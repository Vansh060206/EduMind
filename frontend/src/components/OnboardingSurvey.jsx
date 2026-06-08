import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, Brain, Target, Compass, Award, 
  ArrowRight, BookOpen, Clock, Lightbulb, ChevronRight
} from "lucide-react";
import api from "../services/api";

const QUESTIONS = [
  {
    id: "class",
    ai: "Greetings! I am ARIA, your AI Science Mentor. 🤖\nLet's calibrate your learning path. Which academic year are you currently in?",
    type: "choice",
    options: [
      { label: "Class 11 Science", icon: "🌱", desc: "Foundation building year", value: "11" },
      { label: "Class 12 Science", icon: "⚡", desc: "Board & entrance target year", value: "12" },
      { label: "Dropper / Repeater", icon: "🔄", desc: "Dedicated preparation year", value: "dropper" }
    ]
  },
  {
    id: "goal",
    ai: "Target locked. 🎯\nWhat is your primary milestone target for this session?",
    type: "choice",
    options: [
      { label: "JEE Main & Advanced", icon: "🏆", desc: "IIT & top engineering colleges", value: "jee" },
      { label: "NEET UG", icon: "🩺", desc: "AIIMS & top medical colleges", value: "neet" },
      { label: "CBSE / State Boards", icon: "📋", desc: "Subjective theory & school excellence", value: "boards" }
    ]
  },
  {
    id: "weak",
    ai: "Honesty is the key to mastery. 🧪\nWhich core concept domain feels the most challenging right now?",
    type: "choice",
    options: [
      { label: "Physics (Mechanics/Electro)", icon: "⚛️", desc: "Numerical logic & formulas", value: "physics" },
      { label: "Chemistry (Organic/Physical)", icon: "🧪", desc: "Reactions & atomic theories", value: "chemistry" },
      { label: "Mathematics (Calculus/Vectors)", icon: "∫", desc: "Integration & coordinate systems", value: "maths" },
      { label: "Biology (Genetics/Physiology)", icon: "🧬", desc: "Cellular cycles & terminology", value: "biology" }
    ]
  },
  {
    id: "hours",
    ai: "Consistency beats talent. ⏰\nHow many hours can you commit to self-study daily?",
    type: "choice",
    options: [
      { label: "1–2 Hours", icon: "🚲", desc: "Gradual starting pace", value: "1-2" },
      { label: "3–4 Hours", icon: "🏃", desc: "Balanced preparation rate", value: "3-4" },
      { label: "5–6 Hours", icon: "🚀", desc: "High-intensity study cycle", value: "5-6" },
      { label: "7+ Hours (Grind)", icon: "💎", desc: "Full-immersion competitive mode", value: "7+" }
    ]
  },
  {
    id: "motivation",
    ai: "Excellent commitment. 🧠\nWhat is your primary driving motivation on EduMind?",
    type: "choice",
    options: [
      { label: "Get into a Top IIT / AIIMS", icon: "🏛️", desc: "National rank aspiration", value: "rank" },
      { label: "Clear Chapter Backlogs", icon: "📚", desc: "Reinforcing weak foundations", value: "backlog" },
      { label: "Score 99+ Percentile", icon: "📈", desc: "Mock test benchmarking", value: "percentile" },
      { label: "Learn Concepts Visually", icon: "🎨", desc: "Immersive 3D simulations", value: "visual" }
    ]
  }
];

const CALIBRATION_STEPS = [
  "Extracting baseline concept profile parameters...",
  "Calibrating XGBoost Performance Predictor algorithms...",
  "Instantiating Prophet 30-day score forecaster weights...",
  "Linking collaborative course recommendation nodes...",
  "Calibrating Three.js 3D physics simulator environments...",
  "Cognitive sync complete! Loading your dashboard..."
];

const FLOATING_ELEMENTS = [
  { char: "⚛️", x: "8%", y: "15%", scale: 1.1, dur: 12 },
  { char: "∫", x: "85%", y: "22%", scale: 1.3, dur: 15 },
  { char: "🧪", x: "12%", y: "78%", scale: 1.0, dur: 10 },
  { char: "π", x: "78%", y: "82%", scale: 1.2, dur: 14 },
  { char: "🧬", x: "90%", y: "45%", scale: 1.1, dur: 18 },
  { char: "∑", x: "5%", y: "48%", scale: 1.4, dur: 13 }
];

export default function OnboardingSurvey({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [typing, setTyping] = useState(true);
  const [displayText, setDisplayText] = useState("");
  const [selected, setSelected] = useState(null);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationIdx, setCalibrationIdx] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMessageIdx, setWelcomeMessageIdx] = useState(0);

  const q = QUESTIONS[step];
  
  const WELCOME_MESSAGES = [
    "WELCOME TO EDUMIND",
    "YOUR AI COGNITIVE CORE IS NOW ACTIVE",
    "TRANSITIONING TO DASHBOARD..."
  ];

  // Typewriter effect for ARIA's dialogue
  useEffect(() => {
    setTyping(true);
    setDisplayText("");
    setSelected(null);
    let i = 0;
    const text = q.ai;
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setTyping(false);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [step]);

  // Loading calibration transition sequence
  useEffect(() => {
    if (!calibrating) return;
    
    let dbSaved = false;
    let animDone = false;
    let transitionTriggered = false;

    const proceed = () => {
      if (transitionTriggered) return;
      transitionTriggered = true;
      localStorage.setItem("edumind_survey", JSON.stringify(answers));
      localStorage.setItem("edumind_new_user", "true");
      setCalibrating(false);
      setShowWelcome(true);
    };

    // Save to DB first, then proceed
    const saveSurveyToDb = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("edumind_user") || "{}");
        if (user.id && user.email) {
          await api.post("/auth/survey", {
            student_id: user.id,
            email: user.email,
            name: user.name || "Student",
            survey_data: answers
          });
        }
        dbSaved = true;
        if (animDone) {
          proceed();
        }
      } catch (err) {
        console.error("Failed to save survey to database:", err);
        // Fallback so they don't get stuck forever if backend is down
        dbSaved = true;
        if (animDone) {
          proceed();
        }
      }
    };
    saveSurveyToDb();

    // Cycle through steps
    const interval = setInterval(() => {
      setCalibrationIdx((prev) => {
        if (prev < CALIBRATION_STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          animDone = true;
          if (dbSaved) {
            proceed();
          }
          return prev;
        }
      });
    }, 450);

    return () => {
      clearInterval(interval);
    };
  }, [calibrating]);

  // Welcome phase cycle
  useEffect(() => {
    if (!showWelcome) return;

    const interval = setInterval(() => {
      setWelcomeMessageIdx((prev) => {
        if (prev < WELCOME_MESSAGES.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          onComplete?.();
          return prev;
        }
      });
    }, 900);

    return () => clearInterval(interval);
  }, [showWelcome]);

  const handleSelect = (val) => {
    setSelected(val);
    const newAnswers = { ...answers, [q.id]: val };
    setAnswers(newAnswers);

    // Slide transition delay for visual feedback
    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        setStep((s) => s + 1);
      } else {
        setCalibrating(true);
      }
    }, 550);
  };

  // 🧪 Rendering the Calibration Loader page
  if (calibrating) {
    return (
      <div 
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 text-center select-none"
        style={{ background: "radial-gradient(circle at 50% 50%, #0d052d 0%, #02000c 70%)" }}
      >
        {/* Glow Orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 blur-[130px] rounded-full pointer-events-none" />

        {/* Animated 3D Holographic Portal */}
        <div className="relative mb-12 flex items-center justify-center">
          {/* External rotating HUD ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute w-32 h-32 rounded-full border border-dashed border-cyan-500/30"
          />
          {/* Secondary rotating HUD ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute w-28 h-28 rounded-full border border-double border-purple-500/30"
          />
          {/* Glowing central core */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(168,85,247,0.5)] border border-purple-400"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
            }}
          >
            ⚛️
          </motion.div>
        </div>

        {/* Progress Text Stack */}
        <div className="max-w-md w-full px-6 flex flex-col gap-3 font-mono">
          {CALIBRATION_STEPS.map((msg, idx) => (
            <AnimatePresence key={idx}>
              {calibrationIdx >= idx && (
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 text-left"
                >
                  <span className={`text-xs ${calibrationIdx > idx ? "text-emerald-400 font-bold" : "text-purple-400 animate-pulse font-bold"}`}>
                    {calibrationIdx > idx ? "✓" : "❯"}
                  </span>
                  <span className={`text-[12px] tracking-wide ${calibrationIdx > idx ? "text-gray-400" : "text-white font-semibold"}`}>
                    {msg}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* Futuristic bar at bottom */}
        <div className="w-64 h-1.5 rounded-full overflow-hidden mt-10 bg-white/5 border border-white/5">
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
            initial={{ width: "0%" }}
            animate={{ width: `${((calibrationIdx + 1) / CALIBRATION_STEPS.length) * 100}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>
    );
  }

  // 🎭 Rendering the Welcome Transition Screen
  if (showWelcome) {
    return (
      <div 
        className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-6 text-center select-none"
        style={{ background: "radial-gradient(circle at 50% 50%, #050212 0%, #000000 80%)" }}
      >
        {/* Futuristic glowing rings */}
        <div className="relative mb-10 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute w-40 h-40 rounded-full border border-dashed border-cyan-400/20 shadow-[0_0_20px_rgba(6,182,212,0.05)]"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute w-36 h-36 rounded-full border border-double border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.05)]"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-[0_0_40px_rgba(6,182,212,0.4)] border border-cyan-400/40"
            style={{
              background: "radial-gradient(circle, #06b6d4 0%, #7c3aed 100%)",
            }}
          >
            ⚡
          </motion.div>
        </div>

        {/* Cinematic Welcome Message */}
        <AnimatePresence mode="wait">
          <motion.div
            key={welcomeMessageIdx}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="max-w-md"
          >
            <h1 
              className="text-2xl md:text-3xl font-extrabold tracking-[0.15em] mb-2 uppercase text-transparent bg-clip-text"
              style={{
                fontFamily: "Poppins",
                backgroundImage: "linear-gradient(90deg, #06b6d4, #c084fc)",
                filter: "drop-shadow(0 0 10px rgba(168,85,247,0.3))"
              }}
            >
              {WELCOME_MESSAGES[welcomeMessageIdx]}
            </h1>
            <p className="text-xs text-gray-500 font-mono tracking-widest mt-3">
              SYSTEM_SYNC // ACTIVE
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[9998] flex items-center justify-center p-6 overflow-hidden"
      style={{ background: "radial-gradient(circle at 50% 50%, #08031a 0%, #020008 70%)" }}
    >
      {/* Background vector grids */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />

      {/* Dynamic Floating Science Elements */}
      {FLOATING_ELEMENTS.map((el, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl select-none text-purple-500/20 font-bold pointer-events-none"
          style={{ left: el.x, top: el.y, filter: "drop-shadow(0 0 10px rgba(168,85,247,0.05))" }}
          animate={{
            y: [-15, 15, -15],
            rotate: [0, 8, -8, 0],
            scale: [el.scale, el.scale * 1.1, el.scale]
          }}
          transition={{ duration: el.dur, repeat: Infinity, ease: "easeInOut" }}
        >
          {el.char}
        </motion.div>
      ))}

      {/* Main Survey Panel */}
      <div className="relative z-10 w-full max-w-2xl">
        
        {/* Progress Tracker dots */}
        <div className="flex justify-center gap-2.5 mb-8">
          {QUESTIONS.map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full"
              animate={{
                width: i === step ? 32 : 8,
                background: i < step 
                  ? "linear-gradient(90deg,#06b6d4,#10b981)" 
                  : i === step 
                    ? "linear-gradient(90deg,#a855f7,#06b6d4)" 
                    : "rgba(255,255,255,0.08)",
              }}
              transition={{ duration: 0.4 }}
            />
          ))}
        </div>

        {/* Mentor Bubble & Avatar Row */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8 flex flex-col md:flex-row items-center md:items-start gap-5"
        >
          {/* Futuristic Animated Avatar */}
          <div className="relative flex-shrink-0 flex items-center justify-center">
            {/* Glowing outer orbital paths */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute w-20 h-20 rounded-full border border-dashed border-purple-500/40"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute w-[72px] h-[72px] rounded-full border border-cyan-400/20"
            />
            {/* Core face casing */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-[0_0_25px_rgba(168,85,247,0.3)] border border-purple-500/30"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))", backdropFilter: "blur(10px)" }}
            >
              🤖
            </motion.div>
          </div>

          {/* AI Dialogue Box */}
          <div className="flex-1 text-center md:text-left">
            <span className="text-[10px] tracking-widest font-black uppercase text-purple-400 font-mono block mb-1">
              ARIA // SCIENCE TUTOR CONSOLE
            </span>
            <div 
              className="rounded-2xl rounded-tl-none p-5 text-left border relative overflow-hidden"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                backdropFilter: "blur(12px)",
                borderColor: "rgba(255,255,255,0.06)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03), 0 10px 30px rgba(0,0,0,0.15)"
              }}
            >
              <p className="text-white text-base lg:text-lg font-light leading-relaxed whitespace-pre-line">
                {displayText}
                {typing && (
                  <motion.span
                    className="inline-block w-1.5 h-4.5 bg-cyan-400 ml-1.5 align-middle shadow-[0_0_8px_#06b6d4]"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                )}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Options Panel Container */}
        <div className="min-h-[220px]">
          <AnimatePresence mode="wait">
            {!typing && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              >
                {q.options.map((opt, i) => (
                  <motion.button
                    key={opt.value}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ y: -3, scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => handleSelect(opt.value)}
                    className="p-4 rounded-2xl flex items-center gap-4 text-left transition-all border group relative overflow-hidden"
                    style={{
                      background: selected === opt.value
                        ? "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(6,182,212,0.08))"
                        : "rgba(255,255,255,0.01)",
                      borderColor: selected === opt.value
                        ? "rgba(168,85,247,0.4)"
                        : "rgba(255,255,255,0.06)",
                      boxShadow: selected === opt.value 
                        ? "0 10px 25px rgba(168,85,247,0.1), inset 0 1px 0 rgba(255,255,255,0.02)" 
                        : "none"
                    }}
                  >
                    {/* Inner glowing hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Left Icon Panel */}
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-110">
                      {opt.icon}
                    </div>

                    {/* Text block */}
                    <div className="flex-1 select-none pr-4">
                      <p className="text-white font-bold text-sm leading-tight transition-colors group-hover:text-purple-300">
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 font-light leading-normal">
                        {opt.desc}
                      </p>
                    </div>

                    {/* Selection validation circle */}
                    {selected === opt.value ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs font-bold"
                      >
                        ✓
                      </motion.div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/10 group-hover:border-white/20 flex-shrink-0" />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Console step footer */}
        <motion.p
          className="text-center mt-10 text-[10px] text-gray-500 tracking-[0.25em] font-mono select-none"
        >
          SYS_CALIBRATION: STAGE {step + 1} OF {QUESTIONS.length}
        </motion.p>
      </div>
    </div>
  );
}