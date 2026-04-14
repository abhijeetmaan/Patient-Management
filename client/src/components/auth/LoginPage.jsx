import { useState } from "react";
import {
  ArrowRight,
  HeartPulse,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import Input from "../ui/Input";

const LoginPage = ({ onLogin, loading, errorMessage }) => {
  const [formData, setFormData] = useState({
    email: "doctor1@test.com",
    password: "123456",
  });

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    await onLogin(formData);
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.2),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.22),_transparent_42%),linear-gradient(135deg,_#dbeafe_0%,_#e0e7ff_48%,_#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.28),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.24),_transparent_42%),linear-gradient(135deg,_#020617_0%,_#0f172a_52%,_#111827_100%)]" />

      <Card className="w-full max-w-5xl overflow-hidden p-0">
        <div className="grid min-h-[620px] lg:grid-cols-[1.08fr,0.92fr]">
          <section className="relative hidden overflow-hidden border-r border-white/20 bg-gradient-to-br from-blue-700 via-indigo-700 to-sky-600 p-8 text-white lg:block">
            <div className="absolute -right-14 -top-14 h-56 w-56 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -bottom-20 left-0 h-64 w-64 rounded-full bg-cyan-300/20 blur-2xl" />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure Clinical Workspace
                </div>

                <h2 className="mt-5 font-['Sora'] text-4xl font-bold leading-tight">
                  Smart Patient
                  <br />
                  Management Suite
                </h2>

                <p className="mt-4 max-w-md text-sm text-blue-100/90">
                  Coordinate consultations, appointments, and treatment history
                  in one premium workflow.
                </p>
              </div>

              <div className="space-y-3">
                <FeaturePoint
                  icon={HeartPulse}
                  text="Track patient growth and visit trends"
                />
                <FeaturePoint
                  icon={Stethoscope}
                  text="Generate prescriptions in seconds"
                />
                <FeaturePoint
                  icon={ShieldCheck}
                  text="Doctor-scoped secure records"
                />
              </div>
            </div>
          </section>

          <section className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
            <div className="mb-7">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                <Stethoscope className="h-7 w-7" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Patient Management System
              </p>
              <h1 className="saas-gradient-title mt-2 font-['Sora'] text-3xl font-bold">
                Welcome back, Doctor
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                Sign in to access your patients and appointments.
              </p>
            </div>

            <form className="space-y-4" onSubmit={submitForm}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={updateField}
                    placeholder="doctor1@test.com"
                    className="pl-10 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                  />
                </div>
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={updateField}
                    placeholder="123456"
                    className="pl-10 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                  />
                </div>
              </label>

              {errorMessage && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200">
                  {errorMessage}
                </p>
              )}

              <Button
                type="submit"
                loading={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30"
              >
                {loading ? "Signing in..." : "Login to Dashboard"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                <p className="font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Demo Credentials
                </p>
                <p className="mt-1">doctor1@test.com / 123456</p>
                <p>doctor2@test.com / 123456</p>
              </div>
            </form>
          </section>
        </div>
      </Card>
    </main>
  );
};

const FeaturePoint = ({ icon: Icon, text }) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-blue-50/95 backdrop-blur-sm">
      <Icon className="h-4 w-4" />
      {text}
    </div>
  );
};

export default LoginPage;
