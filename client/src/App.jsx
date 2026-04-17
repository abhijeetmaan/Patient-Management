import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import LoginPage from "./components/auth/LoginPage";
import {
  AdminDashboard,
  AppointmentsPage,
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
import AppLoader from "./components/ui/AppLoader";
import { useAuth } from "./context/AuthContext";
import useAdminPanel from "./hooks/useAdminPanel";
import useBillingPlan from "./hooks/useBillingPlan";
import usePatientManagement from "./hooks/usePatientManagement";
import { socket } from "./socket";
import {
  getDashboardStats,
  getPatientGrowthData,
  getVisitActivities,
  getVisitsPerDayData,
} from "./utils/dashboardMetrics";

const resolveActiveViewFromPath = (pathname) => {
  const normalizedPath = String(pathname || "/");

  if (normalizedPath.startsWith("/appointments")) {
    return "appointments";
  }

  if (normalizedPath.startsWith("/calendar")) {
    return "calendar";
  }

  if (normalizedPath.startsWith("/pricing")) {
    return "pricing";
  }

  if (normalizedPath.startsWith("/admin")) {
    return "admin";
  }

  if (normalizedPath.startsWith("/patients/profile")) {
    return "profile";
  }

  if (normalizedPath.startsWith("/patients")) {
    return "patients";
  }

  return "dashboard";
};

const resolvePathForView = (view) => {
  const normalizedView = String(view || "dashboard");

  if (normalizedView === "appointments") {
    return "/appointments";
  }

  if (normalizedView === "patients") {
    return "/patients";
  }

  if (normalizedView === "calendar") {
    return "/calendar";
  }

  if (normalizedView === "pricing") {
    return "/pricing";
  }

  if (normalizedView === "admin") {
    return "/admin";
  }

  if (normalizedView === "profile") {
    return "/patients/profile";
  }

  return "/";
};

function App() {
  const {
    doctor,
    isAuthenticated,
    authLoading,
    authError,
    login,
    syncDoctorPermissions,
    hasPermission,
  } = useAuth();
  const isAdmin = doctor?.role === "admin";
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = useMemo(
    () => resolveActiveViewFromPath(location.pathname),
    [location.pathname],
  );
  const setActiveView = useCallback(
    (nextView) => {
      navigate(resolvePathForView(nextView));
    },
    [navigate],
  );
  const [theme, setTheme] = useState("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedCalendarAppointment, setFocusedCalendarAppointment] =
    useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showEntryLoader, setShowEntryLoader] = useState(true);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(false);
  const reminderTrackerRef = useRef(new Set());
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
    handleSendAppointmentToCabin,
    handleSkipAppointment,
    handleRequeueAppointment,
    nextPendingAppointmentId,
    handlePrescriptionSaved,
    mergeRealtimePatient,
    mergeRealtimeAppointment,
    recordActivity,
    clearPatientModals,
  } = usePatientManagement();
  const {
    loading: loadingAdmin,
    errorMessage: adminErrorMessage,
    stats: adminStats,
    doctors: adminDoctors,
    allPatients: adminPatients,
    updatingDoctorId,
    mergeRealtimePatient: mergeAdminRealtimePatient,
    incrementAppointmentCount,
    updateDoctorPermissions,
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

  const handleAddPatientCta = () => {
    handleClosePatientDetails();
    setActiveView("patients");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = async (credentials) => {
    try {
      const loggedInDoctor = await login(credentials);
      recordActivity(
        "login",
        `${formatDoctorDisplayName(loggedInDoctor?.name || doctor?.name || "Doctor")} logged in`,
        loggedInDoctor?.name || doctor?.name || "Doctor",
      );
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

  const createNotification = useCallback((message) => {
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
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !doctor?.id) {
      socket.disconnect();
      setLiveUpdatesEnabled(false);
      return undefined;
    }

    socket.auth = {
      doctorId: String(doctor.id),
      role: doctor.role,
    };

    const handleConnect = () => {
      setLiveUpdatesEnabled(true);
    };

    const handleDisconnect = () => {
      setLiveUpdatesEnabled(false);
    };

    const shouldIgnoreToast = (payload) =>
      String(payload?.actorDoctorId || "") === String(doctor.id);

    const handlePatientAdded = (payload) => {
      mergeRealtimePatient(payload);
      mergeAdminRealtimePatient(payload);

      if (!shouldIgnoreToast(payload)) {
        createNotification("New patient added");
      }
    };

    const handlePatientUpdated = (payload) => {
      mergeRealtimePatient(payload);
      mergeAdminRealtimePatient(payload);

      if (!shouldIgnoreToast(payload)) {
        createNotification("Patient updated");
      }
    };

    const handleAppointmentCreated = (payload) => {
      mergeRealtimeAppointment(payload);
      incrementAppointmentCount();

      if (!shouldIgnoreToast(payload)) {
        createNotification("Appointment scheduled");
      }
    };

    const handleAppointmentUpdated = (payload) => {
      mergeRealtimeAppointment(payload);

      if (!shouldIgnoreToast(payload)) {
        createNotification("Appointment updated");
      }
    };

    const handleAppointmentSkipped = (payload) => {
      mergeRealtimeAppointment(payload);

      if (!shouldIgnoreToast(payload)) {
        createNotification("Patient skipped");
      }
    };

    const handleAppointmentRequeued = (payload) => {
      mergeRealtimeAppointment(payload);

      if (!shouldIgnoreToast(payload)) {
        createNotification("Patient re-added to queue");
      }
    };

    const handleDoctorPermissionsUpdated = (payload) => {
      if (String(payload?.doctorId || "") !== String(doctor.id)) {
        return;
      }

      syncDoctorPermissions(payload.doctorId, payload.permissions);
      createNotification("Your permissions were updated by admin");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("patient_added", handlePatientAdded);
    socket.on("patient_updated", handlePatientUpdated);
    socket.on("appointment_created", handleAppointmentCreated);
    socket.on("appointment_updated", handleAppointmentUpdated);
    socket.on("appointment_skipped", handleAppointmentSkipped);
    socket.on("appointment_requeued", handleAppointmentRequeued);
    socket.on("doctor_permissions_updated", handleDoctorPermissionsUpdated);

    if (!socket.connected) {
      socket.connect();
    } else {
      setLiveUpdatesEnabled(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("patient_added", handlePatientAdded);
      socket.off("patient_updated", handlePatientUpdated);
      socket.off("appointment_created", handleAppointmentCreated);
      socket.off("appointment_updated", handleAppointmentUpdated);
      socket.off("appointment_skipped", handleAppointmentSkipped);
      socket.off("appointment_requeued", handleAppointmentRequeued);
      socket.off("doctor_permissions_updated", handleDoctorPermissionsUpdated);
      socket.disconnect();
      setLiveUpdatesEnabled(false);
    };
  }, [
    doctor?.id,
    doctor?.role,
    createNotification,
    incrementAppointmentCount,
    isAuthenticated,
    mergeAdminRealtimePatient,
    mergeRealtimeAppointment,
    mergeRealtimePatient,
    syncDoctorPermissions,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShowEntryLoader(false);
    }, 1400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("pm-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) {
      reminderTrackerRef.current.clear();
      return;
    }

    const checkAppointmentReminders = () => {
      const now = Date.now();
      const activeAppointmentKeys = new Set(
        (Array.isArray(appointments) ? appointments : []).map(
          (appointment) =>
            `${appointment.id}|${appointment.date || ""}|${appointment.time || ""}`,
        ),
      );

      (Array.isArray(appointments) ? appointments : []).forEach(
        (appointment) => {
          const status = String(appointment.status || "pending").toLowerCase();
          if (status === "completed" || status === "cancelled") {
            return;
          }

          const timestamp = new Date(
            `${appointment.date}T${appointment.time}`,
          ).getTime();
          if (Number.isNaN(timestamp)) {
            return;
          }

          const diffMinutes = (timestamp - now) / 60000;
          if (diffMinutes < 0) {
            return;
          }

          const reminderBaseKey = `${appointment.id}|${appointment.date || ""}|${appointment.time || ""}`;
          const thirtyMinuteKey = `${reminderBaseKey}|30`;
          const fiveMinuteKey = `${reminderBaseKey}|5`;

          if (
            diffMinutes <= 30 &&
            diffMinutes > 5 &&
            !reminderTrackerRef.current.has(thirtyMinuteKey)
          ) {
            createNotification(
              `Reminder: ${appointment.patientName} appointment in 30 min`,
            );
            reminderTrackerRef.current.add(thirtyMinuteKey);
          }

          if (
            diffMinutes <= 5 &&
            !reminderTrackerRef.current.has(fiveMinuteKey)
          ) {
            createNotification(
              `Urgent: ${appointment.patientName} appointment in 5 min`,
            );
            reminderTrackerRef.current.add(fiveMinuteKey);
          }
        },
      );

      reminderTrackerRef.current.forEach((key) => {
        const [id, date, time] = String(key).split("|");
        const baseKey = `${id}|${date}|${time}`;
        if (!activeAppointmentKeys.has(baseKey)) {
          reminderTrackerRef.current.delete(key);
        }
      });
    };

    checkAppointmentReminders();
    const intervalId = window.setInterval(checkAppointmentReminders, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [appointments, createNotification, isAuthenticated]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  if (showEntryLoader) {
    return <AppLoader />;
  }

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

  const handleSendToCabinWithNotification = async (appointmentId) => {
    const updatedAppointment =
      await handleSendAppointmentToCabin(appointmentId);

    if (updatedAppointment) {
      createNotification(`${updatedAppointment.patientName} sent to cabin`);
    }
  };

  const handleSkipAppointmentWithNotification = async (appointmentId) => {
    const updatedAppointment = await handleSkipAppointment(appointmentId);

    if (updatedAppointment) {
      createNotification("Patient skipped");
    }
  };

  const handleRequeueAppointmentWithNotification = async (appointmentId) => {
    const updatedAppointment = await handleRequeueAppointment(appointmentId);

    if (updatedAppointment) {
      createNotification("Patient re-added to queue");
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
          updatingDoctorId={updatingDoctorId}
          onUpdateDoctorPermissions={updateDoctorPermissions}
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

    if (activeView === "appointments") {
      return (
        <AppointmentsPage
          appointments={appointments}
          patients={patients}
          loading={loadingAppointments}
          schedulingAppointment={savingAppointment}
          updatingAppointmentId={updatingAppointmentId}
          theme={theme}
          onAddAppointment={handleAddAppointmentWithNotification}
          onMarkAppointmentCompleted={
            handleMarkAppointmentCompletedWithNotification
          }
          onSendToCabin={handleSendToCabinWithNotification}
          onSkipAppointment={handleSkipAppointmentWithNotification}
          onRequeueAppointment={handleRequeueAppointmentWithNotification}
          nextPendingAppointmentId={nextPendingAppointmentId}
          onAddPatient={handleAddPatientCta}
        />
      );
    }

    if (activeView === "dashboard") {
      return (
        <DashboardOverview
          stats={dashboardStats}
          activityLog={activityLog}
          activities={visitActivities.slice(0, 6)}
          doctorName={doctor?.name}
          visitsPerDayData={visitsPerDayData}
          patientGrowthData={patientGrowthData}
          loading={loadingPatients || loadingAppointments}
          theme={theme}
          onOpenPatients={() => changeActiveView("patients")}
          onAddPatient={handleAddPatientCta}
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
          onSendToCabin={handleSendToCabinWithNotification}
          onSkipAppointment={handleSkipAppointmentWithNotification}
          onRequeueAppointment={handleRequeueAppointmentWithNotification}
          nextPendingAppointmentId={nextPendingAppointmentId}
          onAddPatient={handleAddPatientCta}
        />
      );
    }

    if (activeView === "profile") {
      return (
        <PatientProfilePage
          patient={selectedPatient}
          loading={loadingPatients}
          onBack={goBackToPatients}
          onPrescriptionSaved={handlePrescriptionSaved}
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
          onAddPatient={handleAddPatientCta}
          patientScopeLabel={
            isAdmin || hasPermission("view_all_patients")
              ? "All Patients"
              : "Your Patients"
          }
          showAssignedDoctor={isAdmin || hasPermission("view_all_patients")}
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
      liveUpdatesEnabled={liveUpdatesEnabled}
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
          initial={{ opacity: 0, y: 22, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -14, filter: "blur(3px)" }}
          transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
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

      <div className="pointer-events-none fixed left-3 right-3 top-3 z-50 flex flex-col gap-2 sm:left-auto sm:right-5 sm:top-5 sm:w-[320px]">
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

const formatDoctorDisplayName = (rawName) => {
  const normalized = String(rawName || "").trim();

  if (!normalized) {
    return "Dr. John";
  }

  if (/^dr\.?\s+/i.test(normalized)) {
    return normalized.replace(/^dr\.?\s+/i, "Dr. ");
  }

  return `Dr. ${normalized}`;
};

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
