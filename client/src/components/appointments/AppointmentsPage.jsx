import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Select from "../ui/Select";
import {
  AlertTriangle,
  CalendarClock,
  Clock3,
  Sparkles,
  Users,
} from "lucide-react";

const AppointmentsPage = ({
  appointments,
  patients,
  loading,
  schedulingAppointment,
  updatingAppointmentId,
  theme,
  onAddAppointment,
  onMarkAppointmentCompleted,
  onSendToCabin,
  onSkipAppointment,
  onRequeueAppointment,
  nextPendingAppointmentId,
  onAddPatient,
}) => {
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: "",
    date: "",
    time: "",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const sortedAppointments = useMemo(() => {
    return sortAppointments(
      Array.isArray(appointments) ? appointments : [],
    ).map((appointment) => {
      const status = String(appointment.status || "pending").toLowerCase();
      const cabinStartTimestamp = appointment.cabinStartTime
        ? new Date(appointment.cabinStartTime).getTime()
        : Number.NaN;
      const elapsedSeconds =
        status === "in_cabin" && Number.isFinite(cabinStartTimestamp)
          ? Math.max(0, Math.floor((nowTick - cabinStartTimestamp) / 1000))
          : 0;

      return {
        ...appointment,
        status,
        elapsedSeconds,
        timestamp: new Date(
          `${appointment.date}T${appointment.time}`,
        ).getTime(),
      };
    });
  }, [appointments, nowTick]);

  const queueAppointments = useMemo(() => {
    return sortedAppointments.filter((appointment) =>
      ["pending", "requeued"].includes(appointment.status),
    );
  }, [sortedAppointments]);

  const queuePositionsById = useMemo(() => {
    const mapping = new Map();
    queueAppointments.forEach((appointment, index) => {
      mapping.set(String(appointment.id), index + 1);
    });
    return mapping;
  }, [queueAppointments]);

  const smartOpdStatus = useMemo(() => {
    const completedWithDuration = sortedAppointments
      .filter(
        (appointment) =>
          appointment.status === "completed" &&
          appointment.cabinStartTime &&
          appointment.completedAt,
      )
      .map((appointment) => {
        const startTimestamp = new Date(appointment.cabinStartTime).getTime();
        const completeTimestamp = new Date(appointment.completedAt).getTime();

        if (
          Number.isNaN(startTimestamp) ||
          Number.isNaN(completeTimestamp) ||
          completeTimestamp <= startTimestamp
        ) {
          return null;
        }

        return completeTimestamp - startTimestamp;
      })
      .filter(Boolean);

    const avgConsultationMinutes = completedWithDuration.length
      ? completedWithDuration.reduce((sum, duration) => sum + duration, 0) /
        completedWithDuration.length /
        60000
      : 0;

    const currentPatient = sortedAppointments.find(
      (appointment) => appointment.status === "in_cabin",
    );
    const elapsedSeconds = currentPatient?.elapsedSeconds || 0;

    return {
      avgConsultationMinutes,
      avgConsultationLabel: avgConsultationMinutes
        ? `${avgConsultationMinutes.toFixed(1)} min`
        : "0.0 min",
      currentPatient,
      isRunningLate: elapsedSeconds > 10 * 60,
      queueLength: queueAppointments.length,
      elapsedSeconds,
    };
  }, [queueAppointments.length, sortedAppointments]);

  const reminderAppointments = useMemo(() => {
    return sortedAppointments
      .filter((appointment) => {
        if (!["pending", "requeued"].includes(appointment.status)) {
          return false;
        }

        const secondsUntil = Math.floor(
          (appointment.timestamp - nowTick) / 1000,
        );
        return secondsUntil >= 0 && secondsUntil <= 30 * 60;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [nowTick, sortedAppointments]);

  useEffect(() => {
    if (!nextPendingAppointmentId) {
      return;
    }

    const target = document.querySelector(
      `[data-appointment-id="${nextPendingAppointmentId}"]`,
    );

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [nextPendingAppointmentId]);

  const statusCounts = useMemo(() => {
    return sortedAppointments.reduce(
      (counts, appointment) => {
        const status = String(appointment.status || "pending").toLowerCase();
        counts[status] = (counts[status] || 0) + 1;
        return counts;
      },
      {
        pending: 0,
        requeued: 0,
        in_cabin: 0,
        skipped: 0,
        completed: 0,
      },
    );
  }, [sortedAppointments]);

  const patientOptions = useMemo(() => {
    return (Array.isArray(patients) ? patients : []).map((patient) => ({
      id: patient.id,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
    }));
  }, [patients]);

  const updateAppointmentForm = (event) => {
    const { name, value } = event.target;
    setAppointmentForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (formError) {
      setFormError("");
    }
  };

  const submitAppointment = async (event) => {
    event.preventDefault();

    if (
      !appointmentForm.patientId ||
      !appointmentForm.date ||
      !appointmentForm.time
    ) {
      setFormError("Patient, date, and time are required.");
      return;
    }

    const selectedPatient = patientOptions.find(
      (patient) => String(patient.id) === String(appointmentForm.patientId),
    );

    if (!selectedPatient) {
      setFormError("Please select a valid patient.");
      return;
    }

    await onAddAppointment({
      patientId: appointmentForm.patientId,
      patientName: selectedPatient.name,
      date: appointmentForm.date,
      time: appointmentForm.time,
    });

    setAppointmentForm({
      patientId: "",
      date: "",
      time: "",
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]"
      >
        <Card className="overflow-hidden border-white/25 bg-white/55 p-5 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/55">
          <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-rose-700 dark:text-rose-200">
            <Sparkles className="h-3.5 w-3.5" />
            LIVE OPD STATUS
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatusStat
              label="Avg consultation"
              value={smartOpdStatus.avgConsultationLabel}
            />
            <StatusStat
              label="Current patient"
              value={
                smartOpdStatus.currentPatient?.patientName ||
                "No active patient"
              }
            />
            <StatusStat
              label="Status"
              value={
                smartOpdStatus.currentPatient
                  ? smartOpdStatus.isRunningLate
                    ? "Running Late"
                    : "On Time"
                  : "No Active Consult"
              }
              accent={smartOpdStatus.isRunningLate ? "danger" : "success"}
            />
            <StatusStat
              label="Queue length"
              value={`${smartOpdStatus.queueLength} patient${smartOpdStatus.queueLength === 1 ? "" : "s"}`}
            />
          </div>
        </Card>

        <Card className="overflow-hidden border-white/25 bg-gradient-to-br from-slate-900/95 to-indigo-950/80 p-5 text-white shadow-xl backdrop-blur-md dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
            Queue Snapshot
          </p>
          <div className="mt-3 space-y-3 text-sm">
            {queueAppointments.slice(0, 4).map((appointment, index) => {
              const queuePosition = queuePositionsById.get(
                String(appointment.id),
              );
              return (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {appointment.patientName}
                    </p>
                    <p className="text-xs text-slate-300">
                      {appointment.status === "requeued"
                        ? "Back in queue"
                        : "Pending"}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-sky-100">
                    {queuePosition === 1
                      ? "Next"
                      : `${formatOrdinal(queuePosition)} in queue`}
                  </span>
                </div>
              );
            })}
            {queueAppointments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 bg-white/5 px-3 py-6 text-center text-slate-300">
                No patients in queue right now.
              </p>
            ) : null}
          </div>
        </Card>
      </motion.div>

      <Card className="border-white/20 bg-white/45 p-5 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/55">
        <div className="mb-4 border-b border-slate-200 pb-3 dark:border-slate-800">
          <h2 className="font-['Sora'] text-xl font-bold text-slate-900 dark:text-white">
            Schedule Appointment
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Create a new consultation and place the patient in the OPD queue.
          </p>
        </div>

        {patientOptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-800/70">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Add a patient first to schedule appointments.
            </p>
            <Button type="button" onClick={onAddPatient} className="mt-4">
              Add Patient
            </Button>
          </div>
        ) : (
          <form
            onSubmit={submitAppointment}
            className="grid gap-3 md:grid-cols-4"
          >
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
              Patient
              <Select
                name="patientId"
                value={appointmentForm.patientId}
                onChange={updateAppointmentForm}
                className="mt-1"
              >
                <option value="">Select patient</option>
                {patientOptions.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} • {patient.age}y • {patient.gender}
                  </option>
                ))}
              </Select>
            </label>

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Date
              <Input
                type="date"
                name="date"
                value={appointmentForm.date}
                onChange={updateAppointmentForm}
                className="mt-1"
              />
            </label>

            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Time
              <Input
                type="time"
                name="time"
                value={appointmentForm.time}
                onChange={updateAppointmentForm}
                className="mt-1"
              />
            </label>

            <div className="md:col-span-4 flex items-center justify-between gap-3">
              <div>
                {formError ? (
                  <p className="text-sm font-medium text-red-600 dark:text-red-300">
                    {formError}
                  </p>
                ) : null}
              </div>
              <Button type="submit" loading={schedulingAppointment}>
                {schedulingAppointment
                  ? "Scheduling..."
                  : "Schedule Appointment"}
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card className="border-white/20 bg-white/45 p-5 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-slate-900/55">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
          <div>
            <h2 className="font-['Sora'] text-2xl font-bold text-slate-900 dark:text-white">
              Appointments
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Manage the OPD queue, in-cabin workflow, and late arrivals from
              one place.
            </p>
          </div>
        </div>

        {reminderAppointments.length > 0 ? (
          <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50/80 px-4 py-3 dark:border-amber-700 dark:bg-amber-900/20">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              {reminderAppointments.length} appointment
              {reminderAppointments.length === 1 ? "" : "s"} due in the next 30
              minutes
            </p>
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusPill
            label="In Cabin"
            count={statusCounts.in_cabin}
            tone="info"
          />
          <StatusPill
            label="Pending"
            count={statusCounts.pending}
            tone="default"
          />
          <StatusPill
            label="Late Arrival"
            count={statusCounts.requeued}
            tone="warning"
          />
          <StatusPill
            label="Skipped"
            count={statusCounts.skipped}
            tone="danger"
          />
          <StatusPill
            label="Completed"
            count={statusCounts.completed}
            tone="success"
          />
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-52 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70"
              />
            ))}
          </div>
        ) : sortedAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-800/70">
            <CalendarClock className="h-10 w-10 text-brand-600 dark:text-brand-200" />
            <p className="mt-3 font-['Sora'] text-xl font-bold text-slate-800 dark:text-white">
              No appointments scheduled
            </p>
            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-300">
              Add a patient and create consultations to start building the
              queue.
            </p>
            <Button type="button" onClick={onAddPatient} className="mt-5">
              Add Patient
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {sortedAppointments.map((appointment) => {
              const queuePosition = queuePositionsById.get(
                String(appointment.id),
              );
              const isInCabin = appointment.status === "in_cabin";
              const isCompleted = appointment.status === "completed";
              const isSkipped = appointment.status === "skipped";
              const isRequeued = appointment.status === "requeued";
              const isPendingLike =
                appointment.status === "pending" ||
                appointment.status === "requeued";
              const secondsUntil = Math.floor(
                (appointment.timestamp - nowTick) / 1000,
              );
              const isSoon =
                isPendingLike && secondsUntil >= 0 && secondsUntil <= 30 * 60;
              const hasCountdown = isSoon;
              const isUrgent = hasCountdown && secondsUntil <= 5 * 60;
              const estimatedWait = queuePosition
                ? smartOpdStatus.avgConsultationMinutes * queuePosition
                : 0;
              const isNextPendingCandidate =
                appointment.status === "pending" &&
                String(appointment.id) ===
                  String(nextPendingAppointmentId || "");
              const isRunningLate =
                isInCabin && appointment.elapsedSeconds > 10 * 60;

              return (
                <motion.article
                  key={appointment.id}
                  data-appointment-id={appointment.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`rounded-2xl border p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-300 ${
                    isInCabin
                      ? "border-emerald-300/70 bg-emerald-50/80 dark:border-emerald-700 dark:bg-emerald-900/20"
                      : isRequeued
                        ? "border-amber-300/70 bg-amber-50/80 dark:border-amber-700 dark:bg-amber-900/20"
                        : isSkipped
                          ? "border-rose-300/70 bg-rose-50/80 dark:border-rose-700 dark:bg-rose-900/20"
                          : isNextPendingCandidate
                            ? "border-blue-300/70 bg-blue-50/80 dark:border-blue-700 dark:bg-blue-900/20"
                            : "border-white/25 bg-white/75 dark:border-white/10 dark:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        {appointment.patientName}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                        <StatusBadge status={appointment.status} />
                        {isInCabin ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                            {isRunningLate ? "Running Late" : "On Time"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right text-xs font-medium text-slate-500 dark:text-slate-300">
                      <p>{formatTimeLabel(appointment.time)}</p>
                      <p>{formatCalendarDate(appointment.date)}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {isInCabin ? (
                      <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                        In Cabin •{" "}
                        {formatElapsedTimer(appointment.elapsedSeconds)}
                      </span>
                    ) : null}

                    {queuePosition && !isCompleted ? (
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${queuePosition === 1 ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200" : queuePosition === 2 ? "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200" : "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200"}`}
                      >
                        {queuePosition === 1
                          ? "You are next"
                          : `${formatOrdinal(queuePosition)} in queue`}
                      </span>
                    ) : null}

                    {estimatedWait > 0 ? (
                      <span className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                        Estimated wait: {Math.max(1, Math.round(estimatedWait))}{" "}
                        min
                      </span>
                    ) : null}

                    {hasCountdown ? (
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                          isUrgent
                            ? "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200"
                            : isSoon
                              ? "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                              : "border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                        }`}
                      >
                        <Clock3 className="mr-1 inline-block h-3.5 w-3.5" />
                        Starts in {formatCountdown(secondsUntil)}
                      </span>
                    ) : null}

                    {isSkipped ? (
                      <span className="rounded-full border border-rose-300 bg-rose-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200">
                        Missed Appointment
                      </span>
                    ) : null}

                    {isRequeued ? (
                      <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                        Late Arrival
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(appointment.status === "pending" ||
                      appointment.status === "requeued") && (
                      <Button
                        variant="secondary"
                        loading={updatingAppointmentId === appointment.id}
                        onClick={() => onSendToCabin(appointment.id)}
                        className="rounded-full border-blue-300 bg-blue-50 px-3 py-1 text-xs text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/25 dark:text-blue-200"
                      >
                        Send to Cabin
                      </Button>
                    )}

                    {(appointment.status === "pending" ||
                      appointment.status === "in_cabin") && (
                      <Button
                        variant="secondary"
                        loading={updatingAppointmentId === appointment.id}
                        onClick={() => onSkipAppointment(appointment.id)}
                        className="rounded-full border-rose-300 bg-rose-50 px-3 py-1 text-xs text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/25 dark:text-rose-200"
                      >
                        Skip Patient
                      </Button>
                    )}

                    {appointment.status === "skipped" && (
                      <Button
                        variant="secondary"
                        loading={updatingAppointmentId === appointment.id}
                        onClick={() => onRequeueAppointment(appointment.id)}
                        className="rounded-full border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/25 dark:text-amber-200"
                      >
                        Re-add to Queue
                      </Button>
                    )}

                    {appointment.status !== "completed" &&
                      appointment.status !== "skipped" && (
                        <Button
                          variant="secondary"
                          loading={updatingAppointmentId === appointment.id}
                          onClick={() =>
                            onMarkAppointmentCompleted(appointment.id)
                          }
                          className="rounded-full px-3 py-1 text-xs"
                        >
                          Mark Completed
                        </Button>
                      )}
                  </div>

                  {(appointment.skippedAt || appointment.requeueTime) && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Timeline
                      </p>
                      <div className="mt-2 space-y-2">
                        {buildAppointmentTimeline(appointment).map(
                          (entry, index) => (
                            <div
                              key={`${entry.label}-${index}`}
                              className="flex gap-3"
                            >
                              <div className="relative flex flex-col items-center">
                                <span
                                  className={`h-3 w-3 rounded-full ${entry.tone}`}
                                />
                                {index <
                                buildAppointmentTimeline(appointment).length -
                                  1 ? (
                                  <span className="mt-1 h-full w-px flex-1 bg-slate-200 dark:bg-slate-600" />
                                ) : null}
                              </div>
                              <div className="-mt-1 flex-1 pb-1">
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {entry.time} → {entry.label}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

const StatusStat = ({ label, value, accent }) => {
  const accentClass =
    accent === "danger"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200"
      : accent === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
        : "border-slate-200 bg-white/60 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200";

  return (
    <div className={`rounded-2xl border px-3 py-3 ${accentClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-75">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
};

const StatusPill = ({ label, count, tone = "default" }) => {
  const toneClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
      : tone === "danger"
        ? "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
        : tone === "warning"
          ? "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
          : tone === "info"
            ? "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
            : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${toneClass}`}
    >
      {label}
      <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-[10px] leading-none dark:bg-white/10">
        {count}
      </span>
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const normalizedStatus = String(status || "pending").toLowerCase();

  const className =
    normalizedStatus === "in_cabin"
      ? "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
      : normalizedStatus === "completed"
        ? "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
        : normalizedStatus === "skipped"
          ? "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
          : normalizedStatus === "requeued"
            ? "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
            : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  const label =
    normalizedStatus === "in_cabin"
      ? "IN-CABIN"
      : normalizedStatus === "completed"
        ? "COMPLETED"
        : normalizedStatus === "skipped"
          ? "MISSED"
          : normalizedStatus === "requeued"
            ? "LATE ARRIVAL"
            : "PENDING";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 ${className}`}
    >
      {label}
    </span>
  );
};

const sortAppointments = (items) => {
  return [...items].sort((a, b) => {
    const weightA = getSortWeight(a.status);
    const weightB = getSortWeight(b.status);

    if (weightA !== weightB) {
      return weightA - weightB;
    }

    return getSortTimestamp(a) - getSortTimestamp(b);
  });
};

const getSortWeight = (status) => {
  const normalizedStatus = String(status || "pending").toLowerCase();

  if (normalizedStatus === "in_cabin") return 0;
  if (normalizedStatus === "pending") return 1;
  if (normalizedStatus === "requeued") return 2;
  if (normalizedStatus === "skipped") return 3;
  return 4;
};

const getSortTimestamp = (appointment) => {
  const status = String(appointment?.status || "pending").toLowerCase();

  if (status === "in_cabin" && appointment?.cabinStartTime) {
    const timestamp = new Date(appointment.cabinStartTime).getTime();
    if (!Number.isNaN(timestamp)) return timestamp;
  }

  if (status === "requeued" && appointment?.requeueTime) {
    const timestamp = new Date(appointment.requeueTime).getTime();
    if (!Number.isNaN(timestamp)) return timestamp;
  }

  const fallback = new Date(
    `${appointment?.date}T${appointment?.time}`,
  ).getTime();
  return Number.isNaN(fallback) ? 0 : fallback;
};

const buildAppointmentTimeline = (appointment) => {
  const timeline = [
    {
      time: formatTimelineTime(`${appointment.date}T${appointment.time}`),
      label: "Appointment",
      tone: "bg-blue-500",
    },
  ];

  if (appointment.skippedAt) {
    timeline.push({
      time: formatTimelineTime(appointment.skippedAt),
      label: "Skipped",
      tone: "bg-rose-500",
    });
  }

  if (appointment.requeueTime) {
    timeline.push({
      time: formatTimelineTime(appointment.requeueTime),
      label: "Re-added",
      tone: "bg-amber-500",
    });
  }

  return timeline;
};

const formatTimelineTime = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatElapsedTimer = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutesPart = Math.floor(safeSeconds / 60);
  const secondsPart = safeSeconds % 60;
  return `${String(minutesPart).padStart(2, "0")}:${String(secondsPart).padStart(2, "0")}`;
};

const formatCountdown = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutesPart = Math.floor(safeSeconds / 60);
  const secondsPart = safeSeconds % 60;

  return `${minutesPart}m ${String(secondsPart).padStart(2, "0")}s`;
};

const formatOrdinal = (value) => {
  const numeric = Number(value) || 0;
  const remainder = numeric % 100;
  if (remainder >= 11 && remainder <= 13) return `${numeric}th`;
  const tail = numeric % 10;
  if (tail === 1) return `${numeric}st`;
  if (tail === 2) return `${numeric}nd`;
  if (tail === 3) return `${numeric}rd`;
  return `${numeric}th`;
};

const formatCalendarDate = (rawDate) => {
  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return rawDate;
  }

  return parsedDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTimeLabel = (rawTime) => {
  const parsedDate = new Date(`1970-01-01T${rawTime}`);
  if (Number.isNaN(parsedDate.getTime())) {
    return rawTime;
  }

  return parsedDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

export default AppointmentsPage;
