import {
  CalendarDays,
  ClipboardPlus,
  Pill,
  Sparkles,
  Stethoscope,
  Text,
} from "lucide-react";

const VisitTimeline = ({ visits, loading }) => {
  if (loading) {
    return (
      <p className="rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm font-medium text-brand-700 transition-all duration-300 dark:border-brand-900/60 dark:bg-brand-900/30 dark:text-brand-100">
        Refreshing patient details...
      </p>
    );
  }

  if (!Array.isArray(visits) || visits.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
        No visits found.
      </p>
    );
  }

  return (
    <div className="relative pl-6">
      <span className="absolute bottom-0 left-1.5 top-1 w-0.5 bg-gradient-to-b from-brand-300 via-brand-200 to-slate-200 dark:from-sky-500 dark:via-blue-500 dark:to-slate-600" />

      <div className="space-y-4">
        {visits.map((visit, index) => (
          <article
            key={`${visit.date}-${index}`}
            className={`relative rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:shadow-md ${
              index === 0
                ? "border-brand-300 bg-gradient-to-br from-brand-50 to-white dark:border-sky-700/60 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800"
                : "border-slate-200 bg-slate-50/80 dark:border-slate-600 dark:bg-slate-800"
            }`}
          >
            <span
              className={`absolute -left-[1.45rem] top-5 h-3.5 w-3.5 rounded-full border-2 ${
                index === 0
                  ? "border-sky-700 bg-sky-500"
                  : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
              }`}
            />

            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-100">
                <CalendarDays className="h-4 w-4" />
                {formatVisitDate(visit.date)}
              </p>
              {index === 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm shadow-sky-900/40">
                  <Sparkles className="h-3.5 w-3.5" />
                  Latest
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-100">
              <p>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-100">
                  <ClipboardPlus className="h-4 w-4" />
                  Symptoms:
                </span>{" "}
                {visit.symptoms}
              </p>
              <p>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-100">
                  <Stethoscope className="h-4 w-4" />
                  Diagnosis:
                </span>{" "}
                {visit.diagnosis}
              </p>
              <p>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-100">
                  <Pill className="h-4 w-4" />
                  Medicines:
                </span>{" "}
                {Array.isArray(visit.medicines) && visit.medicines.length
                  ? visit.medicines.join(", ")
                  : "Not provided"}
              </p>
              <p>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-100">
                  <Text className="h-4 w-4" />
                  Notes:
                </span>{" "}
                {visit.notes || "-"}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

const formatVisitDate = (rawDate) => {
  if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    const [year, month, day] = rawDate.split("-").map(Number);
    const localDate = new Date(year, month - 1, day);

    if (!Number.isNaN(localDate.getTime())) {
      return localDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return parsedDate.toLocaleString();
};

export default VisitTimeline;
