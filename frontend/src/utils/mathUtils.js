// utils/mathUtils.js

/**
 * Clean raw LaTeX formatting to readable math text.
 * Maps LaTeX characters, fractions, subscripts, and superscripts to readable Unicode.
 */
export const cleanMathLaTeX = (text) => {
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
      "i": "ᵢ", "j": "ⱼ", "m": "ₘ", "t": "ₜ",
      "a": "ₐ", "b": "♭", "c": "꜀", "d": "ᵈ", "e": "ₑ",
      "f": "բ", "g": "₉", "h": "ₕ", "k": "ₖ", "l": "ₗ",
      "o": "ₒ", "p": "ₚ", "r": "ᵣ", "s": "ₛ", "u": "ᵤ",
      "v": "ᵥ"
    };
    return p1.split("").map(c => charMap[c] || c).join("");
  });

  // 3. Convert superscripts: e.g. ^2 -> ² or {-2} -> ⁻²
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
