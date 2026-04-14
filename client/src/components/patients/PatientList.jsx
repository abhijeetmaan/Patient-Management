import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Select from "../ui/Select";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronRight,
  ClipboardPlus,
  Filter,
  PenSquare,
  Search,
  Trash2,
  User,
  UserRoundCheck,
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
  onAddPatient,
  patientScopeLabel = "Your Patients",
  showAssignedDoctor = false,
}) => {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const normalizedPatients = useMemo(() => {
    return patients.map((patient) => ({
      ...patient,
      diagnosis: patient?.visits?.[0]?.diagnosis || "",
    }));
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return normalizedPatients
      .filter((patient) => {
        const searchValue = debouncedSearch.toLowerCase();
        const matchesSearch =
          patient.name.toLowerCase().includes(searchValue) ||
          patient.diagnosis.toLowerCase().includes(searchValue);

        const matchesGender =
          genderFilter === "all" ||
          (patient.gender || "").toLowerCase() === genderFilter;

        const age = Number(patient.age);
        const matchesAge =
          ageFilter === "all" ||
          (ageFilter === "under18" && age < 18) ||
          (ageFilter === "18to40" && age >= 18 && age <= 40) ||
          (ageFilter === "40plus" && age > 40);

        return matchesSearch && matchesGender && matchesAge;
      })
      .sort((a, b) =>
        sortOrder === "latest"
          ? new Date(b.createdAt || b.admissionDate || 0) -
            new Date(a.createdAt || a.admissionDate || 0)
          : new Date(a.createdAt || a.admissionDate || 0) -
            new Date(b.createdAt || b.admissionDate || 0),
      );
  }, [normalizedPatients, debouncedSearch, genderFilter, ageFilter, sortOrder]);

  const listMotion = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const itemMotion = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.28, ease: "easeOut" },
    },
  };

  return (
    <Card className="p-6 transition-all duration-300 md:p-7">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <h2 className="inline-flex items-center gap-2 font-['Sora'] text-3xl font-bold text-slate-800 dark:text-white">
          <Users className="h-6 w-6 text-brand-600 dark:text-brand-200" />
          {patientScopeLabel}
        </h2>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 transition-all duration-300 dark:bg-brand-900/30 dark:text-brand-100">
          Showing {filteredPatients.length} of {patients.length} patients
        </span>
      </div>

      <div className="mb-6 rounded-2xl border border-white/55 bg-gradient-to-br from-white/90 via-brand-50/65 to-cyan-50/70 p-3 shadow-sm backdrop-blur-md dark:border-slate-700/70 dark:from-slate-900/80 dark:via-slate-900/75 dark:to-slate-800/70 sm:p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr),repeat(3,minmax(0,190px))]">
          <label className="block min-w-0 md:col-span-2 xl:col-span-1">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Search
            </span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name or diagnosis"
                className="mt-0 pl-9 pr-9 text-sm"
              />
            </span>
          </label>

          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Gender
            </span>
            <span className="relative block">
              <UserRoundCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Select
                value={genderFilter}
                onChange={(event) => setGenderFilter(event.target.value)}
                className="mt-0 pl-9 pr-9"
              >
                <option value="all">All genders</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </span>
          </label>

          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Age
            </span>
            <span className="relative block">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Select
                value={ageFilter}
                onChange={(event) => setAgeFilter(event.target.value)}
                className="mt-0 pl-9 pr-9"
              >
                <option value="all">All ages</option>
                <option value="under18">Under 18</option>
                <option value="18to40">18–40</option>
                <option value="40plus">40+</option>
              </Select>
            </span>
          </label>

          <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              Sort
            </span>
            <span className="relative block">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="mt-0 pl-9 pr-9"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
              </Select>
            </span>
          </label>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2 text-xs font-semibold text-slate-500 dark:text-slate-300">
          {sortOrder === "latest" ? (
            <ArrowDownAZ className="h-4 w-4" />
          ) : (
            <ArrowUpAZ className="h-4 w-4" />
          )}
          Sorted by {sortOrder === "latest" ? "Latest" : "Oldest"}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <article
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/80 md:p-5"
            >
              <div className="saas-skeleton h-6 w-40 rounded" />
              <div className="saas-skeleton mt-2 h-3 w-24 rounded" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="saas-skeleton h-10 rounded-xl" />
                <div className="saas-skeleton h-10 rounded-xl" />
              </div>
            </article>
          ))}
        </div>
      ) : patients.length === 0 ? (
        <EmptyPatientsState onAddPatient={onAddPatient} />
      ) : filteredPatients.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-medium text-slate-500 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
          🚫 No patients found. Try adjusting filters.
        </p>
      ) : (
        <motion.div
          className="space-y-4"
          variants={listMotion}
          initial="hidden"
          animate="show"
        >
          {filteredPatients.map((patient) => (
            <motion.div key={patient.id} variants={itemMotion}>
              <PatientCard
                patient={patient}
                deleting={deletingPatientId === patient.id}
                onDelete={() => onDelete(patient.id)}
                onViewDetails={() => onViewDetails(patient.id)}
                onEdit={() => onEdit(patient.id)}
                canViewPatient
                canEditPatient={hasPermission("edit_patient")}
                canDeletePatient={hasPermission("delete_patient")}
                showAssignedDoctor={showAssignedDoctor}
              />
            </motion.div>
          ))}
        </motion.div>
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
  canViewPatient,
  canEditPatient,
  canDeletePatient,
  showAssignedDoctor,
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
          {canViewPatient ? (
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
          ) : null}
          {canEditPatient ? (
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
          ) : null}
          {canDeletePatient ? (
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
          ) : null}
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
        {showAssignedDoctor ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-all duration-300 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
            <span className="font-semibold">Assigned to:</span>{" "}
            {patient.assignedDoctorName || "Unknown Doctor"}
          </p>
        ) : null}
      </div>
    </article>
  );
};

const EmptyPatientsState = ({ onAddPatient }) => {
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
      <Button
        type="button"
        onClick={onAddPatient}
        className="mt-5 inline-flex items-center justify-center"
      >
        Add Patient
      </Button>
    </div>
  );
};

export default PatientList;
