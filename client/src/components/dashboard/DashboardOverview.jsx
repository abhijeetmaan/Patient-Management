import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";
import { PatientGrowthLineChart, VisitsBarChart } from "./charts";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Clock3,
  PlusCircle,
  Sparkles,
  Stethoscope,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

const DashboardOverview = ({
  stats,
  activities,
  activityLog,
  appointments,
  patients,
  visitsPerDayData,
  patientGrowthData,
  loading,
  schedulingAppointment,
  updatingAppointmentId,
  doctorName,
  theme,
  onAddAppointment,
  onMarkAppointmentCompleted,
  onOpenPatients,
}) => {
  const [nowTick, setNowTick] = useState(() => Date.now());
  const autoCompletingAppointmentIdsRef = useRef(new Set());
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: "",
    patientName: "",
    date: "",
    time: "",
  });
  const [appointmentValidation, setAppointmentValidation] = useState("");

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const auditEntries = useMemo(() => {
    return [...(Array.isArray(activityLog) ? activityLog : [])].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );
  }, [activityLog]);

  const upcomingAppointments = useMemo(() => {
    const now = nowTick;

    return (Array.isArray(appointments) ? appointments : [])
      .map((appointment) => ({
        ...appointment,
        timestamp: new Date(
          `${appointment.date}T${appointment.time}`,
        ).getTime(),
      }))
      .filter((appointment) => !Number.isNaN(appointment.timestamp))
      .map((appointment) => ({
        ...appointment,
        cabinDurationMinutes: getCabinDurationMinutes(appointment.id),
      }))
      .map((appointment) => ({
        ...appointment,
        cabinEndsAt:
          appointment.timestamp + appointment.cabinDurationMinutes * 60 * 1000,
      }))
      .map((appointment) => {
        const status = String(appointment.status || "pending").toLowerCase();
        const isCompleted = status === "completed";
        const isInCabin =
          !isCompleted &&
          now >= appointment.timestamp &&
          now < appointment.cabinEndsAt;
        const shouldAutoComplete =
          !isCompleted && now >= appointment.cabinEndsAt;

        const displayStatus = isCompleted
          ? "completed"
          : isInCabin
            ? "in_cabin"
            : "pending";

        return {
          ...appointment,
          status,
          displayStatus,
          minutesUntil: (appointment.timestamp - now) / 60000,
          cabinMinutesLeft: (appointment.cabinEndsAt - now) / 60000,
          secondsUntil: (appointment.timestamp - now) / 1000,
          cabinSecondsLeft: (appointment.cabinEndsAt - now) / 1000,
          shouldAutoComplete,
        };
      })
      .filter((appointment) => {
        if (appointment.displayStatus === "completed") {
          return now - appointment.timestamp <= 60 * 60 * 1000;
        }

        if (appointment.displayStatus === "in_cabin") {
          return true;
        }

        return appointment.timestamp >= now - 30 * 60 * 1000;
      })
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, 8);
  }, [appointments, nowTick]);

  useEffect(() => {
    const dueForAutoComplete = upcomingAppointments.filter(
      (appointment) => appointment.shouldAutoComplete,
    );

    dueForAutoComplete.forEach((appointment) => {
      if (
        autoCompletingAppointmentIdsRef.current.has(appointment.id) ||
        updatingAppointmentId === appointment.id
      ) {
        return;
      }

      autoCompletingAppointmentIdsRef.current.add(appointment.id);

      Promise.resolve(onMarkAppointmentCompleted(appointment.id)).finally(
        () => {
          autoCompletingAppointmentIdsRef.current.delete(appointment.id);
        },
      );
    });
  }, [upcomingAppointments, onMarkAppointmentCompleted, updatingAppointmentId]);

  const reminderAppointments = useMemo(() => {
    return upcomingAppointments.filter((appointment) => {
      return (
        appointment.displayStatus === "pending" &&
        appointment.minutesUntil >= 0 &&
        appointment.minutesUntil <= 30
      );
    });
  }, [upcomingAppointments]);

  const advancedInsights = useMemo(() => {
    const diagnosisCounts = (
      Array.isArray(activities) ? activities : []
    ).reduce((accumulator, activity) => {
      const diagnosis = String(activity.diagnosis || "")
        .trim()
        .toLowerCase();
      if (!diagnosis) {
        return accumulator;
      }

      accumulator.set(diagnosis, (accumulator.get(diagnosis) || 0) + 1);
      return accumulator;
    }, new Map());

    const mostCommonEntry = [...diagnosisCounts.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const todayVisits =
      (Array.isArray(visitsPerDayData) ? visitsPerDayData : []).find(
        (entry) => entry.day === todayKey,
      )?.visits || 0;

    const peakDayEntry = [
      ...(Array.isArray(visitsPerDayData) ? visitsPerDayData : []),
    ].sort(
      (a, b) =>
        (Number(b.visits) || 0) - (Number(a.visits) || 0) ||
        String(b.day || "").localeCompare(String(a.day || "")),
    )[0];

    return {
      mostCommonIllness: mostCommonEntry
        ? toTitleCase(mostCommonEntry[0])
        : "No diagnosis data",
      mostCommonCount: mostCommonEntry ? mostCommonEntry[1] : 0,
      diagnosisVariety: diagnosisCounts.size,
      totalVisitsToday: todayVisits,
      peakDayLabel: peakDayEntry?.dateLabel || "No data",
      peakDayVisits: Number(peakDayEntry?.visits) || 0,
    };
  }, [activities, visitsPerDayData]);

  const groupedAppointments = useMemo(() => {
    return upcomingAppointments.reduce((accumulator, appointment) => {
      const day = appointment.date;
      if (!accumulator[day]) {
        accumulator[day] = [];
      }
      accumulator[day].push(appointment);
      return accumulator;
    }, {});
  }, [upcomingAppointments]);

  const updateAppointmentForm = (event) => {
    const { name, value } = event.target;
    setAppointmentForm((previous) => ({ ...previous, [name]: value }));
  };

  const patientOptions = useMemo(() => {
    return (Array.isArray(patients) ? patients : []).map((patient) => ({
      value: patient.id,
      label: patient.name,
      age: patient.age,
      gender: patient.gender,
      name: patient.name,
    }));
  }, [patients]);

  const selectedPatientOption = useMemo(() => {
    if (!appointmentForm.patientId) {
      return null;
    }

    return (
      patientOptions.find(
        (option) => option.value === appointmentForm.patientId,
      ) || null
    );
  }, [appointmentForm.patientId, patientOptions]);

  const selectedPatient = useMemo(() => {
    if (!appointmentForm.patientId) {
      return null;
    }

    return (
      (Array.isArray(patients) ? patients : []).find(
        (patient) => patient.id === appointmentForm.patientId,
      ) || null
    );
  }, [appointmentForm.patientId, patients]);

  const handleSelectPatient = (selectedOption) => {
    if (!selectedOption) {
      setAppointmentForm((previous) => ({
        ...previous,
        patientId: "",
        patientName: "",
      }));
      return;
    }

    setAppointmentForm((previous) => ({
      ...previous,
      patientId: selectedOption.value,
      patientName: selectedOption.name,
    }));
    setAppointmentValidation("");
  };

  const submitAppointment = async (event) => {
    event.preventDefault();

    if (
      !appointmentForm.patientId ||
      !appointmentForm.date ||
      !appointmentForm.time
    ) {
      setAppointmentValidation("Patient, date and time are required.");
      return;
    }

    setAppointmentValidation("");

    try {
      await onAddAppointment({
        patientId: appointmentForm.patientId,
        patientName: appointmentForm.patientName,
        date: appointmentForm.date,
        time: appointmentForm.time,
      });
      setAppointmentForm({
        patientId: "",
        patientName: "",
        date: "",
        time: "",
      });
    } catch (_error) {
      // Parent surfaces request errors.
    }
  };

  const statCards = [
    {
      key: "totalPatients",
      label: "Your Patients",
      value: stats.totalPatients,
      icon: Users,
      tone: {
        iconBg:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
        value: "text-blue-700 dark:text-blue-200",
      },
    },
    {
      key: "totalVisits",
      label: "Total Visits",
      value: stats.totalVisits,
      icon: ClipboardList,
      tone: {
        iconBg:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200",
        value: "text-purple-700 dark:text-purple-200",
      },
    },
    {
      key: "activePatients",
      label: "Active Patients",
      value: stats.activePatients,
      icon: Activity,
      tone: {
        iconBg:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
        value: "text-emerald-700 dark:text-emerald-200",
      },
    },
    {
      key: "recentActivity",
      label: "Recent Activity",
      value: stats.recentActivity,
      icon: Sparkles,
      tone: {
        iconBg:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
        value: "text-amber-700 dark:text-amber-200",
      },
    },
  ];

  const insights = useMemo(() => {
    const diagnosisCounts = activities.reduce((accumulator, activity) => {
      const diagnosis = String(activity.diagnosis || "")
        .trim()
        .toLowerCase();
      if (!diagnosis) {
        return accumulator;
      }

      accumulator.set(diagnosis, (accumulator.get(diagnosis) || 0) + 1);
      return accumulator;
    }, new Map());

    const topDiagnosisEntry = [...diagnosisCounts.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];

    const visitsByPatient = (Array.isArray(patients) ? patients : []).map(
      (patient) => {
        const totalVisits = Array.isArray(patient.visits)
          ? patient.visits.length
          : 0;
        return {
          patientId: patient.id,
          patientName: patient.name,
          totalVisits,
        };
      },
    );

    const topPatient = [...visitsByPatient].sort(
      (a, b) => b.totalVisits - a.totalVisits,
    )[0];

    const totalVisitCount = visitsByPatient.reduce(
      (sum, patient) => sum + patient.totalVisits,
      0,
    );
    const averageVisitsPerPatient = visitsByPatient.length
      ? (totalVisitCount / visitsByPatient.length).toFixed(1)
      : "0.0";

    const trendInfo = getVisitTrend(visitsPerDayData);

    return [
      {
        key: "common-illness",
        title: "Most common illness",
        value: topDiagnosisEntry
          ? toTitleCase(topDiagnosisEntry[0])
          : "No diagnosis data",
        meta: topDiagnosisEntry
          ? `${topDiagnosisEntry[1]} recorded visits`
          : "",
        icon: Stethoscope,
        tone: "text-rose-600 dark:text-rose-300",
      },
      {
        key: "active-patient",
        title: "Most active patient",
        value:
          topPatient && topPatient.totalVisits > 0
            ? topPatient.patientName
            : "No visit activity",
        meta:
          topPatient && topPatient.totalVisits > 0
            ? `${topPatient.totalVisits} total visits`
            : "",
        icon: Users,
        tone: "text-blue-600 dark:text-blue-300",
      },
      {
        key: "visits-per-patient",
        title: "Visits per patient",
        value: `${averageVisitsPerPatient} avg`,
        meta: `${totalVisitCount} visits across ${visitsByPatient.length} patients`,
        icon: Activity,
        tone: "text-emerald-600 dark:text-emerald-300",
      },
      {
        key: "trend",
        title: "Visit trend",
        value: trendInfo.label,
        meta: trendInfo.meta,
        icon: trendInfo.direction === "up" ? TrendingUp : TrendingDown,
        tone:
          trendInfo.direction === "up"
            ? "text-emerald-600 dark:text-emerald-300"
            : "text-amber-600 dark:text-amber-300",
      },
    ];
  }, [activities, patients, visitsPerDayData]);
  const formattedDoctorName = formatDoctorName(doctorName);
  const firstName =
    formattedDoctorName === "Doctor"
      ? "Doctor"
      : formattedDoctorName.split(" ")[0] || "Doctor";
  const dashboardBadgeLabel =
    firstName === "Doctor"
      ? "Doctor Dashboard"
      : `Dr. ${firstName}'s Dashboard`;

  return (
    <div className="space-y-10">
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <section className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-900/30 dark:text-blue-200">
              <Sparkles className="h-3.5 w-3.5" />
              {dashboardBadgeLabel}
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Welcome back, Dr. {formattedDoctorName}. This workspace is scoped
              to your patients and appointments.
            </p>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/30">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Advanced Insights
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Card className="p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                  <Stethoscope className="h-4.5 w-4.5" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Most Common Illness
                </p>
                <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                  {advancedInsights.mostCommonIllness}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {advancedInsights.mostCommonCount} cases •{" "}
                  {advancedInsights.diagnosisVariety} diagnoses tracked
                </p>
              </Card>

              <Card className="p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                  <CalendarClock className="h-4.5 w-4.5" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Total Visits Today
                </p>
                <p className="mt-1 text-2xl font-extrabold text-amber-700 dark:text-amber-200">
                  {advancedInsights.totalVisitsToday}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Based on today&apos;s visit timeline
                </p>
              </Card>

              <Card className="p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                  <TrendingUp className="h-4.5 w-4.5" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Peak Day
                </p>
                <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                  {advancedInsights.peakDayLabel}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {advancedInsights.peakDayVisits} visits on the busiest day
                </p>
              </Card>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/30">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Insights Engine
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {insights.map((insight) => (
                <Card
                  key={insight.key}
                  className="group p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/90">
                    <insight.icon className={`h-4.5 w-4.5 ${insight.tone}`} />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {insight.title}
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                    {insight.value}
                  </p>
                  {insight.meta && (
                    <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {insight.meta}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/30">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Dashboard Snapshot
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <Card
                  as="article"
                  key={card.key}
                  className="group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${card.tone.iconBg}`}
                  >
                    <card.icon />
                  </div>
                  <p
                    className={`text-4xl font-extrabold md:text-[2.2rem] ${card.tone.value}`}
                  >
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    {card.label}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/30">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Charts & Trends
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card className="p-6 md:p-7">
                <div className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h3 className="font-['Sora'] text-xl font-bold text-slate-900 dark:text-white">
                    Visits Overview
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    Number of patient visits per day.
                  </p>
                </div>

                {visitsPerDayData.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                    Not enough visits to show chart.
                  </p>
                ) : (
                  <VisitsBarChart data={visitsPerDayData} theme={theme} />
                )}
              </Card>

              <Card className="p-6 md:p-7">
                <div className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h3 className="font-['Sora'] text-xl font-bold text-slate-900 dark:text-white">
                    Patient Growth
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    Cumulative total patients over time.
                  </p>
                </div>

                {patientGrowthData.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                    Not enough patients to show growth chart.
                  </p>
                ) : (
                  <PatientGrowthLineChart
                    data={patientGrowthData}
                    theme={theme}
                  />
                )}
              </Card>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/30">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Scheduling & Activity
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr),minmax(0,1.05fr)]">
              <Card className="p-6 md:p-7">
                <div className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h3 className="inline-flex items-center gap-2 font-['Sora'] text-xl font-bold text-slate-900 dark:text-white">
                    <PlusCircle className="h-5 w-5 text-brand-600 dark:text-brand-200" />
                    Schedule Appointment
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    Add new consultations for patient follow-ups.
                  </p>
                </div>

                <form className="space-y-3" onSubmit={submitAppointment}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Patient
                    <div className="mt-1">
                      <Select
                        options={patientOptions}
                        value={selectedPatientOption}
                        onChange={handleSelectPatient}
                        isSearchable
                        placeholder="Select patient"
                        noOptionsMessage={() => "No patients found"}
                        formatOptionLabel={(option) => (
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{option.name}</span>
                            <span className="text-xs opacity-80">
                              {option.age}y • {option.gender}
                            </span>
                          </div>
                        )}
                        styles={getPatientSelectStyles(theme)}
                      />
                    </div>
                  </label>

                  {selectedPatient && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/30 dark:text-emerald-200">
                      <p className="font-semibold">Selected Patient</p>
                      <p className="mt-0.5">
                        {selectedPatient.name} • {selectedPatient.age} years •{" "}
                        {selectedPatient.gender}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Date
                      <Input
                        type="date"
                        name="date"
                        value={appointmentForm.date}
                        onChange={updateAppointmentForm}
                      />
                    </label>

                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Time
                      <Input
                        type="time"
                        name="time"
                        value={appointmentForm.time}
                        onChange={updateAppointmentForm}
                      />
                    </label>
                  </div>

                  {appointmentValidation && (
                    <p className="text-sm font-medium text-red-600 dark:text-red-300">
                      {appointmentValidation}
                    </p>
                  )}

                  <Button
                    type="submit"
                    loading={schedulingAppointment}
                    className="w-full"
                  >
                    {schedulingAppointment
                      ? "Scheduling..."
                      : "Schedule Appointment"}
                  </Button>
                </form>
              </Card>

              <Card className="p-6 md:p-7">
                <div className="mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <h3 className="inline-flex items-center gap-2 font-['Sora'] text-xl font-bold text-slate-900 dark:text-white">
                    <CalendarClock className="h-5 w-5 text-brand-600 dark:text-brand-200" />
                    Upcoming Appointments
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    Calendar-style list of the next scheduled visits.
                  </p>
                </div>

                {reminderAppointments.length > 0 ? (
                  <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-900/25 dark:text-amber-200">
                    <p className="inline-flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      {reminderAppointments.length} appointment
                      {reminderAppointments.length > 1 ? "s are" : " is"} due
                      within 30 minutes.
                    </p>
                  </div>
                ) : null}

                {Object.keys(groupedAppointments).length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                    No upcoming appointments.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedAppointments).map(
                      ([day, dayItems]) => (
                        <div key={day}>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {formatCalendarDate(day)}
                          </p>

                          <div className="space-y-2">
                            {dayItems.map((appointment) =>
                              (() => {
                                const isReminder =
                                  appointment.displayStatus === "pending" &&
                                  appointment.minutesUntil >= 0 &&
                                  appointment.minutesUntil <= 30;
                                const isInCabin =
                                  appointment.displayStatus === "in_cabin";
                                const isCompleted =
                                  appointment.displayStatus === "completed";

                                return (
                                  <article
                                    key={appointment.id}
                                    className={`rounded-xl border px-4 py-3 transition-all duration-300 hover:border-brand-200 ${
                                      isInCabin
                                        ? "border-emerald-300 bg-emerald-50/80 dark:border-emerald-700 dark:bg-emerald-900/20"
                                        : isReminder
                                          ? "border-amber-300 bg-amber-50/80 dark:border-amber-700 dark:bg-amber-900/20"
                                          : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/80"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                        {appointment.patientName}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <AppointmentStatusBadge
                                          status={appointment.displayStatus}
                                        />
                                        <p className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-300">
                                          <Clock3 className="h-3.5 w-3.5" />
                                          {formatTimeLabel(appointment.time)}
                                        </p>
                                      </div>
                                    </div>

                                    {isReminder ? (
                                      <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:border-amber-700 dark:bg-amber-900/35 dark:text-amber-200">
                                        <AlertTriangle className="h-3 w-3" />
                                        Starts in{" "}
                                        {formatCountdown(
                                          appointment.secondsUntil,
                                        )}
                                      </p>
                                    ) : null}

                                    {isInCabin ? (
                                      <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200">
                                        <Clock3 className="h-3 w-3" />
                                        In-Cabin •{" "}
                                        {formatCountdown(
                                          appointment.cabinSecondsLeft,
                                        )}{" "}
                                        left
                                      </p>
                                    ) : null}

                                    {!isCompleted && (
                                      <Button
                                        variant="secondary"
                                        loading={
                                          updatingAppointmentId ===
                                          appointment.id
                                        }
                                        onClick={() =>
                                          onMarkAppointmentCompleted(
                                            appointment.id,
                                          )
                                        }
                                        className="mt-3 rounded-full px-3 py-1 text-xs"
                                      >
                                        {updatingAppointmentId ===
                                        appointment.id
                                          ? "Updating..."
                                          : "Mark as Completed"}
                                      </Button>
                                    )}
                                  </article>
                                );
                              })(),
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </Card>
            </div>
          </section>

          <Card className="p-6 md:p-7">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <h3 className="font-['Sora'] text-xl font-bold text-slate-900 dark:text-white">
                  Recent Activity
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                  System log of patient and appointment events.
                </p>
              </div>
              <Button
                onClick={onOpenPatients}
                variant="primary"
                className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 text-sm hover:from-purple-500 hover:to-blue-500"
              >
                <ArrowRight className="h-4 w-4" />
                Open Patients
              </Button>
            </div>

            {auditEntries.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                No activity recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {auditEntries.map((entry, index) => (
                  <article
                    key={entry.id || `${entry.timestamp}-${index}`}
                    className="relative overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-slate-500"
                  >
                    <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 via-indigo-500 to-cyan-400" />
                    <div className="ml-2 flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                        <ActivityLogBadge action={entry.action} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">
                          {entry.message || formatAuditMessage(entry)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                          <span>{entry.user || "Doctor"}</span>
                          <span>•</span>
                          <span>{formatActivityTime(entry.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

const DashboardSkeleton = () => {
  return (
    <>
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5">
            <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
            <div className="mt-4 h-10 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="p-5 md:p-6">
            <div className="h-7 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-2 h-4 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="mt-6 h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          </Card>
        ))}
      </section>

      <Card className="p-5 md:p-6">
        <div className="h-7 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      </Card>
    </>
  );
};

const formatDoctorName = (rawName) => {
  const normalized = String(rawName || "").trim();

  if (!normalized) {
    return "Doctor";
  }

  const withoutTitle = normalized.replace(/^dr\.?\s+/i, "").trim();

  if (!withoutTitle) {
    return "Doctor";
  }

  return withoutTitle
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
};

const formatActivityDate = (rawDate) => {
  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  return parsedDate.toLocaleString();
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

const getCabinDurationMinutes = (appointmentId) => {
  const seed = String(appointmentId || "appointment")
    .split("")
    .reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0);

  return 5 + (seed % 6);
};

const formatCountdown = (seconds) => {
  const clamped = Math.max(0, Math.ceil(Number(seconds) || 0));
  const minutesPart = Math.floor(clamped / 60);
  const secondsPart = clamped % 60;

  return `${minutesPart}m ${String(secondsPart).padStart(2, "0")}s`;
};

const getActivityBadge = (activity, activities) => {
  const diagnosis = String(activity.diagnosis || "").toLowerCase();
  if (/(critical|emergency|severe|acute)/.test(diagnosis)) {
    return "Critical";
  }

  if (activities[0]?.id === activity.id) {
    return "New";
  }

  return "Active";
};

const ActivityLogBadge = ({ action }) => {
  const normalizedType = String(action || "info").toLowerCase();

  const config = {
    patient_added: {
      label: "Patient",
      className:
        "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
      icon: Users,
    },
    patient_updated: {
      label: "Update",
      className:
        "border-violet-200 bg-violet-100 text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-200",
      icon: Activity,
    },
    appointment_scheduled: {
      label: "Appointment",
      className:
        "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
      icon: CalendarClock,
    },
    status_updated: {
      label: "Status",
      className:
        "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
      icon: Sparkles,
    },
    appointment_completed: {
      label: "Complete",
      className:
        "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
      icon: Sparkles,
    },
    login: {
      label: "Login",
      className:
        "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-800 dark:bg-sky-900/30 dark:text-sky-200",
      icon: ShieldCheck,
    },
    info: {
      label: "System",
      className:
        "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
      icon: Activity,
    },
  };

  const selected = config[normalizedType] || config.info;
  const Icon = selected.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${selected.className}`}
    >
      <Icon className="h-3 w-3" />
      {selected.label}
    </span>
  );
};

const formatAuditMessage = (entry) => {
  const action = String(entry?.action || "").toLowerCase();
  const user = String(entry?.user || "Doctor");

  if (action === "login") {
    return `${user} logged in`;
  }

  if (action === "patient_added") {
    return `${user} added a patient`;
  }

  if (action === "patient_updated") {
    return `${user} updated a patient`;
  }

  if (action === "appointment_scheduled") {
    return `${user} scheduled an appointment`;
  }

  if (action === "appointment_completed") {
    return `${user} completed an appointment`;
  }

  return entry?.message || "Activity recorded";
};

const formatActivityTime = (timestamp) => {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
};

const toTitleCase = (value) =>
  String(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

const getVisitTrend = (visitsPerDayData) => {
  const values = (Array.isArray(visitsPerDayData) ? visitsPerDayData : [])
    .map((item) => Number(item.visits) || 0)
    .filter((value) => Number.isFinite(value));

  if (values.length < 2) {
    return {
      direction: "down",
      label: "Stable volume",
      meta: "Need more historical data",
    };
  }

  const recentWindow = values.slice(-7);
  const previousWindow = values.slice(-14, -7);

  const recentAvg =
    recentWindow.reduce((sum, value) => sum + value, 0) / recentWindow.length;

  const previousAvg = previousWindow.length
    ? previousWindow.reduce((sum, value) => sum + value, 0) /
      previousWindow.length
    : recentAvg;

  const delta = recentAvg - previousAvg;

  if (Math.abs(delta) < 0.2) {
    return {
      direction: "down",
      label: "Stable volume",
      meta: "Average visits are steady week-over-week",
    };
  }

  if (delta > 0) {
    return {
      direction: "up",
      label: "Rising activity",
      meta: `+${delta.toFixed(1)} avg visits vs previous period`,
    };
  }

  return {
    direction: "down",
    label: "Cooling activity",
    meta: `${delta.toFixed(1)} avg visits vs previous period`,
  };
};

const Badge = ({ label }) => {
  const variants = {
    Active:
      "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200",
    Critical:
      "border-red-200 bg-red-100 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200",
    New: "border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-200",
  };

  const icon =
    label === "Critical" ? (
      <AlertTriangle className="h-3 w-3" />
    ) : label === "New" ? (
      <Sparkles className="h-3 w-3" />
    ) : (
      <Activity className="h-3 w-3" />
    );

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${variants[label] || variants.Active}`}
    >
      {icon}
      {label}
    </span>
  );
};

const getPatientSelectStyles = (theme) => {
  const isDark = theme === "dark";

  return {
    control: (base, state) => ({
      ...base,
      borderRadius: 12,
      minHeight: 42,
      borderColor: state.isFocused
        ? isDark
          ? "#60a5fa"
          : "#2563eb"
        : isDark
          ? "#334155"
          : "#cbd5e1",
      backgroundColor: isDark
        ? "rgba(30, 41, 59, 0.95)"
        : "rgba(255,255,255,0.95)",
      boxShadow: state.isFocused
        ? isDark
          ? "0 0 0 3px rgba(96, 165, 250, 0.25)"
          : "0 0 0 3px rgba(37, 99, 235, 0.2)"
        : "none",
      transition: "all 300ms",
      backdropFilter: "blur(12px)",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 12,
      overflow: "hidden",
      border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
      backgroundColor: isDark
        ? "rgba(15, 23, 42, 0.96)"
        : "rgba(255,255,255,0.98)",
      backdropFilter: "blur(14px)",
      boxShadow: "0 12px 28px rgba(15, 23, 42, 0.2)",
      zIndex: 30,
    }),
    option: (base, state) => ({
      ...base,
      fontSize: 14,
      backgroundColor: state.isFocused
        ? isDark
          ? "rgba(37, 99, 235, 0.22)"
          : "rgba(219, 234, 254, 1)"
        : "transparent",
      color: isDark ? "#e2e8f0" : "#1e293b",
      cursor: "pointer",
    }),
    singleValue: (base) => ({
      ...base,
      color: isDark ? "#e2e8f0" : "#1e293b",
      fontWeight: 600,
    }),
    placeholder: (base) => ({
      ...base,
      color: isDark ? "#94a3b8" : "#64748b",
    }),
    input: (base) => ({
      ...base,
      color: isDark ? "#e2e8f0" : "#1e293b",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: isDark ? "#94a3b8" : "#64748b",
      transition: "all 300ms",
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: isDark ? "#334155" : "#cbd5e1",
    }),
  };
};

const AppointmentStatusBadge = ({ status }) => {
  const normalizedStatus = String(status || "pending").toLowerCase();

  const badgeClass =
    normalizedStatus === "completed"
      ? "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
      : normalizedStatus === "in_cabin"
        ? "border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
        : "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200";

  const label = normalizedStatus === "in_cabin" ? "IN-CABIN" : normalizedStatus;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}
    >
      {label}
    </span>
  );
};

export default DashboardOverview;
