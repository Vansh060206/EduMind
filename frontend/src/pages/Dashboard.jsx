// Dashboard.jsx — Main student dashboard
// Shows: personalized greeting, stats, ML suggestion, course cards, progress
// Clean dark glassmorphism with purple-cyan theme

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Zap, Target, Clock, TrendingUp,
  Brain, Bell, Settings, LogOut, ChevronRight,
  Flame, Star, Award
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import api from "../services/api";
import { CURRICULUM } from "../utils/curriculum";
import { fetchStudentMlMetrics, buildForecastHistory } from "../utils/studentMetrics";
import {
  ensureDailyReset,
  getDailyPeriodKey,
  getPreviousDailyPeriodKey,
  getDailySeconds,
  getDailyXp,
  getDailyCounter,
  countSinceDailyPeriodStart,
  awardTargetXpOnce,
  scheduleDailyResetCheck,
} from "../utils/dailyReset";

// ── SIDEBAR NAV ──────────────────────────────
const NAV = [
  { icon: "🏠", label: "Dashboard", active: true },
  { icon: "📚", label: "Courses" },
  { icon: "📅", label: "Planner" },
  { icon: "⚗️", label: "Physics Lab" },
  { icon: "🧪", label: "Chem Lab" },
  { icon: "📝", label: "Mock Tests" },
  { icon: "🤖", label: "Ask ARIA" },
  { icon: "📊", label: "Analytics" },
  { icon: "⏳", label: "History" },
];

// ── CARD WRAPPER ─────────────────────────────
function Card({ children, className = "", style = {} }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
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

// ── MAIN DASHBOARD ───────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem("edumind_user") || '{"name":"Student"}'));
  const survey = JSON.parse(localStorage.getItem("edumind_survey") || "{}");
  const [greeting, setGreeting] = useState("Good Morning");

  const getGoalLabel = (goal) => {
    switch (goal) {
      case "jee": return "JEE Aspirant";
      case "neet": return "NEET UG Aspirant";
      case "boards": return "Board Exam Aspirant";
      default: return "Science Student";
    }
  };

  const getClassLabel = (cls) => {
    switch (cls) {
      case "11": return "Class 11";
      case "12": return "Class 12";
      case "dropper": return "Dropper Batch";
      default: return "";
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

  const [mlData, setMlData] = useState({
    risk: null,
    forecast: [],
    loading: true
  });





  const [dashboardData, setDashboardData] = useState({
    coursesCount: 0,
    quizzesCount: 0,
    avgScore: 0,
    studyHours: 0,
    enrolledCourses: [],
    weakTopics: [],
    quizResults: [],
    loading: true
  });

  const isNewUser = localStorage.getItem("edumind_new_user") === "true";

  const [liveStudySeconds, setLiveStudySeconds] = useState(0);
  const [dailyXp, setDailyXp] = useState(0);
  const [doubtsToday, setDoubtsToday] = useState(0);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakAnimationPlayed, setStreakAnimationPlayed] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const loadDashboardData = async () => {
    try {
      let activeUserId = null;

        // 1. Check active Supabase Google OAuth session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          activeUserId = session.user.id;
          const recovered = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "Student",
            role: session.user.user_metadata?.role || "student"
          };
          // Only update if it has changed to prevent infinite loops
          if (currentUser.id !== recovered.id) {
            localStorage.setItem("edumind_user", JSON.stringify(recovered));
            setCurrentUser(recovered);
          }
        }

        // 2. Check credentials token
        if (!activeUserId) {
          const token = localStorage.getItem("edumind_token");
          if (token) {
            const decodedId = getUserIdFromToken(token);
            if (decodedId) {
              activeUserId = decodedId;
              api.get(`/auth/me?token=${token}`).then(res => {
                if (res.data) {
                  const recovered = {
                    id: res.data.id,
                    name: res.data.name,
                    email: res.data.email,
                    role: res.data.role
                  };
                  if (currentUser.id !== recovered.id) {
                    localStorage.setItem("edumind_user", JSON.stringify(recovered));
                    setCurrentUser(recovered);
                  }
                }
              }).catch((err) => {
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                  console.warn("[EduMind] Stale or invalid credentials token. Clearing session and logging out.");
                  supabase.auth.signOut();
                  localStorage.removeItem("edumind_token");
                  localStorage.removeItem("edumind_user");
                  localStorage.removeItem("edumind_survey");
                  localStorage.removeItem("edumind_new_user");
                  navigate("/");
                } else {
                  const recovered = {
                    id: decodedId,
                    name: currentUser.name || "Student",
                    email: currentUser.email || "",
                    role: currentUser.role || "student"
                  };
                  if (currentUser.id !== recovered.id) {
                    localStorage.setItem("edumind_user", JSON.stringify(recovered));
                    setCurrentUser(recovered);
                  }
                }
              });
            }
          }
        }

        // 3. Final fallback to cached state
        if (!activeUserId) {
          activeUserId = currentUser.id;
        }

        if (!activeUserId) {
          console.warn("[EduMind Diagnostics] Dashboard activeUserId is missing, returning early.");
          return;
        }
        console.log("[EduMind Diagnostics] Dashboard activeUserId:", activeUserId);

        // 1. Fetch enrollments via backend API (resilient)
        let enrolledCourses = [];
        try {
          const enrollRes = await api.get(`/courses/my-courses/${activeUserId}`);
          enrolledCourses = enrollRes.data || [];
        } catch (err) {
          console.warn("Backend failed to load dashboard enrollments, falling back directly to Supabase:", err);
          const enrollmentsRes = await supabase.from("enrollments").select("*, courses(*)").eq("student_id", activeUserId);
          enrolledCourses = enrollmentsRes.data || [];
        }
        console.log("[EduMind Diagnostics] Dashboard enrolledCourses:", enrolledCourses);

        // 2. Fetch quiz results via backend API (resilient)
        let quizResults = [];
        try {
          const quizRes = await api.get(`/students/performance/${activeUserId}`);
          quizResults = quizRes.data || [];
          // Sort ascending for chart utility
          quizResults = [...quizResults].reverse();
        } catch (err) {
          console.warn("Backend failed to load quiz results, falling back directly to Supabase:", err);
          const quizRes = await supabase.from("quiz_results").select("*").eq("student_id", activeUserId).order("attempted_at", { ascending: true });
          quizResults = quizRes.data || [];
        }

        // 3. Fetch study sessions via backend API (resilient)
        let studySessions = [];
        try {
          const studyRes = await api.get(`/students/study-sessions/${activeUserId}`);
          studySessions = studyRes.data || [];
        } catch (err) {
          console.warn("Backend failed to load study sessions, falling back directly to Supabase:", err);
          const studyRes = await supabase.from("study_sessions").select("*").eq("student_id", activeUserId);
          studySessions = studyRes.data || [];
        }

        ensureDailyReset(activeUserId);

        // 4. Fetch doubts via backend API (resilient)
        let doubtsHistory = [];
        try {
          const doubtsRes = await api.get(`/doubts/history/${activeUserId}`);
          doubtsHistory = doubtsRes.data || [];
        } catch (err) {
          console.warn("Backend failed to load doubts count, falling back directly to Supabase:", err);
          const doubtsRes = await supabase.from("doubts").select("*").eq("student_id", activeUserId);
          doubtsHistory = doubtsRes.data || [];
        }
        const doubtsTodayCount = countSinceDailyPeriodStart(doubtsHistory, "created_at");
        setDoubtsToday(doubtsTodayCount);

        // Seed initial completed lessons locally for realistic starting dashboard state
        const completedKey = `edumind_completed_lessons_${activeUserId}`;
        if (!localStorage.getItem(completedKey)) {
          const initialCompleted = [
            "rotational_motion_1_1", "rotational_motion_1_2", "rotational_motion_2_1", "rotational_motion_2_2",
            "organic_chemistry_1_1", "organic_chemistry_1_2", "organic_chemistry_2_1",
            "integral_calculus_1_1", "integral_calculus_1_2", "integral_calculus_1_3", "integral_calculus_2_1", "integral_calculus_2_2", "integral_calculus_3_1",
            "electrostatics_1_1"
          ];
          localStorage.setItem(completedKey, JSON.stringify(initialCompleted));
        }
        const savedCompleted = JSON.parse(localStorage.getItem(completedKey) || "[]");

        // Auto-seed the database if this is a returning user with empty course progress
        if (!isNewUser && enrolledCourses.length === 0 && quizResults.length === 0 && studySessions.length === 0) {
          const coursesRes = await supabase.from("courses").select("*");
          if (coursesRes.data && coursesRes.data.length > 0) {
            const courseMap = {};
            coursesRes.data.forEach(c => {
              courseMap[c.title] = c.id;
            });

            // Enroll user in all seeded courses
            const enrollmentsToInsert = coursesRes.data.map(c => ({
              student_id: activeUserId,
              course_id: c.id
            }));
            await supabase.from("enrollments").insert(enrollmentsToInsert);

            // Seed 12 Quiz Results
            const quizSeeds = [
              { student_id: activeUserId, course_id: courseMap["Rotational Motion"], subject: "Physics", topic: "Rotational Kinematics", score: 85, total_questions: 10, correct_answers: 8, time_taken_seconds: 600, attempted_at: "2026-05-15T10:00:00Z" },
              { student_id: activeUserId, course_id: courseMap["Rotational Motion"], subject: "Physics", topic: "Torque & Equilibrium", score: 70, total_questions: 10, correct_answers: 7, time_taken_seconds: 720, attempted_at: "2026-05-18T11:00:00Z" },
              { student_id: activeUserId, course_id: courseMap["Rotational Motion"], subject: "Physics", topic: "Angular Momentum", score: 34, total_questions: 10, correct_answers: 3, time_taken_seconds: 900, attempted_at: "2026-05-20T14:30:00Z" },
              { student_id: activeUserId, course_id: courseMap["Organic Chemistry"], subject: "Chemistry", topic: "IUPAC Nomenclature", score: 90, total_questions: 10, correct_answers: 9, time_taken_seconds: 450, attempted_at: "2026-05-16T09:00:00Z" },
              { student_id: activeUserId, course_id: courseMap["Organic Chemistry"], subject: "Chemistry", topic: "Isomerism", score: 80, total_questions: 10, correct_answers: 8, time_taken_seconds: 550, attempted_at: "2026-05-19T10:15:00Z" },
              { student_id: activeUserId, course_id: courseMap["Organic Chemistry"], subject: "Chemistry", topic: "Organic Reactions", score: 41, total_questions: 10, correct_answers: 4, time_taken_seconds: 800, attempted_at: "2026-05-22T16:00:00Z" },
              { student_id: activeUserId, course_id: courseMap["Integral Calculus"], subject: "Maths", topic: "Indefinite Integrals", score: 95, total_questions: 10, correct_answers: 9, time_taken_seconds: 500, attempted_at: "2026-05-17T15:00:00Z" },
              { student_id: activeUserId, course_id: courseMap["Integral Calculus"], subject: "Maths", topic: "Definite Integrals", score: 80, total_questions: 10, correct_answers: 8, time_taken_seconds: 600, attempted_at: "2026-05-21T11:00:00Z" },
              { student_id: activeUserId, course_id: courseMap["Integral Calculus"], subject: "Maths", topic: "Limits & Continuity", score: 58, total_questions: 10, correct_answers: 5, time_taken_seconds: 700, attempted_at: "2026-05-24T12:00:00Z" },
              { student_id: activeUserId, course_id: courseMap["Electrostatics"], subject: "Physics", topic: "Coulomb's Law", score: 85, total_questions: 10, correct_answers: 8, time_taken_seconds: 400, attempted_at: "2026-05-23T14:00:00Z" },
              { student_id: activeUserId, course_id: courseMap["Electrostatics"], subject: "Physics", topic: "Electric Fields", score: 75, total_questions: 10, correct_answers: 7, time_taken_seconds: 500, attempted_at: "2026-05-26T15:30:00Z" },
              { student_id: activeUserId, course_id: courseMap["Electrostatics"], subject: "Physics", topic: "Capacitance", score: 60, total_questions: 10, correct_answers: 6, time_taken_seconds: 650, attempted_at: "2026-05-28T10:00:00Z" },
            ];
            await supabase.from("quiz_results").insert(quizSeeds);

            // Seed Study Sessions
            const studySeeds = [
              { student_id: activeUserId, course_id: courseMap["Rotational Motion"], duration_minutes: 240, topic: "Rotational Kinematics", date: "2026-05-15" },
              { student_id: activeUserId, course_id: courseMap["Organic Chemistry"], duration_minutes: 180, topic: "IUPAC Nomenclature", date: "2026-05-16" },
              { student_id: activeUserId, course_id: courseMap["Integral Calculus"], duration_minutes: 200, topic: "Indefinite Integrals", date: "2026-05-17" },
              { student_id: activeUserId, course_id: courseMap["Rotational Motion"], duration_minutes: 180, topic: "Torque & Equilibrium", date: "2026-05-18" },
              { student_id: activeUserId, course_id: courseMap["Organic Chemistry"], duration_minutes: 150, topic: "Isomerism", date: "2026-05-19" },
              { student_id: activeUserId, course_id: courseMap["Rotational Motion"], duration_minutes: 120, topic: "Angular Momentum", date: "2026-05-20" },
              { student_id: activeUserId, course_id: courseMap["Integral Calculus"], duration_minutes: 160, topic: "Definite Integrals", date: "2026-05-21" },
              { student_id: activeUserId, course_id: courseMap["Organic Chemistry"], duration_minutes: 140, topic: "Organic Reactions", date: "2026-05-22" },
              { student_id: activeUserId, course_id: courseMap["Electrostatics"], duration_minutes: 150, topic: "Coulomb's Law", date: "2026-05-23" },
              { student_id: activeUserId, course_id: courseMap["Integral Calculus"], duration_minutes: 160, topic: "Limits & Continuity", date: "2026-05-24" },
            ];
            await supabase.from("study_sessions").insert(studySeeds);

            // Re-fetch all seeded tables from backend API
            const enrollRes = await api.get(`/courses/my-courses/${activeUserId}`);
            const quizRes = await api.get(`/students/performance/${activeUserId}`);
            const studyRes = await api.get(`/students/study-sessions/${activeUserId}`);

            enrolledCourses = enrollRes.data || [];
            quizResults = quizRes.data || [];
            studySessions = studyRes.data || [];
            // Sort ascending for chart utility
            quizResults = [...quizResults].reverse();
          }
        }

        const coursesCount = enrolledCourses.length;
        const quizzesCount = quizResults.length;

        const totalScore = quizResults.reduce((acc, curr) => acc + curr.score, 0);
        const avgScore = quizzesCount > 0 ? Math.round(totalScore / quizzesCount) : 0;

        const totalMinutes = studySessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);
        const studyHours = Math.round((totalMinutes / 60) * 10) / 10;

        // Group quiz results by topic/subject to find weak topics (average score < 60%)
        const topicScores = {};
        quizResults.forEach(q => {
          if (!topicScores[q.topic]) {
            topicScores[q.topic] = { topic: q.topic, subject: q.subject, total: 0, count: 0 };
          }
          topicScores[q.topic].total += q.score;
          topicScores[q.topic].count += 1;
        });

        const weakTopics = Object.values(topicScores)
          .map(t => ({
            topic: t.topic,
            subject: t.subject,
            score: Math.round(t.total / t.count),
            priority: Math.round(t.total / t.count) < 45 ? "High" : "Medium"
          }))
          .filter(t => t.score < 60)
          .sort((a, b) => a.score - b.score)
          .slice(0, 3);

        const mappedCourses = enrolledCourses.map(e => {
          const course = e.courses || {};
          const courseConfig = CURRICULUM[course.id];
          
          let progress = 0;
          let nextLesson = "Module Review & Exercises";
          
          if (courseConfig) {
            let totalLessons = 0;
            let completedCount = 0;
            let firstUncompleted = null;
            
            courseConfig.modules.forEach(m => {
              m.lessons.forEach(l => {
                totalLessons++;
                if (savedCompleted.includes(l.id)) {
                  completedCount++;
                } else if (!firstUncompleted) {
                  firstUncompleted = l.title;
                }
              });
            });
            
            if (totalLessons > 0) {
              progress = Math.round((completedCount / totalLessons) * 100);
            }
            if (firstUncompleted) {
              nextLesson = firstUncompleted;
            } else {
              nextLesson = "Course Completed! 🎉";
            }
          }

          const courseQuizzes = quizResults.filter(q => q.course_id === e.course_id).length;
          let streak = courseQuizzes > 0 ? Math.min(7, courseQuizzes) : 0;

          return {
            id: course.id,
            subject: course.subject,
            title: course.title,
            progress: progress,
            nextLesson: nextLesson,
            streak: streak,
            color: course.subject?.toLowerCase() === "physics" ? "#a855f7" :
                   course.subject?.toLowerCase() === "chemistry" ? "#06b6d4" :
                   course.subject?.toLowerCase() === "maths" || course.subject?.toLowerCase() === "mathematics" ? "#34d399" : "#f59e0b",
            icon: course.subject?.toLowerCase() === "physics" ? "⚡" :
                  course.subject?.toLowerCase() === "chemistry" ? "🧪" :
                  course.subject?.toLowerCase() === "maths" || course.subject?.toLowerCase() === "mathematics" ? "∫" : "🧬"
          };
        });

        setDashboardData({
          coursesCount,
          quizzesCount,
          avgScore,
          studyHours,
          enrolledCourses: mappedCourses,
          weakTopics,
          quizResults: quizResults,
          loading: false
        });

        setDailyXp(getDailyXp(activeUserId));

        // Run ML predictions with live student metrics
        try {
          const metrics = isNewUser
            ? { avg_score: 0, study_hours: 0, doubts_asked: 0, quizzes_done: 0, streak: 1 }
            : await fetchStudentMlMetrics(activeUserId);

          const scoresHistory = buildForecastHistory(quizResults);
          const forecastPromise = scoresHistory.length >= 2
            ? api.post("/ml/forecast-score", { scores_history: scoresHistory })
            : Promise.resolve({ data: [] });

          const [riskRes, forecastRes] = await Promise.all([
            api.post("/ml/predict-risk", metrics),
            forecastPromise,
          ]);

          setMlData({
            risk: riskRes.data,
            forecast: forecastRes.data || [],
            loading: false,
          });
        } catch (mlErr) {
          console.error("Failed to load ML predictions:", mlErr);
          const fallbackScore = quizzesCount > 0 ? avgScore : 0;
          setMlData({
            risk: {
              status: fallbackScore < 50 ? "At-Risk" : fallbackScore >= 80 ? "Advanced" : "On-Track",
              risk_probability: fallbackScore < 50 ? 0.55 : 0.2,
              feature_importances: { avg_score: 0.5, study_hours: 0.3, doubts_asked: 0.15, streak: 0.05 },
              recommendations: weakTopics.length > 0
                ? [
                    `Focus on ${weakTopics[0].topic} — your lowest scoring topic at ${weakTopics[0].score}%.`,
                    "Complete today's targets and take an adaptive quiz to refresh your diagnostics.",
                  ]
                : [
                    "Complete today's study targets to build your daily streak.",
                    "Take an adaptive quiz to keep your performance metrics current.",
                  ],
            },
            forecast: [],
            loading: false,
          });
        }

    } catch (err) {
      console.error("Failed to load real dashboard metrics:", err);
      setDashboardData(prev => ({ ...prev, loading: false }));
      setMlData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser.id, isNewUser]);

  useEffect(() => {
    const handleRefresh = () => loadDashboardData();
    window.addEventListener("edumind_db_sync", handleRefresh);
    return () => {
      window.removeEventListener("edumind_db_sync", handleRefresh);
    };
  }, [currentUser.id]);

  useEffect(() => {
    const userId = currentUser.id;
    if (!userId) return;

    const refreshLiveState = () => {
      ensureDailyReset(userId);
      setLiveStudySeconds(getDailySeconds(userId));
      setDailyXp(getDailyXp(userId));
    };

    const handleDailyReset = () => {
      refreshLiveState();
      setStreakAnimationPlayed(false);
      loadDashboardData();
    };

    refreshLiveState();

    window.addEventListener("edumind_study_tick", refreshLiveState);
    window.addEventListener("edumind_db_sync", refreshLiveState);
    window.addEventListener("edumind_xp_update", refreshLiveState);
    window.addEventListener("edumind_daily_reset", handleDailyReset);

    const stopResetCheck = scheduleDailyResetCheck(userId, handleDailyReset);

    return () => {
      window.removeEventListener("edumind_study_tick", refreshLiveState);
      window.removeEventListener("edumind_db_sync", refreshLiveState);
      window.removeEventListener("edumind_xp_update", refreshLiveState);
      window.removeEventListener("edumind_daily_reset", handleDailyReset);
      stopResetCheck();
    };
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
    const s = totalSecs % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const displayStats = [
    { label: "Courses Enrolled", value: String(dashboardData.coursesCount), icon: BookOpen, color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
    { label: "Quizzes Done", value: String(dashboardData.quizzesCount), icon: Target, color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
    { label: "Avg Score", value: `${dashboardData.avgScore}%`, icon: TrendingUp, color: "#34d399", bg: "rgba(52,211,153,0.1)" },
    { label: "Today's Study", value: formatLiveTime(liveStudySeconds), icon: Clock, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  ];

  const userId = currentUser.id || "default";
  ensureDailyReset(userId);

  const displayCourses = dashboardData.enrolledCourses;
  
  const displayWeakTopics = dashboardData.weakTopics;

  const targetHours = parseFloat(String(survey.hours || "3").split("-")[0]) || 3;
  const quizzesToday = Math.max(
    getDailyCounter(userId, "quizzes"),
    countSinceDailyPeriodStart(dashboardData.quizResults)
  );
  const lessonsToday = getDailyCounter(userId, "lessons");

  const displayDailyTarget = [
    { id: "study_hours", task: `Self-Study for ${targetHours}+ Hours`, done: liveStudySeconds / 3600 >= targetHours, xp: 30 },
    { id: "quiz_today", task: "Complete 1 adaptive quiz", done: quizzesToday > 0, xp: 40 },
    { id: "lesson_today", task: "Finish 1 lesson module", done: lessonsToday > 0, xp: 25 },
    { id: "doubt_today", task: "Ask ARIA 1 doubt", done: doubtsToday > 0, xp: 20 },
  ];

  // Calculate completed targets XP
  const earnedXP = displayDailyTarget
    .filter(t => t.done)
    .reduce((acc, t) => acc + t.xp, 0);

  const totalXP = displayDailyTarget.reduce((acc, t) => acc + t.xp, 0);
  const xpPercentage = totalXP > 0 ? Math.round((earnedXP / totalXP) * 100) : 0;

  const periodKey = getDailyPeriodKey();
  const previousPeriodKey = getPreviousDailyPeriodKey();

  const lastCompletedDate = localStorage.getItem(`edumind_streak_last_completed_date_${userId}`);
  const storedStreak = localStorage.getItem(`edumind_streak_count_${userId}`);

  let baseStreak = storedStreak !== null ? Number(storedStreak) : 0;

  if (lastCompletedDate && lastCompletedDate !== periodKey && lastCompletedDate !== previousPeriodKey) {
    baseStreak = 0;
    localStorage.setItem(`edumind_streak_count_${userId}`, "0");
  }

  const allTargetsDone = displayDailyTarget.every(t => t.done);
  const isCompletedToday = lastCompletedDate === periodKey;

  const activeStreakCount = isCompletedToday
    ? baseStreak
    : (allTargetsDone ? baseStreak + 1 : baseStreak);

  const displayStreak = `${activeStreakCount} Day Streak`;

  useEffect(() => {
    if (dashboardData.loading || !userId) return;

    displayDailyTarget.forEach((target) => {
      if (target.done) {
        awardTargetXpOnce(userId, target.id, target.xp);
      }
    });
  }, [dashboardData.loading, userId, liveStudySeconds, quizzesToday, lessonsToday, doubtsToday, targetHours]);

  useEffect(() => {
    if (dashboardData.loading) return;

    if (allTargetsDone && lastCompletedDate !== periodKey && !streakAnimationPlayed) {
      setShowStreakModal(true);
      setStreakAnimationPlayed(true);

      const newStreak = baseStreak + 1;
      localStorage.setItem(`edumind_streak_count_${userId}`, String(newStreak));
      localStorage.setItem(`edumind_streak_last_completed_date_${userId}`, periodKey);
    }
  }, [allTargetsDone, dashboardData.loading, userId, baseStreak, lastCompletedDate, periodKey, streakAnimationPlayed]);

  const displayXP = String(dailyXp);

  const displayAchievements = [
    { icon: "🌱", label: "Fresh Recruit", earned: true },
    { icon: "🏆", label: "Top Scorer", earned: dashboardData.avgScore >= 80 },
    { icon: "🔥", label: "Streak Active", earned: activeStreakCount > 0 },
    { icon: "⚡", label: "Physics Pro", earned: dashboardData.enrolledCourses.some(c => c.subject?.toLowerCase() === "physics" && c.progress > 0) },
    { icon: "🧪", label: "Chem Expert", earned: dashboardData.enrolledCourses.some(c => c.subject?.toLowerCase() === "chemistry" && c.progress > 0) },
    { icon: "∑", label: "Math Wizard", earned: dashboardData.enrolledCourses.some(c => (c.subject?.toLowerCase() === "maths" || c.subject?.toLowerCase() === "mathematics") && c.progress > 0) },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#030014" }}>

      {/* ── SIDEBAR ── */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-64 flex-shrink-0 flex flex-col p-5 border-r"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
      >
        {/* Logo */}
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

        {/* Nav items */}
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

        {/* User card at bottom */}
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

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto p-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-7"
        >
          <div>
            <p className="text-sm text-gray-500 mb-1">{greeting} 👋</p>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Poppins" }}>
                {currentUser.name || "Student"}'s Dashboard
              </h1>
              {survey.class && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-purple-500/10 border-purple-500/30 text-purple-300">
                  {getClassLabel(survey.class)}
                </span>
              )}
              {survey.goal && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-cyan-500/10 border-cyan-500/30 text-cyan-300">
                  {survey.goal.toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Streak badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <Flame size={16} className="text-amber-400" />
              <span className="text-amber-400 font-bold text-sm">{displayStreak}</span>
            </div>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Bell size={16} className="text-gray-400" />
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Settings size={16} className="text-gray-400" />
            </button>
          </div>
        </motion.div>
 
        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {displayStats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: s.bg }}>
                    <s.icon size={18} style={{ color: s.color }} />
                  </div>
                  <TrendingUp size={13} className="text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white mb-0.5">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ── MIDDLE ROW ── */}
        <div className="grid grid-cols-2 gap-4 mb-6">

          {/* ML ARIA suggestion */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-1"
          >
            <Card style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,182,212,0.06))", border: "1px solid rgba(168,85,247,0.2)", height: "100%", display: "flex", flexDirection: "column" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base animate-pulse"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>🤖</div>
                  <div>
                    <p className="text-xs font-bold text-purple-300">ARIA says</p>
                    <p className="text-[10px] text-gray-500">AI Recommendation</p>
                  </div>
                </div>
                {mlData.risk && !mlData.loading && (
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    mlData.risk.status === "At-Risk" ? "bg-red-500/10 border border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]" :
                    mlData.risk.status === "Advanced" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]" :
                    "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                  }`}>
                    {mlData.risk.status}
                  </span>
                )}
              </div>

              {mlData.loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10">
                  <div className="w-6 h-6 rounded-full border-2 border-t-purple-500 border-r-transparent animate-spin mb-2" />
                  <p className="text-[10px] text-gray-500 font-semibold">ARIA is analyzing your stats...</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="mb-3">
                    {isNewUser ? (
                      <div className="space-y-3 text-left">
                        <p className="text-xs text-gray-200 leading-relaxed font-semibold">
                          Welcome, <span className="text-cyan-300 font-extrabold">{currentUser.name || "Student"}</span>! I am Professor ARIA, your AI study companion.
                        </p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          We've calibrated your dashboard for <span className="text-purple-300 font-bold">{survey.goal ? survey.goal.toUpperCase() : "JEE"}</span> prep. Since you flagged <span className="text-cyan-300 font-semibold">{getWeakSubjectLabel(survey.weak) || "Physics"}</span> as your weak subject, let's start there:
                        </p>
                        <ul className="text-[11px] text-gray-300 leading-relaxed space-y-1.5 list-none">
                          <li className="flex items-start gap-1.5 hover:text-cyan-200 transition-colors">
                            <span className="text-purple-400 mt-0.5">✦</span>
                            <span>
                              {survey.motivation === "visual" ? "Explore interactive 3D models in our Labs." :
                               survey.motivation === "rank" ? "Attempt mock quizzes to secure a top competitive rank." :
                               "Check your daily targets & review chapters in Planner."}
                            </span>
                          </li>
                          <li className="flex items-start gap-1.5 hover:text-cyan-200 transition-colors">
                            <span className="text-purple-400 mt-0.5">✦</span>
                            <span>Click "Browse Core Courses" below to select a topic.</span>
                          </li>
                          <li className="flex items-start gap-1.5 hover:text-cyan-200 transition-colors">
                            <span className="text-purple-400 mt-0.5">✦</span>
                            <span>Upload diagram doubts directly in the Ask ARIA chat!</span>
                          </li>
                        </ul>
                      </div>
                    ) : mlData.risk && mlData.risk.recommendations && mlData.risk.recommendations.length > 0 ? (
                      <ul className="text-xs text-gray-300 leading-relaxed space-y-2 list-none">
                        {mlData.risk.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-1.5 hover:text-purple-200 transition-colors">
                            <span className="text-purple-400 mt-1">✦</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    ) : displayWeakTopics.length > 0 ? (
                      <p className="text-xs text-gray-300 leading-relaxed">
                        Based on your recent quizzes, focus on <span className="text-purple-300 font-semibold">{displayWeakTopics[0].topic}</span> today.
                        Your average score in this topic is {displayWeakTopics[0].score}%.
                      </p>
                    ) : (
                      <p className="text-xs text-gray-300 leading-relaxed">
                        Complete today's study targets and take an adaptive quiz to keep your diagnostics current.
                      </p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/courses")}
                    className="w-full py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 mt-2"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}
                  >
                    <Brain size={12} /> {isNewUser ? "Browse Core Courses" : "Start Focused Session"}
                  </motion.button>
                </div>
              )}

              {/* Weak topics */}
              <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-1">Weak Areas</p>
                {displayWeakTopics.length > 0 ? (
                  displayWeakTopics.slice(0, 2).map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[10px] text-gray-400">{t.topic}</span>
                          <span className="text-[10px] font-bold" style={{ color: t.score < 50 ? "#f87171" : "#facc15" }}>
                            {t.score}%
                          </span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${t.score}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                            style={{ background: t.score < 50 ? "#f87171" : "#facc15" }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-2 px-3 text-center rounded-xl border border-white/5 bg-white/5 flex flex-col items-center justify-center">
                    <Target size={14} className="text-purple-400 mb-1" />
                    <p className="text-[9px] text-gray-400 font-bold">No Weak Areas</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Course progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-1"
          >
            <Card style={{ height: "100%", display: "flex", flexDirection: "column", background: "rgba(10, 5, 25, 0.95)", border: "1px solid rgba(255, 255, 255, 0.07)", padding: "24px" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "Poppins" }}>My Courses</h2>
                <button className="text-xs text-[#a855f7] hover:text-[#c084fc] font-semibold flex items-center gap-1 transition-all">
                  View All <ChevronRight size={12} className="mt-[1px]" />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col justify-start">
                {displayCourses.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {displayCourses.slice(0, 2).map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 + i * 0.07 }}
                        whileHover={{ y: -2, scale: 1.01 }}
                        onClick={() => navigate("/courses")}
                        className="p-5 rounded-[18px] cursor-pointer transition-all flex flex-col justify-between"
                        style={{
                          background: `linear-gradient(135deg, ${c.color}0a, rgba(255,255,255,0.01))`,
                          border: `1px solid ${c.color}25`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: c.color }}>{c.subject}</p>
                          {c.streak > 0 && (
                            <div className="flex items-center gap-1 text-[#f59e0b]">
                              <Flame size={13} className="fill-[#f59e0b]" />
                              <span className="text-xs font-bold">{c.streak}d</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[17px] font-bold text-white mb-0.5 leading-snug">{c.title}</p>
                        <p className="text-[12px] text-gray-500 mb-4 font-medium">Next: {c.nextLesson}</p>

                        {/* Progress */}
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <motion.div
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${c.progress}%` }}
                              transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                              style={{ background: c.color }}
                            />
                          </div>
                          <span className="text-sm font-bold flex-shrink-0" style={{ color: c.color }}>{c.progress}%</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center rounded-2xl border border-white/5 bg-white/5 flex flex-col items-center justify-center">
                    <BookOpen size={24} className="text-purple-400 mb-2" />
                    <p className="text-xs font-bold text-white mb-0.5">No Enrolled Courses</p>
                    <p className="text-[10px] text-gray-500 max-w-sm mb-3 leading-normal">
                      Enroll in your first module to get started.
                    </p>
                    <button 
                      onClick={() => navigate("/courses")}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl text-[9px] font-bold text-white hover:scale-105 transition-all"
                    >
                      Browse Courses
                    </button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>



        {/* ── BOTTOM ROW ── */}
        <div className="grid grid-cols-3 gap-4">

          {/* Today's targets */}
          <Card>
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Target size={15} className="text-cyan-400" /> Today's Targets
            </h3>
            <p className="text-[10px] text-gray-500 mb-3">Resets daily at 6:00 AM</p>
            <div className="space-y-3">
              {displayDailyTarget.map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all`}
                    style={{
                      borderColor: t.done ? "#34d399" : "rgba(255,255,255,0.2)",
                      background: t.done ? "rgba(52,211,153,0.15)" : "transparent",
                    }}>
                    {t.done && <span className="text-green-400 text-xs">✓</span>}
                  </div>
                  <span className={`text-xs flex-1 ${t.done ? "line-through text-gray-600" : "text-gray-300"}`}>
                    {t.task}
                  </span>
                  <span className="text-xs font-bold text-amber-400">+{t.xp}xp</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-400">Daily XP</span>
                <span className="text-xs font-bold text-amber-400">{earnedXP} / {totalXP}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div className="h-full rounded-full" style={{ background: "#f59e0b", width: `${xpPercentage}%` }}
                  initial={{ width: 0 }} animate={{ width: `${xpPercentage}%` }} transition={{ delay: 0.8, duration: 0.8 }} />
              </div>
            </div>
          </Card>



          {/* Quick Actions & Achievements Stack */}
          <div className="flex flex-col gap-4">
            {/* Quick actions (compact) */}
            <div className="rounded-2xl p-4 flex-1 flex flex-col justify-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
              }}
            >
              <h3 className="text-xs font-bold text-white mb-2.5 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" /> Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Mock Test", icon: "📝" },
                  { label: "Physics Lab", icon: "⚡" },
                  { label: "Ask ARIA", icon: "🤖" },
                  { label: "Leaderboard", icon: "🏆" },
                ].map((a, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      if (a.label === "Ask ARIA") navigate("/ask-aria");
                      if (a.label === "Mock Test") navigate("/mock-tests");
                      if (a.label === "Physics Lab") navigate("/physics-lab");
                    }}
                    className="flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span className="text-xs">{a.icon}</span>
                    <span className="text-gray-300 font-medium text-[10px]">{a.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Achievements (compact) */}
            <div className="rounded-2xl p-4 flex-1 flex flex-col justify-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(12px)",
              }}
            >
              <h3 className="text-xs font-bold text-white mb-2.5 flex items-center gap-1.5">
                <Award size={14} className="text-purple-400" /> Achievements
              </h3>
              <div className="flex justify-between items-center p-2 rounded-xl"
                style={{ 
                  background: "linear-gradient(135deg,rgba(168,85,247,0.1),rgba(6,182,212,0.06))", 
                  border: "1px solid rgba(168,85,247,0.15)" 
                }}
              >
                <div>
                  <p className="text-[9px] text-gray-400">Today's XP Earned</p>
                  <p className="text-base font-black text-white">{displayXP} <span className="text-[10px] text-purple-400 font-bold font-mono">XP</span></p>
                </div>
                <Star size={20} className="text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Leetcode-style Streak Completed Modal Overlay */}
      <AnimatePresence>
        {showStreakModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className="relative max-w-md w-full p-8 rounded-3xl text-center border overflow-hidden mx-4"
              style={{
                background: "linear-gradient(135deg, rgba(20, 10, 40, 0.95), rgba(10, 5, 25, 0.98))",
                borderColor: "rgba(168, 85, 247, 0.3)",
                boxShadow: "0 0 50px rgba(168, 85, 247, 0.25)"
              }}
            >
              {/* Shimmering particle dots / sparks */}
              {[...Array(20)].map((_, idx) => {
                const angle = (idx / 20) * 360;
                const distance = 80 + Math.random() * 80;
                const x = Math.cos((angle * Math.PI) / 180) * distance;
                const y = Math.sin((angle * Math.PI) / 180) * distance;
                return (
                  <motion.div
                    key={idx}
                    className="absolute w-2.5 h-2.5 rounded-full bg-amber-400"
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{
                      x: x,
                      y: y,
                      opacity: [1, 1, 0],
                      scale: [0, 1.5, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 0.2,
                      repeat: Infinity,
                      repeatDelay: 1.5
                    }}
                    style={{
                      left: "50%",
                      top: "35%",
                      transform: "translate(-50%, -50%)",
                      boxShadow: "0 0 10px rgba(245, 158, 11, 0.8)"
                    }}
                  />
                );
              })}

              {/* Giant glowing flame icon container */}
              <div className="relative flex justify-center mb-6">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute w-32 h-32 rounded-full bg-amber-500/20 blur-xl"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="w-24 h-24 rounded-full flex items-center justify-center relative bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 shadow-[0_0_30px_rgba(245,158,11,0.5)] border border-amber-300/30"
                >
                  <Flame size={48} className="text-white fill-white animate-pulse" />
                </motion.div>
              </div>

              {/* Message */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-black text-white mb-2 uppercase tracking-wide"
                style={{ fontFamily: "Poppins", background: "linear-gradient(90deg, #fbbf24, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                Streak Restored! 🔥
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-400 text-sm mb-6 leading-relaxed"
              >
                You completed all daily study and learning targets today. Your streak increases to:
              </motion.p>

              {/* Streak Days count display */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
                className="inline-block px-8 py-3 rounded-2xl mb-8 font-mono border"
                style={{
                  background: "rgba(245, 158, 11, 0.08)",
                  borderColor: "rgba(245, 158, 11, 0.3)",
                  boxShadow: "0 0 20px rgba(245, 158, 11, 0.15)"
                }}
              >
                <span className="text-5xl font-black text-amber-400">{activeStreakCount}</span>
                <span className="text-xl font-bold text-amber-400/80 ml-2">DAYS</span>
              </motion.div>

              {/* Close / Action Button */}
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(168,85,247,0.4)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowStreakModal(false)}
                className="w-full py-3.5 rounded-2xl text-xs font-bold text-white uppercase tracking-wider transition-all"
                style={{
                  background: "linear-gradient(135deg, #a855f7, #06b6d4)",
                  border: "1px solid rgba(255,255,255,0.1)"
                }}
              >
                Keep the Fire Burning! 🔥
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}