// History.jsx — Dedicated student assessment history page
// Shows: scrollable glassmorphic list of all past attempts and AI-driven diagnostic logs
// Cohesive dark mode theme with side navigation menu

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Target, Clock, TrendingUp,
  Bell, Settings, LogOut, ChevronRight,
  Award, Star, ArrowLeft, Menu
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import api from "../services/api";

const NAV = [
  { icon: "🏠", label: "Dashboard" },
  { icon: "📚", label: "Courses" },
  { icon: "📅", label: "Planner" },
  { icon: "⚗️", label: "Physics Lab" },
  { icon: "🧪", label: "Chem Lab" },
  { icon: "📝", label: "Mock Tests" },
  { icon: "🤖", label: "Ask ARIA" },
  { icon: "📊", label: "Analytics" },
  { icon: "⏳", label: "History", active: true },
];

function Card({ children, className = "", style = {} }) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

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

export default function History() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem("edumind_user") || '{"name":"Student"}'));
  const survey = JSON.parse(localStorage.getItem("edumind_survey") || "{}");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        let activeUserId = null;

        // Check Google session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          activeUserId = session.user.id;
        }

        // Check credentials token
        if (!activeUserId) {
          const token = localStorage.getItem("edumind_token");
          if (token) {
            const decodedId = getUserIdFromToken(token);
            if (decodedId) activeUserId = decodedId;
          }
        }

        if (!activeUserId) {
          activeUserId = currentUser.id;
        }

        if (!activeUserId) {
          setLoading(false);
          return;
        }

        let results = [];
        try {
          const res = await api.get(`/students/performance/${activeUserId}`);
          results = res.data || [];
        } catch (err) {
          console.warn("Backend failed to load history, querying Supabase directly:", err);
          const res = await supabase.from("quiz_results").select("*").eq("student_id", activeUserId).order("attempted_at", { ascending: false });
          results = res.data || [];
        }

        // Sort descending by date (most recent first)
        results = results.sort((a, b) => new Date(b.attempted_at) - new Date(a.attempted_at));
        setQuizResults(results);
      } catch (err) {
        console.error("Failed to load historical assessments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser.id]);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("edumind_token");
    localStorage.removeItem("edumind_user");
    localStorage.removeItem("edumind_survey");
    localStorage.removeItem("edumind_new_user");
    navigate("/");
  };

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: "#030014" }}>
      
      {/* Mobile Sidebar Toggle Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <AnimatePresence>
        {(!isMobile || isSidebarOpen) && (
          <motion.aside
            key="sidebar"
            initial={isMobile ? { x: -260, opacity: 0 } : { x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={isMobile ? { x: -260, opacity: 0 } : { opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`w-64 flex-shrink-0 flex flex-col p-5 border-r ${
              isMobile ? "fixed inset-y-0 left-0 z-50 h-full shadow-2xl shadow-purple-500/20 bg-[#0a0519]/98" : ""
            }`}
            style={{ borderColor: "rgba(255,255,255,0.06)", background: isMobile ? undefined : "rgba(255,255,255,0.02)" }}
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
                    setIsSidebarOpen(false);
                    if (item.label === "Dashboard") navigate("/dashboard");
                    if (item.label === "Ask ARIA") navigate("/ask-aria");
                    if (item.label === "Mock Tests") navigate("/mock-tests");
                    if (item.label === "Courses") navigate("/courses");
                    if (item.label === "Planner") navigate("/planner");
                    if (item.label === "Physics Lab") navigate("/physics-lab");
                    if (item.label === "Chem Lab") navigate("/chem-lab");
                    if (item.label === "Analytics") navigate("/analytics");
                    if (item.label === "History") navigate("/history");
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
                    {survey.goal ? survey.goal.toUpperCase() : "JEE ASPIRANT"}
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
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto p-6 text-left relative">
        {/* Mobile menu trigger */}
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0519]/40 backdrop-blur-md sticky top-0 z-30 -mx-6 -mt-6 mb-6">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center"
              >
                <Menu size={16} />
              </button>
              <span className="text-sm font-black bg-gradient-to-r from-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent" style={{ fontFamily: "Poppins" }}>
                EduMind
              </span>
            </div>
          </div>
        )}
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-7"
        >
          <div>
            <button 
              onClick={() => {
                if (window.history.length > 2) {
                  navigate(-1);
                } else {
                  navigate("/dashboard");
                }
              }}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-all mb-1 font-semibold"
            >
              <ArrowLeft size={13} /> Back
            </button>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2" style={{ fontFamily: "Poppins" }}>
              <span>📜</span> Assessment History & ARIA Diagnostics
            </h1>
            <p className="text-xs text-gray-500 mt-1">Review your comprehensive evaluation history, accuracy, and AI cognitive feedback reports.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono tracking-wider">
              {quizResults.length} Total Assessment{quizResults.length !== 1 ? "s" : ""}
            </span>
          </div>
        </motion.div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-10 h-10 rounded-full border-4 border-t-purple-500 border-r-transparent animate-spin mb-4" />
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loading assessment history log...</p>
          </div>
        ) : quizResults.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-4 px-5">Date & Time</th>
                      <th className="py-4 px-5">Subject & Topic</th>
                      <th className="py-4 px-5">Accuracy</th>
                      <th className="py-4 px-5">Correct / Total</th>
                      <th className="py-4 px-5">ARIA Cognitive Diagnostics</th>
                      <th className="py-4 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizResults.map((q, idx) => {
                      let attemptedAtStr = q.attempted_at;
                      if (attemptedAtStr && !attemptedAtStr.endsWith("Z") && !attemptedAtStr.includes("+") && !attemptedAtStr.includes("GMT")) {
                        attemptedAtStr = attemptedAtStr + "Z";
                      }
                      const date = new Date(attemptedAtStr);
                      const formattedDate = date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      });

                      // Diagnostic evaluation based on score
                      let scoreColor = "text-red-400 bg-red-500/10 border-red-500/20";
                      let diagnosticNote = "Critical Review Required. Significant conceptual gaps identified. Pause testing and re-visit primary textbook derivations.";
                      
                      if (q.score >= 80) {
                        scoreColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                        diagnosticNote = "Conceptual Mastery. Flawless logical transitions. Ready to proceed with high-difficulty mock papers.";
                      } else if (q.score >= 50) {
                        scoreColor = "text-orange-400 bg-orange-500/10 border-orange-500/20";
                        diagnosticNote = "Foundations Established. Minor computational or sign-convention slip-ups. Practice similar modules.";
                      }

                      return (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/1 transition-all text-gray-300 font-medium">
                          <td className="py-4 px-5 font-mono text-gray-400">{formattedDate}</td>
                          <td className="py-4 px-5">
                            <span className="font-bold text-white block mb-0.5">{q.subject}</span>
                            <span className="text-[10px] text-gray-500">({q.topic || "Practice Test"})</span>
                          </td>
                          <td className="py-4 px-5">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded border uppercase font-mono ${scoreColor}`}>
                              {q.score}%
                            </span>
                          </td>
                          <td className="py-4 px-5 font-mono text-[11px] text-gray-400">
                            {q.correct_answers} / {q.total_questions} correct
                          </td>
                          <td className="py-4 px-5 text-gray-400 max-w-sm leading-normal">
                            {diagnosticNote}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={() => navigate(`/mock-tests?retestSubject=${encodeURIComponent(q.subject)}&retestTopic=${encodeURIComponent(q.topic || "")}`)}
                              className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-purple-400 hover:text-white hover:bg-purple-600/20 hover:border-purple-500/30 transition-all font-mono"
                            >
                              Retest Topic
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center p-8 py-32 rounded-3xl border border-white/5 bg-white/1 max-w-xl mx-auto"
          >
            <BookOpen size={48} className="text-purple-500/20 mb-4 animate-bounce" />
            <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "Poppins" }}>No Evaluation Records</h2>
            <p className="text-xs text-gray-500 leading-normal max-w-xs mb-6">
              Complete your first personalized diagnostic mock test or practice quiz to activate ARIA's diagnostics logs.
            </p>
            <button
              onClick={() => navigate("/mock-tests")}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl text-xs font-bold text-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            >
              Start Diagnostic Quiz
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
