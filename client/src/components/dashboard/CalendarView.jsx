import { useEffect, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import enUS from "date-fns/locale/en-US";
import { CalendarDays, Clock3, UserRound } from "lucide-react";
import Button from "../ui/Button";
import Card from "../ui/Card";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const CalendarView = ({
  appointments,
  loading,
  updatingAppointmentId,
  focusedCalendarAppointment,
  theme,
  onMarkAppointmentCompleted,
  onSendToCabin,
  onSkipAppointment,
  onRequeueAppointment,
  nextPendingAppointmentId,
  onAddPatient,
}) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const events = useMemo(() => {
    return (Array.isArray(appointments) ? appointments : [])
      .map((appointment) => {
        const start = new Date(`${appointment.date}T${appointment.time}`);
        const end = new Date(start.getTime() + 30 * 60 * 1000);

        if (Number.isNaN(start.getTime())) {
          return null;
        }

        return {
          id: appointment.id,
          title: appointment.patientName,
          start,
          end,
          status: appointment.status || "pending",
          patientName: appointment.patientName,
          doctorName: appointment.doctorName,
          patientId: appointment.patientId,
          date: appointment.date,
          time: appointment.time,
          cabinStartTime: appointment.cabinStartTime || null,
          completedAt: appointment.completedAt || null,
          skippedAt: appointment.skippedAt || null,
          requeueTime: appointment.requeueTime || null,
          isLate: Boolean(appointment.isLate),
        };
      })
      .filter(Boolean);
  }, [appointments]);

  useEffect(() => {
    if (!focusedCalendarAppointment?.appointmentId) {
      return;
    }

    const matchingEvent = events.find(
      (event) => event.id === focusedCalendarAppointment.appointmentId,
    );

    if (matchingEvent) {
      setSelectedEvent(matchingEvent);
    }
  }, [events, focusedCalendarAppointment]);

  return (
    <div className="space-y-6">
      <Card className="p-5 md:p-6">
        <div className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="inline-flex items-center gap-2 font-['Sora'] text-2xl font-bold text-slate-900 dark:text-white">
            <CalendarDays className="h-6 w-6 text-brand-600 dark:text-brand-200" />
            Appointments Calendar
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Monthly care schedule for all upcoming consultations.
          </p>
        </div>

        {loading ? (
          <div className="h-[420px] animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800 sm:h-[500px] lg:h-[560px]" />
        ) : events.length === 0 ? (
          <div className="flex h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center sm:h-[500px] lg:h-[560px] dark:border-slate-700 dark:bg-slate-800/70">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-200">
              <CalendarDays className="h-8 w-8" />
            </div>
            <p className="font-['Sora'] text-xl font-bold text-slate-800 dark:text-white">
              No appointments scheduled
            </p>
            <p className="mt-2 max-w-sm text-sm font-medium text-slate-500 dark:text-slate-300">
              Add your first patient and start scheduling appointments to fill
              this calendar.
            </p>
            <Button
              type="button"
              onClick={onAddPatient}
              className="mt-5 inline-flex items-center justify-center"
            >
              Add Patient
            </Button>
          </div>
        ) : (
          <div
            className={`calendar-shell h-[420px] sm:h-[500px] lg:h-[560px] ${theme === "dark" ? "calendar-dark" : ""}`}
          >
            <Calendar
              localizer={localizer}
              events={events}
              views={["month"]}
              defaultView="month"
              popup
              onSelectEvent={(event) => setSelectedEvent(event)}
              eventPropGetter={(event) => ({
                className:
                  event.status === "completed"
                    ? "rounded-md border border-emerald-200 bg-gradient-to-r from-emerald-500 to-green-500 px-2 py-1 text-xs font-semibold text-white shadow-sm"
                    : event.status === "in_cabin"
                      ? "rounded-md border border-blue-200 bg-gradient-to-r from-blue-500 to-cyan-500 px-2 py-1 text-xs font-semibold text-white shadow-sm"
                      : event.status === "requeued"
                        ? "rounded-md border border-amber-200 bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-1 text-xs font-semibold text-white shadow-sm"
                        : event.status === "skipped"
                          ? "rounded-md border border-rose-200 bg-gradient-to-r from-rose-500 to-red-500 px-2 py-1 text-xs font-semibold text-white shadow-sm"
                          : "rounded-md border border-amber-200 bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-1 text-xs font-semibold text-white shadow-sm",
              })}
            />
          </div>
        )}
      </Card>

      {selectedEvent && (
        <Card className="p-5 md:p-6">
          <h4 className="font-['Sora'] text-lg font-bold text-slate-900 dark:text-white">
            Appointment Details
          </h4>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <DetailTile
              icon={UserRound}
              label="Patient"
              value={selectedEvent.patientName}
            />
            <DetailTile
              icon={UserRound}
              label="Doctor"
              value={selectedEvent.doctorName || "Unknown Doctor"}
            />
            <DetailTile
              icon={CalendarDays}
              label="Date"
              value={format(selectedEvent.start, "EEE, MMM d, yyyy")}
            />
            <DetailTile
              icon={Clock3}
              label="Time"
              value={format(selectedEvent.start, "hh:mm a")}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                selectedEvent.status === "completed"
                  ? "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                  : selectedEvent.status === "in_cabin"
                    ? "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                    : selectedEvent.status === "requeued"
                      ? "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                      : selectedEvent.status === "skipped"
                        ? "border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200"
                        : "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
              }`}
            >
              {selectedEvent.status === "completed"
                ? "Completed"
                : selectedEvent.status === "in_cabin"
                  ? "In Cabin"
                  : selectedEvent.status === "requeued"
                    ? "Late Arrival"
                    : selectedEvent.status === "skipped"
                      ? "Missed Appointment"
                      : "Pending"}
            </span>

            {selectedEvent.status === "in_cabin" && (
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-900/25 dark:text-blue-200">
                In Cabin:{" "}
                {formatElapsedTimer(
                  getElapsedSeconds(selectedEvent.cabinStartTime, nowTick),
                )}
              </span>
            )}

            {selectedEvent.status === "pending" &&
              String(selectedEvent.id) ===
                String(nextPendingAppointmentId || "") && (
                <Button
                  variant="secondary"
                  loading={updatingAppointmentId === selectedEvent.id}
                  onClick={async () => {
                    const updated = await onSendToCabin(selectedEvent.id);
                    if (updated) {
                      setSelectedEvent((previous) =>
                        previous
                          ? {
                              ...previous,
                              status: "in_cabin",
                              cabinStartTime:
                                updated.cabinStartTime ||
                                new Date().toISOString(),
                            }
                          : previous,
                      );
                    }
                  }}
                  className="rounded-full border-blue-300 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-200"
                >
                  {updatingAppointmentId === selectedEvent.id
                    ? "Updating..."
                    : "Send to Cabin"}
                </Button>
              )}

            {selectedEvent.status === "skipped" && (
              <Button
                variant="secondary"
                loading={updatingAppointmentId === selectedEvent.id}
                onClick={async () => {
                  const updated = await onRequeueAppointment(selectedEvent.id);
                  if (updated) {
                    setSelectedEvent((previous) =>
                      previous
                        ? {
                            ...previous,
                            status: "requeued",
                            requeueTime:
                              updated.requeueTime || new Date().toISOString(),
                            isLate: true,
                          }
                        : previous,
                    );
                  }
                }}
                className="rounded-full border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
              >
                {updatingAppointmentId === selectedEvent.id
                  ? "Updating..."
                  : "Re-add to Queue"}
              </Button>
            )}

            {(selectedEvent.status === "pending" ||
              selectedEvent.status === "in_cabin") && (
              <Button
                variant="secondary"
                loading={updatingAppointmentId === selectedEvent.id}
                onClick={async () => {
                  await onSkipAppointment(selectedEvent.id);
                  setSelectedEvent((previous) =>
                    previous
                      ? {
                          ...previous,
                          status: "skipped",
                          isLate: true,
                        }
                      : previous,
                  );
                }}
                className="rounded-full border-rose-300 bg-rose-50 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-200"
              >
                {updatingAppointmentId === selectedEvent.id
                  ? "Updating..."
                  : "Skip Patient"}
              </Button>
            )}

            {selectedEvent.status !== "completed" &&
              selectedEvent.status !== "skipped" && (
                <Button
                  variant="secondary"
                  loading={updatingAppointmentId === selectedEvent.id}
                  onClick={async () => {
                    const updated = await onMarkAppointmentCompleted(
                      selectedEvent.id,
                    );
                    if (updated) {
                      setSelectedEvent((previous) =>
                        previous
                          ? { ...previous, status: "completed" }
                          : previous,
                      );
                    }
                  }}
                  className="rounded-full px-3 py-1.5 text-xs"
                >
                  {updatingAppointmentId === selectedEvent.id
                    ? "Updating..."
                    : "Mark as Completed"}
                </Button>
              )}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Timeline
            </p>
            <div className="mt-3 space-y-3">
              {buildAppointmentTimeline(selectedEvent).map((entry, index) => (
                <div key={`${entry.label}-${index}`} className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <span className={`h-3 w-3 rounded-full ${entry.tone}`} />
                    {index <
                    buildAppointmentTimeline(selectedEvent).length - 1 ? (
                      <span className="mt-1 h-full w-px flex-1 bg-slate-200 dark:bg-slate-600" />
                    ) : null}
                  </div>
                  <div className="-mt-1 flex-1 pb-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {entry.time} → {entry.label}
                    </p>
                    {entry.meta ? (
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {entry.meta}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

const getElapsedSeconds = (cabinStartTime, nowTick) => {
  if (!cabinStartTime) {
    return 0;
  }

  const startTimestamp = new Date(cabinStartTime).getTime();

  if (Number.isNaN(startTimestamp)) {
    return 0;
  }

  return Math.max(0, Math.floor((nowTick - startTimestamp) / 1000));
};

const formatElapsedTimer = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutesPart = Math.floor(safeSeconds / 60);
  const secondsPart = safeSeconds % 60;

  return `${String(minutesPart).padStart(2, "0")}:${String(secondsPart).padStart(2, "0")}`;
};

const buildAppointmentTimeline = (appointment) => {
  if (!appointment) {
    return [];
  }

  const timeline = [
    {
      time: formatTimelineTime(
        appointment.start || `${appointment.date}T${appointment.time}`,
      ),
      label: "Appointment",
      meta: "Scheduled consultation",
      tone: "bg-blue-500",
    },
  ];

  if (appointment.skippedAt) {
    timeline.push({
      time: formatTimelineTime(appointment.skippedAt),
      label: "Skipped",
      meta: "Missed appointment",
      tone: "bg-rose-500",
    });
  }

  if (appointment.requeueTime) {
    timeline.push({
      time: formatTimelineTime(appointment.requeueTime),
      label: "Re-added",
      meta: "Back in queue",
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

  return format(date, "HH:mm");
};

const DetailTile = ({ icon: Icon, label, value }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 p-3 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/70">
      <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">
        {value}
      </p>
    </div>
  );
};

export default CalendarView;
