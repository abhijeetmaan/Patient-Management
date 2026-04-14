import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoginPage from "./components/auth/LoginPage";
import {
  AdminDashboard,
  CalendarView,
  DashboardLayout,
  DashboardOverview,
  PricingPage,
} from "./components/dashboard";
import {
  AddPatientForm,
  EditPatientModal,
  PatientList,
  PatientProfilePage,
} from "./components/patients";
import { useAuth } from "./context/AuthContext";
import useAdminPanel from "./hooks/useAdminPanel";
import useBillingPlan from "./hooks/useBillingPlan";
import usePatientManagement from "./hooks/usePatientManagement";
import {
  getDashboardStats,
  getPatientGrowthData,
  getVisitActivities,
  getVisitsPerDayData,
} from "./utils/dashboardMetrics";

function App() {
  const { doctor, isAuthenticated, authLoading, authError, login } = useAuth();
  const isAdmin = doctor?.role === "admin";
  const [activeView, setActiveView] = useState("dashboard");
  const [theme, setTheme] = useState("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedCalendarAppointment, setFocusedCalendarAppointment] =
    useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const {
    patients,
    appointments,
    loadingPatients,
    loadingAppointments,
    savingPatient,
    savingAppointment,
    updatingAppointmentId,
    deletingPatientId,
    updatingPatient,
    activityLog,
    errorMessage,
    successMessage,
    selectedPatient,
    editingPatient,
    handleAddPatient,
    handleDeletePatient,
    handleOpenPatientDetails,
    handleClosePatientDetails,
    handleOpenEditPatient,
    handleCloseEditPatient,
    handleUpdatePatient,
    handleAddAppointment,
    handleMarkAppointmentCompleted,
    clearPatientModals,
  } = usePatientManagement();
  const {
    loading: loadingAdmin,
    errorMessage: adminErrorMessage,
    stats: adminStats,
    doctors: adminDoctors,
    allPatients: adminPatients,
  } = useAdminPanel(isAdmin && activeView === "admin");
  const {
    plans,
    planId,
    currentPlan,
    billingCycle,
    setPlanId,
    setBillingCycle,
    patientLimit,
    canAddPatient,
  } = useBillingPlan();

  const visitActivities = useMemo(() => {
    return getVisitActivities(patients);
  }, [patients]);

  const dashboardStats = useMemo(() => {
    return getDashboardStats(patients, visitActivities);
  }, [patients, visitActivities]);

  const visitsPerDayData = useMemo(() => {
    return getVisitsPerDayData(visitActivities);
  }, [visitActivities]);

  const patientGrowthData = useMemo(() => {
    return getPatientGrowthData(patients);
  }, [patients]);

  const deferredSearchQuery = useDeferredValue(searchQuery.trim());

  const searchResults = useMemo(() => {
    const query = deferredSearchQuery.toLowerCase();

    if (!query) {
      return [];
    }

    const patientMatches = patients
      .map((patient) => {
        const visits = Array.isArray(patient.visits) ? patient.visits : [];
        const latestVisit = visits[0] || null;
        const haystack = [
          patient.name,
          patient.age,
          patient.gender,
          latestVisit?.diagnosis,
          latestVisit?.symptoms,
          ...(latestVisit?.medicines || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) {
          return null;
        }

        return {
          id: `patient-${patient.id}`,
          type: "patient",
          title: patient.name,
          subtitle: `${patient.age} years • ${patient.gender}`,
          meta: latestVisit?.diagnosis || "Patient record",
          patientId: patient.id,
        };
      })
      .filter(Boolean);

    const appointmentMatches = appointments
      .map((appointment) => {
        const formattedDate = new Date(appointment.date).toLocaleDateString(
          undefined,
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          },
        );
        const haystack = [
          appointment.patientName,
          appointment.date,
          appointment.time,
          appointment.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) {
          return null;
        }

        return {
          id: `appointment-${appointment.id}`,
          type: "appointment",
          title: appointment.patientName,
          subtitle: `${formattedDate} • ${formatSearchTime(appointment.time)}`,
          meta: `${toTitleCase(appointment.status || "pending")} appointment`,
          appointmentId: appointment.id,
        };
      })
      .filter(Boolean);

    return [...patientMatches, ...appointmentMatches].slice(0, 8);
  }, [appointments, deferredSearchQuery, patients]);

  const changeActiveView = (nextView) => {
    if (nextView === "admin" && !isAdmin) {
      setActiveView("dashboard");
      return;
    }

    setActiveView(nextView);

    if (!["patients", "profile"].includes(nextView)) {
      clearPatientModals();
    }
  };

  const openPatientProfile = (patientId) => {
    handleOpenPatientDetails(patientId);
    setActiveView("profile");
  };

  const goBackToPatients = () => {
    handleClosePatientDetails();
    setActiveView("patients");
  };

  const handleLogin = async (credentials) => {
    try {
      await login(credentials);
      setActiveView("dashboard");
      setSearchQuery("");
      setFocusedCalendarAppointment(null);
      setNotifications([]);
      setToasts([]);
    } catch (error) {
      throw error;
    }
  };

  const handleSearchQueryChange = (value) => {
    setSearchQuery(value);
  };

  const handleSearchResultSelect = (result) => {
    if (!result) {
      return;
    }

    if (result.type === "patient") {
      openPatientProfile(result.patientId);
    }

    if (result.type === "appointment") {
      setFocusedCalendarAppointment({
        appointmentId: result.appointmentId,
        nonce: Date.now(),
      });
      setActiveView("calendar");
    }

    setSearchQuery("");
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem("pm-theme");
    if (storedTheme === "dark") {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("pm-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  if (!isAuthenticated) {
    return (
      <LoginPage
        loading={authLoading}
        errorMessage={authError}
        onLogin={handleLogin}
      />
    );
  }

  const showWarningState = !loadingPatients && patients.length === 0;

  const createNotification = (message) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const createdAt = new Date().toISOString();
    const notification = { id, message, createdAt };

    setNotifications((previous) => [notification, ...previous].slice(0, 20));
    setToasts((previous) => [...previous, notification]);

    window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const handleOpenDoctorProfile = () => {
    createNotification("Doctor profile settings will be available soon.");
  };

  const handleAddPatientWithNotification = async (formData) => {
    if (!canAddPatient(patients.length)) {
      setShowUpgradePrompt(true);
      setActiveView("pricing");
      createNotification(
        "Free plan limit reached. Upgrade to Pro for unlimited patients.",
      );
      return;
    }

    const createdPatient = await handleAddPatient(formData);
    if (createdPatient) {
      createNotification(`Patient added: ${createdPatient.name}`);

      if (planId === "free" && patients.length + 1 >= patientLimit) {
        createNotification(
          "You have reached the Free plan limit. Upgrade to add more patients.",
        );
      }
    }
  };

  const handleChoosePlan = (nextPlanId) => {
    setPlanId(nextPlanId);
    setShowUpgradePrompt(false);
    const plan = plans.find((item) => item.id === nextPlanId);
    createNotification(`Plan selected: ${plan?.name || "Plan updated"}`);
  };

  const handleAddAppointmentWithNotification = async (appointmentData) => {
    const createdAppointment = await handleAddAppointment(appointmentData);
    if (createdAppointment) {
      createNotification(
        `Appointment scheduled for ${createdAppointment.patientName}`,
      );
    }
  };

  const handleMarkAppointmentCompletedWithNotification = async (
    appointmentId,
  ) => {
    const appointment = appointments.find((item) => item.id === appointmentId);
    const updatedAppointment =
      await handleMarkAppointmentCompleted(appointmentId);

    if (updatedAppointment) {
      createNotification(
        `Appointment completed for ${appointment?.patientName || updatedAppointment.patientName}`,
      );
    }
  };

  const renderActiveView = () => {
    if (activeView === "admin") {
      if (!isAdmin) {
        return (
          <div className="saas-status-danger">
            You do not have access to the admin panel.
          </div>
        );
      }

      return (
        <AdminDashboard
          loading={loadingAdmin}
          errorMessage={adminErrorMessage}
          stats={adminStats}
          doctors={adminDoctors}
          allPatients={adminPatients}
        />
      );
    }

    if (activeView === "pricing") {
      return (
        <PricingPage
          plans={plans}
          billingCycle={billingCycle}
          currentPlanId={planId}
          onCycleChange={setBillingCycle}
          onSelectPlan={handleChoosePlan}
        />
      );
    }

    if (activeView === "dashboard") {
      return (
        <DashboardOverview
          stats={dashboardStats}
          activityLog={activityLog}
          activities={visitActivities.slice(0, 6)}
          appointments={appointments}
          patients={patients}
          doctorName={doctor?.name}
          visitsPerDayData={visitsPerDayData}
          patientGrowthData={patientGrowthData}
          loading={loadingPatients || loadingAppointments}
          schedulingAppointment={savingAppointment}
          updatingAppointmentId={updatingAppointmentId}
          theme={theme}
          searchQuery={searchQuery}
          searchResults={searchResults}
          onSearchQueryChange={handleSearchQueryChange}
          onSearchResultSelect={handleSearchResultSelect}
          onAddAppointment={handleAddAppointmentWithNotification}
          onMarkAppointmentCompleted={
            handleMarkAppointmentCompletedWithNotification
          }
          onOpenPatients={() => changeActiveView("patients")}
        />
      );
    }

    if (activeView === "calendar") {
      return (
        <CalendarView
          appointments={appointments}
          loading={loadingAppointments}
          updatingAppointmentId={updatingAppointmentId}
          focusedCalendarAppointment={focusedCalendarAppointment}
          theme={theme}
          onMarkAppointmentCompleted={
            handleMarkAppointmentCompletedWithNotification
          }
        />
      );
    }

    if (activeView === "profile") {
      return (
        <PatientProfilePage
          patient={selectedPatient}
          loading={loadingPatients}
          onBack={goBackToPatients}
        />
      );
    }

    return (
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr),minmax(0,1.05fr)] lg:gap-8">
        <AddPatientForm
          onSubmit={handleAddPatientWithNotification}
          loading={savingPatient}
        />
        <PatientList
          patients={patients}
          loading={loadingPatients}
          deletingPatientId={deletingPatientId}
          onDelete={handleDeletePatient}
          onViewDetails={openPatientProfile}
          onEdit={handleOpenEditPatient}
        />
      </section>
    );
  };

  return (
    <DashboardLayout
      activeView={activeView}
      onChangeView={changeActiveView}
      patientCount={patients.length}
      notifications={notifications}
      notificationCount={notifications.length}
      searchQuery={searchQuery}
      searchResults={searchResults}
      onSearchQueryChange={handleSearchQueryChange}
      onSearchResultSelect={handleSearchResultSelect}
      theme={theme}
      currentPlanName={currentPlan.name}
      onClearNotifications={clearNotifications}
      onToggleTheme={toggleTheme}
      onOpenDoctorProfile={handleOpenDoctorProfile}
    >
      {errorMessage && <div className="saas-status-danger">{errorMessage}</div>}

      {successMessage && (
        <div className="saas-status-success">{successMessage}</div>
      )}

      {showWarningState && (
        <div className="saas-status-warning">
          No patient records yet. Add your first patient to start tracking.
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="transition-all duration-300"
        >
          {renderActiveView()}
        </motion.div>
      </AnimatePresence>

      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          onClose={handleCloseEditPatient}
          onSubmit={handleUpdatePatient}
          saving={updatingPatient}
        />
      )}

      {showUpgradePrompt && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/70 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              Plan Limit Reached
            </p>
            <h3 className="mt-2 font-['Sora'] text-2xl font-bold text-slate-900 dark:text-white">
              Upgrade to continue
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Free plan supports up to {patientLimit} patients. Upgrade to Pro
              for unlimited patient records.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowUpgradePrompt(false)}
                className="saas-btn-secondary w-full"
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpgradePrompt(false);
                  setActiveView("pricing");
                }}
                className="saas-btn-primary w-full"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed right-5 top-5 z-50 flex w-[320px] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 18, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="pointer-events-auto rounded-xl border border-emerald-200/80 bg-white/95 px-3.5 py-3 text-sm font-medium text-emerald-700 shadow-xl backdrop-blur-md dark:border-emerald-900/60 dark:bg-slate-900/95 dark:text-emerald-200"
            >
              <p className="font-semibold">Success</p>
              <p className="mt-0.5 text-xs sm:text-sm">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

const formatSearchTime = (rawTime) => {
  const parsedDate = new Date(`1970-01-01T${rawTime}`);

  if (Number.isNaN(parsedDate.getTime())) {
    return rawTime;
  }

  return parsedDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

const toTitleCase = (value) =>
  String(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

export default App;
