// SplashScreen.jsx
// Shows on first load: logo animation → loading bar → transitions to app
// Like Hotstar/gaming intros — cinematic and memorable

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 3,
  dur: 2 + Math.random() * 4,
  delay: Math.random() * 3,
  color: ["#a855f7", "#06b6d4", "#3b82f6", "#ec4899"][i % 4],
}));

const SCIENCE_ICONS = ["⚛️", "∑", "🧬", "∫", "π", "🔭", "⚡", "🧪"];

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState("logo"); // logo → tagline → bar → exit
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Phase timeline (Speeded up by 2x for snappier experience)
    const t1 = setTimeout(() => setPhase("tagline"), 600);
    const t2 = setTimeout(() => setPhase("bar"), 1000);
    const t3 = setTimeout(() => setPhase("exit"), 2000);
    const t4 = setTimeout(() => onComplete?.(), 2400);

    // Progress bar animation (completes in 1000ms)
    let p = 0;
    const interval = setInterval(() => {
      p += 2.2; // faster increment to match 1000ms
      setProgress(Math.min(p, 100));
      if (p >= 100) clearInterval(interval);
    }, 20);

    return () => {
      [t1, t2, t3, t4].forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: "radial-gradient(ellipse at 50% 50%, #0d0520 0%, #030014 60%)" }}
        >
          {/* Animated grid */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(rgba(168,85,247,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(168,85,247,0.04) 1px,transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />

          {/* Particles */}
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.color }}
              animate={{ y: [-10, 10, -10], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity }}
            />
          ))}

          {/* Floating science icons */}
          {SCIENCE_ICONS.map((icon, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl select-none"
              style={{
                left: `${8 + (i * 12)}%`,
                top: `${15 + (i % 3) * 25}%`,
                filter: "drop-shadow(0 0 8px rgba(168,85,247,0.5))",
              }}
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3 + i * 0.4, delay: i * 0.3, repeat: Infinity }}
            >
              {icon}
            </motion.div>
          ))}

          {/* Glowing rings */}
          {[200, 300, 400].map((size, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border"
              style={{
                width: size, height: size,
                borderColor: `rgba(168,85,247,${0.15 - i * 0.04})`,
              }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2.5, delay: i * 0.4, repeat: Infinity }}
            />
          ))}

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center gap-6">

            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, duration: 0.8 }}
              className="relative"
            >
              {/* Glow behind logo */}
              <div className="absolute inset-0 rounded-full blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)", transform: "scale(2)" }}
              />
              <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)", boxShadow: "0 0 60px rgba(124,58,237,0.8)" }}
              >
                <span className="text-4xl">⚡</span>
              </div>
            </motion.div>

            {/* Brand name letter-by-letter */}
            <div className="flex items-center gap-1">
              {"EduMind".split("").map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08, type: "spring", stiffness: 300 }}
                  className="text-6xl font-black font-[Poppins]"
                  style={{
                    background: i < 3
                      ? "linear-gradient(90deg,#a855f7,#7c3aed)"
                      : "linear-gradient(90deg,#06b6d4,#3b82f6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "none",
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Tagline */}
            <AnimatePresence>
              {(phase === "tagline" || phase === "bar") && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-gray-400 text-lg font-light tracking-[0.3em] uppercase"
                  style={{ fontFamily: "Inter" }}
                >
                  AI · Physics · Chemistry · Maths
                </motion.p>
              )}
            </AnimatePresence>

            {/* Progress bar */}
            <AnimatePresence>
              {phase === "bar" && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 280 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <div className="h-1 rounded-full overflow-hidden" style={{ width: 280, background: "rgba(255,255,255,0.08)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        width: `${progress}%`,
                        background: "linear-gradient(90deg,#7c3aed,#06b6d4,#ec4899)",
                        boxShadow: "0 0 12px rgba(168,85,247,0.8)",
                      }}
                    />
                  </div>
                  {/* Spinner dot on progress end */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                    style={{
                      left: `calc(${progress}% - 6px)`,
                      background: "#a855f7",
                      boxShadow: "0 0 8px #a855f7, 0 0 20px #a855f7",
                    }}
                  />

                  {/* Loading text */}
                  <motion.p
                    className="text-center mt-4 text-xs text-gray-500 tracking-widest"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    {progress < 40 ? "INITIALIZING AI ENGINE..." :
                     progress < 75 ? "LOADING PHYSICS LAB..." :
                     "PREPARING YOUR JOURNEY..."}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}