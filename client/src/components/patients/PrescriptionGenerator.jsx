import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { FileText, Pill, Plus, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

const createDefaultLine = () => ({
  medicine: "",
  dosage: "",
  instructions: "",
});

const PrescriptionGenerator = ({ patientName }) => {
  const [showForm, setShowForm] = useState(false);
  const [lines, setLines] = useState([createDefaultLine()]);
  const [notes, setNotes] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [generatedPrescription, setGeneratedPrescription] = useState(null);

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

  const generatePrescription = (event) => {
    event.preventDefault();

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

    setValidationMessage("");
    setGeneratedPrescription({
      patientName,
      createdAt: new Date().toISOString(),
      lines: cleanedLines,
      notes: String(notes || "").trim(),
    });
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
    doc.text(
      `Date: ${new Date(generatedPrescription.createdAt).toLocaleDateString()}`,
      14,
      y,
    );

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Medicines", 14, y);

    y += 8;
    generatedPrescription.lines.forEach((line, index) => {
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
        <Button
          variant="primary"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm"
          onClick={() => setShowForm((current) => !current)}
        >
          <FileText className="h-4 w-4" />
          Generate Prescription
        </Button>
      </div>

      {showForm && (
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

          <Button type="submit" className="w-full md:w-auto">
            Generate Preview
          </Button>
        </form>
      )}

      {generatedPrescription && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-900/70">
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
              Date: {generatedDate.toLocaleDateString()}
            </p>
          </div>

          <ul className="mt-4 space-y-3">
            {generatedPrescription.lines.map((line, index) => (
              <li
                key={`${line.medicine}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/80"
              >
                <p className="font-semibold text-slate-900 dark:text-white">
                  {index + 1}. {line.medicine}
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">Dosage:</span> {line.dosage}
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">Instructions:</span>{" "}
                  {line.instructions}
                </p>
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
