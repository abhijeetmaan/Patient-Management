import { useMemo, useState } from "react";

const BILLING_STORAGE_KEY = "pm-billing-plan";

const PLAN_DEFINITIONS = [
  {
    id: "free",
    name: "Free",
    recommended: false,
    rank: 1,
    prices: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      "Up to 3 patients",
      "Basic patient records",
      "Core dashboard",
      "Single clinic workflow",
    ],
    patientLimit: 3,
  },
  {
    id: "pro",
    name: "Pro",
    recommended: true,
    rank: 2,
    prices: {
      monthly: 499,
      yearly: 4990,
    },
    features: [
      "Unlimited patients",
      "Appointments & calendar",
      "Advanced insights",
      "Priority support",
    ],
    patientLimit: Number.POSITIVE_INFINITY,
  },
  {
    id: "premium",
    name: "Premium",
    recommended: false,
    rank: 3,
    prices: {
      monthly: 999,
      yearly: 9990,
    },
    features: [
      "Everything in Pro",
      "Admin analytics",
      "Multi-doctor teams",
      "Premium onboarding",
    ],
    patientLimit: Number.POSITIVE_INFINITY,
  },
];

const getInitialBillingState = () => {
  try {
    const raw = localStorage.getItem(BILLING_STORAGE_KEY);
    if (!raw) {
      return { planId: "free", billingCycle: "monthly" };
    }

    const parsed = JSON.parse(raw);
    const planExists = PLAN_DEFINITIONS.some(
      (plan) => plan.id === parsed.planId,
    );
    const billingCycle =
      parsed.billingCycle === "yearly" ? "yearly" : "monthly";

    return {
      planId: planExists ? parsed.planId : "free",
      billingCycle,
    };
  } catch (_error) {
    return { planId: "free", billingCycle: "monthly" };
  }
};

const useBillingPlan = () => {
  const [billingState, setBillingState] = useState(getInitialBillingState);

  const persistBillingState = (nextState) => {
    localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(nextState));
  };

  const setPlanId = (planId) => {
    setBillingState((previous) => {
      const planExists = PLAN_DEFINITIONS.some((plan) => plan.id === planId);
      const nextState = {
        ...previous,
        planId: planExists ? planId : previous.planId,
      };
      persistBillingState(nextState);
      return nextState;
    });
  };

  const setBillingCycle = (billingCycle) => {
    setBillingState((previous) => {
      const nextState = {
        ...previous,
        billingCycle: billingCycle === "yearly" ? "yearly" : "monthly",
      };
      persistBillingState(nextState);
      return nextState;
    });
  };

  const currentPlan = useMemo(() => {
    return (
      PLAN_DEFINITIONS.find((plan) => plan.id === billingState.planId) ||
      PLAN_DEFINITIONS[0]
    );
  }, [billingState.planId]);

  return {
    plans: PLAN_DEFINITIONS,
    planId: currentPlan.id,
    currentPlan,
    billingCycle: billingState.billingCycle,
    setPlanId,
    setBillingCycle,
    patientLimit: currentPlan.patientLimit,
    canAddPatient: (currentPatientCount) =>
      Number(currentPatientCount) < Number(currentPlan.patientLimit),
  };
};

export default useBillingPlan;
