// MockTests.jsx — Adaptive Mock Tests Engine
// Class 11-12 Science Core // Streak adaptive progression

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, Clock, AlertTriangle, ChevronRight, 
  Sparkles, Award, Star, BookOpen, Flame, ArrowLeft, RefreshCw, Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../services/api";

const SUBJECTS = [
  { name: "Physics", icon: "⚡", color: "text-purple-400", border: "border-purple-500/30", bg: "from-purple-500/20 to-indigo-500/10", topics: "Rotational Dynamics, Simple Harmonic Motion, Electrostatics, Carnot Engines..." },
  { name: "Chemistry", icon: "🧪", color: "text-cyan-400", border: "border-cyan-500/30", bg: "from-cyan-500/20 to-blue-500/10", topics: "pH calculations, Hybridization, Chemical Kinetics, Organic Kharasch Addition..." },
  { name: "Mathematics", icon: "∫", color: "text-emerald-400", border: "border-emerald-500/30", bg: "from-emerald-500/20 to-teal-500/10", topics: "Parabola Coordinate Geometry, Definite Integrals, Limits & Continuity, AGP Series..." },
  { name: "Biology", icon: "🧬", color: "text-amber-400", border: "border-amber-500/30", bg: "from-amber-500/20 to-orange-500/10", topics: "Glycolysis pathways, DNA replication enzymes, Apical dominance, C₄ plant acceptor..." }
];

const LOADING_LOGS = [
  "Connecting to ARIA cognitive network...",
  "Analyzing Class 11-12 syllabus nodes...",
  "Synthesizing conceptual problems...",
  "Calibrating Easy, Medium, and Hard tiers...",
  "Drafting algebraic explanations..."
];

export default function MockTests() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("edumind_user") || '{"name":"Student"}');

  // Parse search params for retest
  const queryParams = new URLSearchParams(window.location.search);
  const retestSubject = queryParams.get("retestSubject");
  const retestTopic = queryParams.get("retestTopic");
  const isRetesting = !!retestSubject;

  // --- States ---
  const [activeSubject, setActiveSubject] = useState(() => {
    if (isRetesting) return null;
    return localStorage.getItem("edumind_mock_active_subject") || null;
  });
  const [testActive, setTestActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pool of questions from server
  const [questionsPool, setQuestionsPool] = useState(null);

  // ARIA Custom Topic Booster states
  const [customSubject, setCustomSubject] = useState(retestSubject || "Physics");
  const [customTopics, setCustomTopics] = useState(retestTopic || "");
  const [cinematicLoading, setCinematicLoading] = useState(false);
  const [cinematicLogIndex, setCinematicLogIndex] = useState(0);
  
  // Test taking states
  const [questionsFaced, setQuestionsFaced] = useState([]); // List of question objects served
  const [userAnswers, setUserAnswers] = useState({}); // Maps question.id to chosen_option_index
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);

  // Adaptive logic states
  const [currentDifficulty, setCurrentDifficulty] = useState("Medium");
  const [correctStreak, setCorrectStreak] = useState(0);
  const [incorrectStreak, setIncorrectStreak] = useState(0);

  // No pointers needed, we select questions by tracking servedIds dynamically

  // Timer states
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const timerRef = useRef(null);

  // Results state
  const [results, setResults] = useState(() => {
    if (isRetesting) return null;
    const saved = localStorage.getItem("edumind_mock_results");
    return saved ? JSON.parse(saved) : null;
  });

  const [retestLoading, setRetestLoading] = useState(false); // Retest generation loading state
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Save results state to localStorage when it changes
  useEffect(() => {
    if (results) {
      localStorage.setItem("edumind_mock_results", JSON.stringify(results));
      localStorage.setItem("edumind_mock_active_subject", activeSubject || "");
    } else {
      localStorage.removeItem("edumind_mock_results");
      localStorage.removeItem("edumind_mock_active_subject");
    }
  }, [results, activeSubject]);



  const TOPIC_REMEDIATION_MAP = {
    // Physics
    "Units & Dimensions": { courseId: "0dc0abe6-a380-47d7-b2fb-3c5702569dd8", lessonId: "units_dimensions_errors_1_1" },
    "Kinematics": { courseId: "874b9291-b17f-43f0-b685-3c8ef47565f6", lessonId: "mathematical_physics_and_vectors_3_1" },
    "Work, Energy & Power": { courseId: "874b9291-b17f-43f0-b685-3c8ef47565f6", lessonId: "mathematical_physics_and_vectors_3_1" },
    "Collisions": { courseId: "874b9291-b17f-43f0-b685-3c8ef47565f6", lessonId: "mathematical_physics_and_vectors_3_3" },
    "Rotational Motion": { courseId: "f6bc2a64-548f-4e13-a2fb-dd60d1f3c917", lessonId: "rotational_motion_1_1" },
    "Rotational Dynamics": { courseId: "f6bc2a64-548f-4e13-a2fb-dd60d1f3c917", lessonId: "rotational_motion_3_1" },
    "Simple Harmonic Motion": { courseId: "f6bc2a64-548f-4e13-a2fb-dd60d1f3c917", lessonId: "rotational_motion_2_3" },
    "Electrostatics": { courseId: "c7e0610a-b71d-4704-ba39-7fe982dfa2c1", lessonId: "electrostatics_1_1" },
    "Electric Fields": { courseId: "c7e0610a-b71d-4704-ba39-7fe982dfa2c1", lessonId: "electrostatics_1_3" },
    "Gauss's Law": { courseId: "c7e0610a-b71d-4704-ba39-7fe982dfa2c1", lessonId: "electrostatics_4_3" },
    "Electric Potential": { courseId: "c7e0610a-b71d-4704-ba39-7fe982dfa2c1", lessonId: "electrostatics_2_1" },
    "Capacitance": { courseId: "c7e0610a-b71d-4704-ba39-7fe982dfa2c1", lessonId: "electrostatics_3_1" },
    "Capacitors": { courseId: "c7e0610a-b71d-4704-ba39-7fe982dfa2c1", lessonId: "electrostatics_3_1" },
    "Magnetic Fields": { courseId: "c7e0610a-b71d-4704-ba39-7fe982dfa2c1", lessonId: "electrostatics_1_3" },
    "Thermodynamics": { courseId: "0dc0abe6-a380-47d7-b2fb-3c5702569dd8", lessonId: "applications_units_dimensions_errors_4_1" },
    // Chemistry
    "Acids & Bases": { courseId: "1190caa1-7e13-4ace-b81a-2b6fbda3118c", lessonId: "organic_chemistry_2_3" },
    "Periodic Table": { courseId: "1190caa1-7e13-4ace-b81a-2b6fbda3118c", lessonId: "organic_chemistry_2_1" },
    "Redox Reactions": { courseId: "1190caa1-7e13-4ace-b81a-2b6fbda3118c", lessonId: "organic_chemistry_4_1" },
    "Chemical Reactions": { courseId: "1190caa1-7e13-4ace-b81a-2b6fbda3118c", lessonId: "organic_chemistry_4_1" },
    "Organic Chemistry": { courseId: "1190caa1-7e13-4ace-b81a-2b6fbda3118c", lessonId: "organic_chemistry_1_1" },
    "Chemical Bonding": { courseId: "1190caa1-7e13-4ace-b81a-2b6fbda3118c", lessonId: "organic_chemistry_2_1" },
    "Chemical Kinetics": { courseId: "1190caa1-7e13-4ace-b81a-2b6fbda3118c", lessonId: "organic_chemistry_4_2" },
    "Intermolecular Forces": { courseId: "1190caa1-7e13-4ace-b81a-2b6fbda3118c", lessonId: "organic_chemistry_2_3" },
    "Coordination Compounds": { courseId: "1190caa1-7e13-4ace-b81a-2b6fbda3118c", lessonId: "organic_chemistry_3_2" },
    "Equilibrium": { courseId: "1190caa1-7e13-4ace-b81a-2b6fbda3118c", lessonId: "organic_chemistry_3_2" },
    // Mathematics
    "Calculus": { courseId: "f47cdd63-0771-4ecd-84ad-bd495bf9028a", lessonId: "integral_calculus_1_1" },
    "Limits": { courseId: "f47cdd63-0771-4ecd-84ad-bd495bf9028a", lessonId: "integral_calculus_1_2" },
    "Coordinate Geometry": { courseId: "f47cdd63-0771-4ecd-84ad-bd495bf9028a", lessonId: "integral_calculus_3_1" },
    "Integrals": { courseId: "f47cdd63-0771-4ecd-84ad-bd495bf9028a", lessonId: "integral_calculus_1_1" },
    "Quadratic Equations": { courseId: "f47cdd63-0771-4ecd-84ad-bd495bf9028a", lessonId: "integral_calculus_1_1" },
    "Binomial Theorem": { courseId: "f47cdd63-0771-4ecd-84ad-bd495bf9028a", lessonId: "integral_calculus_1_3" },
    "Infinite Series": { courseId: "f47cdd63-0771-4ecd-84ad-bd495bf9028a", lessonId: "integral_calculus_1_3" },
  };



  const handleRetrySimilar = async () => {
    const wrongQuestions = results?.graded_details?.filter(q => !q.is_correct) || [];
    const wrongTopics = [...new Set(wrongQuestions.map(q => q.topic))];
    if (wrongTopics.length === 0) {
      toast.error("No incorrect topics to retry!");
      return;
    }
    
    setRetestLoading(true);
    try {
      const res = await api.post("/tests/retry-similar", {
        student_id: user.id || "guest",
        subject: activeSubject,
        topics: wrongTopics
      });
      
      // Parse retry questions pool
      const pool = res.data;
      setQuestionsPool(pool);
      
      // Setup first question
      let firstQ = null;
      for (const diff of ["Medium", "Easy", "Hard"]) {
        if (pool[diff] && pool[diff].length > 0) {
          firstQ = pool[diff][0];
          setCurrentDifficulty(diff);
          break;
        }
      }
      
      if (!firstQ) {
        throw new Error("Generated retry pool is empty.");
      }
      
      // Reset all take-test states
      setQuestionsFaced([firstQ]);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setCorrectStreak(0);
      setIncorrectStreak(0);
      setTimeLeft(1200);
      setResults(null);
      setUserAnswers({});
      setTestActive(true);
      
      toast.success("Synthesized retry assessment targeting your weak areas!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate retry assessment. Please try again.");
    } finally {
      setRetestLoading(false);
    }
  };

  // --- Clean LaTeX Math Parser ---
  const cleanMathLaTeX = (text) => {
    if (!text) return "";
    let clean = text;

    // Restore garbled LaTeX symbols from control characters (JSON/JS string literal parsing quirks)
    clean = clean.replace(/\t/g, '\\t');
    clean = clean.replace(/\f/g, '\\f');
    clean = clean.replace(/\v/g, '\\v');
    clean = clean.replace(/[\b]/g, '\\b');
    clean = clean.replace(/\r([a-zA-Z])/g, '\\r$1');
    clean = clean.replace(/\n(eq|nabla|u\b|u\^|u_)/g, '\\n$1');

    // Normalize multiple backslashes to a single backslash
    clean = clean.replace(/\\+/g, '\\');

    // Clean up stand-alone "pm" math operator representing ±
    clean = clean.replace(/(^|[^a-zA-Z])pm\s*([0-9\.\+-]+|\\)/g, "$1±$2");

    // Convert vectors: \vec{v} -> v⃗ and \overrightarrow{v} -> v⃗
    clean = clean.replace(/\\vec\s*\{([^}]+)\}/g, "$1\u20d7");
    clean = clean.replace(/\\overrightarrow\s*\{([^}]+)\}/g, "$1\u20d7");
    
    // Convert unit vectors: \hat{i} -> î
    clean = clean.replace(/\\hat\s*\{([^}]+)\}/g, "$1\u0302");
    
    // Strip script wrappers: \mathcal{A} -> A
    clean = clean.replace(/\\mathcal\s*\{([^}]+)\}/g, "$1");
    
    // Convert Blackboard Bold (sets of numbers): \mathbb{R} -> ℝ, etc.
    clean = clean.replace(/\\mathbb\s*\{R\}/g, "ℝ");
    clean = clean.replace(/\\mathbb\s*\{N\}/g, "ℕ");
    clean = clean.replace(/\\mathbb\s*\{Z\}/g, "ℤ");
    clean = clean.replace(/\\mathbb\s*\{Q\}/g, "ℚ");
    clean = clean.replace(/\\mathbb\s*\{C\}/g, "ℂ");
    clean = clean.replace(/\\mathbb\s*\{([^}]+)\}/g, "$1");

    // Parse matrices: \begin{vmatrix} ... \end{vmatrix}
    clean = clean.replace(/\\begin\s*\{vmatrix\}([\s\S]*?)\\end\s*\{vmatrix\}/g, (match, body) => {
      const rows = body.split(/\\\\|\n/).map(row => row.trim()).filter(Boolean);
      const formattedRows = rows.map(row => {
        const cols = row.split("&").map(c => c.trim());
        return `│  ${cols.join("    ")}  │`;
      });
      return "\n" + formattedRows.join("\n") + "\n";
    });

    // Parse aligned equations: \begin{aligned} ... \end{aligned}
    clean = clean.replace(/\\begin\s*\{aligned\}([\s\S]*?)\\end\s*\{aligned\}/g, (match, body) => {
      const rows = body.split(/\\\\|\n/).map(row => row.trim()).filter(Boolean);
      const formattedRows = rows.map(row => {
        return row.replace(/&/g, " ").trim();
      });
      return "\n" + formattedRows.join("\n") + "\n";
    });
    clean = clean.replace(/\\begin\s*\{align\*?\}([\s\S]*?)\\end\s*\{align\*?\}/g, (match, body) => {
      const rows = body.split(/\\\\|\n/).map(row => row.trim()).filter(Boolean);
      const formattedRows = rows.map(row => {
        return row.replace(/&/g, " ").trim();
      });
      return "\n" + formattedRows.join("\n") + "\n";
    });

    // Parse arrays: \begin{array}{...} ... \end{array}
    clean = clean.replace(/\\begin\s*\{array\}\s*\{[^}]*\}([\s\S]*?)\\end\s*\{array\}/g, (match, body) => {
      const rows = body.split(/\\\\|\n/).map(row => row.trim()).filter(Boolean);
      const formattedRows = rows.map(row => {
        if (row.includes("\\hline")) {
          return "────────────────────────────────────────";
        }
        const cols = row.split("&").map(c => c.trim());
        return cols.join("   |   ");
      });
      return "\n" + formattedRows.join("\n") + "\n";
    });

    // Normalize commonly garbled LaTeX escape sequences from JSON parsing
    clean = clean.replaceAll("\\neq", "≠");
    clean = clean.replaceAll("\\beta", "β");
    clean = clean.replaceAll("\\theta", "θ");
    clean = clean.replaceAll("\\times", "×");
    clean = clean.replaceAll("\\to", "→");
    
    // Strip sizing and boundaries sizing
    clean = clean.replace(/\\(left|right|big|Big|bigg|Big)/g, "");

    // Clean up specific common raw display variants
    clean = clean.replaceAll(", ext", "");
    clean = clean.replaceAll(",ext", "");
    clean = clean.replaceAll(", ", " ");

    // Strip LaTeX math delimiters
    clean = clean.replaceAll("$$", "");
    clean = clean.replaceAll("$", "");
    
    // Replace degree symbols cleanly without affecting English words
    clean = clean.replace(/(\^\\?circ|\\circ|\^?\{\\?circ\})/g, "°");

    // Strip LaTeX formatting wrappers (e.g. \text{...}, \mathrm{...})
    clean = clean.replace(/\\text\s*\{([^}]+)\}/g, "$1");
    clean = clean.replace(/\\mathrm\s*\{([^}]+)\}/g, "$1");
    clean = clean.replace(/\\mathrm/g, "");
    clean = clean.replace(/\\mathbf\s*\{([^}]+)\}/g, "$1");
    clean = clean.replace(/\\mathbf/g, "");

    // Replace chemical reaction arrows
    clean = clean.replace(/\\xrightarrow\s*\{([^}]+)\}/g, " --($1)--> ");

    // 1. Fractions: \frac{A}{B} -> (A)/(B)
    const fracRegex = /\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g;
    while (fracRegex.test(clean)) {
      clean = clean.replace(fracRegex, "($1)/($2)");
    }
    // Simple fractions without braces if any (e.g. \frac A B)
    clean = clean.replace(/\\frac\s*([a-zA-Z0-9])\s*([a-zA-Z0-9])/g, "($1)/($2)");

    // Strip curly braces from subscripts/superscripts
    clean = clean.replace(/_\{([^}]+)\}/g, "_$1");
    clean = clean.replace(/\^\{([^}]+)\}/g, "^$1");

    // 2. Convert subscripts: e.g. _1 -> ₁ or _{max} -> ₘₐₓ
    clean = clean.replace(/_\{?([0-9+\-nxyzabcdfghijklmnoprstuvwyz\(\)]+)\}?/g, (match, p1) => {
      const charMap = {
        "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
        "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
        "+": "₊", "-": "₋", "n": "ₙ", "x": "ₓ", "y": "ᵧ",
        "i": "ᵢ", "j": "ⱼ", "n": "ₙ", "m": "ₘ", "t": "ₜ",
        "a": "ₐ", "b": "♭", "c": "꜀", "d": "ᵈ", "e": "ₑ",
        "f": "բ", "g": "₉", "h": "ₕ", "k": "ₖ", "l": "ₗ",
        "o": "ₒ", "p": "ₚ", "r": "ᵣ", "s": "ₛ", "u": "ᵤ",
        "v": "ᵥ"
      };
      return p1.split("").map(c => charMap[c] || c).join("");
    });

    // 3. Convert superscripts: e.g. ^2 -> ² or ^{-2} -> ⁻²
    clean = clean.replace(/\^\{?([0-9+\-nxyzabcdfghijklmnoprstuvwyz\(\)]+)\}?/g, (match, p1) => {
      const charMap = {
        "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
        "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
        "+": "⁺", "-": "⁻", "n": "ⁿ", "x": "ˣ", "y": "ʸ",
        "(": "⁽", ")": "⁾", "a": "ᵃ", "b": "ᵇ", "c": "ᶜ",
        "d": "ᵈ", "e": "ᵉ", "f": "ᶠ", "g": "ᵍ", "h": "ʰ",
        "i": "ⁱ", "j": "ʲ", "k": "ᵏ", "l": "ˡ", "m": "ᵐ",
        "p": "ᵖ", "r": "ʳ", "s": "ˢ", "t": "ᵗ", "u": "ᵘ",
        "v": "ᵛ", "w": "ʷ", "z": "ᶻ"
      };
      return p1.split("").map(c => charMap[c] || c).join("");
    });

    // Remove backslashes from common trig/math functions
    clean = clean.replace(/\\(sin|cos|tan|sec|csc|cot|log|ln|arcsin|arccos|arctan)/g, "$1");

    // Clean escaped underscores to normal underscores
    clean = clean.replace(/\\_/g, "_");

    // 4. Standard LaTeX symbols to Unicode
    const symbolMap = {
      "\\propto": "∝",
      "\\to": "→",
      "\\lim": "lim",
      "\\theta": "θ",
      "\\alpha": "α",
      "\\beta": "β",
      "\\gamma": "γ",
      "\\lambda": "λ",
      "\\pi": "π",
      "\\infty": "∞",
      "\\Delta": "Δ",
      "\\partial": "∂",
      "\\int": "∫",
      "\\sigma": "σ",
      "\\omega": "ω",
      "\\Omega": "Ω",
      "\\phi": "φ",
      "\\psi": "ψ",
      "\\Psi": "Ψ",
      "\\mu": "μ",
      "\\epsilon": "ε",
      "\\hbar": "ℏ",
      "\\cdot": "·",
      "\\times": "×",
      "\\pm": "±",
      "\\le": "≤",
      "\\ge": "≥",
      "\\neq": "≠",
      "\\approx": "≈",
      "\\sum": "∑",
      "\\implies": "⟹",
      "\\div": "÷",
      "\\tau": "τ",
      "\\eta": "η",
      "\\nabla": "∇",
      "\\cap": "∩",
      "\\cup": "∪",
      "\\in": "∈",
      "\\notin": "∉",
      "\\emptyset": "∅",
      "\\subset": "⊂",
      "\\subseteq": "⊆",
      "\\exists": "∃",
      "\\forall": "∀",
      "\\land": "∧",
      "\\iff": "⇔",
      "\\Leftrightarrow": "⇔",
      "\\Rightarrow": "⇒",
      "\\quad": "  ",
      "\\chi": "χ",
      "\\oint": "∮",
      "\\iint": "∬",
      "\\iiint": "∭",
      "\\cdots": "···",
      "\\dots": "...",
      "\\ldots": "..."
    };
    Object.entries(symbolMap).forEach(([latex, unicode]) => {
      const escapedLatex = latex.replace(/\\/g, "\\\\");
      clean = clean.replaceAll(new RegExp(escapedLatex, "g"), unicode);
    });

    // 5. Square root: \sqrt{x} -> √(x)
    const sqrtRegex = /\\sqrt\s*\{([^{}]+)\}/g;
    while (sqrtRegex.test(clean)) {
      clean = clean.replace(sqrtRegex, "√($1)");
    }

    return clean;
  };

  // --- Active Test Handlers ---
  const handleStartTest = async (subjectName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/tests/generate", {
        student_id: user.id || "guest",
        subject: subjectName
      });
      
      const pool = res.data;
      setQuestionsPool(pool);
      setActiveSubject(subjectName);
      
      // Initialize first question (Medium difficulty)
      const firstQ = pool["Medium"][0];
      setQuestionsFaced([firstQ]);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      
      setCurrentDifficulty("Medium");
      setCorrectStreak(0);
      setIncorrectStreak(0);
      
      // Setup timer
      setTimeLeft(1200); 
      setTestActive(true);
      setResults(null);
      setUserAnswers({});

    } catch (err) {
      console.error(err);
      setError("Failed to generate test pool. Please make sure the FastAPI server is active.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartCustomTest = async (subjectOverride = null, topicsOverride = null) => {
    const targetSubject = typeof subjectOverride === "string" ? subjectOverride : customSubject;
    const targetTopics = typeof topicsOverride === "string" ? topicsOverride : customTopics;

    if (!targetTopics || !targetTopics.trim()) {
      setError("Please specify at least one weak topic for synthesis.");
      return;
    }
    setCinematicLoading(true);
    setError(null);
    try {
      const res = await api.post("/tests/generate-custom", {
        student_id: user.id || "guest",
        subject: targetSubject,
        topics: targetTopics
      });
      
      const pool = res.data;
      setQuestionsPool(pool);
      setActiveSubject(targetSubject);
      
      // Initialize first question (Medium difficulty)
      const firstQ = pool["Medium"][0];
      setQuestionsFaced([firstQ]);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      
      setCurrentDifficulty("Medium");
      setCorrectStreak(0);
      setIncorrectStreak(0);
      
      // Setup timer
      setTimeLeft(1200); 
      setTestActive(true);
      setResults(null);
      setUserAnswers({});

    } catch (err) {
      console.error(err);
      setError("Failed to synthesize custom test. Please verify Groq configuration and API server status.");
    } finally {
      setCinematicLoading(false);
    }
  };

  // Auto-trigger retest on mount if query parameters are present
  useEffect(() => {
    if (isRetesting) {
      localStorage.removeItem("edumind_mock_results");
      localStorage.removeItem("edumind_mock_active_subject");
      localStorage.removeItem("edumind_mock_explanations");
      localStorage.removeItem("edumind_mock_labels");
      localStorage.removeItem("edumind_mock_confidence");
      
      handleStartCustomTest(retestSubject, retestTopic || "");
      navigate("/mock-tests", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer loop
  useEffect(() => {
    if (testActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && testActive) {
      handleForceSubmit();
    }

    return () => clearInterval(timerRef.current);
  }, [testActive, timeLeft]);

  // Cinematic logs cycling loop
  useEffect(() => {
    let interval;
    if (cinematicLoading) {
      setCinematicLogIndex(0);
      interval = setInterval(() => {
        setCinematicLogIndex(prev => (prev + 1) % LOADING_LOGS.length);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [cinematicLoading]);

  const handleForceSubmit = () => {
    handleSubmitTest(true);
  };

  const fetchHistoryList = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get(`/students/performance/${user.id || "guest"}`);
      setHistoryList(res.data || []);
    } catch (err) {
      console.error("Failed to load test history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showHistoryModal && user.id) {
      fetchHistoryList();
    }
  }, [showHistoryModal, user.id]);

  const handleOptionSelect = (idx) => {
    setSelectedOption(idx);
  };

  const handleNextQuestion = () => {
    if (selectedOption === null) return;

    const currentQ = questionsFaced[currentQuestionIndex];
    
    // 1. Record answer
    const newAnswers = { ...userAnswers, [currentQ.id]: selectedOption };
    setUserAnswers(newAnswers);

    // 2. Evaluate answer correctness locally to update streaks
    const isCorrect = (selectedOption === currentQ.correct_index);
    
    let newCorrectStreak = correctStreak;
    let newIncorrectStreak = incorrectStreak;
    let newDifficulty = currentDifficulty;

    if (isCorrect) {
      newCorrectStreak += 1;
      newIncorrectStreak = 0;
    } else {
      newIncorrectStreak += 1;
      newCorrectStreak = 0;
    }

    // 3. Apply 2-streak difficulty steering rule
    if (newCorrectStreak === 2) {
      if (currentDifficulty === "Easy") newDifficulty = "Medium";
      else if (currentDifficulty === "Medium") newDifficulty = "Hard";
      // Reset streak after transition
      newCorrectStreak = 0;
    } else if (newIncorrectStreak === 2) {
      if (currentDifficulty === "Hard") newDifficulty = "Medium";
      else if (currentDifficulty === "Medium") newDifficulty = "Easy";
      // Reset streak after transition
      newIncorrectStreak = 0;
    }

    // 4. Load next question
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < 10) {
      // Get set of already served question IDs
      const servedIds = new Set(questionsFaced.map(q => q.id));
      
      // Try the target difficulty pool first
      let nextQ = questionsPool[newDifficulty]?.find(q => !servedIds.has(q.id));
      
      if (!nextQ) {
        // Fallback to other difficulties if target pool is exhausted
        const fallbacks = {
          Hard: ["Medium", "Easy"],
          Medium: ["Hard", "Easy"],
          Easy: ["Medium", "Hard"]
        };
        for (const fallbackDiff of fallbacks[newDifficulty] || []) {
          nextQ = questionsPool[fallbackDiff]?.find(q => !servedIds.has(q.id));
          if (nextQ) {
            newDifficulty = fallbackDiff; // Update current difficulty to match the actual question served
            break;
          }
        }
      }

      // Update states
      setCurrentDifficulty(newDifficulty);
      setCorrectStreak(newCorrectStreak);
      setIncorrectStreak(newIncorrectStreak);
      
      // Serve question
      if (nextQ) {
        setQuestionsFaced(prev => [...prev, nextQ]);
      }
      setCurrentQuestionIndex(nextIndex);
      setSelectedOption(null);
    } else {
      // Complete test
      handleSubmitTest(false, newAnswers);
    }
  };

  const handleSubmitTest = async (isTimeOut = false, finalAnswers = userAnswers) => {
    setLoading(true);
    clearInterval(timerRef.current);
    
    // Ensure all remaining unanswered questions get logged as missed (-1)
    const answersPayload = { ...finalAnswers };
    questionsFaced.forEach(q => {
      if (answersPayload[q.id] === undefined) {
        answersPayload[q.id] = -1;
      }
    });

    const timeSpent = 1200 - timeLeft;
    const isCustomQuiz = questionsFaced.some(q => q.id && q.id.toString().startsWith("custom"));

    try {
      const res = await api.post("/tests/submit", {
        student_id: user.id || "guest",
        subject: activeSubject,
        answers: answersPayload,
        time_taken_seconds: timeSpent > 0 ? timeSpent : 1,
        ...(isCustomQuiz ? { questions: questionsFaced } : {})
      });

      setResults(res.data);
      setTestActive(false);
    } catch (err) {
      console.error(err);
      setError("Failed to grade test submission. Please verify API server status.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveSubject(null);
    setTestActive(false);
    setResults(null);
    setError(null);
    localStorage.removeItem("edumind_mock_results");
    localStorage.removeItem("edumind_mock_active_subject");
    localStorage.removeItem("edumind_mock_explanations");
    localStorage.removeItem("edumind_mock_labels");
    localStorage.removeItem("edumind_mock_confidence");
  };

  // Timer formatter
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case "Easy": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "Medium": return "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
      case "Hard": return "text-purple-400 border-purple-500/30 bg-purple-500/10";
      default: return "text-gray-400 border-gray-500/30 bg-gray-500/10";
    }
  };
  // --- Adaptive Remediation Stats calculations ---
  const wrongQuestions = results?.graded_details?.filter(q => !q.is_correct) || [];
  const totalIncorrect = wrongQuestions.length;

  // Group wrong questions by topic
  const topicMistakes = {};
  wrongQuestions.forEach(q => {
    if (!topicMistakes[q.topic]) {
      topicMistakes[q.topic] = {
        topic: q.topic,
        count: 0
      };
    }
    topicMistakes[q.topic].count += 1;
  });

  const topicHeatmap = Object.values(topicMistakes).map(item => {
    let vulnerability = "Low";
    let colorClass = "text-yellow-400 border-yellow-500/20 bg-yellow-500/10";
    let priorityModifier = 15;
    
    if (item.count >= 3) {
      vulnerability = "High";
      colorClass = "text-red-400 border-red-500/20 bg-red-500/10";
      priorityModifier = 50;
    } else if (item.count === 2) {
      vulnerability = "Medium";
      colorClass = "text-orange-400 border-orange-500/20 bg-orange-500/10";
      priorityModifier = 30;
    } else {
      vulnerability = "Low";
      colorClass = "text-yellow-400 border-yellow-500/20 bg-yellow-500/10";
      priorityModifier = 15;
    }
    
    const basePriority = item.count * 20;
    const priorityScore = Math.min(100, basePriority + priorityModifier);
    
    return {
      ...item,
      vulnerability,
      colorClass,
      priorityScore
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div className="w-full min-h-screen text-white relative py-12 px-6 lg:px-16 overflow-y-auto" style={{ background: "#030014" }}>
      
      {/* Background radial orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/5 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 blur-[130px] rounded-full pointer-events-none" />

      {/* Floating particles */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />

      <div className="max-w-4xl mx-auto relative z-10 w-full">
        
        {/* Header navigation */}
        {!testActive && (
          <header className="flex justify-between items-center mb-10">
            <button 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>📝</div>
              <span className="text-sm font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400" style={{ fontFamily: "Poppins" }}>
                EduMind Tests
              </span>
            </div>
          </header>
        )}

        {/* --- VIEW 1: TEST LAUNCHPAD --- */}
        {!testActive && !results && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center">
              <span className="px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase bg-purple-500/10 border border-purple-500/30 text-purple-300">
                COGNITIVE EVALUATION SUITE
              </span>
              <h1 className="text-3xl font-extrabold mt-3 tracking-tight" style={{ fontFamily: "Poppins" }}>
                Adaptive Mock Tests
              </h1>
              <p className="text-xs text-gray-400 mt-2 max-w-2xl mx-auto leading-relaxed">
                Calibrate your performance via dynamic stream assessments, or use the ARIA Topic Booster to generate targeted diagnostics from your specific weak syllabus nodes.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3 text-red-400 text-xs">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Standard calibration (7 columns) */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1 font-mono">
                  Standard Stream Calibration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {SUBJECTS.map((s, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -3, scale: 1.01 }}
                      className="p-5 rounded-2xl border bg-white/2 border-white/5 backdrop-blur-md relative overflow-hidden flex flex-col justify-between"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-3xl">{s.icon}</span>
                          <span className={`text-[9px] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-md border bg-white/5 ${s.color} ${s.border}`}>
                            {s.name}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mb-2" style={{ fontFamily: "Poppins" }}>
                          {s.name} Calibration
                        </h3>
                        <p className="text-xs text-gray-500 leading-normal min-h-[38px]">
                          {s.topics}
                        </p>
                      </div>

                      <button
                        onClick={() => handleStartTest(s.name)}
                        disabled={loading}
                        className="w-full mt-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform cursor-pointer"
                        style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        {loading ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-t-white border-r-transparent animate-spin" />
                        ) : (
                          <>
                            Initialize Session <ChevronRight size={13} />
                          </>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right Column: ARIA Dynamic Topic Booster (5 columns) */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-1 font-mono">
                  AI Dynamic Synthesis
                </h3>
                <motion.div
                  whileHover={{ y: -3 }}
                  className="p-6 rounded-3xl border border-purple-500/20 bg-white/2 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between"
                >
                  {/* Glowing background highlights */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 space-y-6">
                    
                    {/* Header with Pulsing AI Avatar */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        {/* Outer Ring */}
                        <motion.div 
                          className="absolute inset-0 rounded-full border border-dashed border-purple-500/50"
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                        />
                        {/* Inner Ring */}
                        <motion.div 
                          className="absolute inset-2 rounded-full border border-dashed border-cyan-500/45"
                          animate={{ rotate: -360 }}
                          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                        />
                        {/* Pulse Center */}
                        <motion.div 
                          className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20"
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        >
                          <Sparkles size={16} className="text-white" />
                        </motion.div>
                      </div>
                      
                      <div>
                        <h4 className="text-base font-extrabold text-white flex items-center gap-1.5" style={{ fontFamily: "Poppins" }}>
                          Professor ARIA
                        </h4>
                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider font-mono">
                          Topic Booster Suite
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed">
                      Target your exact weaknesses. Input your weak topics and select a subject stream; Professor ARIA will dynamically generate a calibrated 12-question diagnostic.
                    </p>

                    {/* Subject Selector */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest block font-mono">
                        Target Subject
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { name: "Physics", icon: "⚡" },
                          { name: "Chemistry", icon: "🧪" },
                          { name: "Mathematics", icon: "∫", label: "Math" },
                          { name: "Biology", icon: "🧬" }
                        ].map((s) => {
                          const isSelected = customSubject === s.name;
                          return (
                            <button
                              key={s.name}
                              type="button"
                              onClick={() => setCustomSubject(s.name)}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 cursor-pointer ${
                                isSelected 
                                  ? "bg-white/5 text-white font-bold"
                                  : "bg-white/1 border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/10"
                              }`}
                              style={isSelected ? {
                                borderColor: s.name === "Physics" ? "#a855f7" : s.name === "Chemistry" ? "#06b6d4" : s.name === "Mathematics" ? "#10b981" : "#f59e0b",
                                boxShadow: `0 0 12px ${s.name === "Physics" ? "rgba(168, 85, 247, 0.12)" : s.name === "Chemistry" ? "rgba(6, 182, 212, 0.12)" : s.name === "Mathematics" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)"}`
                              } : {}}
                            >
                              <span className="text-sm">{s.icon}</span>
                              <span>{s.label || s.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Topics Input Box */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest block font-mono">
                        Weak Topics
                      </label>
                      <textarea
                        value={customTopics}
                        onChange={(e) => setCustomTopics(e.target.value)}
                        placeholder="e.g. Rotational Dynamics, pH calculations, Limits & Continuity"
                        className="w-full min-h-[90px] p-3 rounded-2xl bg-white/2 border border-white/10 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all leading-relaxed"
                      />
                    </div>

                    {/* Synthesize Button */}
                    <button
                      onClick={handleStartCustomTest}
                      disabled={loading || cinematicLoading || !customTopics.trim()}
                      className="w-full py-3 rounded-2xl text-xs font-black text-black bg-gradient-to-r from-purple-400 to-cyan-400 hover:scale-[1.01] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all cursor-pointer disabled:opacity-40 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      <Sparkles size={14} className="animate-pulse" />
                      Synthesize Assessment
                    </button>

                  </div>
                </motion.div>
              </div>

            </div>
          </motion.div>
        )}

        {/* --- VIEW 2: ACTIVE QUIZ WORKSPACE --- */}
        {testActive && questionsFaced.length > 0 && (
          <div className="space-y-6">
            
            {/* HUD Status Bar */}
            <div className="flex justify-between items-center p-4 rounded-2xl border border-white/5 bg-white/1 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Stream</p>
                  <p className="text-sm font-extrabold text-white flex items-center gap-1">
                    <span>{activeSubject}</span>
                  </p>
                </div>
                
                {/* Current Difficulty */}
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Difficulty</p>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getDifficultyColor(currentDifficulty)}`}>
                    {currentDifficulty}
                  </span>
                </div>

                {/* Adaptive Streak Indicator */}
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Adaptation Streak</p>
                  <div className="flex gap-1 items-center">
                    {/* Correct Streak Dots */}
                    <div className="flex gap-0.5 mr-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full border border-emerald-500/40 transition-colors duration-300 ${correctStreak >= 1 ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-transparent"}`} />
                      <div className={`w-2.5 h-2.5 rounded-full border border-emerald-500/40 transition-colors duration-300 ${correctStreak >= 2 ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-transparent"}`} />
                      <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider ml-1">Up</span>
                    </div>

                    {/* Incorrect Streak Dots */}
                    <div className="flex gap-0.5 border-l border-white/10 pl-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full border border-red-500/40 transition-colors duration-300 ${incorrectStreak >= 1 ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-transparent"}`} />
                      <div className={`w-2.5 h-2.5 rounded-full border border-red-500/40 transition-colors duration-300 ${incorrectStreak >= 2 ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : "bg-transparent"}`} />
                      <span className="text-[8px] text-red-400 font-bold uppercase tracking-wider ml-1">Down</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <Clock size={14} className="animate-pulse" />
                <span className="text-xs font-bold font-mono">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Test Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                <span>Progress</span>
                <span>Question {currentQuestionIndex + 1} of 10</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400"
                  animate={{ width: `${(currentQuestionIndex + 1) * 10}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Question Card */}
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 rounded-3xl border border-white/5 bg-white/2 backdrop-blur-md relative overflow-hidden"
            >
              {/* Question Text */}
              <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 font-mono block mb-2">
                MODULE: {questionsFaced[currentQuestionIndex].topic}
              </span>
              <h2 className="text-base font-bold text-white leading-relaxed mb-6 font-serif">
                {cleanMathLaTeX(questionsFaced[currentQuestionIndex].text)}
              </h2>

              {/* Options list */}
              <div className="space-y-3">
                {questionsFaced[currentQuestionIndex].options.map((opt, i) => {
                  const letters = ["A", "B", "C", "D"];
                  const isSelected = selectedOption === i;
                  return (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.005 }}
                      onClick={() => handleOptionSelect(i)}
                      className="w-full p-4 rounded-2xl border text-left flex items-center gap-4 transition-all"
                      style={{
                        background: isSelected ? "rgba(168, 85, 247, 0.12)" : "rgba(255, 255, 255, 0.02)",
                        borderColor: isSelected ? "rgba(168, 85, 247, 0.35)" : "rgba(255, 255, 255, 0.06)",
                        boxShadow: isSelected ? "0 0 15px rgba(168, 85, 247, 0.05)" : "none"
                      }}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                        isSelected ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400"
                      }`}>
                        {letters[i]}
                      </div>
                      <span className="text-xs text-gray-300 font-medium font-serif leading-snug">
                        {cleanMathLaTeX(opt)}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Test Navigation Controls */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handleForceSubmit}
                className="px-5 py-2.5 rounded-xl text-xs text-gray-500 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 border border-transparent transition-all font-semibold"
              >
                Submit Early
              </button>

              <button
                onClick={handleNextQuestion}
                disabled={selectedOption === null}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-cyan-400 to-purple-500 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {currentQuestionIndex === 9 ? "Finish Evaluation" : "Next Question"}
                <ChevronRight size={14} />
              </button>
            </div>

          </div>
        )}

        {/* --- VIEW 3: SUMMARY & DETAILED RESULTS --- */}
        {results && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            
            {/* Score Summary Box */}
            <div className="p-8 rounded-3xl border border-white/5 bg-white/2 backdrop-blur-md text-center flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-purple-500/30 rounded-tl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/30 rounded-br-xl" />
              
              <span className="px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 mb-4">
                EVALUATION COMPLETED
              </span>
              
              <div className="flex gap-10 items-center justify-center my-4 flex-wrap">
                {/* Accuracy percentage */}
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Accuracy</p>
                  <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mt-1">{results.score}%</p>
                  <p className="text-xs text-gray-400 mt-1 font-semibold">({results.correct_answers} / {results.total_questions} correct)</p>
                </div>

                <div className="h-10 w-px bg-white/10 hidden md:block" />

                {/* Score Projection */}
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Predicted Exam Score</p>
                  <p className="text-5xl font-black text-white mt-1 flex items-center gap-1 justify-center">
                    {results.predicted_exam_score}%
                    <span className="text-[9px] font-black uppercase text-cyan-400 font-mono tracking-widest border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 rounded-md">ML</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Calibrated 30-day index</p>
                </div>
              </div>

              {/* Recommendation Action Advice */}
              <div className="mt-6 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 max-w-xl text-left">
                <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={13} className="text-purple-400 animate-pulse" />
                  ARIA Remediation Advice
                </h4>
                <p className="text-[13px] text-gray-300 leading-relaxed font-sans">
                  {(() => {
                    const wrongQuestions = results.graded_details.filter(q => !q.is_correct);
                    const wrongTopics = [...new Set(wrongQuestions.map(q => q.topic))];
                    
                    if (results.score === 100) {
                      return `Flawless score! You demonstrated complete conceptual mastery across all tested syllabus nodes. Continue benchmarking your performance with higher difficulty tiers or alternative subjects.`;
                    }
                    
                    const topicsListText = wrongTopics.join(", ");
                    
                    if (results.score >= 80) {
                      return `Great performance! However, you showed slight vulnerability in: ${topicsListText}. Reviewing the pedagogical derivations for these specific topics will solidify your concepts for a perfect score.`;
                    } else if (results.score >= 50) {
                      return `Solid baseline established, but key gaps remain in: ${topicsListText}. We recommend focusing on the step-by-step math derivations below to resolve these topics.`;
                    } else {
                      return `High conceptual vulnerability detected in this stream, specifically in: ${topicsListText}. We suggest pausing new tests on this subject, bookmarking these worksheets, and re-visiting the core chapter notes first.`;
                    }
                  })()}
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1.5"
                >
                  <RefreshCw size={13} /> Try Another Stream
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-black bg-white hover:scale-105 transition-all"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>

            {/* AI-Driven Adaptive Remediation & Diagnostic Dashboard HUD */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Weak-Topic Heatmap & priority scores */}
              <div className="p-6 rounded-3xl border border-white/5 bg-white/2 backdrop-blur-md relative overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-lg">🗺️</span>
                  <h3 className="text-sm font-bold text-white tracking-wider font-mono">
                    WEAK-TOPIC HEATMAP &amp; PRIORITIES
                  </h3>
                </div>

                {topicHeatmap.length === 0 ? (
                  <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-center text-xs text-emerald-400 font-semibold">
                    🏆 Zero weak topics detected! Excellent conceptual alignment.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topicHeatmap.map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-4 rounded-xl border border-white/5 bg-white/1 space-y-2.5 transition-all hover:bg-white/2"
                      >
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-white">{item.topic}</h4>
                            <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                              {item.count} mistake{item.count > 1 ? "s" : ""} recorded
                            </p>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${item.colorClass}`}>
                            {item.vulnerability} Risk
                          </span>
                        </div>

                        {/* Priority bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] font-bold">
                            <span className={
                              item.priorityScore >= 70 ? "text-red-400" :
                              item.priorityScore >= 40 ? "text-orange-400" :
                              "text-yellow-400"
                            }>
                              {item.priorityScore >= 70 ? "⚡ CRITICAL REMEDIATION REQUIRED" :
                               item.priorityScore >= 40 ? "🔍 CONCEPT REVIEW RECOMMENDED" :
                               "✏️ PRACTICE REFINEMENT"}
                            </span>
                            <span className="text-gray-400">{item.priorityScore}/100</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                            <motion.div 
                              className={`h-full ${
                                item.priorityScore >= 70 ? "bg-red-500" :
                                item.priorityScore >= 40 ? "bg-orange-500" :
                                "bg-yellow-500"
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${item.priorityScore}%` }}
                              transition={{ duration: 0.8 }}
                            />
                          </div>
                        </div>

                        {/* Launch Course button */}
                        {TOPIC_REMEDIATION_MAP[item.topic] && (
                          <button
                            onClick={() => {
                              const { courseId, lessonId } = TOPIC_REMEDIATION_MAP[item.topic];
                              navigate(`/courses?courseId=${courseId}&lessonId=${lessonId}&from=mock-tests`);
                            }}
                            className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1 transition-all"
                          >
                            <BookOpen size={10} /> Launch Workspace in Courses
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Adaptive Retesting Assessment Panel */}
              <div className="p-6 rounded-3xl border border-purple-500/10 bg-purple-500/2 backdrop-blur-md relative overflow-hidden text-center flex flex-col items-center justify-center">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-purple-500/20 rounded-tl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/20 rounded-br-xl" />
                
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 mb-3">
                  ADAPTIVE RETEST ENGINE
                </span>

                <h3 className="text-sm font-extrabold text-white mb-2">
                  Targeted Weak Area Remediation
                </h3>
                
                <p className="text-xs text-gray-400 leading-relaxed max-w-sm mb-6 font-sans">
                  Once you review your mistakes, generate a targeted 5-question adaptive assessment focused precisely on your weak topics: <span className="text-gray-300 font-semibold">{topicHeatmap.map(t => t.topic).slice(0, 3).join(", ")}{topicHeatmap.length > 3 ? "..." : ""}</span>.
                </p>

                <button
                  onClick={handleRetrySimilar}
                  disabled={retestLoading || topicHeatmap.length === 0}
                  className="w-full py-3 rounded-2xl text-xs font-bold text-black bg-gradient-to-r from-cyan-400 to-purple-500 hover:scale-102 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                >
                  {retestLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Synthesizing Adaptive Test...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={12} />
                      <span>Retry Similar Questions</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="w-full mt-3 py-2.5 rounded-2xl text-xs font-bold text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>📋</span>
                  <span>View Assessment History</span>
                </button>
              </div>

            </div>

            {/* Answer Key Analysis */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-1.5">
                <Zap size={14} className="text-cyan-400" />
                Question Analysis
              </h3>

              <div className="space-y-4">
                {results.graded_details.map((q, idx) => (
                  <div 
                    key={idx}
                    className="p-5 rounded-2xl border text-left space-y-3 relative overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.01)",
                      borderColor: q.is_correct ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"
                    }}
                  >
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] text-purple-400 font-black font-mono">Q{idx + 1}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                          q.is_correct ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                          {q.is_correct ? "Correct" : "Incorrect"}
                        </span>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">{q.topic}</span>
                      </div>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-gray-300 font-serif leading-relaxed">
                      {cleanMathLaTeX(q.text)}
                    </p>

                    {/* Option Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[13px] pt-1">
                      <div className="p-2.5 rounded-lg bg-white/3 border border-white/5 text-gray-300 font-serif leading-snug">
                        <span className="text-gray-400 font-black mr-1">Your choice:</span> 
                        {q.chosen_index === -1 ? "[No Answer]" : cleanMathLaTeX(q.options[q.chosen_index])}
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-200 font-serif leading-snug">
                        <span className="text-emerald-500/40 font-black mr-1">Correct Answer:</span> 
                        {cleanMathLaTeX(q.options[q.correct_index])}
                      </div>
                    </div>

                    {/* Solution */}
                    <div className="p-4 rounded-xl bg-purple-950/10 border border-purple-500/10 text-[13px] text-gray-200 font-sans leading-relaxed mt-2">
                      <span className="text-purple-300 font-bold block mb-1">Pedagogical Derivation:</span>
                      {cleanMathLaTeX(q.solution)}
                    </div>

                    {/* Remediation Action Link */}
                    {!q.is_correct && TOPIC_REMEDIATION_MAP[q.topic] && (
                      <div className="mt-2.5 flex justify-end">
                        <button
                          onClick={() => {
                            const { courseId, lessonId } = TOPIC_REMEDIATION_MAP[q.topic];
                            navigate(`/courses?courseId=${courseId}&lessonId=${lessonId}&from=mock-tests`);
                          }}
                          className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-all"
                        >
                          <BookOpen size={11} />
                          Review Lesson in Workspace
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        )}

      </div>

      {/* Full-screen Holographic Calibration Cinematic Loader */}
      <AnimatePresence>
        {cinematicLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-xl bg-[#030014]/90 text-white"
          >
            {/* Holographic background scanner beam */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-pulse pointer-events-none" />

            <div className="relative flex flex-col items-center max-w-sm px-6 text-center space-y-8">
              
              {/* Spinner HUD Rings */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* Outer Ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-dashed border-purple-500/40"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                />
                {/* Middle Ring with glowing notch */}
                <motion.div
                  className="absolute inset-3 rounded-full border-t-2 border-r-2 border-transparent border-t-cyan-400 border-r-cyan-400/50"
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                />
                {/* Inner Ring */}
                <motion.div
                  className="absolute inset-6 rounded-full border border-dashed border-purple-400/30"
                  animate={{ rotate: 180 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                />
                {/* Center Pulsing Aura */}
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center"
                  animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <Sparkles size={20} className="text-cyan-300 animate-pulse" />
                </motion.div>
              </div>

              {/* Cycling Status Logs */}
              <div className="space-y-3">
                <h3 className="text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 uppercase font-mono">
                  Synthesizing Assessment
                </h3>
                
                <div className="h-10 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={cinematicLogIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-gray-400 font-mono tracking-wide"
                    >
                      {LOADING_LOGS[cinematicLogIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="w-48 h-1 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 8, ease: "easeInOut" }}
                />
              </div>

             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assessment History Modal Overlay */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl p-6 rounded-3xl border border-white/10 bg-[#0c051a]/95 text-white shadow-2xl max-h-[85vh] flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-sm font-bold p-2 hover:bg-white/5 rounded-full"
              >
                ✕
              </button>

              <div className="mb-6">
                <h3 className="text-base font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 uppercase font-mono">
                  Assessment History & Feedback Log
                </h3>
                <p className="text-xs text-gray-400 mt-1">Review your past evaluations, scores, and cognitive performance summaries.</p>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-t-purple-500 border-r-transparent animate-spin mb-2" />
                    <span className="text-xs text-gray-500 font-mono">Retrieving cognitive database files...</span>
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="p-8 border border-white/5 bg-white/2 rounded-2xl text-center text-xs text-gray-500">
                    No mock tests or quizzes recorded yet. Take your first test to see your history logs.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyList.map((q, idx) => {
                      let attemptedAtStr = q.attempted_at;
                      if (attemptedAtStr && !attemptedAtStr.endsWith("Z") && !attemptedAtStr.includes("+") && !attemptedAtStr.includes("GMT")) {
                        attemptedAtStr = attemptedAtStr + "Z";
                      }
                      const date = new Date(attemptedAtStr);
                      const formattedDate = date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      });

                      // Performance classification
                      let scoreColor = "text-red-400 border-red-500/20 bg-red-500/10";
                      let diagnosticNote = "Critical Review Needed. High conceptual vulnerability detected. Pause testing and re-visit lecture notes.";
                      
                      if (q.score >= 80) {
                        scoreColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
                        diagnosticNote = "Conceptual Mastery. Demonstration of complete logic flow. Ready for advanced modules.";
                      } else if (q.score >= 50) {
                        scoreColor = "text-orange-400 border-orange-500/20 bg-orange-500/10";
                        diagnosticNote = "Foundations Established. Minor conceptual gaps detected. Focus on pedagogical derivations.";
                      }

                      return (
                        <div 
                          key={idx} 
                          className="p-4 rounded-2xl border border-white/5 bg-white/1 space-y-2.5 transition-all hover:bg-white/2"
                        >
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-white">{q.subject}</span>
                                <span className="text-[10px] text-gray-500 font-semibold font-mono">({q.topic || "Practice Quiz"})</span>
                              </div>
                              <span className="text-[10px] text-gray-500 font-mono">{formattedDate}</span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <span className="text-[10px] text-gray-400 font-mono">
                                {q.correct_answers} / {q.total_questions} correct
                              </span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase font-mono ${scoreColor}`}>
                                {q.score}%
                              </span>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 text-[11px] text-gray-300 leading-normal">
                            <span className="font-bold text-purple-300 block mb-0.5 font-mono text-[9px] uppercase tracking-wider">ARIA Diagnosis</span>
                            {diagnosticNote}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 text-right">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-white hover:scale-102 transition-all"
                >
                  Close History
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
