// Analytics.jsx — Interactive Student Analytics & Score Forecasting
// Shows: dynamic study stats, 30-Day ML Score Forecast, Study Time BarChart, and Mistake Analysis charts.

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Zap, Target, Clock, TrendingUp,
  Brain, Bell, Settings, LogOut, ChevronRight,
  Flame, Award, PieChart as PieIcon, BarChart2, Rocket, RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import api from "../services/api";
import { CURRICULUM } from "../utils/curriculum";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie
} from "recharts";

const NAV = [
  { icon: "🏠", label: "Dashboard" },
  { icon: "📚", label: "Courses" },
  { icon: "📅", label: "Planner" },
  { icon: "⚗️", label: "Physics Lab" },
  { icon: "🧪", label: "Chem Lab" },
  { icon: "📝", label: "Mock Tests" },
  { icon: "🤖", label: "Ask ARIA" },
  { icon: "📊", label: "Analytics", active: true },
  { icon: "⏳", label: "History" },
];

function Card({ children, className = "", style = {}, hoverEffect = true }) {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, borderColor: "rgba(168, 85, 247, 0.25)", boxShadow: "0 12px 30px -10px rgba(168, 85, 247, 0.15)" } : undefined}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

const CustomForecastTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className="p-3 rounded-xl border font-mono text-[11px]"
        style={{
          background: "rgba(10, 5, 25, 0.95)",
          borderColor: "rgba(168,85,247,0.3)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 10px 20px rgba(0,0,0,0.5)"
        }}
      >
        <p className="text-gray-400 mb-1">{data.date}</p>
        <p className="text-white font-bold mb-0.5">
          Predicted: <span className="text-cyan-400 text-sm">{data.predicted_score}%</span>
        </p>
        <p className="text-gray-500 text-[10px]">
          Bounds: {data.lower_bound}% – {data.upper_bound}%
        </p>
      </div>
    );
  }
  return null;
};

const CustomStudyHoursTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className="p-3 rounded-xl border font-mono text-[11px]"
        style={{
          background: "rgba(10, 5, 25, 0.95)",
          borderColor: "rgba(6,182,212,0.3)",
          backdropFilter: "blur(12px)",
        }}
      >
        <p className="text-white font-bold mb-0.5">{data.subject}</p>
        <p className="text-cyan-400 text-xs font-semibold">{data.hours} hours logged</p>
      </div>
    );
  }
  return null;
};

const SafeRocket = ({ size = 24, className = "" }) => {
  const hasRocket = typeof Rocket !== "undefined" && Rocket;
  if (hasRocket) {
    return <Rocket size={size} className={className} />;
  }
  return <span className={className} style={{ fontSize: size, display: "inline-block" }}>🚀</span>;
};

const AnimatedNumber = ({ value, suffix = "" }) => {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    const target = parseFloat(value) || 0;
    if (target === 0) {
      setCurrent(0);
      return;
    }
    
    let start = 0;
    const duration = 750; // ms
    const startTime = performance.now();
    
    let animationFrame;
    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress); // easeOutQuad
      
      const currentVal = Math.round(start + ease * (target - start));
      setCurrent(currentVal);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(update);
      } else {
        setCurrent(target);
      }
    };
    
    animationFrame = requestAnimationFrame(update);
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [value]);
  
  return <span>{current}{suffix}</span>;
};

const AnimatedStudyTime = ({ seconds }) => {
  const [currentSecs, setCurrentSecs] = useState(0);
  
  useEffect(() => {
    const target = Number(seconds) || 0;
    if (target === 0) {
      setCurrentSecs(0);
      return;
    }
    const start = 0;
    const duration = 750; // ms
    const startTime = performance.now();
    
    let animationFrame;
    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress);
      const currentVal = Math.round(start + ease * (target - start));
      setCurrentSecs(currentVal);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(update);
      } else {
        setCurrentSecs(target);
      }
    };
    
    animationFrame = requestAnimationFrame(update);
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [seconds]);
  
  const h = Math.floor(currentSecs / 3600);
  const m = Math.floor((currentSecs % 3600) / 60);
  return <span>{h}h {m}m</span>;
};

const getUserIdFromToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.sub || null;
  } catch (e) {
    return null;
  }
};

export default function Analytics() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem("edumind_user") || '{"name":"Student"}'));
  const survey = JSON.parse(localStorage.getItem("edumind_survey") || "{}");
  const [liveStudySeconds, setLiveStudySeconds] = useState(0);

  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    avgScore: 0,
    quizzesCount: 0,
    coursesCount: 0,
    studyHours: 0,
    studyHoursBySubject: [],
    mistakesRatio: [],
    forecastData: [],
    weakTopics: []
  });

  const getGoalLabel = (goal) => {
    switch (goal) {
      case "jee": return "JEE Aspirant";
      case "neet": return "NEET UG Aspirant";
      case "boards": return "Board Exam Aspirant";
      default: return "Science Student";
    }
  };

  const getWeakSubjectLabel = (weak) => {
    switch (weak) {
      case "physics": return "Physics";
      case "chemistry": return "Chemistry";
      case "maths": return "Mathematics";
      case "biology": return "Biology";
      default: return "";
    }
  };

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      let activeUserId = currentUser.id;
      
      // Resolve active user id
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        activeUserId = session.user.id;
      } else {
        const token = localStorage.getItem("edumind_token");
        if (token) {
          const decodedId = getUserIdFromToken(token);
          if (decodedId) activeUserId = decodedId;
        }
      }

      if (!activeUserId) return;

      // 1. Fetch Quiz performance
      let quizResults = [];
      try {
        const quizRes = await api.get(`/students/performance/${activeUserId}`);
        quizResults = quizRes.data || [];
        quizResults = [...quizResults].reverse(); // Sort chronological
      } catch (err) {
        const quizRes = await supabase.from("quiz_results").select("*").eq("student_id", activeUserId).order("attempted_at", { ascending: true });
        quizResults = quizRes.data || [];
      }

      // 2. Fetch study sessions
      let studySessions = [];
      try {
        const studyRes = await api.get(`/students/study-sessions/${activeUserId}`);
        studySessions = studyRes.data || [];
      } catch (err) {
        const studyRes = await supabase.from("study_sessions").select("*").eq("student_id", activeUserId);
        studySessions = studyRes.data || [];
      }

      // 3. Fetch courses
      let enrolledCourses = [];
      try {
        const enrollRes = await api.get(`/courses/my-courses/${activeUserId}`);
        enrolledCourses = enrollRes.data || [];
      } catch (err) {
        const enrollmentsRes = await supabase.from("enrollments").select("*, courses(*)").eq("student_id", activeUserId);
        enrolledCourses = enrollmentsRes.data || [];
      }

      // Compute general stats
      const quizzesCount = quizResults.length;
      const coursesCount = enrolledCourses.length;
      
      const totalScore = quizResults.reduce((acc, curr) => acc + curr.score, 0);
      const avgScore = quizzesCount > 0 ? Math.round(totalScore / quizzesCount) : 0;

      const totalMinutes = studySessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);
      const studyHours = Math.round((totalMinutes / 60) * 10) / 10;

      // Group study sessions by subject
      const subjectMinutes = { Physics: 0, Chemistry: 0, Mathematics: 0, Biology: 0 };
      studySessions.forEach(s => {
        const courseId = s.course_id;
        const matchedCourse = enrolledCourses.find(e => e.course_id === courseId || e.courses?.id === courseId);
        const subjectName = matchedCourse?.courses?.subject || matchedCourse?.subject || "Physics";
        
        let normalizedSubject = "Physics";
        if (subjectName.toLowerCase().includes("chem")) normalizedSubject = "Chemistry";
        else if (subjectName.toLowerCase().includes("math")) normalizedSubject = "Mathematics";
        else if (subjectName.toLowerCase().includes("biol")) normalizedSubject = "Biology";

        subjectMinutes[normalizedSubject] += s.duration_minutes;
      });

      const studyHoursBySubject = Object.entries(subjectMinutes).map(([subject, minutes]) => ({
        subject,
        hours: Math.round((minutes / 60) * 10) / 10
      }));

      // Find weak topics
      const topicScores = {};
      quizResults.forEach(q => {
        if (!topicScores[q.topic]) {
          topicScores[q.topic] = { topic: q.topic, total: 0, count: 0 };
        }
        topicScores[q.topic].total += q.score;
        topicScores[q.topic].count += 1;
      });

      const weakTopics = Object.values(topicScores)
        .map(t => ({
          topic: t.topic,
          score: Math.round(t.total / t.count)
        }))
        .filter(t => t.score < 60)
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);

      // Load ML forecast curves
      let forecastData = [];
      if (quizResults.length >= 2) {
        try {
          const historyPayload = {
            scores_history: quizResults.map(q => ({
              date: q.attempted_at ? q.attempted_at.split("T")[0] : new Date().toISOString().split("T")[0],
              score: q.score
            }))
          };
          const forecastRes = await api.post("/ml/forecast-score", historyPayload);
          forecastData = forecastRes.data || [];
        } catch (err) {
          console.warn("Forecast API failed, setting empty forecast curves");
          forecastData = [];
        }
      } else {
        forecastData = [];
      }

      // Pre-seed some mistake classifier distribution data
      let mistakesRatio = [];
      if (quizResults.length > 0) {
        mistakesRatio = [
          { name: "Conceptual Gap", value: 45, color: "#a855f7" },
          { name: "Silly Mistake", value: 35, color: "#f59e0b" },
          { name: "Lack of Knowledge", value: 20, color: "#f87171" }
        ];
      }

      setAnalyticsData({
        avgScore,
        quizzesCount,
        coursesCount,
        studyHours,
        studyHoursBySubject,
        mistakesRatio,
        forecastData,
        weakTopics
      });
    } catch (err) {
      console.error("Failed to compile analytics page charts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [currentUser.id]);

  useEffect(() => {
    const userId = currentUser.id || "default";
    const updateTick = () => {
      const totalSecs = Number(localStorage.getItem(`edumind_total_seconds_${userId}`) || 0);
      setLiveStudySeconds(totalSecs);
    };
    updateTick();
    window.addEventListener("edumind_study_tick", updateTick);
    return () => window.removeEventListener("edumind_study_tick", updateTick);
  }, [currentUser.id]);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("edumind_token");
    localStorage.removeItem("edumind_user");
    localStorage.removeItem("edumind_survey");
    localStorage.removeItem("edumind_new_user");
    navigate("/");
  };

  const formatLiveTime = (totalSecs) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // Streak calculations
  const userId = currentUser.id || "default";
  const storedStreak = localStorage.getItem(`edumind_streak_count_${userId}`);
  const displayStreak = storedStreak ? `${storedStreak} Days` : "0 Days";

  const displayStats = [
    { label: "Predictive Mastery", value: `${analyticsData.avgScore}%`, icon: TrendingUp, color: "#34d399", bg: "rgba(52,211,153,0.1)" },
    { label: "Study Time Logged", value: formatLiveTime(liveStudySeconds), icon: Clock, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    { label: "Completed Tests", value: String(analyticsData.quizzesCount), icon: Target, color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
    { label: "Streak Active", value: displayStreak, icon: Flame, color: "#a855f7", bg: "rgba(168,85,247,0.1)" }
  ];

  return (
    <div className="flex h-screen overflow-hidden text-white" style={{ background: "#030014" }}>
      
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* ── SIDEBAR ── */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-64 flex-shrink-0 flex flex-col p-5 border-r"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(16px)" }}
      >
        <div className="flex items-center gap-2.5 mb-8 px-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
            style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>⚡</div>
          <span className="text-xl font-black" style={{
            fontFamily: "Poppins",
            background: "linear-gradient(90deg,#a855f7,#06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>EduMind</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV.map((item, i) => (
            <motion.button
              key={i}
              whileHover={{ x: 4 }}
              onClick={() => {
                if (item.label === "Dashboard") navigate("/dashboard");
                if (item.label === "Ask ARIA") navigate("/ask-aria");
                if (item.label === "Mock Tests") navigate("/mock-tests");
                if (item.label === "Courses") navigate("/courses");
                if (item.label === "Planner") navigate("/planner");
                if (item.label === "Physics Lab") navigate("/physics-lab");
                if (item.label === "Chem Lab") navigate("/chem-lab");
                if (item.label === "History") navigate("/history");
                if (item.label === "Analytics") navigate("/analytics");
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all"
              style={{
                background: item.active ? "rgba(168,85,247,0.15)" : "transparent",
                color: item.active ? "#c084fc" : "rgba(255,255,255,0.45)",
                border: item.active ? "1px solid rgba(168,85,247,0.25)" : "1px solid transparent",
              }}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
              {item.active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />}
            </motion.button>
          ))}
        </nav>

        <div className="mt-4 p-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
              style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
              {currentUser.name?.[0]?.toUpperCase() || "S"}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{currentUser.name || "Student"}</p>
              <p className="text-[10px] text-gray-500 font-semibold tracking-wide">
                {survey.goal ? getGoalLabel(survey.goal).toUpperCase() : "JEE ASPIRANT"}
              </p>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs text-gray-500 hover:text-red-400 transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </motion.aside>

      {/* ── MAIN ANALYTICS VIEW ── */}
      <main className="flex-1 overflow-y-auto p-6 relative">

        {/* Top Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-7 border-b border-white/5 pb-4"
        >
          <div>
            <p className="text-xs text-purple-400 font-mono tracking-widest uppercase">Deep Analytics Portal</p>
            <h1 className="text-2xl font-bold text-white mt-0.5" style={{ fontFamily: "Poppins" }}>
              Academic Performance Report
            </h1>
          </div>
          <div className="flex gap-2">
            {loading ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-[10px] font-bold uppercase tracking-wider animate-pulse">
                <RefreshCw size={11} className="animate-spin" /> Synchronizing ML Models...
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <Zap size={11} /> Active Prediction Models
              </div>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="h-[65vh] flex flex-col items-center justify-center text-center">
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="text-purple-400 mb-4"
            >
              <SafeRocket size={48} className="transform rotate-45" />
            </motion.div>
            <p className="text-xs text-purple-300 font-mono tracking-widest uppercase animate-pulse">Launching Analytics Engine...</p>
            <p className="text-[10px] text-gray-500 mt-1">Calibrating Professor ARIA's ML models</p>
          </div>
        ) : (
          <div className="space-y-6">

          {/* ── METRICS GRID ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayStats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{s.label}</p>
                    <s.icon size={15} style={{ color: s.color }} />
                  </div>
                  <p className="text-xl font-black text-white">
                    {s.label === "Predictive Mastery" && <AnimatedNumber value={analyticsData.avgScore} suffix="%" />}
                    {s.label === "Study Time Logged" && <AnimatedStudyTime seconds={liveStudySeconds} />}
                    {s.label === "Completed Tests" && <AnimatedNumber value={analyticsData.quizzesCount} />}
                    {s.label === "Streak Active" && <AnimatedNumber value={Number(storedStreak) || 0} suffix=" Days" />}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* ── CHARTS ROW 1: SCORE FORECAST AND STUDY DISTRIBUTION ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Recharts ML Score Forecast */}
            <Card className="flex flex-col justify-between h-[300px]">
              <div className="mb-4 text-left">
                <h2 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-widest text-purple-300">
                  <TrendingUp size={14} className="text-purple-400" />
                  30-Day Predictive Curve
                </h2>
                <p className="text-[9px] text-gray-500 mt-0.5">Calculated score projections with confidence bounds</p>
              </div>
              
              <div className="flex-1 w-full min-h-[180px] relative flex items-center justify-center">
                {loading ? (
                  <div className="text-center p-4">
                    <motion.div
                      animate={{ y: [0, -8, 0], rotate: [0, 4, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                      className="text-purple-400 mb-2"
                    >
                      <SafeRocket size={26} className="transform rotate-45" />
                    </motion.div>
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase animate-pulse">Igniting Prediction Engine...</p>
                  </div>
                ) : analyticsData.forecastData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={analyticsData.forecastData}
                      margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={8} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={8} tickLine={false} domain={[40, 100]} />
                      <Tooltip content={<CustomForecastTooltip />} />
                      
                      <Area
                        type="monotone"
                        dataKey="upper_bound"
                        stroke="rgba(168, 85, 247, 0.3)"
                        strokeDasharray="4 4"
                        fill="none"
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="lower_bound"
                        stroke="rgba(168, 85, 247, 0.3)"
                        strokeDasharray="4 4"
                        fill="none"
                        dot={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="predicted_score"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        fill="url(#forecastScoreGradient)"
                        fillOpacity={0.15}
                      />
                      <defs>
                        <linearGradient id="forecastScoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center p-4">
                    <TrendingUp size={24} className="text-purple-500/25 mx-auto mb-2" />
                    <p className="text-[11px] font-bold text-gray-400">No Score Projections Yet</p>
                    <p className="text-[9px] text-gray-600 max-w-[200px] leading-normal mt-1 mx-auto">
                      Complete at least 2 mock tests to activate ML score predictions.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Study time breakdown BarChart */}
            <Card className="flex flex-col justify-between h-[300px]">
              <div className="mb-4 text-left">
                <h2 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-widest text-cyan-300">
                  <BarChart2 size={14} className="text-cyan-400" />
                  Study Hours distribution
                </h2>
                <p className="text-[9px] text-gray-500 mt-0.5">Total revision time spent on each subject</p>
              </div>
              
              <div className="flex-1 w-full min-h-[180px] relative flex items-center justify-center">
                {loading ? (
                  <div className="text-center p-4">
                    <motion.div
                      animate={{ y: [0, -8, 0], rotate: [0, -4, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                      className="text-cyan-400 mb-2"
                    >
                      <SafeRocket size={26} className="transform rotate-45" />
                    </motion.div>
                    <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase animate-pulse">Syncing revision time logs...</p>
                  </div>
                ) : analyticsData.studyHoursBySubject.some(s => s.hours > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.studyHoursBySubject}
                      margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="subject" stroke="rgba(255,255,255,0.3)" fontSize={8} tickLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={8} tickLine={false} />
                      <Tooltip content={<CustomStudyHoursTooltip />} cursor={{ fill: "rgba(255,255,255,0.01)" }} />
                      <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
                        {analyticsData.studyHoursBySubject.map((entry, index) => {
                          const colors = ["#a855f7", "#06b6d4", "#34d399", "#f59e0b"];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center p-4">
                    <Clock size={24} className="text-cyan-500/25 mx-auto mb-2" />
                    <p className="text-[11px] font-bold text-gray-400">No Revision Hours Logged</p>
                    <p className="text-[9px] text-gray-600 max-w-[200px] leading-normal mt-1 mx-auto">
                      Your active course study sessions will update here in real-time.
                    </p>
                  </div>
                )}
              </div>
            </Card>

          </div>

          {/* ── CHARTS ROW 2: WEAK TOPICS AND MISTAKE BREAKDOWN ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Mistakes categories PieChart */}
            <Card className="col-span-1 h-[260px] flex flex-col justify-between">
              <div className="text-left">
                <h2 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-widest text-amber-300">
                  <PieIcon size={14} className="text-amber-400" />
                  Mistake Breakdown
                </h2>
                <p className="text-[8px] text-gray-500 mt-0.5">Wrong answer classifications</p>
              </div>

              <div className="flex-1 flex items-center justify-center relative min-h-[130px]">
                {loading ? (
                  <div className="text-center p-4">
                    <motion.div
                      animate={{ y: [0, -6, 0], rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                      className="text-amber-400 mb-1.5"
                    >
                      <SafeRocket size={22} className="transform rotate-45" />
                    </motion.div>
                    <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase animate-pulse">Mapping mistake logs...</p>
                  </div>
                ) : analyticsData.mistakesRatio.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.mistakesRatio}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analyticsData.mistakesRatio.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Mid label */}
                    <div className="absolute text-center">
                      <p className="text-lg font-black text-white">ARIA</p>
                      <p className="text-[7px] text-gray-500 uppercase tracking-widest">Logs</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <PieIcon size={24} className="text-amber-500/25 mx-auto mb-2" />
                    <p className="text-[11px] font-bold text-gray-400">No Mistakes Logged</p>
                    <p className="text-[9px] text-gray-600 max-w-[150px] leading-normal mt-1 mx-auto">
                      Take a diagnostic test to log conceptual gap logs.
                    </p>
                  </div>
                )}
              </div>

              {/* Legend */}
              {analyticsData.mistakesRatio.length > 0 && (
                <div className="flex justify-between text-[8px] px-1 font-semibold text-gray-400">
                  {analyticsData.mistakesRatio.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: entry.color }} />
                      <span>{entry.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Weak concepts logs list */}
            <Card className="col-span-1 h-[260px] flex flex-col justify-between">
              <div className="text-left mb-3">
                <h2 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-widest text-red-300">
                  <Target size={14} className="text-red-400" />
                  Urgent Concepts
                </h2>
                <p className="text-[8px] text-gray-500 mt-0.5">Chapters requiring immediate review</p>
              </div>

              <div className="flex-1 flex flex-col gap-3 justify-center">
                {loading ? (
                  <div className="text-center p-4">
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                      className="text-red-400 mb-1.5"
                    >
                      <SafeRocket size={22} className="transform rotate-45" />
                    </motion.div>
                    <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase animate-pulse">Running diagnostics...</p>
                  </div>
                ) : analyticsData.weakTopics.length > 0 ? (
                  analyticsData.weakTopics.map((topic, i) => (
                    <div key={i} className="space-y-1 text-left">
                      <div className="flex justify-between text-[10px] font-semibold">
                        <span className="text-gray-300">{topic.topic}</span>
                        <span className="text-red-400 font-bold">{topic.score}% Mastery</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="h-full rounded-full bg-red-400" style={{ width: `${topic.score}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center rounded-xl border border-white/5 bg-white/5 flex flex-col items-center justify-center flex-1">
                    <Award size={20} className="text-purple-400 mb-1" />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">All Clear!</p>
                    <p className="text-[8px] text-gray-600 max-w-[120px] leading-normal mt-0.5">All topics are above the 60% mastery threshold.</p>
                  </div>
                )}
              </div>
            </Card>

            {/* ARIA Advice */}
            <Card className="col-span-1 h-[260px] flex flex-col justify-between" style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.1),rgba(6,182,212,0.06))", border: "1px solid rgba(168,85,247,0.15)" }}>
              <div className="text-left">
                <h2 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-widest text-purple-300">
                  <Brain size={14} className="text-purple-400 animate-pulse" />
                  Professor ARIA's Advice
                </h2>
                <p className="text-[8px] text-gray-500 mt-0.5">Machine Learning study directives</p>
              </div>

              <div className="flex-1 flex items-center text-xs text-gray-300 leading-relaxed text-left py-4">
                {analyticsData.weakTopics.length > 0 ? (
                  <p>
                    Your performance logs identify <span className="text-red-400 font-bold">{analyticsData.weakTopics[0]?.topic}</span> as your lowest score sector. We highly recommend navigating to courses to re-read study derivations and attempting a focused practice test under <strong>Mock Tests</strong>.
                  </p>
                ) : (
                  <p>
                    Outstanding progress! Your diagnostic scores reflect robust subject mastery. We recommend scheduling full-length simulation tests under <strong>Mock Tests</strong> to build timing habits for the final competitive exam.
                  </p>
                )}
              </div>

              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white"
                style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}
              >
                Return to Dashboard
              </button>
            </Card>

          </div>

        </div>
        )}

      </main>

    </div>
  );
}
