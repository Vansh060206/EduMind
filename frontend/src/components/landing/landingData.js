export const FEATURES = [
  {
    icon: "🤖",
    title: "ARIA AI Tutor",
    desc: "Step-by-step derivations, diagram analysis, and instant doubt resolution powered by Groq LLMs.",
    gradient: "from-purple-500/20 to-violet-600/5",
    glow: "#a855f7",
  },
  {
    icon: "📝",
    title: "Adaptive Mock Tests",
    desc: "Dynamic JEE/NEET question pools that prioritize your weak topics from mistake logs.",
    gradient: "from-cyan-500/20 to-blue-600/5",
    glow: "#06b6d4",
  },
  {
    icon: "⚗️",
    title: "3D Science Labs",
    desc: "Interactive Physics and Chemistry simulations with real-time telemetry and HUD overlays.",
    gradient: "from-emerald-500/20 to-teal-600/5",
    glow: "#34d399",
  },
  {
    icon: "📈",
    title: "Performance Prediction",
    desc: "XGBoost risk profiling and Prophet score forecasting from your actual quiz history.",
    gradient: "from-amber-500/20 to-orange-600/5",
    glow: "#f59e0b",
  },
  {
    icon: "🎯",
    title: "Personalized Learning",
    desc: "Curriculum-aware study paths, flashcards, and formula sheets tuned to Class 11–12 science.",
    gradient: "from-pink-500/20 to-rose-600/5",
    glow: "#ec4899",
  },
];

export const JOURNEY_STEPS = [
  { label: "Learn", icon: "📚", desc: "Curriculum-aligned notes & labs" },
  { label: "Practice", icon: "✍️", desc: "Adaptive quizzes & mocks" },
  { label: "Diagnose", icon: "🔬", desc: "Weak-topic heatmaps" },
  { label: "Improve", icon: "📊", desc: "Targeted remediation" },
  { label: "Predict", icon: "🧠", desc: "ML score forecasting" },
  { label: "Succeed", icon: "🏆", desc: "JEE/NEET readiness" },
];

export const TESTIMONIALS = [
  { name: "Aarav S.", score: "JEE Main 98.2%", quote: "EduMind's adaptive quizzes found gaps I didn't know I had. ARIA explained rotational dynamics better than any coaching class.", avatar: "A" },
  { name: "Priya M.", score: "NEET 710/720", quote: "The 3D chem lab made reaction mechanisms click. My organic score jumped 40 points in six weeks.", avatar: "P" },
  { name: "Rohan K.", score: "Class 12 Topper", quote: "Prophet forecasts kept me honest about my trajectory. The daily targets built a streak I actually maintained.", avatar: "R" },
  { name: "Sneha T.", score: "JEE Advanced Qualifier", quote: "Formula sheets with premium LaTeX rendering feel like a digital textbook. Mock tests mirror the real exam pressure.", avatar: "S" },
  { name: "Vikram D.", score: "NEET AIR 842", quote: "Mistake analysis after every quiz is the killer feature. EduMind doesn't just test you—it teaches you.", avatar: "V" },
  { name: "Ananya R.", score: "Physics 99/100", quote: "Physics lab simulations with path tracing helped me visualize projectile motion intuitively for the first time.", avatar: "A" },
];

export const STATS = [
  { label: "Active Students", value: 12400, suffix: "+" },
  { label: "Questions Solved", value: 2800000, suffix: "+" },
  { label: "Study Hours Logged", value: 890000, suffix: "+" },
  { label: "AI Analyses Run", value: 520000, suffix: "+" },
];

export const ARIA_PREVIEW = [
  { role: "user", text: "Why is angular momentum conserved in rotational motion?" },
  { role: "aria", text: "When net external torque τ_ext = 0, dL/dt = 0 → L stays constant. For a rigid body: L = Iω." },
  { role: "user", text: "Show me the ice skater effect." },
  { role: "aria", text: "Pulling arms in ↓ I → ω increases to keep L = Iω constant. Classic angular momentum conservation! ✦" },
];
