import { useMemo } from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { PatientGrowthLineChart, VisitsBarChart } from "./charts";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

const DashboardOverview = ({
  stats,
  activities,
  activityLog,
  visitsPerDayData,
  patientGrowthData,
  loading,
  doctorName,
  theme,
  onOpenPatients,
  onAddPatient,
}) => {
  const recentActivityEntries = useMemo(() => {
    return [...(Array.isArray(activityLog) ? activityLog : [])].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    );
  }, [activityLog]);

  const insights = useMemo(() => {
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

    const topDiagnosis = [...diagnosisCounts.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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

    return [
      {
        key: "common-illness",
        title: "Most common illness",
        value: topDiagnosis
          ? toTitleCase(topDiagnosis[0])
          : "No diagnosis data",
        meta: topDiagnosis ? `${topDiagnosis[1]} recorded visits` : "",
        icon: Stethoscope,
        tone: "text-rose-600 dark:text-rose-300",
      },
      {
        key: "today-visits",
        title: "Visits today",
        value: String(todayVisits),
        meta: "Based on today's timeline",
        icon: CalendarClock,
        tone: "text-amber-600 dark:text-amber-300",
      },
      {
        key: "peak-day",
        title: "Peak day",
        value: peakDayEntry?.dateLabel || "No data",
        meta: `${Number(peakDayEntry?.visits) || 0} visits on busiest day`,
        icon: TrendingUp,
        tone: "text-emerald-600 dark:text-emerald-300",
      },
      {
        key: "trend",
        title: "Visit trend",
        value: getVisitTrendLabel(visitsPerDayData),
        meta: getVisitTrendMeta(visitsPerDayData),
        icon:
          getVisitTrendDirection(visitsPerDayData) === "up"
            ? TrendingUp
            : TrendingDown,
        tone:
          getVisitTrendDirection(visitsPerDayData) === "up"
            ? "text-emerald-600 dark:text-emerald-300"
            : "text-amber-600 dark:text-amber-300",
      },
    ];
  }, [activities, visitsPerDayData]);

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

  const formattedDoctorName = formatDoctorName(doctorName);
  const firstName =
    formattedDoctorName === "Doctor"
      ? "Doctor"
      : formattedDoctorName.split(" ")[0] || "Doctor";
  const dashboardBadgeLabel =
    firstName === "Doctor"
      ? "Doctor Dashboard"
      : `Dr. ${firstName}'s Dashboard`;

  const sectionMotion = {
    hidden: { opacity: 0, y: 26 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const cardStaggerMotion = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardMotion = {
    hidden: { opacity: 0, y: 18, scale: 0.985 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.36, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      className="space-y-10"
      variants={cardStaggerMotion}
      initial="hidden"
      animate="show"
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <motion.section className="space-y-3" variants={sectionMotion}>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:border-blue-900/60 dark:bg-blue-900/30 dark:text-blue-200">
              <Sparkles className="h-3.5 w-3.5" />
              {dashboardBadgeLabel}
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Welcome back, Dr. {formattedDoctorName}. This workspace is scoped
              to your patients and chart intelligence.
            </p>
          </motion.section>

          <motion.section className="space-y-4" variants={sectionMotion}>
            <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/30">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Dashboard Snapshot
              </p>
            </div>

            <motion.div
              className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
              variants={cardStaggerMotion}
            >
              {statCards.map((card) => (
                <motion.div key={card.key} variants={cardMotion}>
                  <Card
                    as="article"
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
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          <motion.section className="space-y-4" variants={sectionMotion}>
            <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/30">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Insights Engine
              </p>
            </div>

            <motion.div
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              variants={cardStaggerMotion}
            >
              {insights.map((insight) => (
                <motion.div key={insight.key} variants={cardMotion}>
                  <Card className="group p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          <motion.section className="space-y-4" variants={sectionMotion}>
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
          </motion.section>

          <motion.section className="space-y-4" variants={sectionMotion}>
            <div className="rounded-2xl border border-white/25 bg-white/35 px-4 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/30">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Quick Overview
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr),minmax(0,1.1fr)]">
              <Card className="p-6 md:p-7">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div>
                    <h3 className="font-['Sora'] text-xl font-bold text-slate-900 dark:text-white">
                      Quick Actions
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                      Jump into common workflows.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={onOpenPatients}
                    variant="primary"
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-2 text-sm hover:from-purple-500 hover:to-blue-500"
                  >
                    <ArrowRight className="h-4 w-4" />
                    Open Patients
                  </Button>
                  <Button
                    onClick={onAddPatient}
                    variant="secondary"
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm"
                  >
                    <Users className="h-4 w-4" />
                    Add Patient
                  </Button>
                </div>
              </Card>

              <Card className="p-6 md:p-7">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div>
                    <h3 className="font-['Sora'] text-xl font-bold text-slate-900 dark:text-white">
                      Recent Activity
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                      Your latest patient and chart events.
                    </p>
                  </div>
                </div>

                {recentActivityEntries.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm font-medium text-slate-500 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                    No activity recorded yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentActivityEntries.slice(0, 5).map((entry, index) => (
                      <article
                        key={entry.id || `${entry.timestamp}-${index}`}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                            <ShieldCheck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              {entry.message ||
                                `${entry.user || "Doctor"} recorded an update`}
                            </p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              {formatActivityTime(entry.timestamp)}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </motion.section>
        </>
      )}
    </motion.div>
  );
};

const DashboardSkeleton = () => {
  return (
    <>
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5">
            <div className="saas-skeleton h-11 w-11 rounded-xl" />
            <div className="saas-skeleton mt-4 h-10 w-24 rounded-lg" />
            <div className="saas-skeleton mt-2 h-3 w-28 rounded" />
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="p-5 md:p-6">
            <div className="saas-skeleton h-7 w-40 rounded" />
            <div className="saas-skeleton mt-2 h-4 w-56 rounded" />
            <div className="saas-skeleton mt-6 h-64 rounded-xl" />
          </Card>
        ))}
      </section>

      <Card className="p-5 md:p-6">
        <div className="saas-skeleton h-7 w-44 rounded" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="saas-skeleton h-16 rounded-xl" />
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

const getVisitTrendDirection = (visitsPerDayData) => {
  const values = (Array.isArray(visitsPerDayData) ? visitsPerDayData : [])
    .map((item) => Number(item.visits) || 0)
    .filter((value) => Number.isFinite(value));

  if (values.length < 2) {
    return "down";
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
  return delta >= 0 ? "up" : "down";
};

const getVisitTrendLabel = (visitsPerDayData) => {
  const direction = getVisitTrendDirection(visitsPerDayData);

  if (direction === "up") {
    return "Rising activity";
  }

  return "Cooling activity";
};

const getVisitTrendMeta = (visitsPerDayData) => {
  const values = (Array.isArray(visitsPerDayData) ? visitsPerDayData : [])
    .map((item) => Number(item.visits) || 0)
    .filter((value) => Number.isFinite(value));

  if (values.length < 2) {
    return "Need more historical data";
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
    return "Average visits are steady week-over-week";
  }

  return delta > 0
    ? `+${delta.toFixed(1)} avg visits vs previous period`
    : `${delta.toFixed(1)} avg visits vs previous period`;
};

export default DashboardOverview;
