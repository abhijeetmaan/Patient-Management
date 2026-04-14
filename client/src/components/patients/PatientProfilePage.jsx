import jsPDF from "jspdf";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import Card from "../ui/Card";
import PrescriptionGenerator from "./PrescriptionGenerator";
import VisitTimeline from "./VisitTimeline";
import {
  Activity,
  ArrowLeft,
  Download,
  Gauge,
  HeartPulse,
  Pill,
  Thermometer,
  UserRound,
} from "lucide-react";

const formatDateLabel = (value) => {
  if (!value) {
    return "Unknown date";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return parsedDate.toLocaleDateString();
};

const getLocalDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const PatientProfilePage = ({
  patient,
  loading,
  onBack,
  onPrescriptionSaved,
}) => {
  const { doctor } = useAuth();
  const [downloadError, setDownloadError] = useState("");

  if (!patient) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
          Patient not found.
        </p>
        <Button
          variant="secondary"
          className="mt-4 inline-flex items-center gap-1.5"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Button>
      </Card>
    );
  }

  const visits = Array.isArray(patient.visits) ? patient.visits : [];
  const savedPrescriptions = Array.isArray(patient.prescriptions)
    ? patient.prescriptions
    : [];
  const medicinesByDate = [
    ...savedPrescriptions
      .map((prescription) => {
        const medicines = Array.isArray(prescription.medicines)
          ? prescription.medicines
          : [];

        if (medicines.length === 0) {
          return null;
        }

        return {
          key: `prescription-${prescription.id}`,
          dateValue:
            prescription.prescriptionDate ||
            prescription.generatedAt ||
            prescription.savedAt ||
            "",
          dateLabel: formatDateLabel(
            prescription.prescriptionDate ||
              prescription.generatedAt ||
              prescription.savedAt ||
              "",
          ),
          medicines,
          sourceLabel: "Prescription",
        };
      })
      .filter(Boolean),
    ...visits
      .map((visit, index) => {
        const medicines = Array.isArray(visit.medicines) ? visit.medicines : [];

        if (medicines.length === 0) {
          return null;
        }

        return {
          key: `visit-${index}`,
          dateValue: visit.date || "",
          dateLabel: formatDateLabel(visit.date || ""),
          medicines,
          sourceLabel: "Visit",
        };
      })
      .filter(Boolean),
  ].sort((a, b) => new Date(b.dateValue || 0) - new Date(a.dateValue || 0));

  const allMedicines = [
    ...new Set([
      ...visits.flatMap((visit) => visit.medicines || []),
      ...savedPrescriptions.flatMap((prescription) =>
        Array.isArray(prescription.medicines) ? prescription.medicines : [],
      ),
    ]),
  ];
  const latestVisit = visits[0] || null;
  const diagnosis =
    latestVisit?.diagnosis || patient.diagnosis || "Not specified";
  const notes = latestVisit?.notes || patient.notes || "No additional notes";
  const latestSavedPrescription =
    [...savedPrescriptions].sort(
      (a, b) =>
        new Date(b.prescriptionDate || b.generatedAt || b.savedAt || 0) -
        new Date(a.prescriptionDate || a.generatedAt || a.savedAt || 0),
    )[0] || null;

  const downloadPrescriptionPDF = async () => {
    if (!patient?.id || !latestSavedPrescription) {
      setDownloadError(
        "Generate and save a prescription first, then download the PDF.",
      );
      return;
    }

    setDownloadError("");

    const prescriptionMedicines = Array.isArray(
      latestSavedPrescription.medicines,
    )
      ? latestSavedPrescription.medicines
      : [];
    const prescriptionDiagnosis =
      latestSavedPrescription.diagnosis || diagnosis;
    const prescriptionNotes = latestSavedPrescription.notes || notes;
    const prescriptionDate =
      latestSavedPrescription.prescriptionDate ||
      getLocalDateInputValue(new Date());

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 18;
    let y = 18;

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.9);
    doc.roundedRect(10, 10, pageWidth - 20, pageHeight - 20, 3, 3);

    doc.setFillColor(239, 246, 255);
    doc.rect(11.5, 11.5, pageWidth - 23, 26, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(30, 64, 175);
    doc.text("Smart Care Clinic", marginX, y + 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(71, 85, 105);
    doc.text("Digitally generated patient prescription", marginX, y + 9);

    doc.setLineWidth(0.3);
    doc.setDrawColor(148, 163, 184);
    doc.line(marginX, 42, pageWidth - marginX, 42);

    y = 52;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14.5);
    doc.setTextColor(15, 23, 42);
    doc.text("Patient Prescription", marginX, y);

    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`Name: ${patient.name}`, marginX, y);
    y += 7;
    doc.text(`Age: ${patient.age}`, marginX, y);
    y += 7;
    doc.text(`Gender: ${patient.gender}`, marginX, y);
    y += 7;
    doc.text(
      `Date: ${formatDateLabel(prescriptionDate)}  Time: ${new Date(
        latestSavedPrescription.generatedAt || Date.now(),
      ).toLocaleTimeString()}`,
      marginX,
      y,
    );

    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Diagnosis", marginX, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const diagnosisLines = doc.splitTextToSize(
      prescriptionDiagnosis,
      pageWidth - marginX * 2,
    );
    doc.text(diagnosisLines, marginX, y);
    y += diagnosisLines.length * 6 + 4;

    doc.setFont("helvetica", "bold");
    doc.text("Medicines", marginX, y);
    y += 6;
    doc.setFont("helvetica", "normal");

    if (prescriptionMedicines.length === 0) {
      doc.text("- No medicines prescribed", marginX + 3, y);
      y += 7;
    } else {
      prescriptionMedicines.forEach((medicine) => {
        const medicineLines = doc.splitTextToSize(
          `- ${medicine}`,
          pageWidth - marginX * 2 - 4,
        );
        doc.text(medicineLines, marginX + 3, y);
        y += medicineLines.length * 6 + 1;
      });
    }

    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Notes", marginX, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(
      prescriptionNotes,
      pageWidth - marginX * 2,
    );
    doc.text(noteLines, marginX, y);

    const doctorName = doctor?.name || "Assigned Physician";
    doc.setLineWidth(0.3);
    doc.setDrawColor(203, 213, 225);
    doc.line(marginX, pageHeight - 40, pageWidth - marginX, pageHeight - 40);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Doctor: Dr. ${doctorName}`, marginX, pageHeight - 31);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "This is a digitally generated prescription",
      marginX,
      pageHeight - 20,
    );

    const safeName = (patient.name || "patient")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    doc.save(`${safeName || "patient"}_prescription.pdf`);
  };

  const vitals = getDummyVitals(patient);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Button
          onClick={downloadPrescriptionPDF}
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:-translate-y-0.5 hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg hover:shadow-teal-500/25"
        >
          <Download className="h-4 w-4" />
          Download Prescription PDF
        </Button>
      </div>

      {downloadError ? (
        <p className="text-sm font-medium text-red-600 dark:text-red-300">
          {downloadError}
        </p>
      ) : null}

      <section className="grid gap-7 xl:grid-cols-[minmax(0,0.9fr),minmax(0,1.1fr)]">
        <div className="space-y-7">
          <Card className="p-5 md:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 transition-all duration-300 dark:bg-brand-900/40 dark:text-brand-100">
                <UserRound className="h-6 w-6" />
              </div>

              <div>
                <h2 className="font-['Sora'] text-3xl font-bold text-slate-900 dark:text-white md:text-[2rem]">
                  {patient.name}
                </h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {patient.age} years • {patient.gender}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 md:p-6">
            <h3 className="mb-4 inline-flex items-center gap-2 font-['Sora'] text-xl font-bold text-slate-900 dark:text-white">
              <Activity className="h-5 w-5 text-brand-600 dark:text-brand-200" />
              Vitals
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <VitalCard
                label="Blood Pressure"
                value={vitals.bloodPressure}
                icon={Gauge}
              />
              <VitalCard
                label="Heart Rate"
                value={vitals.heartRate}
                icon={HeartPulse}
              />
              <VitalCard
                label="Temperature"
                value={vitals.temperature}
                icon={Thermometer}
              />
            </div>
          </Card>

          <Card className="p-5 md:p-6">
            <h3 className="mb-4 inline-flex items-center gap-2 font-['Sora'] text-xl font-bold text-slate-900 dark:text-white">
              <Pill className="h-5 w-5 text-brand-600 dark:text-brand-200" />
              Medicines
            </h3>

            {medicinesByDate.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-500 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                No medicines recorded.
              </p>
            ) : (
              <div className="space-y-3">
                {medicinesByDate.map((entry) => (
                  <div
                    key={entry.key}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-800/80"
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {entry.sourceLabel} • {entry.dateLabel}
                    </p>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {entry.medicines.map((medicine, index) => (
                        <li
                          key={`${entry.key}-${index}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                        >
                          <Pill className="h-4 w-4 text-brand-600 dark:text-brand-200" />
                          {medicine}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-7">
          <Card className="p-5 md:p-6">
            <h3 className="mb-4 font-['Sora'] text-xl font-bold text-slate-900 dark:text-white">
              Visit Timeline
            </h3>
            <VisitTimeline visits={visits} loading={loading} />
          </Card>

          <PrescriptionGenerator
            patientId={patient.id}
            patientName={patient.name}
            latestDiagnosis={diagnosis}
            doctorName={doctor?.name}
            prescriptions={savedPrescriptions}
            onPrescriptionSaved={(prescription) =>
              onPrescriptionSaved?.(patient.id, prescription)
            }
          />
        </div>
      </section>
    </div>
  );
};

const VitalCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center shadow-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/70">
    <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {label}
    </p>
    <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
      {value}
    </p>
  </div>
);

const getDummyVitals = (patient) => {
  const age = Number(patient.age) || 30;

  return {
    bloodPressure: `${110 + (age % 20)}/${70 + (age % 15)} mmHg`,
    heartRate: `${68 + (age % 12)} bpm`,
    temperature: `${(97.8 + (age % 4) * 0.2).toFixed(1)} °F`,
  };
};

export default PatientProfilePage;
