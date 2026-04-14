import Card from "../ui/Card";
import { ShieldCheck, Stethoscope, Users, ClipboardList } from "lucide-react";

const AdminDashboard = ({
  loading,
  errorMessage,
  stats,
  doctors,
  allPatients,
}) => {
  const statCards = [
    {
      id: "doctors",
      title: "Total Doctors",
      value: stats.totalDoctors,
      icon: Stethoscope,
      tone: "text-indigo-600 dark:text-indigo-300",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
    },
    {
      id: "patients",
      title: "Total Patients",
      value: stats.totalPatients,
      icon: Users,
      tone: "text-blue-600 dark:text-blue-300",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      id: "appointments",
      title: "Total Appointments",
      value: stats.totalAppointments,
      icon: ClipboardList,
      tone: "text-emerald-600 dark:text-emerald-300",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/90 px-4 py-3 dark:border-indigo-900/50 dark:bg-indigo-900/20">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Admin Control Panel
        </p>
        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Monitor platform-wide doctors, patients, and appointments.
        </p>
      </div>

      {errorMessage ? (
        <div className="saas-status-danger">{errorMessage}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.id} className="p-5">
            <div
              className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}
            >
              <card.icon className={`h-5 w-5 ${card.tone}`} />
            </div>
            <p className={`text-4xl font-extrabold ${card.tone}`}>
              {card.value}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              {card.title}
            </p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h3 className="font-['Sora'] text-xl font-bold text-slate-900 dark:text-white">
            Doctor List
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Role-based directory of all registered doctors.
          </p>
        </div>

        {loading ? (
          <p className="px-5 py-10 text-center text-sm font-medium text-slate-500 dark:text-slate-300">
            Loading admin data...
          </p>
        ) : doctors.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm font-medium text-slate-500 dark:text-slate-300">
            No doctors available.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/30">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr
                    key={doctor.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {doctor.name}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                      {doctor.email}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {doctor.role || "doctor"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        Platform patient records: {allPatients.length}
      </p>
    </section>
  );
};

export default AdminDashboard;
