import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import Card from "../ui/Card";
import {
  CalendarClock,
  Bell,
  CalendarDays,
  BadgeIndianRupee,
  LayoutDashboard,
  ShieldCheck,
  Moon,
  LogOut,
  Search,
  Sun,
  ChevronDown,
  UserRound,
  Users,
  X,
} from "lucide-react";

const DashboardLayout = ({
  activeView,
  onChangeView,
  children,
  notifications,
  notificationCount,
  onClearNotifications,
  searchQuery,
  searchResults,
  onSearchQueryChange,
  onSearchResultSelect,
  patientCount,
  currentPlanName,
  theme,
  onToggleTheme,
  onOpenDoctorProfile,
}) => {
  const { doctor, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDoctorMenu, setShowDoctorMenu] = useState(false);
  const doctorMenuRef = useRef(null);

  useEffect(() => {
    if (!showDoctorMenu) {
      return;
    }

    const handleClickOutside = (event) => {
      if (doctorMenuRef.current?.contains(event.target)) {
        return;
      }

      setShowDoctorMenu(false);
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDoctorMenu]);

  const doctorInitials = String(doctor?.name || "Doctor")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  const handleDoctorProfileClick = () => {
    setShowDoctorMenu(false);
    onOpenDoctorProfile?.();
  };

  const handleLogout = () => {
    setShowDoctorMenu(false);
    logout();
  };

  const recentNotifications = useMemo(() => {
    return Array.isArray(notifications) ? notifications.slice(0, 8) : [];
  }, [notifications]);

  const hasSearchResults =
    Array.isArray(searchResults) && searchResults.length > 0;
  const shouldShowSearchPanel = String(searchQuery || "").trim().length > 0;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "patients", label: "Patients", icon: Users },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "pricing", label: "Pricing", icon: BadgeIndianRupee },
    ...(doctor?.role === "admin"
      ? [{ id: "admin", label: "Admin Panel", icon: ShieldCheck }]
      : []),
  ];

  return (
    <main className="w-full px-3 py-3 transition-all duration-300 sm:px-6 sm:py-4 md:py-6 lg:px-8 xl:px-10">
      <div className="grid gap-5 lg:grid-cols-[280px,minmax(0,1fr)] lg:gap-10">
        <Card
          as="aside"
          className="h-fit border-white/10 bg-gradient-to-b from-slate-900/88 via-slate-900/78 to-indigo-950/70 p-4 text-slate-100 backdrop-blur-md sm:p-5 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]"
        >
          <div className="mb-6 border-b border-white/10 pb-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-sky-200">
              Smart Care
            </p>
            <h1 className="saas-gradient-title mt-2 font-['Sora'] text-2xl font-bold">
              Patient Suite
            </h1>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
            {navItems.map((item) => {
              const isActive =
                activeView === item.id ||
                (activeView === "profile" && item.id === "patients");
              return (
                <Button
                  key={item.id}
                  onClick={() => onChangeView(item.id)}
                  variant={isActive ? "navActive" : "nav"}
                  className="flex shrink-0 items-center gap-2 px-3.5 py-2.5 text-left text-sm font-semibold transition-all duration-300 lg:w-full"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:block lg:space-y-3 lg:gap-0">
            <div className="rounded-xl border border-slate-200/80 bg-white/85 px-3.5 py-3 shadow-md shadow-slate-900/10 transition-all duration-300 dark:border-white/15 dark:bg-white/10 dark:shadow-none">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-sky-100">
                Total Patients
              </p>
              <div className="mt-1 flex items-center gap-2 text-slate-900 dark:text-white">
                <Users className="h-5 w-5" />
                <p className="text-3xl font-extrabold">{patientCount}</p>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/90 px-3.5 py-3 shadow-sm transition-all duration-300 dark:border-indigo-900/50 dark:bg-indigo-900/25">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">
                Current Plan
              </p>
              <p className="mt-1 text-base font-bold text-indigo-900 dark:text-indigo-100">
                {currentPlanName}
              </p>
            </div>
          </div>
        </Card>

        <section className="relative z-0 space-y-8 py-1">
          <Card
            as="header"
            className="relative z-50 overflow-visible border-white/35 bg-white/55 px-4 py-4 shadow-lg shadow-slate-300/35 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/55 dark:shadow-black/30 sm:px-6 md:px-8 md:py-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
              <div className="shrink-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Welcome {doctor?.name || "Doctor"}
                </p>
                <h2 className="saas-gradient-title font-['Sora'] text-2xl font-bold sm:text-3xl md:text-[2rem]">
                  {activeView === "dashboard"
                    ? "Dashboard"
                    : activeView === "calendar"
                      ? "Calendar"
                      : activeView === "pricing"
                        ? "Pricing"
                        : activeView === "admin"
                          ? "Admin Panel"
                          : activeView === "profile"
                            ? "Patient Profile"
                            : "Patients"}
                </h2>
              </div>

              <div className="relative w-full lg:max-w-[460px] lg:flex-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    value={searchQuery}
                    onChange={(event) =>
                      onSearchQueryChange(event.target.value)
                    }
                    placeholder="Search patients or appointments"
                    aria-label="Global search"
                    className="saas-input h-11 w-full rounded-full border-slate-200 bg-white pl-10 pr-10 text-sm shadow-sm shadow-slate-900/5 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:shadow-none"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => onSearchQueryChange("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <AnimatePresence>
                  {shouldShowSearchPanel && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white/98 shadow-2xl shadow-slate-900/15 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/98"
                    >
                      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                          Global Search
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                          Search across patients and appointments.
                        </p>
                      </div>

                      <div className="max-h-80 overflow-y-auto p-2">
                        {hasSearchResults ? (
                          <div className="space-y-2">
                            {searchResults.map((result) => (
                              <button
                                key={result.id}
                                type="button"
                                onClick={() => onSearchResultSelect(result)}
                                className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-800/80 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                              >
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-100">
                                  {result.type === "patient" ? (
                                    <UserRound className="h-4 w-4" />
                                  ) : (
                                    <CalendarClock className="h-4 w-4" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                      {result.title}
                                    </p>
                                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                      {result.type}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                    {result.subtitle}
                                  </p>
                                  <p className="mt-1 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                                    {result.meta}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                            No results found.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative flex w-full flex-wrap items-center gap-2 lg:ml-auto lg:w-auto lg:justify-end">
                <div className="relative">
                  <Button
                    onClick={() => setShowNotifications((current) => !current)}
                    variant="secondary"
                    className="relative flex items-center gap-1.5 px-3 py-2 text-xs"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    Notifications
                    {notificationCount > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {notificationCount > 99 ? "99+" : notificationCount}
                      </span>
                    )}
                  </Button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 top-full z-[90] mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">
                            Notifications
                          </p>
                          {notificationCount > 0 && (
                            <button
                              type="button"
                              onClick={onClearNotifications}
                              className="text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                              Clear all
                            </button>
                          )}
                        </div>

                        <div className="max-h-80 overflow-y-auto p-2">
                          {recentNotifications.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400">
                              No new notifications.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {recentNotifications.map((item) => (
                                <article
                                  key={item.id}
                                  className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/80"
                                >
                                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                    {item.message}
                                  </p>
                                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    {formatNotificationTime(item.createdAt)}
                                  </p>
                                </article>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Button
                  onClick={onToggleTheme}
                  variant="secondary"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs"
                >
                  {theme === "dark" ? (
                    <Sun className="h-3.5 w-3.5" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" />
                  )}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </Button>
                <div className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 sm:flex">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                <div className="relative" ref={doctorMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowDoctorMenu((current) => !current)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                    aria-label="Open doctor profile menu"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
                      {doctorInitials || "DR"}
                    </span>
                    <span className="hidden sm:block">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {doctor?.name || "Doctor"}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Account
                      </p>
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  </button>

                  <AnimatePresence>
                    {showDoctorMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute right-0 top-full z-[95] mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95"
                      >
                        <button
                          type="button"
                          onClick={handleDoctorProfileClick}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <UserRound className="h-4 w-4" />
                          Profile
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/30"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Card>

          {children}
        </section>
      </div>
    </main>
  );
};

const formatNotificationTime = (createdAt) => {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

export default DashboardLayout;
