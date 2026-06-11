import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [exit, setExit] = useState(false);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += 4 + Math.random() * 6;
      setProgress(Math.min(p, 100));
      if (p >= 100) clearInterval(interval);
    }, 40);

    const done = setTimeout(() => {
      setExit(true);
      setTimeout(() => onComplete?.(), 700);
    }, 2200);

    return () => {
      clearInterval(interval);
      clearTimeout(done);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!exit && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: "#030014" }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
            <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-500/15 blur-[100px]" />
          </div>

          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-3xl border border-purple-500/30"
              style={{ boxShadow: "0 0 60px rgba(168,85,247,0.3)" }}
            />
            <div
              className="relative w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                boxShadow: "0 0 40px rgba(168,85,247,0.5)",
              }}
            >
              ⚡
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl font-black tracking-tight mb-2"
            style={{
              fontFamily: "Poppins, sans-serif",
              background: "linear-gradient(90deg, #fff, #c084fc, #67e8f9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            EduMind
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-gray-500 tracking-[0.3em] uppercase mb-10"
          >
            Calibrating Intelligence
          </motion.p>

          <div className="w-48 h-1 rounded-full overflow-hidden bg-white/5">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
                boxShadow: "0 0 12px rgba(6,182,212,0.6)",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
