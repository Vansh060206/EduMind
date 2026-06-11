import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight, ChevronDown, Sparkles, Brain, FlaskConical,
  Atom, LineChart, MessageSquare, Star, Zap, Mail
} from "lucide-react";
import LandingLoader from "../components/landing/LandingLoader";
import HeroCanvas from "../components/landing/HeroCanvas";
import LabSceneCanvas from "../components/landing/LabSceneCanvas";
import {
  FEATURES, JOURNEY_STEPS, TESTIMONIALS, STATS, ARIA_PREVIEW,
} from "../components/landing/landingData";

gsap.registerPlugin(ScrollTrigger);

function useCountUp(end, active, duration = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const startTime = performance.now();
    const tick = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(start + (end - start) * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end, active, duration]);
  return value;
}

function GlassButton({ children, onClick, variant = "primary", className = "" }) {
  const isPrimary = variant === "primary";
  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative px-7 py-3.5 rounded-2xl text-sm font-bold overflow-hidden ${className}`}
      style={{
        background: isPrimary
          ? "linear-gradient(135deg, #7c3aed, #06b6d4)"
          : "rgba(255,255,255,0.04)",
        border: isPrimary ? "none" : "1px solid rgba(255,255,255,0.12)",
        boxShadow: isPrimary ? "0 0 30px rgba(168,85,247,0.35)" : "none",
        color: "#fff",
      }}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {isPrimary && (
        <motion.span
          className="absolute inset-0 opacity-0 hover:opacity-100"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15), transparent)" }}
        />
      )}
    </motion.button>
  );
}

function StatCounter({ stat, active }) {
  const count = useCountUp(stat.value, active);
  const formatted = count >= 1000000
    ? `${(count / 1000000).toFixed(1)}M`
    : count >= 1000
      ? `${Math.floor(count / 1000)}K`
      : count;
  return (
    <div className="text-center landing-stat">
      <p className="text-3xl sm:text-4xl font-black text-white mb-1" style={{ fontFamily: "Poppins" }}>
        {formatted}{stat.suffix}
      </p>
      <p className="text-xs text-gray-500 uppercase tracking-widest">{stat.label}</p>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [statsVisible, setStatsVisible] = useState(false);
  const [ariaText, setAriaText] = useState("");
  const [ariaIdx, setAriaIdx] = useState(0);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const labRef = useRef(null);
  const pageRef = useRef(null);
  const statsRef = useRef(null);

  // Mouse move listener for dynamic spotlight
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.35,
      }
    }
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 35, scale: 0.8, rotate: -2 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        damping: 13,
        stiffness: 90
      }
    }
  };

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray(".landing-reveal").forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none reverse" },
          y: 50,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
        });
      });

      gsap.from(".feature-card", {
        scrollTrigger: { trigger: "#why-edumind", start: "top 72%" },
        y: 70,
        opacity: 0,
        stagger: 0.12,
        duration: 0.85,
        ease: "power3.out",
      });

      gsap.from(".journey-node", {
        scrollTrigger: { trigger: "#journey", start: "top 75%" },
        scale: 0.6,
        opacity: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: "back.out(1.4)",
      });

      gsap.from(".journey-line", {
        scrollTrigger: { trigger: "#journey", start: "top 75%" },
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1.2,
        ease: "power2.inOut",
      });

      ScrollTrigger.create({
        trigger: "#lab-section",
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => labRef.current?.setProgress(self.progress),
      });
    }, pageRef);

    return () => ctx.revert();
  }, [ready]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, [ready]);

  // ARIA typing animation
  useEffect(() => {
    if (!ready) return;
    const messages = ARIA_PREVIEW.filter((m) => m.role === "aria").map((m) => m.text);
    const msg = messages[ariaIdx % messages.length];
    let i = 0;
    setAriaText("");
    const interval = setInterval(() => {
      setAriaText(msg.slice(0, i + 1));
      i++;
      if (i >= msg.length) {
        clearInterval(interval);
        setTimeout(() => setAriaIdx((p) => p + 1), 2500);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [ready, ariaIdx]);

  const handleLoaderDone = useCallback(() => {
    setLoading(false);
    setTimeout(() => setReady(true), 100);
  }, []);

  return (
    <>
      {loading && <LandingLoader onComplete={handleLoaderDone} />}

      <div ref={pageRef} className="landing-page bg-[#030014] text-white overflow-x-hidden relative" style={{ scrollBehavior: "smooth" }}>
        {/* Dynamic Interactive Cursor Spotlight */}
        <div
          className="pointer-events-none fixed inset-0 z-10 transition-all duration-300 ease-out"
          style={{
            background: `radial-gradient(550px at ${mousePos.x}px ${mousePos.y}px, rgba(124, 58, 237, 0.08), rgba(6, 182, 212, 0.04), transparent 80%)`
          }}
        />
        {/* ── NAV ── */}
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={ready ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4"
        >
          <div
            className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>⚡</div>
              <span className="text-lg font-black" style={{
                fontFamily: "Poppins",
                background: "linear-gradient(90deg,#a855f7,#06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>EduMind</span>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-xs text-gray-400 font-medium">
              <a href="#why-edumind" className="hover:text-white transition-colors">Features</a>
              <a href="#lab-section" className="hover:text-white transition-colors">Labs</a>
              <a href="#journey" className="hover:text-white transition-colors">Journey</a>
              <a href="#aria" className="hover:text-white transition-colors">ARIA</a>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <GlassButton variant="ghost" onClick={() => navigate("/login")} className="!px-4 !py-2.5 !text-xs">
                Login
              </GlassButton>
              <GlassButton onClick={() => navigate("/login")} className="!px-4 !py-2.5 !text-xs">
                Sign Up <ArrowRight size={14} />
              </GlassButton>
            </div>
          </div>
        </motion.nav>

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <HeroCanvas scrollY={scrollY} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030014]/40 to-[#030014] z-[2]" />

          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-24"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6"
              style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)", color: "#c084fc" }}
            >
              <Sparkles size={12} /> AI-Powered Learning for JEE & NEET
            </motion.div>

            <motion.h1
              variants={containerVariants}
              initial="hidden"
              animate={ready ? "visible" : "hidden"}
              className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-6"
              style={{ fontFamily: "Poppins" }}
            >
              <span className="block text-white">
                {["Learn", "Smarter"].map((word) => (
                  <motion.span
                    key={word}
                    variants={wordVariants}
                    className="inline-block mr-3 sm:mr-4 origin-bottom"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
              <span
                className="block mt-2"
                style={{
                  background: "linear-gradient(90deg, #a855f7, #06b6d4, #34d399)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {["with", "AI."].map((word) => (
                  <motion.span
                    key={word}
                    variants={wordVariants}
                    className="inline-block mr-3 sm:mr-4 origin-bottom"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              EduMind is the adaptive learning platform for Class 11–12 Science students — combining AI tutoring,
              3D labs, predictive analytics, and personalized mock tests into one cinematic study experience.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.85, duration: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <GlassButton onClick={() => navigate("/login")}>
                Get Started Free <ArrowRight size={16} />
              </GlassButton>
              <GlassButton variant="ghost" onClick={() => navigate("/login")}>
                Login to Dashboard
              </GlassButton>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={ready ? { opacity: 1, y: [0, 8, 0] } : {}}
            transition={{ opacity: { delay: 1.2 }, y: { duration: 2, repeat: Infinity } }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-gray-500"
          >
            <span className="text-[10px] uppercase tracking-widest">Scroll to explore</span>
            <ChevronDown size={20} className="text-purple-400" />
          </motion.div>
        </section>

        {/* ── WHY EDUMIND ── */}
        <section id="why-edumind" className="relative py-24 sm:py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="landing-reveal text-center mb-16">
              <p className="text-xs uppercase tracking-[0.3em] text-purple-400 font-bold mb-3">Why EduMind</p>
              <h2 className="text-3xl sm:text-5xl font-black mb-4" style={{ fontFamily: "Poppins" }}>
                Everything you need to <span className="text-cyan-400">dominate</span> competitive exams
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
                Five pillars of intelligence — each engineered for Class 11–12 science mastery.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  className={`feature-card group p-6 rounded-3xl relative overflow-hidden ${i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}`}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(16px)",
                  }}
                  whileHover={{ y: -6, scale: 1.02 }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 30% 20%, ${f.glow}15, transparent 60%)` }}
                  />
                  <div className="relative">
                    <span className="text-3xl mb-4 block">{f.icon}</span>
                    <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3D LABS ── */}
        <section id="lab-section" className="relative py-24 sm:py-32 px-6 overflow-hidden">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="landing-reveal">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold mb-3">Interactive 3D</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "Poppins" }}>
                Physics & Chemistry Labs
              </h2>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6">
                Scroll to orbit through molecular structures, particle simulations, and real-time scientific models.
                Built with Three.js for immersive spatial learning.
              </p>
              <div className="flex flex-wrap gap-3">
                {["⚡ Projectile Motion", "🧪 SN2 Mechanisms", "⚛️ Molecular Orbitals", "🔭 Orbital Mechanics"].map((tag) => (
                  <span key={tag} className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-300"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div
              className="relative h-[320px] sm:h-[420px] rounded-3xl overflow-hidden landing-reveal"
              style={{ border: "1px solid rgba(6,182,212,0.2)", boxShadow: "0 0 60px rgba(6,182,212,0.1)" }}
            >
              <LabSceneCanvas ref={labRef} />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#030014] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-gray-500 font-mono">
                <span className="flex items-center gap-1"><FlaskConical size={12} className="text-cyan-400" /> Chem Lab</span>
                <span className="flex items-center gap-1"><Atom size={12} className="text-purple-400" /> Physics Lab</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── LEARNING JOURNEY ── */}
        <section id="journey" className="relative py-24 sm:py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="landing-reveal text-center mb-16">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400 font-bold mb-3">The Loop</p>
              <h2 className="text-3xl sm:text-5xl font-black" style={{ fontFamily: "Poppins" }}>
                Your AI Learning Journey
              </h2>
            </div>

            <div className="relative hidden md:block mb-4">
              <div className="journey-line absolute top-8 left-[8%] right-[8%] h-0.5 rounded-full"
                style={{ background: "linear-gradient(90deg, #7c3aed, #06b6d4, #34d399, #f59e0b, #ec4899, #a855f7)" }} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-6 md:gap-4">
              {JOURNEY_STEPS.map((step, i) => (
                <div key={step.label} className="journey-node text-center">
                  <div
                    className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-xl mb-3 relative"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(168,85,247,0.25)",
                      boxShadow: "0 0 20px rgba(168,85,247,0.15)",
                    }}
                  >
                    {step.icon}
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-500 text-[9px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">{step.label}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ANALYTICS PREVIEW ── */}
        <section className="relative py-24 sm:py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="landing-reveal text-center mb-12">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-400 font-bold mb-3">Predictive Intelligence</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "Poppins" }}>
                Student Analytics Dashboard
              </h2>
            </div>

            <div
              className="landing-reveal grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 sm:p-8 rounded-3xl"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
              }}
            >
              {[
                { label: "Avg Score", value: "74%", trend: "+8%", color: "#34d399", icon: LineChart },
                { label: "Risk Status", value: "On-Track", trend: "XGBoost", color: "#06b6d4", icon: Brain },
                { label: "30-Day Forecast", value: "82%", trend: "Prophet", color: "#a855f7", icon: Sparkles },
                { label: "Weak Topics", value: "3", trend: "Adaptive", color: "#f59e0b", icon: Zap },
              ].map((m) => (
                <motion.div
                  key={m.label}
                  whileHover={{ scale: 1.03 }}
                  className="p-5 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <m.icon size={18} style={{ color: m.color }} className="mb-3" />
                  <p className="text-2xl font-black text-white">{m.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{m.label}</p>
                  <p className="text-[10px] font-bold mt-2" style={{ color: m.color }}>{m.trend}</p>
                </motion.div>
              ))}
            </div>

            <div className="landing-reveal mt-6 p-5 rounded-2xl flex items-start gap-3"
              style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)" }}>
              <Brain size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-300 leading-relaxed">
                <span className="text-purple-300 font-semibold">AI Recommendation:</span> Focus on Angular Momentum today.
                Your diagnostic scores suggest targeted practice in rotational dynamics will yield the highest score improvement.
              </p>
            </div>
          </div>
        </section>

        {/* ── ARIA ── */}
        <section id="aria" className="relative py-24 sm:py-32 px-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[150px]" />
          </div>

          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative">
            <div className="landing-reveal">
              <p className="text-xs uppercase tracking-[0.3em] text-pink-400 font-bold mb-3">Meet ARIA</p>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "Poppins" }}>
                Professor ARIA — Your AI Tutor
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Upload diagrams, ask derivation doubts, and get step-by-step LaTeX explanations
                calibrated for JEE and NEET rigor.
              </p>
              <GlassButton onClick={() => navigate("/login")}>
                <MessageSquare size={16} /> Chat with ARIA
              </GlassButton>
            </div>

            <div
              className="landing-reveal relative p-6 rounded-3xl min-h-[280px]"
              style={{
                background: "rgba(10,5,25,0.8)",
                border: "1px solid rgba(168,85,247,0.2)",
                boxShadow: "0 0 50px rgba(168,85,247,0.12)",
                backdropFilter: "blur(24px)",
              }}
            >
              <div className="absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>
                Live Preview
              </div>

              <div className="space-y-4 mt-4">
                {ARIA_PREVIEW.slice(0, 3).map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-purple-500/20 text-purple-100 border border-purple-500/20"
                          : "bg-white/5 text-gray-200 border border-white/8"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed bg-white/5 text-gray-200 border border-white/8">
                    {ariaText}
                    <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-cyan-400 animate-pulse align-middle" />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full opacity-20 pointer-events-none"
                style={{ background: "conic-gradient(from 180deg, #7c3aed, #06b6d4, #7c3aed)", filter: "blur(40px)" }} />
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="relative py-20 overflow-hidden">
          <div className="landing-reveal text-center mb-12 px-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 font-bold mb-3">Success Stories</p>
            <h2 className="text-3xl sm:text-4xl font-black" style={{ fontFamily: "Poppins" }}>
              Trusted by aspirants nationwide
            </h2>
          </div>

          <div className="marquee-track flex gap-5 w-max">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <motion.div
                key={`${t.name}-${i}`}
                whileHover={{ scale: 1.03, y: -4 }}
                className="w-[300px] sm:w-[340px] flex-shrink-0 p-6 rounded-3xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-[10px] text-emerald-400 font-semibold">{t.score}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, j) => <Star key={j} size={12} className="text-amber-400 fill-amber-400" />)}
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── STATS ── */}
        <section ref={statsRef} className="relative py-24 px-6">
          <div
            className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 p-10 rounded-3xl landing-reveal"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {STATS.map((s) => (
              <StatCounter key={s.label} stat={s} active={statsVisible} />
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="relative py-32 sm:py-40 px-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-purple-600/15 blur-[120px]" />
          </div>

          <div className="max-w-3xl mx-auto text-center relative landing-reveal">
            <motion.h2
              className="text-4xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight"
              style={{ fontFamily: "Poppins" }}
            >
              Your Future
              <br />
              <span style={{
                background: "linear-gradient(90deg, #fff, #c084fc, #67e8f9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Starts Here.
              </span>
            </motion.h2>
            <p className="text-gray-400 mb-10 text-sm sm:text-base max-w-lg mx-auto">
              Join thousands of JEE and NEET aspirants using AI to learn faster, diagnose smarter, and predict their rank trajectory.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <GlassButton onClick={() => navigate("/login")} className="!px-10 !py-4 !text-base">
                Sign Up Free <ArrowRight size={18} />
              </GlassButton>
              <GlassButton variant="ghost" onClick={() => navigate("/login")} className="!px-10 !py-4 !text-base">
                Login
              </GlassButton>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="py-12 px-6 border-t border-white/5 bg-[#02000c]/80 backdrop-blur-md relative z-20">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>⚡</div>
              <span className="text-base font-black text-white" style={{ fontFamily: "Poppins" }}>EduMind</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/Vansh060206"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 text-gray-400 hover:text-purple-400 transition-all shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                title="Github"
              >
                <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/vansh-mankani-9aa1a8316/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400 transition-all shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                title="LinkedIn"
              >
                <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24">
                  <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43c-1.14 0-2.06-.92-2.06-2.06 0-1.14.92-2.06 2.06-2.06 1.14 0 2.06.92 2.06 2.06 0 1.14-.92 2.06-2.06 2.06zm15.11 13.02h-3.56v-5.6c0-1.34-.03-3.05-1.86-3.05-1.86 0-2.14 1.45-2.14 2.95v5.7h-3.56V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z"/>
                </svg>
              </a>
              <a
                href="mailto:mankanivansh273@gmail.com"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 transition-all shadow-[0_0_15px_rgba(255,255,255,0.02)] hover:shadow-[0_0_15px_rgba(52,211,153,0.15)]"
                title="Email"
              >
                <Mail size={18} />
              </a>
            </div>
            
            <div className="text-center md:text-right text-xs text-gray-500 font-medium">
              <p>© {new Date().getFullYear()} EduMind · Learn Smarter with AI</p>
              <p className="text-[10px] text-gray-600 mt-1">Class 11–12 · JEE · NEET</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
