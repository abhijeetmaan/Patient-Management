const ModalShell = ({ className = "", children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/55 p-3 transition-all duration-300 dark:bg-black/65 sm:p-4 md:items-center md:p-8">
      <div
        className={`max-h-[calc(100vh-1.5rem)] w-full overflow-y-auto rounded-2xl border border-white/70 bg-white shadow-card transition-all duration-300 dark:border-slate-700 dark:bg-slate-900 sm:max-h-[calc(100vh-2rem)] ${className}`.trim()}
      >
        {children}
      </div>
    </div>
  );
};

export default ModalShell;
