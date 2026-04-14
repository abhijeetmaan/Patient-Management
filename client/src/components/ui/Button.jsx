const BUTTON_VARIANTS = {
  primary: "saas-btn-primary",
  secondary: "saas-btn-secondary",
  danger:
    "rounded-xl border border-red-200 px-4 py-2.5 font-semibold text-red-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-100 active:translate-y-0 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-900/40",
  navActive:
    "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 transition-all duration-300 hover:from-blue-500 hover:to-indigo-500 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-400 dark:hover:to-indigo-400",
  nav: "text-slate-700 transition-all duration-300 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white",
};

const Button = ({
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
  loading = false,
  children,
  ...props
}) => {
  const variantClass = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`${variantClass} active:scale-95 ${className}`.trim()}
      {...props}
    >
      {loading ? (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent align-[-0.2em]" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;
