import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Zap, Brain, Target, BookOpen, 
  ChevronRight, Award, TrendingUp, 
  ArrowLeft, Atom, Sparkles
} from "lucide-react";

const FEATURES = [
  {
    icon: <Sparkles className="text-cyan-400 w-6 h-6" />,
    badge: "AI Powered",
    title: "ARIA Doubt Solver",
    desc: "Got stuck on a tricky JEE/NEET question? Take a snap or type your doubt to receive instant, step-by-step guidance from ARIA, our conversational AI physics & chemistry tutor.",
    accent: "from-cyan-500/20 to-blue-500/10",
    border: "border-cyan-500/30",
    color: "text-cyan-400"
  },
  {
    icon: <Target className="text-purple-400 w-6 h-6" />,
    badge: "XGBoost + IRT",
    title: "Adaptive Mock Tests",
    desc: "An intelligent quiz platform that adjusts difficulty dynamically. Excel on medium questions to face harder concepts, or drop down on silly mistakes to rebuild confidence.",
    accent: "from-purple-500/20 to-indigo-500/10",
    border: "border-purple-500/30",
    color: "text-purple-400"
  },
  {
    icon: <Atom className="text-emerald-400 w-6 h-6" />,
    badge: "Three.js 3D Engine",
    title: "3D Physics Lab",
    desc: "Interact with physical forces, electric charges, and rotational mechanics in real-time virtual simulations. Tweak variables and instantly visualize the physical outputs.",
    accent: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-500/30",
    color: "text-emerald-400"
  },
  {
    icon: <TrendingUp className="text-amber-400 w-6 h-6" />,
    badge: "Prophet Model",
    title: "30-Day Score Forecasting",
    desc: "Predict your final JEE or NEET score trend 30 days ahead based on daily performance parameters, historical mocks, and average study session logs.",
    accent: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/30",
    color: "text-amber-400"
  },
  {
    icon: <Brain className="text-pink-400 w-6 h-6" />,
    badge: "DistilBERT NLP",
    title: "Wrong Answer Analyzer",
    desc: "Analyzes user-written explanations to identify whether an incorrect answer was due to a conceptual gap, a silly calculation mistake, or a lack of knowledge.",
    accent: "from-pink-500/20 to-rose-500/10",
    border: "border-pink-500/30",
    color: "text-pink-400"
  },
  {
    icon: <Award className="text-indigo-400 w-6 h-6" />,
    badge: "Collaborative Filtering",
    title: "Personalized Study Paths",
    desc: "No two minds learn the same way. Get automated recommendations for video lectures, custom worksheets, and exercises tailored to bridge your exact weaknesses.",
    accent: "from-indigo-500/20 to-violet-500/10",
    border: "border-indigo-500/30",
    color: "text-indigo-400"
  }
];

export default function ExploreFeatures() {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-[#030014] text-white overflow-x-hidden relative py-12 px-6 lg:px-16 flex flex-col justify-between">
      
      {/* Background radial orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Floating dot grids */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />

      {/* Top Header Row */}
      <header className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between mb-16">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-gray-400 hover:text-white transition-colors duration-300 px-4 py-2.5 rounded-xl border border-white/5 bg-white/5 backdrop-blur-md"
        >
          <ArrowLeft size={14} /> Back to Home
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>⚡</div>
          <span className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400" style={{ fontFamily: "Poppins" }}>
            EduMind
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto w-full flex-1">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 text-purple-300">
              EXPLORE COGNITIVE PLATFORM
            </span>
            <h1 className="text-4xl lg:text-5xl font-black mt-4 leading-tight" style={{ fontFamily: "Poppins" }}>
              AI-Powered Features for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] via-[#a855f7] to-[#ec4899] animate-pulse">
                JEE & NEET Excellence
              </span>
            </h1>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed font-mono">
              Combining advanced machine learning models with immersive 3D visualization pipelines to customize the ideal learning velocity for each student.
            </p>
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="p-6 rounded-[22px] border relative overflow-hidden flex flex-col justify-between transition-all duration-300"
              style={{
                background: "rgba(255, 255, 255, 0.02)",
                backdropFilter: "blur(16px)",
                borderColor: "rgba(255, 255, 255, 0.05)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)"
              }}
            >
              {/* Inner gradient glow */}
              <div className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-40 pointer-events-none z-0`} />

              <div className="relative z-10">
                {/* Icon & Badge Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {f.icon}
                  </div>
                  <span className={`text-[10px] font-bold tracking-widest uppercase ${f.color} px-2 py-0.5 rounded-md border ${f.border} bg-white/5`}>
                    {f.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "Poppins" }}>
                  {f.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-gray-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>

              {/* Arrow Indicator */}
              <div className="mt-6 flex justify-end relative z-10">
                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/20 transition-all duration-300 cursor-pointer">
                  <ChevronRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="rounded-[28px] p-8 lg:p-12 relative overflow-hidden text-center max-w-4xl mx-auto mb-8 border border-purple-500/20"
          style={{
            background: "linear-gradient(135deg, rgba(124, 58, 237, 0.07), rgba(6, 182, 212, 0.03))",
            backdropFilter: "blur(20px)"
          }}
        >
          {/* Neon corner lines */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-purple-500/40 rounded-tl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40 rounded-br-xl" />

          <div className="relative z-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3" style={{ fontFamily: "Poppins" }}>
              Ready to Accelerate Your Prep?
            </h2>
            <p className="text-xs lg:text-sm text-gray-400 max-w-2xl mx-auto mb-8 font-mono">
              Join thousands of JEE and NEET aspirants leveraging the power of personalization. Access mock tests, chat with ARIA, and explore virtual physics labs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase text-black bg-gradient-to-r from-cyan-400 to-purple-500 shadow-lg shadow-cyan-500/20 hover:scale-105 hover:shadow-cyan-500/30 transition-all duration-300"
              >
                Start Learning Now
              </button>
              <button 
                onClick={() => navigate("/login")}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs tracking-widest uppercase text-white border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300"
              >
                Access Portal
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 text-center max-w-7xl mx-auto w-full mt-12 text-[10px] text-gray-600 font-mono">
        &copy; {new Date().getFullYear()} EDUMIND COGNITIVE TECHNOLOGIES. ALL SYSTEMS SECURED.
      </footer>
    </div>
  );
}
