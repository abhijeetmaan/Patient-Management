import { useMemo, useState } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Select from "../ui/Select";
import {
  ChevronRight,
  ClipboardPlus,
  Filter,
  PenSquare,
  Search,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

const PatientList = ({
  patients,
  loading,
  deletingPatientId,
  onDelete,
  onViewDetails,
  onEdit,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");

  const normalizedPatients = useMemo(() => {
    return patients.map((patient) => ({
      ...patient,
      diagnosis: patient?.visits?.[0]?.diagnosis || "",
    }));
  }, [patients]);

  const diagnosisOptions = useMemo(() => {
    return [
      ...new Set(
        normalizedPatients.map((patient) => patient.diagnosis).filter(Boolean),
      ),
    ];
  }, [normalizedPatients]);

  const filteredPatients = useMemo(() => {
    return normalizedPatients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedFilter === "" || patient.diagnosis === selectedFilter),
    );
  }, [normalizedPatients, searchTerm, selectedFilter]);

  return (
    <Card className="p-6 transition-all duration-300 md:p-7">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <h2 className="inline-flex items-center gap-2 font-['Sora'] text-3xl font-bold text-slate-800 dark:text-white">
          <Users className="h-6 w-6 text-brand-600 dark:text-brand-200" />
          Patients
        </h2>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 transition-all duration-300 dark:bg-brand-900/30 dark:text-brand-100">
          {filteredPatients.length}/{patients.length}
        </span>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr,220px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by patient name"
            className="mt-0 pl-9"
          />
        </label>

        <label className="relative block">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Select
            value={selectedFilter}
            onChange={(event) => setSelectedFilter(event.target.value)}
            className="mt-0 pl-9"
          >
            <option value="">All diagnoses</option>
            {diagnosisOptions.map((diagnosis) => (
              <option key={diagnosis} value={diagnosis}>
                {diagnosis}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <article
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/80 md:p-5"
            >
              <div className="h-6 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="h-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
              </div>
            </article>
          ))}
        </div>
      ) : patients.length === 0 ? (
        <EmptyPatientsState />
      ) : filteredPatients.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
          No patients found.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              deleting={deletingPatientId === patient.id}
              onDelete={() => onDelete(patient.id)}
              onViewDetails={() => onViewDetails(patient.id)}
              onEdit={() => onEdit(patient.id)}
            />
          ))}
        </div>
      )}
    </Card>
  );
};

const PatientCard = ({
  patient,
  deleting,
  onDelete,
  onViewDetails,
  onEdit,
}) => {
  const latestVisit = Array.isArray(patient.visits) ? patient.visits[0] : null;

  return (
    <article
      onClick={onViewDetails}
      className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80 md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="inline-flex items-center gap-2 text-xl font-extrabold text-slate-900 dark:text-white">
            <UserRound className="h-5 w-5 text-brand-600 dark:text-brand-200" />
            {patient.name}
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-300">
            {patient.age} years • {patient.gender}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            variant="secondary"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            <PenSquare className="h-4 w-4" />
            Edit
          </Button>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              onViewDetails();
            }}
            variant="secondary"
            className="inline-flex items-center gap-1.5 border-brand-200 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-100 dark:hover:bg-brand-900/30"
          >
            <ChevronRight className="h-4 w-4" />
            Open Profile
          </Button>
          <Button
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            disabled={deleting}
            variant="danger"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
          <span className="inline-flex items-center gap-1 font-semibold">
            <ClipboardPlus className="h-4 w-4" />
            Latest Diagnosis:
          </span>{" "}
          {latestVisit?.diagnosis || "Not available"}
        </p>
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
          <span className="font-semibold">Visits:</span>{" "}
          {Array.isArray(patient.visits) ? patient.visits.length : 0}
        </p>
      </div>
    </article>
  );
};

const EmptyPatientsState = () => {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/70">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-200">
        <Users className="h-8 w-8" />
      </div>
      <h3 className="font-['Sora'] text-xl font-bold text-slate-800 dark:text-white">
        No patients yet
      </h3>
      <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-300">
        Start by adding your first patient record to unlock timelines and
        analytics.
      </p>
    </div>
  );
};

export default PatientList;
