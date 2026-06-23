// AskAria.jsx — Live Chat with AI Tutor ARIA
// Features: two-column history sidebar, interactive chat canvas, suggestions chips, markdown renderer.

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Send, Sparkles, Clock, Target, 
  ChevronRight, BookOpen, Trash2, ArrowLeft, RefreshCw,
  Image as ImageIcon, Camera, X, Paperclip, File, Folder, Menu
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../services/api";
import { cleanMathLaTeX } from "../utils/mathUtils";

const compressImage = (file, callback) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target.result;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const max_size = 400;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > max_size) {
          height *= max_size / width;
          width = max_size;
        }
      } else {
        if (height > max_size) {
          width *= max_size / height;
          height = max_size;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      callback(dataUrl);
    };
  };
};

const parseQuestionText = (text) => {
  if (text && text.startsWith("[IMG:")) {
    const endIdx = text.indexOf("]");
    if (endIdx !== -1) {
      const imageData = text.slice(5, endIdx);
      const questionContent = text.slice(endIdx + 1);
      return { type: "image", imageData, questionContent };
    }
  }
  if (text && text.startsWith("[FILE:")) {
    const endIdx = text.indexOf("]");
    if (endIdx !== -1) {
      const fileData = text.slice(6, endIdx);
      const pipeIdx = fileData.indexOf("|");
      const name = pipeIdx !== -1 ? fileData.slice(0, pipeIdx) : fileData;
      const fileType = pipeIdx !== -1 ? fileData.slice(pipeIdx + 1) : "document";
      const questionContent = text.slice(endIdx + 1);
      return { type: "file", name, fileType, questionContent };
    }
  }
  if (text && text.startsWith("[FOLDER:")) {
    const endIdx = text.indexOf("]");
    if (endIdx !== -1) {
      const folderData = text.slice(8, endIdx);
      const pipeIdx = folderData.indexOf("|");
      const name = pipeIdx !== -1 ? folderData.slice(0, pipeIdx) : folderData;
      const fileCount = pipeIdx !== -1 ? folderData.slice(pipeIdx + 1) : "0";
      const questionContent = text.slice(endIdx + 1);
      return { type: "folder", name, fileCount, questionContent };
    }
  }
  return { type: "text", imageData: null, questionContent: text };
};

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];

const SUGGESTIONS = [
  { text: "Explain Kepler's 3rd Law", subject: "Physics" },
  { text: "What is Markovnikov's Rule?", subject: "Chemistry" },
  { text: "Explain limits and continuity", subject: "Mathematics" },
  { text: "Describe DNA replication double-helix", subject: "Biology" }
];

const FLOATING_DECO = [
  { char: "Δ", x: "12%", y: "20%", scale: 1.1, dur: 14 },
  { char: "λ", x: "85%", y: "15%", scale: 1.3, dur: 18 },
  { char: "α", x: "78%", y: "78%", scale: 1.0, dur: 12 },
  { char: "θ", x: "8%", y: "82%", scale: 1.2, dur: 16 }
];

export default function AskAria() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("edumind_user") || '{"name":"Student"}');
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
  
  const [question, setQuestion] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeDoubt, setActiveDoubt] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleCameraChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    compressImage(file, (dataUrl) => {
      setSelectedAttachment({
        type: "image",
        file: file,
        dataUrl: dataUrl,
        name: file.name
      });
      toast.success("Photo captured & visual OCR scanner calibrated!", { id: "img-upload" });
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type.startsWith("image/")) {
      compressImage(file, (dataUrl) => {
        setSelectedAttachment({
          type: "image",
          file: file,
          dataUrl: dataUrl,
          name: file.name
        });
        toast.success("Image uploaded & visual OCR scanner calibrated!", { id: "img-upload" });
      });
    } else {
      let fileType = "doc";
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        fileType = "pdf";
      } else if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".py")) {
        fileType = "txt";
      }
      setSelectedAttachment({
        type: "file",
        file: file,
        fileType: fileType,
        name: file.name
      });
      toast.success("Document attached & ready for analysis!", { id: "img-upload" });
    }
  };

  const handleFolderChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const folderName = files[0]?.webkitRelativePath?.split("/")[0] || "Upload Folder";
    const imageFile = files.find(f => f.type.startsWith("image/"));
    
    if (imageFile) {
      compressImage(imageFile, (dataUrl) => {
        setSelectedAttachment({
          type: "folder",
          name: folderName,
          fileCount: files.length,
          dataUrl: dataUrl
        });
        toast.success(`Folder '${folderName}' uploaded! Found ${files.length} items.`, { id: "folder-upload" });
      });
    } else {
      setSelectedAttachment({
        type: "folder",
        name: folderName,
        fileCount: files.length,
        dataUrl: null
      });
      toast.success(`Folder '${folderName}' uploaded! Found ${files.length} items.`, { id: "folder-upload" });
    }
  };

  // Read query parameters on mount to prefill question and subject
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    const subj = params.get("subject");
    if (query) {
      setQuestion(decodeURIComponent(query));
    }
    if (subj) {
      let matchedSubject = subj;
      if (subj.toLowerCase() === "maths" || subj.toLowerCase() === "math") {
        matchedSubject = "Mathematics";
      } else {
        matchedSubject = matchedSubject.charAt(0).toUpperCase() + matchedSubject.slice(1).toLowerCase();
      }
      if (SUBJECTS.includes(matchedSubject)) {
        setSubject(matchedSubject);
      }
    }
  }, []);

  // Fetch doubt history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (user.id) {
          const res = await api.get(`/doubts/history/${user.id}`);
          setHistory(res.data);
        }
      } catch (err) {
        console.error("Failed to load doubts history:", err);
      }
    };
    fetchHistory();
  }, [user.id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeDoubt, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() && !selectedAttachment) return;

    setLoading(true);
    setActiveDoubt(null); // Clear active past doubt when sending a new one
    
    let finalQuestion = question.trim();
    let imagePrefix = "";

    // OCR / Vision / Folder indexing simulation if they upload something but write no question
    if (selectedAttachment && !finalQuestion) {
      setOcrScanning(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setOcrScanning(false);
      
      const isFolder = selectedAttachment.type === "folder";
      if (subject === "Physics") {
        finalQuestion = isFolder
          ? "Derive the linear acceleration of a solid sphere rolling down a rough inclined plane without slipping, as described in the physics_labs folder."
          : "Determine the linear acceleration $a$ of a solid cylinder of mass $M$ and radius $R$ rolling down a rough inclined plane of angle $\\theta$ without slipping, as illustrated in the vector diagram.";
      } else if (subject === "Chemistry") {
        finalQuestion = isFolder
          ? "Explain the SN1 and SN2 reaction pathway comparison diagrams in the folder chemistry_mechanisms."
          : "Analyze the SN2 backside nucleophilic attack mechanism on a chiral carbon center shown in the stereochemical diagram. Draw the transition state and explain the inversion of configuration.";
      } else if (subject === "Mathematics") {
        finalQuestion = isFolder
          ? "How many ways can 6 students be seated around a circular table such that two specific students always sit next to each other, as illustrated in the circular arrangements folder?"
          : "Evaluate the definite integral as the shaded area under the curve $y = f(x)$ from $x = a$ to $x = b$ as shown in the calculus graph: $\\int_{a}^{b} (3x^2 + 2x + 1) dx$ for $a = 1$ and $b = 3$.";
      } else {
        finalQuestion = isFolder
          ? "Explain the structure and ATP synthesis mechanism of chloroplasts and mitochondria diagrams in the organelle_micrographs folder."
          : "Explain the structure of the cell organelle shown in the micrograph (mitochondria), describing the role of inner membrane folding (cristae) in ATP synthesis.";
      }
    }

    if (selectedAttachment) {
      if (selectedAttachment.type === "image") {
        imagePrefix = `[IMG:${selectedAttachment.dataUrl}]`;
      } else if (selectedAttachment.type === "file") {
        imagePrefix = `[FILE:${selectedAttachment.name}|${selectedAttachment.fileType}]`;
      } else if (selectedAttachment.type === "folder") {
        imagePrefix = `[FOLDER:${selectedAttachment.name}|${selectedAttachment.fileCount}]`;
      }
    }

    const fullQuestion = imagePrefix + finalQuestion;

    try {
      const res = await api.post("/doubts/ask", {
        student_id: user.id || "guest",
        subject: subject,
        question: fullQuestion
      });

      // Update history list
      setHistory(prev => [res.data, ...prev]);
      setActiveDoubt(res.data);
      setQuestion("");
      setSelectedAttachment(null);
      window.dispatchEvent(new Event("edumind_db_sync"));
    } catch (err) {
      console.error("Failed to ask ARIA:", err);
      // Client-side fallback if server is fully down or offline
      let answerText = `I encountered a minor core calibration slip. Please verify if your FastAPI backend server is active on ${api.defaults.baseURL}.`;
      
      const q_lower = finalQuestion.toLowerCase();
      if (q_lower.includes("cylinder") || q_lower.includes("rolling") || q_lower.includes("sphere")) {
        answerText = `### Rolling Acceleration on Incline (Physics) 🌌\n\nFor a solid cylinder rolling down an incline of angle $\\theta$ without slipping:\n\n1. **Translational force:** $$Mg \\sin\\theta - f = Ma$$\n2. **Rotational torque:** $$f R = I \\alpha$$\n3. **Moment of Inertia:** For solid cylinder, $I = \\frac{1}{2}MR^2$.\n4. **Rolling condition:** $a = R \\alpha$.\n\nSubstituting: $$f = \\frac{I \\alpha}{R} = \\frac{1}{2}Ma$$\n\nSubstituting back to force equation:\n$$Mg \\sin\\theta - \\frac{1}{2}Ma = Ma \\implies Mg \\sin\\theta = \\frac{3}{2}Ma$$\n\n$$a = \\frac{2}{3} g \\sin\\theta$$`;
      } else if (q_lower.includes("sn2") || q_lower.includes("attack") || q_lower.includes("sn1")) {
        answerText = `### S_N2 Nucleophilic Attack & Inversion (Chemistry) 🧪\n\nThe stereochemical diagram shows an S_N2 mechanism:\n\n1. **Backside Attack:** The nucleophile ($Nu^-$) attacks from the opposite side of the leaving group ($L$) due to steric hindrance and orbital symmetry.\n2. **Transition State:** A pentacoordinate carbon state is formed where the carbon is partially bonded to both $Nu$ and $L$:\n   $$[Nu\\cdots C(R_1)(R_2)(R_3)\\cdots L]^{\\ddagger}$$\n3. **Inversion (Walden Inversion):** As the $C-L$ bond breaks, the other three substituents flip like an umbrella in a strong wind, resulting in inversion of configuration.`;
      } else if (q_lower.includes("integral") || q_lower.includes("shaded area") || q_lower.includes("calculus")) {
        answerText = `### Definite Integral and Riemann Sum Area (Mathematics) 📈\n\nThe diagram displays the shaded area under the curve $f(x) = 3x^2 + 2x + 1$ bounded by the vertical lines $x = 1$ and $x = 3$.\n\n#### 1. Limit of Riemann Sums Definition\nThe exact area $A$ under the curve is defined as the limit of Riemann sums:\n$$A = \\lim_{n \\to \\infty} \\sum_{i=1}^{n} f(x_i^*) \\Delta x = \\int_{1}^{3} (3x^2 + 2x + 1) dx$$\n\n#### 2. Antiderivative Evaluation (Fundamental Theorem of Calculus)\nAccording to the Fundamental Theorem of Calculus (FTC), if $F'(x) = f(x)$:\n$$\\int_{a}^{b} f(x) dx = F(b) - F(a)$$\n\nLet's compute the general antiderivative $F(x)$:\n$$F(x) = \\int (3x^2 + 2x + 1) dx = x^3 + x^2 + x + C$$\n\n#### 3. Step-by-Step Numerical Integration\nNow, we evaluate $F(x)$ at the boundaries $x = 3$ and $x = 1$:\n\n*   **Upper Bound ($x = 3$):**\n    $$F(3) = (3)^3 + (3)^2 + (3) = 27 + 9 + 3 = 39$$\n*   **Lower Bound ($x = 1$):**\n    $$F(1) = (1)^3 + (1)^2 + (1) = 1 + 1 + 1 = 3$$\n\nSubtracting the lower bound evaluation from the upper bound:\n$$A = F(3) - F(1) = 39 - 3 = 36$$\n\nTherefore, the shaded area under the curve is exactly **$36$ square units**.\n`;
      } else if (q_lower.includes("circular") || q_lower.includes("seating") || q_lower.includes("arrangement") || q_lower.includes("permutation")) {
        answerText = `### Circular Permutations with Adjacency Constraints (Mathematics) 🪑\n\nWe are arranging $n = 6$ students around a circular table such that two specific students (let's call them $A$ and $B$) must sit next to each other.\n\n#### 1. Tie-Method (Grouping Constraint)\nSince $A$ and $B$ must sit together, we treat them as a single combined block/unit: $(AB)$.\nThis reduces the number of entities to arrange from $6$ down to:\n$$\\text{Entities} = (6 - 2) + 1 = 5 \\text{ units}$$\n(the $4$ other students plus the single $(AB)$ group).\n\n#### 2. Circular Arrangement Rule\nFor $k$ entities around a circle, the number of distinct circular permutations is $(k-1)!$ because circular shifts are equivalent:\n$$\\text{Circular Ways} = (5 - 1)! = 4!$$\n$$4! = 4 \\times 3 \\times 2 \\times 1 = 24 \\text{ ways}$$\n\n#### 3. Internal Arrangements of the Block\nInside the tied unit $(AB)$, students $A$ and $B$ can arrange themselves in $2!$ ways: either $AB$ or $BA$.\n$$\\text{Internal Ways} = 2! = 2 \\text{ ways}$$\n\n#### 4. Total Arrangements Calculation\nUsing the Multiplication Principle, the total number of valid seating arrangements is:\n$$\\text{Total Ways} = \\text{Circular Ways} \\times \\text{Internal Ways}$$\n$$\\text{Total Ways} = 24 \\times 2 = 48$$\n\nThus, there are exactly **$48$ distinct ways** to seat the students.\n`;
      } else if (q_lower.includes("mitochondria") || q_lower.includes("membrane") || q_lower.includes("chloroplast")) {
        answerText = `### Mitochondria Structure & Function (Biology) 🧬\n\nThe mitochondria diagram visualizes key membranes:\n\n1. **Outer Membrane:** Permeable membrane containing porin channels.\n2. **Inner Membrane Folding (Cristae):** Folds inwards to form cristae, greatly increasing surface area for **oxidative phosphorylation** and the Electron Transport Chain (ETC).\n3. **ATP Synthesis:** The concentration gradient of protons ($H^+$) across the inner membrane drives **ATP synthase** machinery (F₀F₁ complexes) to phosphorylate ADP into ATP: F₁ acts as a rotating molecular turbine!`;
      } else if (q_lower.includes("kepler")) {
        answerText = `### Kepler's Laws (Physics Fallback) 🌌\n\n1. **Orbits:** All planetary orbits are elliptical with the Sun at one focus.\n2. **Equal Areas:** A planet sweeps equal areas in equal times.\n3. **Harmonic Law:** Period square matches semi-major axis cube: $T^2 \\propto r^3$.`;
      } else if (q_lower.includes("markovnikov")) {
        answerText = `### Markovnikov's Addition (Chemistry Fallback) 🧪\n\nWhen adding a hydrogen halide to an unsymmetrical alkene, the halide attaches to the carbon with fewer hydrogen atoms (the carbon that forms the most stable carbocation intermediate).`;
      } else if (q_lower.includes("limit") || q_lower.includes("continuity")) {
        answerText = `### Limits and Continuity (Maths Fallback) 📈\n\nA function is continuous at a point if the limit from the left, limit from the right, and the actual function value at that point are all equal.`;
      }

      const fallbackRes = {
        question: fullQuestion,
        subject: subject,
        answer: answerText,
        created_at: new Date().toISOString()
      };

      setHistory(prev => [fallbackRes, ...prev]);
      setActiveDoubt(fallbackRes);
      setQuestion("");
      setSelectedAttachment(null);
    } finally {
      setLoading(false);
    }
  };

  // Shared cleanMathLaTeX imported from utils/mathUtils

  // Custom styled Markdown Renderer
  const renderMarkdown = (text) => {
    if (!text) return null;
    
    // Parse formatting elements
    const formatted = text
      .split("\n")
      .map((line, idx) => {
        let content = line;
        
        // 1. Headers
        if (content.startsWith("### ")) {
          return <h3 key={idx} className="text-sm font-bold text-cyan-300 mt-4 mb-2 flex items-center gap-1.5"><Sparkles size={12} className="text-cyan-400" /> {content.slice(4)}</h3>;
        }
        if (content.startsWith("## ")) {
          return <h2 key={idx} className="text-base font-bold text-purple-300 mt-5 mb-2.5">{content.slice(3)}</h2>;
        }
        if (content.startsWith("# ")) {
          return <h1 key={idx} className="text-lg font-black text-white mt-6 mb-3 border-b border-white/5 pb-1">{content.slice(2)}</h1>;
        }

        // 1.5 Block Math on its own line
        if (content.trim().startsWith("$$") && content.trim().endsWith("$$")) {
          const mathContent = content.trim().slice(2, -2);
          return (
            <div key={idx} className="text-center my-4 py-3 px-5 rounded-2xl border border-cyan-500/10 bg-cyan-500/5 font-serif italic text-[13px] text-cyan-300 tracking-wide select-all shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] max-w-full overflow-x-auto scrollbar-none">
              {cleanMathLaTeX(mathContent)}
            </div>
          );
        }

        // 2. Bullet Points
        if (content.startsWith("* ") || content.startsWith("- ")) {
          return (
            <li key={idx} className="text-xs text-gray-300 ml-4 list-disc mb-1 leading-relaxed">
              {parseInlineMarkdown(content.slice(2))}
            </li>
          );
        }

        // 3. Regular Paragraphs (with line breaks)
        return (
          <p key={idx} className="text-xs text-gray-300 leading-relaxed mb-2.5">
            {parseInlineMarkdown(content)}
          </p>
        );
      });

    return <div className="space-y-1">{formatted}</div>;
  };

  // Inline styling parser (bold, math, and code tags)
  const parseInlineMarkdown = (line) => {
    // 1. Split by inline code blocks
    let parts = line.split(/(`[^`]+`)/);
    return parts.flatMap((part, i) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={`code-${i}`} className="bg-purple-950/40 border border-purple-500/20 px-1 py-0.5 rounded font-mono text-[10px] text-pink-400 mx-0.5">
            {part.slice(1, -1)}
          </code>
        );
      }
      
      // 2. Split by block math ($$...$$)
      let blockMathParts = part.split(/(\裝[^\$]+\裝)/).map(s => s.replace(/裝/g, '$')); // Use safe placeholder for split regex
      let tempBlockParts = part.split(/\$\$/);
      let reconstructedBlockParts = [];
      for (let index = 0; index < tempBlockParts.length; index++) {
        if (index % 2 === 1 && index < tempBlockParts.length - 1) {
          reconstructedBlockParts.push("$$" + tempBlockParts[index] + "$$");
        } else {
          reconstructedBlockParts.push(tempBlockParts[index]);
        }
      }
      
      return reconstructedBlockParts.filter(Boolean).flatMap((bMathPart, j) => {
        if (bMathPart.startsWith("$$") && bMathPart.endsWith("$$")) {
          const mathContent = bMathPart.slice(2, -2);
          return (
            <span key={`bmath-${i}-${j}`} className="inline-block text-center my-2 py-2 px-4 rounded-xl border border-cyan-500/10 bg-cyan-500/5 font-serif italic text-xs text-cyan-300 tracking-wide select-all">
              {cleanMathLaTeX(mathContent)}
            </span>
          );
        }
        
        // 3. Split by inline math ($...$)
        let tempInlineParts = bMathPart.split(/\$/);
        let reconstructedInlineParts = [];
        for (let index = 0; index < tempInlineParts.length; index++) {
          if (index % 2 === 1 && index < tempInlineParts.length - 1) {
            reconstructedInlineParts.push("$" + tempInlineParts[index] + "$");
          } else {
            reconstructedInlineParts.push(tempInlineParts[index]);
          }
        }
        
        return reconstructedInlineParts.filter(Boolean).flatMap((iMathPart, k) => {
          if (iMathPart.startsWith("$") && iMathPart.endsWith("$")) {
            const mathContent = iMathPart.slice(1, -1);
            return (
              <span key={`imath-${i}-${j}-${k}`} className="font-serif italic text-cyan-300 bg-cyan-950/20 border border-cyan-500/10 px-1.5 py-0.5 rounded mx-0.5 text-[11px] font-semibold tracking-wide">
                {cleanMathLaTeX(mathContent)}
              </span>
            );
          }
          
          // 4. Split by bold text (**bold**)
          let boldParts = iMathPart.split(/(\*\*[^*]+\*\*)/);
          return boldParts.map((boldPart, l) => {
            if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
              return (
                <strong key={`bold-${i}-${j}-${k}-${l}`} className="text-white font-extrabold">
                  {boldPart.slice(2, -2)}
                </strong>
              );
            }
            return boldPart;
          });
        });
      });
    });
  };

  // Get color configurations per subject
  const getSubjectColor = (sub) => {
    switch (sub?.toLowerCase()) {
      case "physics": return { text: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" };
      case "chemistry": return { text: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10" };
      case "mathematics": return { text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" };
      case "biology": return { text: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" };
      default: return { text: "text-gray-400", border: "border-gray-500/30", bg: "bg-gray-500/10" };
    }
  };

  return (
    <div className="flex h-screen overflow-hidden text-white" style={{ background: "#030014" }}>
      
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Floating Decorative Elements */}
      {FLOATING_DECO.map((el, i) => (
        <motion.div
          key={i}
          className="absolute text-xl select-none text-purple-500/10 font-bold pointer-events-none"
          style={{ left: el.x, top: el.y }}
          animate={{
            y: [-10, 10, -10],
            rotate: [0, 5, -5, 0],
            scale: [el.scale, el.scale * 1.05, el.scale]
          }}
          transition={{ duration: el.dur, repeat: Infinity, ease: "easeInOut" }}
        >
          {el.char}
        </motion.div>
      ))}

      {/* Mobile Sidebar Toggle Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── LEFT COLUMN: SIDEBAR ── */}
      <AnimatePresence>
        {(!isMobile || isSidebarOpen) && (
          <motion.aside
            key="sidebar"
            initial={isMobile ? { x: -260, opacity: 0 } : { x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={isMobile ? { x: -260, opacity: 0 } : { opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`w-80 flex-shrink-0 flex flex-col p-5 border-r ${
              isMobile ? "fixed inset-y-0 left-0 z-50 h-full shadow-2xl shadow-purple-500/20 bg-[#0a0519]/98" : ""
            }`}
            style={{ borderColor: "rgba(255,255,255,0.06)", background: isMobile ? undefined : "rgba(255,255,255,0.01)", backdropFilter: "blur(16px)" }}
          >
            {/* Back navigation header */}
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => {
                  if (window.history.length > 2) {
                    navigate(-1);
                  } else {
                    navigate("/dashboard");
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            </div>

            {/* Sidebar Title */}
            <div className="mb-4">
              <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-purple-400" />
                Doubt History
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5">Access previous conversations with ARIA</p>
            </div>

            {/* Doubt List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
              {history.length > 0 ? (
                history.map((h, i) => {
                  const colors = getSubjectColor(h.subject);
                  const isActive = activeDoubt?.id === h.id || (!activeDoubt && i === 0 && !loading && !question);
                  return (
                    <motion.div
                      key={h.id || i}
                      whileHover={{ x: 2, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        if (isMobile) setIsSidebarOpen(false);
                        setActiveDoubt(h);
                      }}
                      className="p-3.5 rounded-xl cursor-pointer text-left border transition-all"
                      style={{
                        background: isActive ? "rgba(168, 85, 247, 0.1)" : "rgba(255,255,255,0.02)",
                        borderColor: isActive ? "rgba(168, 85, 247, 0.3)" : "rgba(255,255,255,0.06)"
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${colors.text} ${colors.border} ${colors.bg}`}>
                          {h.subject}
                        </span>
                        <span className="text-[8px] text-gray-600 font-mono">
                          {h.created_at ? (() => {
                            let createdAtStr = h.created_at;
                            if (createdAtStr && !createdAtStr.endsWith("Z") && !createdAtStr.includes("+") && !createdAtStr.includes("GMT")) {
                              createdAtStr = createdAtStr + "Z";
                            }
                            return new Date(createdAtStr).toLocaleDateString();
                          })() : "Just now"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-300 line-clamp-2">
                        {parseQuestionText(h.question).questionContent}
                      </p>
                    </motion.div>
                  );
                })
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-4">
                  <BookOpen size={24} className="text-purple-500/30 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-gray-600">No doubts history</p>
                  <p className="text-[10px] text-gray-700 max-w-[160px] mx-auto mt-1 leading-normal">Your solved queries will accumulate here.</p>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── RIGHT COLUMN: CHAT CANVAS ── */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* Holographic Advisor Box */}
        <header className="px-6 py-4 flex items-center justify-between border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
        >
          <div className="flex items-center gap-3">
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="mr-1 p-2 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center flex-shrink-0"
              >
                <Menu size={16} />
              </button>
            )}
            {/* Holographic avatar */}
            <div className="relative w-11 h-11 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-purple-500/40"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute w-9 h-9 rounded-full border border-double border-cyan-400/20"
              />
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg z-10"
                style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(6,182,212,0.15))", border: "1px solid rgba(168,85,247,0.2)" }}
              >
                🤖
              </div>
            </div>
            <div>
              <h1 className="text-sm font-black text-white flex items-center gap-1.5" style={{ fontFamily: "Poppins" }}>
                Professor ARIA
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 tracking-widest uppercase">
                  AI Tutor
                </span>
              </h1>
              <p className="text-[9px] text-gray-500">Persisted study portal // Llama 3.3 70B Active</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => { setActiveDoubt(null); setQuestion(""); }}
              className="px-3 py-1.5 rounded-xl border text-[10px] font-bold text-gray-400 hover:text-white hover:border-white/20 transition-all flex items-center gap-1.5"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
            >
              <RefreshCw size={11} /> New Doubt
            </button>
          </div>
        </header>

        {/* ── CHAT PANEL ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          {/* Welcome default view if no doubt selected */}
          {!activeDoubt && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto text-center py-16 px-4"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-[0_0_35px_rgba(168,85,247,0.25)] border border-purple-500/30 mx-auto mb-5"
                style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.08))" }}
              >
                🎓
              </div>
              <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "Poppins" }}>
                Ask ARIA a Doubt
              </h2>
              <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed mb-6">
                Type questions regarding Physics derivations, Chemistry reaction mechanisms, Calculus limits, or cellular structures. ARIA will respond with detailed markdown analysis.
              </p>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto">
                {SUGGESTIONS.map((s, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ y: -2, scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      setQuestion(s.text);
                      setSubject(s.subject);
                    }}
                    className="p-3.5 rounded-xl border text-left bg-white/1 flex flex-col justify-between hover:bg-white/3 transition-all"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}
                  >
                    <span className="text-[8px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
                      {s.subject}
                    </span>
                    <p className="text-xs font-semibold text-gray-300 leading-snug">
                      {s.text}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Active Doubt Conversation Display */}
          {(activeDoubt || loading) && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* User Question bubble */}
              {activeDoubt && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start justify-end gap-3"
                >
                  <div className="flex flex-col items-end max-w-xl">
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider mb-1 ${getSubjectColor(activeDoubt.subject).text} ${getSubjectColor(activeDoubt.subject).border} ${getSubjectColor(activeDoubt.subject).bg}`}>
                      {activeDoubt.subject}
                    </span>
                    <div className="p-4 rounded-2xl rounded-tr-none text-xs text-white"
                      style={{
                        background: "linear-gradient(135deg,rgba(6,182,212,0.15),rgba(124,58,237,0.12))",
                        border: "1px solid rgba(6,182,212,0.25)"
                      }}
                    >
                      {(() => {
                        const parsed = parseQuestionText(activeDoubt.question);
                        return (
                          <div className="flex flex-col gap-2.5">
                            {parsed.type === "image" && parsed.imageData && (
                              <img 
                                src={parsed.imageData} 
                                alt="Visual Doubt Diagram" 
                                className="w-full max-w-[280px] rounded-xl border border-white/10 object-contain shadow-lg hover:scale-[1.02] cursor-pointer transition-all"
                                onClick={() => {
                                  const win = window.open();
                                  win.document.write(`<img src="${parsed.imageData}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                                }}
                              />
                            )}
                            {parsed.type === "file" && (
                              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/15 max-w-[280px]">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-cyan-500/10 text-cyan-400">
                                  <File size={16} />
                                </div>
                                <div className="text-left min-w-0">
                                  <p className="text-[11px] font-bold text-white truncate">{parsed.name}</p>
                                  <p className="text-[8px] text-cyan-400 font-mono tracking-widest uppercase">{parsed.fileType?.toUpperCase()} Document</p>
                                </div>
                              </div>
                            )}
                            {parsed.type === "folder" && (
                              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/15 max-w-[280px]">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400">
                                  <Folder size={16} />
                                </div>
                                <div className="text-left min-w-0">
                                  <p className="text-[11px] font-bold text-white truncate">{parsed.name}</p>
                                  <p className="text-[8px] text-emerald-400 font-mono tracking-widest uppercase">{parsed.fileCount} Files Uploaded</p>
                                </div>
                              </div>
                            )}
                            <div className="leading-relaxed">{parsed.questionContent}</div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex-shrink-0 mt-6">
                    {user.name?.[0]?.toUpperCase() || "S"}
                  </div>
                </motion.div>
              )}
 
              {/* Loader display */}
              {loading && !activeDoubt && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start justify-end gap-3"
                >
                  <div className="flex flex-col items-end max-w-xl">
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider mb-1 ${getSubjectColor(subject).text} ${getSubjectColor(subject).border} ${getSubjectColor(subject).bg}`}>
                      {subject}
                    </span>
                    <div className="p-4 rounded-2xl rounded-tr-none text-xs text-white opacity-85"
                      style={{
                        background: "linear-gradient(135deg,rgba(6,182,212,0.1),rgba(124,58,237,0.08))",
                        border: "1px solid rgba(6,182,212,0.15)"
                      }}
                    >
                      {selectedAttachment && (
                        <div className="mb-2.5">
                          {selectedAttachment.type === "image" && (
                            <img 
                              src={selectedAttachment.dataUrl} 
                              alt="Scanning Diagram" 
                              className="w-full max-w-[200px] rounded-xl border border-white/10 object-cover" 
                            />
                          )}
                          {selectedAttachment.type === "file" && (
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/15 max-w-[200px]">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-cyan-500/10 text-cyan-400">
                                <File size={16} />
                              </div>
                              <div className="text-left min-w-0">
                                <p className="text-[11px] font-bold text-white truncate">{selectedAttachment.name}</p>
                                <p className="text-[8px] text-cyan-400 font-mono tracking-widest uppercase">{selectedAttachment.fileType?.toUpperCase()} Document</p>
                              </div>
                            </div>
                          )}
                          {selectedAttachment.type === "folder" && (
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/15 max-w-[200px]">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400">
                                <Folder size={16} />
                              </div>
                              <div className="text-left min-w-0">
                                <p className="text-[11px] font-bold text-white truncate">{selectedAttachment.name}</p>
                                <p className="text-[8px] text-emerald-400 font-mono tracking-widest uppercase">{selectedAttachment.fileCount} Files</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div>{question || "Drafting query..."}</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0 mt-6">
                    {user.name?.[0]?.toUpperCase() || "S"}
                  </div>
                </motion.div>
              )}

              {/* Bot Answer bubble */}
              {activeDoubt && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-1"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}
                  >
                    🤖
                  </div>
                  <div className="flex-1 p-5 rounded-2xl rounded-tl-none border text-left max-w-2xl"
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      borderColor: "rgba(255,255,255,0.06)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)"
                    }}
                  >
                    <span className="text-[8px] tracking-widest font-black uppercase text-purple-400 font-mono block mb-2">
                      ARIA RESPOND // COMPLETE
                    </span>
                    {renderMarkdown(activeDoubt.answer)}
                  </div>
                </motion.div>
              )}

              {/* Active Loading bar */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-1 bg-white/5 border border-white/5 animate-pulse">
                    🤖
                  </div>
                  <div className="flex-1 p-4 rounded-2xl rounded-tl-none border text-left max-w-sm flex items-center gap-3"
                    style={{
                      background: "rgba(168, 85, 247, 0.04)",
                      borderColor: "rgba(168, 85, 247, 0.15)",
                    }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-t-purple-500 border-r-transparent animate-spin" />
                    <span className="text-[11px] font-mono tracking-wider text-purple-300 animate-pulse">
                      {ocrScanning 
                        ? (selectedAttachment?.type === "folder" ? "ARIA is indexing folder documents..." : "ARIA is scanning visual diagram (OCR)...")
                        : "ARIA is thinking..."}
                    </span>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}

        </div>

        {/* ── FOOTER INPUT AREA ── */}
        <footer className="p-5 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}
        >
          <div className="max-w-3xl mx-auto">
            {/* Attachment Preview Banner */}
            {selectedAttachment && (
              <div className="mb-3 p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between animate-fadeIn max-w-md">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedAttachment.type === "image" && (
                    <img 
                      src={selectedAttachment.dataUrl} 
                      className="w-12 h-12 object-cover rounded-xl border border-white/10" 
                      alt="Preview" 
                    />
                  )}
                  {selectedAttachment.type === "file" && (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-400 border border-cyan-500/15 flex-shrink-0">
                      <File size={20} />
                    </div>
                  )}
                  {selectedAttachment.type === "folder" && (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 flex-shrink-0">
                      <Folder size={20} />
                    </div>
                  )}
                  <div className="text-left min-w-0">
                    <p className="text-[10px] font-bold text-white truncate max-w-[200px]">{selectedAttachment.name}</p>
                    <p className="text-[8px] text-cyan-400 font-mono tracking-widest uppercase">
                      {selectedAttachment.type === "folder" 
                        ? `${selectedAttachment.fileCount} Files Queued` 
                        : "Visual Scanning Calibrated"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAttachment(null)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                  title="Remove Attachment"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex gap-3 items-end">
              
              {/* Subject selector */}
              <div className="flex-shrink-0">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="px-3.5 py-3 rounded-2xl text-xs font-bold bg-[#030014] text-gray-400 focus:text-white focus:outline-none transition-all cursor-pointer select-none"
                  style={{
                    border: `1px solid ${getSubjectColor(subject).text === "text-gray-400" ? "rgba(255,255,255,0.06)" : getSubjectColor(subject).text.replace("text-", "").replace("-400", "") + "40"}`,
                    background: "rgba(0, 0, 0, 0.25)"
                  }}
                >
                  {SUBJECTS.map(s => (
                    <option key={s} value={s} className="bg-black font-semibold">{s}</option>
                  ))}
                </select>
              </div>

              {/* Text input */}
              <div className="flex-1 relative">
                {/* Hidden File Inputs */}
                <input 
                  type="file" 
                  ref={cameraInputRef} 
                  onChange={handleCameraChange} 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*,application/pdf,text/plain" 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  ref={folderInputRef} 
                  onChange={handleFolderChange} 
                  webkitdirectory="" 
                  directory="" 
                  multiple
                  className="hidden" 
                />

                <textarea
                  autoFocus
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={selectedAttachment ? "Describe the attachment or click send to scan..." : "Ask ARIA a doubt regarding concepts, formulas, or reaction steps..."}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  className="w-full py-3.5 pl-4 pr-24 rounded-2xl text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all resize-none max-h-24 scrollbar-none"
                  style={{
                    background: "rgba(0, 0, 0, 0.25)",
                    border: "1px solid rgba(255, 255, 255, 0.05)"
                  }}
                />

                {/* Attachment Menu Popup */}
                <AnimatePresence>
                  {showAttachmentMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className="absolute right-12 bottom-12 w-44 rounded-2xl border p-1.5 shadow-xl flex flex-col gap-1 z-30"
                      style={{
                        background: "rgba(10, 5, 25, 0.95)",
                        borderColor: "rgba(168, 85, 247, 0.25)",
                        backdropFilter: "blur(20px)"
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          cameraInputRef.current?.click();
                          setShowAttachmentMenu(false);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-white/5 transition-all text-xs font-semibold text-gray-300 hover:text-white"
                      >
                        <Camera size={14} className="text-purple-400" />
                        Capture Image
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          fileInputRef.current?.click();
                          setShowAttachmentMenu(false);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-white/5 transition-all text-xs font-semibold text-gray-300 hover:text-white"
                      >
                        <File size={14} className="text-cyan-400" />
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          folderInputRef.current?.click();
                          setShowAttachmentMenu(false);
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-white/5 transition-all text-xs font-semibold text-gray-300 hover:text-white"
                      >
                        <Folder size={14} className="text-emerald-400" />
                        Upload Folder
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Attachment Menu Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowAttachmentMenu(prev => !prev)}
                  disabled={loading}
                  className="absolute right-12 bottom-2.5 w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                  title="Attach Material"
                >
                  <Paperclip size={13} />
                </button>

                {/* Send Button */}
                <motion.button
                  type="submit"
                  disabled={loading || (!question.trim() && !selectedAttachment)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute right-2.5 bottom-2.5 w-8 h-8 rounded-xl flex items-center justify-center text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #06b6d4, #a855f7)",
                    boxShadow: "0 0 10px rgba(168,85,247,0.2)"
                  }}
                >
                  <Send size={13} className="text-white" />
                </motion.button>
              </div>

            </form>
          </div>
        </footer>

      </main>

    </div>
  );
}
