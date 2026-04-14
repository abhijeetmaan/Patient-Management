import Button from "../ui/Button";
import Card from "../ui/Card";
import PrescriptionGenerator from "./PrescriptionGenerator";
import VisitTimeline from "./VisitTimeline";
import {
  Activity,
  ArrowLeft,
  Gauge,
  HeartPulse,
  Pill,
  Thermometer,
  UserRound,
} from "lucide-react";

const PatientProfilePage = ({ patient, loading, onBack }) => {
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
  const allMedicines = [
    ...new Set(visits.flatMap((visit) => visit.medicines || [])),
  ];
  const vitals = getDummyVitals(patient);

  return (
    <div className="space-y-7">
      <Button
        variant="secondary"
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

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

            {allMedicines.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-500 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                No medicines recorded.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {allMedicines.map((medicine) => (
                  <li
                    key={medicine}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Pill className="h-4 w-4 text-brand-600 dark:text-brand-200" />
                    {medicine}
                  </li>
                ))}
              </ul>
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

          <PrescriptionGenerator patientName={patient.name} />
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
