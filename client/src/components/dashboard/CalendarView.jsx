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
}) => {
  const [selectedEvent, setSelectedEvent] = useState(null);

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
          patientId: appointment.patientId,
          date: appointment.date,
          time: appointment.time,
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
          <div className="h-[560px] animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800" />
        ) : (
          <div
            className={`calendar-shell h-[560px] ${theme === "dark" ? "calendar-dark" : ""}`}
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
                  : "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
              }`}
            >
              {selectedEvent.status === "completed" ? "Completed" : "Pending"}
            </span>

            {selectedEvent.status !== "completed" && (
              <Button
                variant="secondary"
                loading={updatingAppointmentId === selectedEvent.id}
                onClick={async () => {
                  await onMarkAppointmentCompleted(selectedEvent.id);
                  setSelectedEvent((previous) =>
                    previous ? { ...previous, status: "completed" } : previous,
                  );
                }}
                className="rounded-full px-3 py-1.5 text-xs"
              >
                {updatingAppointmentId === selectedEvent.id
                  ? "Updating..."
                  : "Mark as Completed"}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
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
