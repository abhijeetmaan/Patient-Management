const ModalShell = ({ className = "", children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/55 p-4 transition-all duration-300 dark:bg-black/65 md:p-8">
      <div
        className={`w-full rounded-2xl border border-white/70 bg-white shadow-card transition-all duration-300 dark:border-slate-700 dark:bg-slate-900 ${className}`.trim()}
      >
        {children}
      </div>
    </div>
  );
};

export default ModalShell;
