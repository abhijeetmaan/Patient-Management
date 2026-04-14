import { motion } from "framer-motion";

const AppLoader = () => {
  return (
    <div className="fixed inset-0 z-[120] overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.35),transparent_45%),radial-gradient(circle_at_85%_12%,rgba(99,102,241,0.28),transparent_45%),radial-gradient(circle_at_40%_80%,rgba(14,165,233,0.25),transparent_48%)]" />

      <motion.div
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <motion.div
          className="relative flex h-24 w-24 items-center justify-center"
          initial={{ scale: 0.9, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            className="absolute inset-0 rounded-3xl border border-sky-300/70"
            animate={{ scale: [1, 1.16, 1], opacity: [0.8, 0.15, 0.8] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-2 rounded-2xl border border-indigo-300/70"
            animate={{ scale: [1, 1.1, 1], opacity: [0.75, 0.2, 0.75] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 text-lg font-extrabold text-slate-900 shadow-2xl shadow-blue-900/35">
            PM
          </div>
        </motion.div>

        <motion.p
          className="mt-7 text-center font-['Sora'] text-xl font-bold tracking-[0.08em] text-white"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45, ease: "easeOut" }}
        >
          Patient Suite
        </motion.p>
        <motion.p
          className="mt-2 text-center text-sm font-medium tracking-wide text-blue-100/90"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45, ease: "easeOut" }}
        >
          Preparing your premium workspace...
        </motion.p>
      </motion.div>
    </div>
  );
};

export default AppLoader;
