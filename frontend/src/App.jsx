// App.jsx — Main router with splash + survey + auth + dashboard flow
import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import SplashScreen from "./components/SplashScreen";
import OnboardingSurvey from "./components/OnboardingSurvey";
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import ExploreFeatures from "./pages/ExploreFeatures";
import AskAria from "./pages/AskAria";
import MockTests from "./pages/MockTests";
import Courses from "./pages/Courses";
import PhysicsLab from "./pages/PhysicsLab";
import ChemLab from "./pages/ChemLab";
import History from "./pages/History";
import Planner from "./pages/Planner";
import Analytics from "./pages/Analytics";
import { supabase } from "./services/supabase";
import api from "./services/api";
import GlobalStudyTimer from "./components/GlobalStudyTimer";

// Helper to wrap promises with a timeout
const withTimeout = (promise, ms = 4000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
  ]);
};

// ── AUTH GUARD ─────────────────────────────────
function PrivateRoute({ children }) {
  const token = localStorage.getItem("edumind_token");
  return token ? children : <Navigate to="/" replace />;
}

// ── GLOBAL AUTH LISTENER ────────────────────────
// Moves onAuthStateChange inside the Router context to use useNavigate.
// This preserves hash parameters for Supabase to parse before any route transition.
function AuthListener() {
  const navigate = useNavigate();
  const currentPath = window.location.pathname;
  const hasMounted = useRef(false);

  // Helper to safely parse and check if a JWT token is issued by Supabase
  const getSupabaseUserId = (token) => {
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
      if (payload.iss && payload.iss.includes('supabase')) {
        return payload.sub; // return Supabase user UUID
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const isValidSurvey = (surveyData) => {
    if (!surveyData) return false;
    let obj = surveyData;
    if (typeof surveyData === "string") {
      if (surveyData.startsWith("http")) return false; // Google profile photo URL
      try {
        obj = JSON.parse(surveyData);
      } catch (e) {
        return false;
      }
    }
    return obj && typeof obj === "object" && (!!obj.class || !!obj.goal || !!obj.weak);
  };

  // Unified session & survey validation helper
  const validateSessionAndSurvey = async (sessionUser = null, forceFetch = false) => {
    const token = localStorage.getItem("edumind_token");
    const path = window.location.pathname;

    if (!token) {
      // Not logged in: allow public paths, redirect others to "/"
      if (path !== "/" && path !== "" && path !== "/features") {
        navigate("/");
      }
      return;
    }

    // Redirect to dashboard if logged in but visiting login screen
    if (path === "/" || path === "") {
      navigate("/dashboard");
      return;
    }

    let localSurvey = localStorage.getItem("edumind_survey");
    let dbSurvey = localSurvey;
    let createdAt = null;

    // Only fetch from database if we don't have it locally, or if we force a fetch (e.g. on mount/OAuth transition)
    if (!localSurvey || forceFetch) {
      const supabaseUserId = sessionUser?.id || getSupabaseUserId(token);

      if (supabaseUserId) {
        // Case 1: Google OAuth User
        try {
          const { data, error } = await withTimeout(
            supabase
              .from("users")
              .select("avatar_url, created_at")
              .eq("id", supabaseUserId)
              .single()
          );
          
          if (data) {
            if (data.avatar_url) dbSurvey = data.avatar_url;
            if (data.created_at) createdAt = data.created_at;
          }
          
          if (error || !data) {
            // Self-heal: Create missing user row in public.users table
            const normalizedUser = JSON.parse(localStorage.getItem("edumind_user") || "{}");
            await withTimeout(
              supabase.from("users").insert({
                id: supabaseUserId,
                name: normalizedUser.name || "Student",
                email: normalizedUser.email || "",
                role: "student"
              })
            );
            console.log("Self-healed missing Google user in public.users table.");
          }
        } catch (err) {
          console.error("Failed to query survey/heal Google user:", err);
        }
      } else {
        // Case 2: Credentials-based User
        try {
          const res = await withTimeout(api.get(`/auth/me?token=${token}`));
          if (res.data) {
            if (res.data.avatar_url) dbSurvey = res.data.avatar_url;
            if (res.data.created_at) createdAt = res.data.created_at;
          }
        } catch (err) {
          console.error("Failed to query /auth/me:", err);
          // Handle 401 token expiry for credentials user
          if (err.response?.status === 401) {
            localStorage.removeItem("edumind_token");
            localStorage.removeItem("edumind_user");
            localStorage.removeItem("edumind_survey");
            localStorage.removeItem("edumind_new_user");
            navigate("/");
            return;
          }
        }
      }
    } else {
      // Try to parse created_at from edumind_user cache if available
      try {
        const localUser = JSON.parse(localStorage.getItem("edumind_user") || "{}");
        if (localUser.created_at) createdAt = localUser.created_at;
      } catch (e) {}
    }

    const hasValidSurvey = isValidSurvey(dbSurvey);
    
    // Sync database state to local storage
    if (hasValidSurvey) {
      const surveyStr = typeof dbSurvey === "object" ? JSON.stringify(dbSurvey) : dbSurvey;
      localStorage.setItem("edumind_survey", surveyStr);
    } else {
      // If returning user has no valid survey (or it's just a Google photo URL),
      // we save a safe default survey in localStorage to prevent frontend crashes on dashboard/analytics.
      const isNewUserLocal = localStorage.getItem("edumind_new_user") === "true";
      const isNewUserDb = createdAt ? (Date.now() - new Date(createdAt).getTime() < 30 * 60 * 1000) : false;
      const isNewUser = isNewUserLocal || isNewUserDb;

      if (!isNewUser) {
        const defaultSurvey = { class: "12", goal: "jee", weak: "physics", hours: "3-4", motivation: "visual" };
        localStorage.setItem("edumind_survey", JSON.stringify(defaultSurvey));
      } else {
        localStorage.removeItem("edumind_survey");
      }
    }

    // Redirect control: Only force onboarding for actual newly registered users who lack a valid survey
    const isNewUserLocal = localStorage.getItem("edumind_new_user") === "true";
    const isNewUserDb = createdAt ? (Date.now() - new Date(createdAt).getTime() < 30 * 60 * 1000) : false;
    const isNewUser = isNewUserLocal || isNewUserDb;

    const shouldShowSurvey = isNewUser && !hasValidSurvey;

    if (shouldShowSurvey) {
      if (path !== "/onboarding") {
        navigate("/onboarding");
      }
    } else {
      if (path === "/" || path === "" || path === "/onboarding") {
        navigate("/dashboard");
      }
    }
  };

  useEffect(() => {
    // 1. Supabase auth listener for real-time events (Google OAuth login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        localStorage.setItem("edumind_token", session.access_token);
        
        const normalizedUser = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "Student",
          role: session.user.user_metadata?.role || "student"
        };
        localStorage.setItem("edumind_user", JSON.stringify(normalizedUser));
        
        const createdAt = session.user.created_at ? new Date(session.user.created_at).getTime() : 0;
        const isNewGoogleAccount = createdAt ? (Date.now() - createdAt) < 600000 : false;

        if (isNewGoogleAccount) {
          localStorage.setItem("edumind_new_user", "true");
        } else if (event === "SIGNED_IN") {
          localStorage.removeItem("edumind_new_user");
        }
        
        await validateSessionAndSurvey(session.user, true);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // 2. Navigation listener and initial mount validation
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;

      // Remember me check: if first time loading this session (tab/window session)
      const sessionActive = sessionStorage.getItem("edumind_session_active");
      if (!sessionActive) {
        const rememberMe = localStorage.getItem("edumind_remember_me");
        if (rememberMe !== "true") {
          // Clear only auth tokens and profiles
          localStorage.removeItem("edumind_token");
          localStorage.removeItem("edumind_user");
          localStorage.removeItem("edumind_survey");
          localStorage.removeItem("edumind_new_user");
          localStorage.removeItem("edumind_remember_me");
        }
        sessionStorage.setItem("edumind_session_active", "true");
      }

      validateSessionAndSurvey(null, true); // force database fetch on app launch/refresh
    } else {
      validateSessionAndSurvey(null, false); // check using local cache on subsequent route transitions
    }
  }, [navigate, currentPath]);

  return null;
}

export default function App() {
  const [phase, setPhase] = useState("splash"); // splash → survey → app

  useEffect(() => {
    // Skip splash if already visited this session
    const visited = sessionStorage.getItem("edumind_visited");
    if (visited) setPhase("app");
  }, []);

  const handleSplashDone = () => {
    setPhase("app");
    sessionStorage.setItem("edumind_visited", "true");
  };

  return (
    <>
      {/* ── SPLASH ── */}
      {phase === "splash" && (
        <SplashScreen onComplete={handleSplashDone} />
      )}

      {/* ── MAIN APP ── */}
      <Router>
        {/* Listen for auth changes and handle routing */}
        <AuthListener />
        <GlobalStudyTimer />

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(15,10,30,0.95)",
              color: "#fff",
              border: "1px solid rgba(168,85,247,0.3)",
              borderRadius: "14px",
              backdropFilter: "blur(16px)",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#34d399", secondary: "#030014" } },
            error: { iconTheme: { primary: "#f87171", secondary: "#030014" } },
          }}
        />

        <Routes>
          {/* Login / Signup */}
          <Route path="/" element={<Login />} />

          {/* Onboarding survey — after signup */}
          <Route path="/onboarding" element={
            <PrivateRoute>
              <OnboardingSurvey onComplete={() => window.location.href = "/dashboard"} />
            </PrivateRoute>
          } />

          {/* Dashboard */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />

          {/* Explore Features */}
          <Route path="/features" element={<ExploreFeatures />} />

          {/* Ask ARIA Chat */}
          <Route path="/ask-aria" element={
            <PrivateRoute>
              <AskAria />
            </PrivateRoute>
          } />

          {/* Mock Tests */}
          <Route path="/mock-tests" element={
            <PrivateRoute>
              <MockTests />
            </PrivateRoute>
          } />

          {/* Courses */}
          <Route path="/courses" element={
            <PrivateRoute>
              <Courses />
            </PrivateRoute>
          } />

          {/* Physics Lab */}
          <Route path="/physics-lab" element={
            <PrivateRoute>
              <PhysicsLab />
            </PrivateRoute>
          } />

          {/* Chemistry Lab */}
          <Route path="/chem-lab" element={
            <PrivateRoute>
              <ChemLab />
            </PrivateRoute>
          } />

          {/* History */}
          <Route path="/history" element={
            <PrivateRoute>
              <History />
            </PrivateRoute>
          } />

          {/* Planner */}
          <Route path="/planner" element={
            <PrivateRoute>
              <Planner />
            </PrivateRoute>
          } />

          {/* Analytics */}
          <Route path="/analytics" element={
            <PrivateRoute>
              <Analytics />
            </PrivateRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}