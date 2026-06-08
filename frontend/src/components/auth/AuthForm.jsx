import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { supabase } from "../../services/supabase";

// ── SCHEMAS ──────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Requires at least one uppercase letter")
    .regex(/[0-9]/, "Requires at least one numeric digit"),
  confirm: z.string(),
  role: z.enum(["student", "teacher"]),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

// ── PASSWORD STRENGTH ─────────────────────────
const getStrength = (pwd) => {
  const checks = [
    pwd.length >= 8,
    /[A-Z]/,
    /[0-9]/,
    /[^A-Za-z0-9]/,
  ];
  return checks.filter((regex) => typeof regex === "boolean" ? regex : regex.test(pwd)).length;
};

const STRENGTH_CONFIG = [
  { label: "Weak Strength", color: "#f87171" },
  { label: "Fair Strength", color: "#fb923c" },
  { label: "Good Strength", color: "#facc15" },
  { label: "Strong & Secured", color: "#34d399" },
];

// ── REUSABLE GLASSMOPHIC FIELD ────────────────
function Field({ icon, placeholder, type = "text", error, rightEl, label, ...props }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="text-left w-full">
      {label && (
        <label className="text-xs font-semibold text-gray-400 mb-1.5 block pl-1">
          {label}
        </label>
      )}
      <motion.div
        animate={error ? { x: [-6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300 relative overflow-hidden"
        style={{
          background: isFocused ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.01)",
          border: `1px solid ${
            error 
              ? "rgba(248,113,113,0.4)" 
              : isFocused 
                ? "rgba(168,85,247,0.4)" 
                : "rgba(255,255,255,0.06)"
          }`,
          boxShadow: isFocused 
            ? "0 0 15px rgba(168,85,247,0.1)" 
            : "none"
        }}
      >
        <div className={`flex-shrink-0 transition-colors duration-300 ${isFocused ? "text-purple-400" : "text-gray-500"}`}>
          {icon}
        </div>
        <input
          type={type}
          placeholder={placeholder}
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className="bg-transparent outline-none w-full text-white placeholder:text-gray-600 text-sm"
        />
        {rightEl}
      </motion.div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-xs text-red-400 pl-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── MAIN MODULE ───────────────────────────────
export default function AuthForm() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState("student");
  const [pwdVal, setPwdVal] = useState("");
  const navigate = useNavigate();

  const isLogin = mode === "login";
  const strength = getStrength(pwdVal);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    defaultValues: { role: "student" },
  });

  const switchMode = (m) => { setMode(m); reset(); setPwdVal(""); };

  // --- Cursor Tilt Coordinates ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 });

  const sheenX = useSpring(useTransform(x, [-0.5, 0.5], ["0%", "100%"]), { stiffness: 150, damping: 20 });
  const sheenY = useSpring(useTransform(y, [-0.5, 0.5], ["0%", "100%"]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const relativeX = (event.clientX - rect.left) / width - 0.5;
    const relativeY = (event.clientY - rect.top) / height - 0.5;
    x.set(relativeX);
    y.set(relativeY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // ── SUBMIT ──
  const onSubmit = async (data) => {
    try {
      if (isLogin) {
        const res = await api.post("/auth/login", data);
        localStorage.setItem("edumind_token", res.data.token);
        localStorage.setItem("edumind_user", JSON.stringify(res.data.user));
        localStorage.setItem("edumind_remember_me", data.rememberMe ? "true" : "false");
        localStorage.removeItem("edumind_new_user");
        toast.success("Welcome back to EduMind! 🚀");

        if (res.data.user.survey) {
          const surveyStr = typeof res.data.user.survey === "object"
            ? JSON.stringify(res.data.user.survey)
            : res.data.user.survey;
          localStorage.setItem("edumind_survey", surveyStr);
          navigate("/dashboard");
        } else {
          localStorage.removeItem("edumind_survey");
          navigate("/onboarding");
        }
      } else {
        const res = await api.post("/auth/signup", data);
        localStorage.setItem("edumind_token", res.data.token);
        localStorage.setItem("edumind_user", JSON.stringify(res.data.user));
        localStorage.setItem("edumind_remember_me", "true");
        localStorage.setItem("edumind_new_user", "true");
        toast.success("Account created successfully! 🎉");
        navigate("/onboarding");
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Authentication sequence failed");
    }
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md"
      style={{ perspective: 1000 }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes rotate-glow {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-rotate-glow {
          animation: rotate-glow 12s linear infinite;
        }
      `}} />

      {/* Tilt Window Container */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative p-[1.5px] rounded-[32px] overflow-hidden"
      >
        {/* Neon Cyber Glow Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-[conic-gradient(from_0deg,transparent,rgba(168,85,247,0.4),rgba(6,182,212,0.3),transparent)] animate-rotate-glow opacity-50 z-0 pointer-events-none" />

        {/* Outer Form Card */}
        <div 
          className="relative rounded-[31px] overflow-hidden z-10 flex flex-col p-8 lg:p-9"
          style={{
            background: "rgba(10, 5, 25, 0.75)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Moving Light Sheen Glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              background: useTransform(
                [sheenX, sheenY],
                (latest) => `radial-gradient(circle 280px at ${latest[0]} ${latest[1]}, rgba(168,85,247,0.04) 0%, transparent 80%)`
              )
            }}
          />

          {/* Form Header */}
          <div className="relative z-10 text-center mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "Poppins" }}>
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="mt-2 text-xs text-gray-400">
              {isLogin 
                ? "Sign in to continue your personalized learning path." 
                : "Join EduMind to prepare for JEE & NEET with AI."
              }
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="relative z-10 flex p-1 rounded-xl mb-6 border border-white/5 bg-white/5">
            {["login", "signup"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-300"
                style={{
                  background: mode === m ? "rgba(255, 255, 255, 0.08)" : "transparent",
                  color: mode === m ? "#fff" : "rgba(255,255,255,0.4)",
                  border: mode === m ? "1px solid rgba(255,255,255,0.05)" : "1px solid transparent",
                }}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10" noValidate>

            {/* Role Selector (Signup only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block pl-1">
                    I am a...
                  </label>
                  <div className="flex gap-2.5 mb-2">
                    {["student", "teacher"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        {...register("role")}
                        className="flex-1 py-2 rounded-xl text-xs font-bold transition-all border uppercase tracking-wider"
                        style={{
                          background: role === r ? "rgba(168,85,247,0.12)" : "rgba(255,255,255,0.01)",
                          borderColor: role === r ? "rgba(168,85,247,0.3)" : "rgba(255,255,255,0.05)",
                          color: role === r ? "#c084fc" : "rgba(255,255,255,0.4)",
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Full Name (Signup only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Field
                    icon={<User size={15} />}
                    placeholder="Full Name"
                    error={errors.name?.message}
                    label="Full Name"
                    {...register("name")}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Address */}
            <Field
              icon={<Mail size={15} />}
              placeholder="name@example.com"
              type="email"
              error={errors.email?.message}
              label="Email Address"
              {...register("email")}
            />

            {/* Phone Number (Signup only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Field
                    icon={<Phone size={15} />}
                    placeholder="10-digit mobile number"
                    type="tel"
                    error={errors.phone?.message}
                    label="Phone Number"
                    {...register("phone")}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password */}
            <div>
              <Field
                icon={<Lock size={15} />}
                placeholder="Enter password"
                type={showPass ? "text" : "password"}
                error={errors.password?.message}
                label="Password"
                rightEl={
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                {...register("password", {
                  onChange: (e) => setPwdVal(e.target.value),
                })}
              />

              {/* Password Strength Indicator (Signup only) */}
              {!isLogin && pwdVal.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2.5 px-1 text-left">
                  <div className="flex gap-1.5 mb-1.5">
                    {[1, 2, 3, 4].map((s) => (
                      <motion.div
                        key={s}
                        className="flex-1 h-1 rounded-sm"
                        animate={{
                          background: strength >= s
                            ? STRENGTH_CONFIG[strength - 1].color
                            : "rgba(255,255,255,0.06)",
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold tracking-wide uppercase" style={{ color: STRENGTH_CONFIG[Math.max(0, strength - 1)].color }}>
                    Security Evaluation: {strength > 0 ? STRENGTH_CONFIG[strength - 1].label : "Evaluating password..."}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Confirm Password (Signup only) */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Field
                    icon={<Lock size={15} />}
                    placeholder="Confirm password"
                    type={showConfirm ? "text" : "password"}
                    error={errors.confirm?.message}
                    label="Confirm Password"
                    rightEl={
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0">
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    }
                    {...register("confirm")}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Remember Me + Forgot Password (Login only) */}
            {isLogin && (
              <div className="flex items-center justify-between text-xs select-none">
                <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                  <input type="checkbox" {...register("rememberMe")} className="accent-purple-500 bg-transparent border-white/10 rounded" />
                  Remember me
                </label>
                <button type="button" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative w-full py-3.5 rounded-2xl font-bold text-black overflow-hidden flex items-center justify-center gap-2 mt-4"
              style={{
                background: "linear-gradient(135deg, #06b6d4, #a855f7)",
                boxShadow: "0 10px 20px rgba(168, 85, 247, 0.15)",
              }}
            >
              {/* Shimmer */}
              <motion.div
                className="absolute inset-0"
                style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)" }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
              />
              <span className="relative z-10 text-xs tracking-wider font-extrabold uppercase text-white">
                {isSubmitting
                  ? <Loader2 size={16} className="animate-spin text-white" />
                  : isLogin ? "Sign In" : "Register Now"
                }
              </span>
              {!isSubmitting && <ArrowRight size={14} className="relative z-10 text-white stroke-[2.5]" />}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5 select-none">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Or Connect With</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Google Auth Button */}
          <motion.button
            onClick={handleGoogle}
            whileHover={{ scale: 1.01, background: "rgba(255, 255, 255, 0.04)" }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3 rounded-2xl font-bold text-xs text-white flex items-center justify-center gap-3 transition-all border border-white/5 bg-white/5 backdrop-blur-md"
          >
            <FcGoogle size={18} />
            Continue with Google
          </motion.button>
        </div>
      </motion.div>

      {/* Terms (Signup only) */}
      {!isLogin && (
        <p className="text-center text-[10px] text-gray-500 mt-4 select-none">
          By signing up, you agree to our{" "}
          <span className="text-purple-400 cursor-pointer hover:text-purple-300">Terms of Service</span>
          {" "}and{" "}
          <span className="text-purple-400 cursor-pointer hover:text-purple-300">Privacy Policy</span>.
        </p>
      )}
    </motion.div>
  );
}