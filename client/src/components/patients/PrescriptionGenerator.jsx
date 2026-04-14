import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { FileText, Pill, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { savePatientPrescription } from "../../services/patientApi";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

const createDefaultLine = () => ({
  medicine: "",
  dosage: "",
  instructions: "",
});

const getLocalDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value) => {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleDateString();
};

const PrescriptionGenerator = ({
  patientId,
  patientName,
  latestDiagnosis,
  doctorName,
  prescriptions,
  onPrescriptionSaved,
}) => {
  const { hasPermission } = useAuth();
  const todayDate = useMemo(() => getLocalDateInputValue(new Date()), []);
  const [showForm, setShowForm] = useState(false);
  const [lines, setLines] = useState([createDefaultLine()]);
  const [diagnosis, setDiagnosis] = useState(String(latestDiagnosis || ""));
  const [prescriptionDate, setPrescriptionDate] = useState(todayDate);
  const [notes, setNotes] = useState("");
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState("");
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [generatedPrescription, setGeneratedPrescription] = useState(null);

  useEffect(() => {
    setDiagnosis(String(latestDiagnosis || ""));
  }, [latestDiagnosis]);

  const prescriptionHistory = useMemo(() => {
    const items = Array.isArray(prescriptions) ? prescriptions : [];

    return [...items].sort(
      (a, b) =>
        new Date(b.prescriptionDate || b.generatedAt || b.savedAt || 0) -
        new Date(a.prescriptionDate || a.generatedAt || a.savedAt || 0),
    );
  }, [prescriptions]);

  useEffect(() => {
    if (prescriptionHistory.length === 0) {
      setSelectedPrescriptionId("");
      return;
    }

    const hasCurrentSelection = prescriptionHistory.some(
      (item) => item.id === selectedPrescriptionId,
    );

    if (!hasCurrentSelection) {
      setSelectedPrescriptionId(prescriptionHistory[0].id);
    }
  }, [prescriptionHistory, selectedPrescriptionId]);

  useEffect(() => {
    if (!selectedPrescriptionId) {
      return;
    }

    const selectedPrescription = prescriptionHistory.find(
      (item) => item.id === selectedPrescriptionId,
    );

    if (!selectedPrescription) {
      return;
    }

    setGeneratedPrescription({
      patientName,
      createdAt:
        selectedPrescription.generatedAt || selectedPrescription.savedAt,
      prescriptionDate: selectedPrescription.prescriptionDate || "",
      diagnosis: selectedPrescription.diagnosis || "",
      medicines: Array.isArray(selectedPrescription.medicines)
        ? selectedPrescription.medicines
        : [],
      notes: selectedPrescription.notes || "",
    });

    if (selectedPrescription.prescriptionDate) {
      setPrescriptionDate(selectedPrescription.prescriptionDate);
    }
  }, [selectedPrescriptionId, prescriptionHistory, patientName]);

  const generatedDate = useMemo(() => {
    if (!generatedPrescription?.createdAt) {
      return new Date();
    }

    const parsedDate = new Date(generatedPrescription.createdAt);
    return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }, [generatedPrescription]);

  const updateLine = (index, field, value) => {
    setLines((previous) =>
      previous.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      ),
    );
  };

  const addLine = () => {
    setLines((previous) => [...previous, createDefaultLine()]);
  };

  const removeLine = (index) => {
    setLines((previous) => {
      if (previous.length === 1) {
        return previous;
      }
      return previous.filter((_, lineIndex) => lineIndex !== index);
    });
  };

  const generatePrescription = async (event) => {
    event.preventDefault();

    if (!patientId) {
      setValidationMessage("Patient not found. Please reopen the profile.");
      return;
    }

    const cleanedLines = lines
      .map((line) => ({
        medicine: String(line.medicine || "").trim(),
        dosage: String(line.dosage || "").trim(),
        instructions: String(line.instructions || "").trim(),
      }))
      .filter((line) => line.medicine && line.dosage && line.instructions);

    if (cleanedLines.length === 0) {
      setValidationMessage(
        "Add at least one medicine with dosage and instructions.",
      );
      return;
    }

    if (!String(diagnosis || "").trim()) {
      setValidationMessage("Diagnosis is required.");
      return;
    }

    if (!String(prescriptionDate || "").trim()) {
      setValidationMessage("Prescription date is required.");
      return;
    }

    const diagnosisValue = String(diagnosis || "").trim();
    const noteValue = String(notes || "").trim();
    const medicinesForStorage = cleanedLines.map(
      (line) => `${line.medicine} - ${line.dosage} (${line.instructions})`,
    );

    try {
      setSavingPrescription(true);
      setValidationMessage("");

      const response = await savePatientPrescription(patientId, {
        diagnosis: diagnosisValue,
        medicines: medicinesForStorage,
        notes: noteValue,
        prescriptionDate,
        doctorName: doctorName || "Assigned Physician",
        generatedAt: new Date().toISOString(),
      });

      if (response?.prescription && onPrescriptionSaved) {
        onPrescriptionSaved(response.prescription);
      }

      if (response?.prescription?.id) {
        setSelectedPrescriptionId(response.prescription.id);
      }

      setGeneratedPrescription({
        patientName,
        createdAt:
          response?.prescription?.generatedAt || new Date().toISOString(),
        prescriptionDate:
          response?.prescription?.prescriptionDate || prescriptionDate,
        diagnosis: diagnosisValue,
        lines: cleanedLines,
        medicines: medicinesForStorage,
        notes: noteValue,
      });
    } catch (error) {
      setValidationMessage(error.message || "Failed to save prescription.");
    } finally {
      setSavingPrescription(false);
    }
  };

  const downloadPdf = () => {
    if (!generatedPrescription) {
      return;
    }

    const doc = new jsPDF();
    let y = 18;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Medical Prescription", 14, y);

    y += 10;
    doc.setLineWidth(0.4);
    doc.line(14, y, 196, y);

    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Patient: ${generatedPrescription.patientName}`, 14, y);

    y += 7;
    doc.text(`Diagnosis: ${generatedPrescription.diagnosis || "N/A"}`, 14, y);

    y += 7;
    doc.text(
      `Date: ${formatDisplayDate(
        generatedPrescription.prescriptionDate ||
          generatedPrescription.createdAt ||
          "",
      )}`,
      14,
      y,
    );

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Medicines", 14, y);

    y += 8;
    const linesToRender = Array.isArray(generatedPrescription.lines)
      ? generatedPrescription.lines
      : (generatedPrescription.medicines || []).map((medicine) => ({
          medicine,
          dosage: "As prescribed",
          instructions: "Follow doctor instructions",
        }));

    linesToRender.forEach((line, index) => {
      const lineChunks = [
        `${index + 1}. ${line.medicine}`,
        `Dosage: ${line.dosage}`,
        `Instructions: ${line.instructions}`,
      ];

      doc.setFont("helvetica", "normal");
      lineChunks.forEach((chunk) => {
        const wrapped = doc.splitTextToSize(chunk, 175);
        doc.text(wrapped, 18, y);
        y += wrapped.length * 6;
      });

      y += 2;
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
    });

    if (generatedPrescription.notes) {
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Additional Notes", 14, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(generatedPrescription.notes, 175);
      doc.text(noteLines, 18, y);
    }

    const safePatientName = generatedPrescription.patientName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    doc.save(`prescription-${safePatientName || "patient"}.pdf`);
  };

  return (
    <Card className="p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-2 font-['Sora'] text-xl font-bold text-slate-900 dark:text-white">
          <FileText className="h-5 w-5 text-brand-600 dark:text-brand-200" />
          Prescription Generator
        </h3>
        {hasPermission("generate_prescription") ? (
          <Button
            variant="primary"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm"
            onClick={() => setShowForm((current) => !current)}
          >
            <FileText className="h-4 w-4" />
            Generate Prescription
          </Button>
        ) : null}
      </div>

      {!hasPermission("generate_prescription") ? (
        <AccessDeniedState />
      ) : showForm ? (
        <form className="mt-4 space-y-4" onSubmit={generatePrescription}>
          {lines.map((line, index) => (
            <div
              key={`prescription-line-${index}`}
              className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-800/70"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <Pill className="h-3.5 w-3.5" />
                  Medicine {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 transition-colors hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-300"
                  disabled={lines.length === 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Medicine
                  <Input
                    type="text"
                    value={line.medicine}
                    onChange={(event) =>
                      updateLine(index, "medicine", event.target.value)
                    }
                    placeholder="e.g. Paracetamol"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Dosage
                  <Input
                    type="text"
                    value={line.dosage}
                    onChange={(event) =>
                      updateLine(index, "dosage", event.target.value)
                    }
                    placeholder="e.g. 500mg twice daily"
                  />
                </label>
              </div>

              <label className="mt-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Instructions
                <Input
                  type="text"
                  value={line.instructions}
                  onChange={(event) =>
                    updateLine(index, "instructions", event.target.value)
                  }
                  placeholder="e.g. After meals for 5 days"
                />
              </label>
            </div>
          ))}

          <Button
            type="button"
            variant="secondary"
            onClick={addLine}
            className="inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Medicine
          </Button>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Diagnosis
            <Input
              type="text"
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              placeholder="e.g. Viral fever"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Prescription Date
            <Input
              type="date"
              value={prescriptionDate}
              onChange={(event) => setPrescriptionDate(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            General Notes (optional)
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              className="saas-input resize-none"
              placeholder="Any additional advice for the patient"
            />
          </label>

          {validationMessage && (
            <p className="text-sm font-medium text-red-600 dark:text-red-300">
              {validationMessage}
            </p>
          )}

          <Button
            type="submit"
            className="w-full md:w-auto"
            loading={savingPrescription}
            disabled={savingPrescription}
          >
            {savingPrescription ? "Saving Prescription..." : "Generate Preview"}
          </Button>
        </form>
      ) : null}

      {generatedPrescription && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-900/70">
          {prescriptionHistory.length > 1 ? (
            <label className="mb-4 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              View Prescription By Date
              <select
                value={selectedPrescriptionId}
                onChange={(event) =>
                  setSelectedPrescriptionId(event.target.value)
                }
                className="saas-input mt-1"
              >
                {prescriptionHistory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatDisplayDate(
                      item.prescriptionDate || item.generatedAt || item.savedAt,
                    )}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-700">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Patient Prescription
              </p>
              <h4 className="mt-1 font-['Sora'] text-xl font-bold text-slate-900 dark:text-white">
                {generatedPrescription.patientName}
              </h4>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Date:{" "}
              {formatDisplayDate(generatedPrescription.prescriptionDate) ||
                generatedDate.toLocaleDateString()}
            </p>
          </div>

          <ul className="mt-4 space-y-3">
            {(Array.isArray(generatedPrescription.lines)
              ? generatedPrescription.lines
              : (generatedPrescription.medicines || []).map((medicine) => ({
                  medicine,
                  dosage: "",
                  instructions: "",
                }))
            ).map((line, index) => (
              <li
                key={`${line.medicine}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/80"
              >
                <p className="font-semibold text-slate-900 dark:text-white">
                  {index + 1}. {line.medicine}
                </p>
                {line.dosage ? (
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                    <span className="font-semibold">Dosage:</span> {line.dosage}
                  </p>
                ) : null}
                {line.instructions ? (
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                    <span className="font-semibold">Instructions:</span>{" "}
                    {line.instructions}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          {generatedPrescription.notes && (
            <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
              <span className="font-semibold">Notes:</span>{" "}
              {generatedPrescription.notes}
            </p>
          )}

          <Button
            onClick={downloadPdf}
            className="mt-5 inline-flex items-center gap-1.5"
          >
            Download PDF
          </Button>
        </div>
      )}
    </Card>
  );
};

export default PrescriptionGenerator;

const AccessDeniedState = () => {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-rose-300 bg-rose-50 p-6 text-center dark:border-rose-800 dark:bg-rose-950/30">
      <h4 className="font-['Sora'] text-lg font-bold text-rose-700 dark:text-rose-200">
        Access Denied
      </h4>
      <p className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">
        You do not have permission to generate prescriptions.
      </p>
    </div>
  );
};
