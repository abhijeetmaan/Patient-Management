import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import Button from "../ui/Button";
import Card from "../ui/Card";

const cycleText = {
  monthly: "/month",
  yearly: "/year",
};

const PricingPage = ({
  plans,
  billingCycle,
  currentPlanId,
  onCycleChange,
  onSelectPlan,
}) => {
  const selectedPlan =
    plans.find((plan) => plan.id === currentPlanId) || plans[0];

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden border-indigo-200/70 bg-gradient-to-r from-indigo-50/90 via-blue-50/85 to-sky-50/85 p-6 dark:border-indigo-900/40 dark:from-indigo-900/25 dark:via-slate-900/50 dark:to-blue-900/20 md:p-7">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" />
          SaaS Billing
        </p>
        <h3 className="mt-2 font-['Sora'] text-3xl font-bold text-slate-900 dark:text-white">
          Pricing Plans
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Choose the best plan for your clinic workflow. Current plan:{" "}
          {selectedPlan.name}
        </p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/90 p-1 dark:border-indigo-900/40 dark:bg-slate-900/80">
          {[
            { id: "monthly", label: "Monthly" },
            { id: "yearly", label: "Yearly" },
          ].map((cycle) => {
            const active = billingCycle === cycle.id;
            return (
              <button
                key={cycle.id}
                type="button"
                onClick={() => onCycleChange(cycle.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {cycle.label}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan, index) => {
          const isCurrent = plan.id === currentPlanId;
          const shouldUpgrade = plan.rank > selectedPlan.rank;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: index * 0.05 }}
            >
              <Card
                className={`relative h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                  plan.recommended
                    ? "border-indigo-300 bg-gradient-to-b from-indigo-50/90 to-white dark:border-indigo-500/60 dark:from-indigo-900/35 dark:to-slate-900"
                    : ""
                }`}
              >
                {plan.recommended ? (
                  <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                    Recommended
                  </span>
                ) : null}

                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {plan.name}
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <p className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    ₹{plan.prices[billingCycle]}
                  </p>
                  <p className="pb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {cycleText[billingCycle]}
                  </p>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => onSelectPlan(plan.id)}
                  disabled={isCurrent}
                  variant={plan.recommended ? "primary" : "secondary"}
                  className="mt-6 w-full"
                >
                  {isCurrent
                    ? "Current Plan"
                    : shouldUpgrade
                      ? "Upgrade"
                      : "Choose Plan"}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default PricingPage;
