import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { 
  ArrowLeft, BookOpen, Clock, Play, Pause, RotateCcw, 
  CheckCircle2, Lock, ChevronRight, ChevronDown, MessageSquare, 
  Award, Sparkles, Zap, BookOpenCheck, HelpCircle, Search
} from "lucide-react";
import { supabase } from "../services/supabase";
import api from "../services/api";
import { CURRICULUM } from "../utils/curriculum";
import {
  fetchStudentMlMetrics,
  fetchWeakTopicsForSubject,
  matchCourseWeakTopics,
  prioritizePoolByWeakTopics,
} from "../utils/studentMetrics";
import { addDailyXp, incrementDailyCounter } from "../utils/dailyReset";

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

const COURSE_FORMULAS = {
  // 1. Rotational Motion
  "f6bc2a64-548f-4e13-a2fb-dd60d1f3c917": [
    {
      title: "Foundation: Projectile Motion & Kinematics",
      equations: [
        { formula: "T = \\frac{2v_0 \\sin\\theta}{g}", label: "Time of Flight (Ground-to-Ground)" },
        { formula: "H_{max} = \\frac{v_0^2 \\sin^2\\theta}{2g}", label: "Maximum Height" },
        { formula: "R = \\frac{v_0^2 \\sin(2\\theta)}{g}", label: "Horizontal Range" },
        { formula: "R_{max} = \\frac{v_0^2}{g} \\text{ (at } \\theta = 45^\\circ\\text{)}", label: "Maximum Horizontal Range" },
        { formula: "\\theta_1 + \\theta_2 = 90^\\circ \\implies R_1 = R_2", label: "Complementary Angles of Projection" },
        { formula: "y = x \\tan\\theta - \\frac{g x^2}{2 v_0^2 \\cos^2\\theta}", label: "Trajectory Equation" },
        { formula: "y = x \\tan\\theta \\left(1 - \\frac{x}{R}\\right)", label: "Trajectory Equation in terms of Range" },
        { formula: "T_{inclined} = \\frac{2v_0 \\sin(\\theta - \\beta)}{g \\cos\\beta}", label: "Time of Flight on Incline (Incline Angle β)" },
        { formula: "R_{inclined} = \\frac{v_0^2}{g \\cos^2\\beta} [\\sin(2\\theta - \\beta) - \\sin\\beta]", label: "Range up Incline" },
        { formula: "R_{max\\_inclined} = \\frac{v_0^2}{g(1 + \\sin\\beta)}", label: "Maximum Range up Incline (at θ = 45° + β/2)" }
      ]
    },
    {
      title: "1. Rotational Kinematics & Analogy",
      equations: [
        { formula: "\\theta = \\frac{s}{r}", label: "Angular Displacement" },
        { formula: "\\omega = \\frac{d\\theta}{dt} = \\frac{v}{r} = 2\\pi f = \\frac{2\\pi}{T}", label: "Angular Velocity" },
        { formula: "\\alpha = \\frac{d\\omega}{dt} = \\frac{d^2\\theta}{dt^2} = \\omega \\frac{d\\omega}{d\\theta}", label: "Angular Acceleration" },
        { formula: "v = \\omega \\times r", label: "Linear & Angular Velocity Relation" },
        { formula: "a_t = \\alpha \\times r", label: "Tangential Acceleration" },
        { formula: "a_c = \\omega^2 r = \\frac{v^2}{r}", label: "Centripetal/Radial Acceleration" },
        { formula: "a_{total} = \\sqrt{a_t^2 + a_c^2}", label: "Total Linear Acceleration" },
        { formula: "\\omega = \\omega_0 + \\alpha t", label: "First Equation (Constant α)" },
        { formula: "\\theta = \\omega_0 t + \\frac{1}{2}\\alpha t^2", label: "Second Equation (Constant α)" },
        { formula: "\\omega^2 = \\omega_0^2 + 2\\alpha\\theta", label: "Third Equation (Constant α)" },
        { formula: "\\theta_n = \\omega_0 + \\frac{1}{2}\\alpha(2n - 1)", label: "Displacement in nth second" }
      ]
    },
    {
      title: "2. Moment of Inertia (Discrete & Continuous)",
      equations: [
        { formula: "I = \\sum m_i r_i^2", label: "Discrete System of Particles" },
        { formula: "I = \\int r^2 dm", label: "Continuous Mass Distribution" },
        { formula: "K = \\sqrt{\\frac{I}{M}}", label: "Radius of Gyration" },
        { formula: "I_{ring} = MR^2", label: "Thin Ring (axis perpendicular through center)" },
        { formula: "I_{ring\\_dia} = \\frac{1}{2}MR^2", label: "Thin Ring (about diameter)" },
        { formula: "I_{disc} = \\frac{1}{2}MR^2", label: "Solid Disc / Cylinder (longitudinal center axis)" },
        { formula: "I_{disc\\_dia} = \\frac{1}{4}MR^2", label: "Solid Disc (about diameter)" },
        { formula: "I_{hollow\\_cyl} = MR^2", label: "Hollow Thin Cylinder (longitudinal axis)" },
        { formula: "I_{solid\\_sphere} = \\frac{2}{5}MR^2", label: "Solid Sphere (about diameter)" },
        { formula: "I_{hollow\\_sphere} = \\frac{2}{3}MR^2", label: "Hollow Sphere (about diameter)" },
        { formula: "I_{rod\\_center} = \\frac{1}{12}ML^2", label: "Thin Rod (axis perpendicular at center)" },
        { formula: "I_{rod\\_end} = \\frac{1}{3}ML^2", label: "Thin Rod (axis perpendicular at end)" },
        { formula: "I_{solid\\_cone} = \\frac{3}{10}MR^2", label: "Solid Cone (about central axis)" },
        { formula: "I_{plate} = \\frac{1}{12}M(a^2 + b^2)", label: "Rectangular Plate (axis perp. through center of mass)" }
      ]
    },
    {
      title: "3. Moment of Inertia Theorems",
      equations: [
        { formula: "I = I_{cm} + Md^2", label: "Parallel Axis Theorem (All shapes)" },
        { formula: "I_z = I_x + I_y", label: "Perpendicular Axis Theorem (Planar laminar bodies only)" }
      ]
    },
    {
      title: "4. Rotational Dynamics & Energy",
      equations: [
        { formula: "\\vec{\\tau} = \\vec{r} \\times \\vec{F}", label: "Torque Vector" },
        { formula: "\\tau = r F \\sin\\theta = F d_{\\perp}", label: "Torque Magnitude (Lever Arm d_⊥)" },
        { formula: "\\tau = I \\alpha", label: "Rotational Second Law (Torque-Inertia)" },
        { formula: "W = \\int \\tau d\\theta", label: "Work done by torque" },
        { formula: "P = \\tau \\omega", label: "Rotational Power" },
        { formula: "W_{net} = \\Delta KE_{rot} = \\frac{1}{2}I\\omega_f^2 - \\frac{1}{2}I\\omega_i^2", label: "Rotational Work-Energy Theorem" },
        { formula: "KE_{rot} = \\frac{1}{2}I\\omega^2", label: "Rotational Kinetic Energy" },
        { formula: "KE_{total} = \\frac{1}{2}mv^2 + \\frac{1}{2}I\\omega^2", label: "Total KE of Rolling Body" },
        { formula: "KE_{total} = \\frac{1}{2}mv^2\\left(1 + \\frac{K^2}{R^2}\\right)", label: "Total KE using Radius of Gyration" }
      ]
    },
    {
      title: "5. Rolling on an Inclined Plane",
      equations: [
        { formula: "a = \\frac{g \\sin\\theta}{1 + \\frac{K^2}{R^2}}", label: "Linear Acceleration down Incline (Angle θ)" },
        { formula: "v = \\sqrt{\\frac{2gh}{1 + \\frac{K^2}{R^2}}}", label: "Linear Velocity at Bottom" },
        { formula: "t = \\frac{1}{\\sin\\theta}\\sqrt{\\frac{2h\\left(1 + \\frac{K^2}{R^2}\\right)}{g}}", label: "Time of travel to the bottom" },
        { formula: "f = \\frac{Mg \\sin\\theta}{1 + \\frac{R^2}{K^2}}", label: "Static Friction acting on rolling body" },
        { formula: "\\mu_s \\ge \\frac{\\tan\\theta}{1 + \\frac{R^2}{K^2}}", label: "Minimum Friction Coefficient for Pure Rolling" }
      ]
    },
    {
      title: "6. Angular Momentum & Conservation",
      equations: [
        { formula: "\\vec{L} = \\vec{r} \\times \\vec{p}", label: "Angular Momentum Vector of a Particle" },
        { formula: "L = I\\omega", label: "Angular Momentum Magnitude of Rigid Body" },
        { formula: "L = m v r_{\\perp} + I_{cm}\\omega", label: "Angular Momentum in Combined Translation + Rotation" },
        { formula: "\\vec{\\tau}_{ext} = \\frac{d\\vec{L}}{dt}", label: "Torque-Angular Momentum relation" },
        { formula: "I_1\\omega_1 = I_2\\omega_2", label: "Conservation of Angular Momentum (when τ_ext = 0)" },
        { formula: "J_{\\theta} = \\int \\tau dt = \\Delta L = I(\\omega_f - \\omega_i)", label: "Angular Impulse" }
      ]
    },
    {
      title: "7. Toppling dynamics",
      equations: [
        { formula: "F \\cdot h > W \\cdot \\frac{a}{2}", label: "Toppling Condition (Force h-height, Base-width a, Weight W)" },
        { formula: "F_{topple} = \\frac{W a}{2h}", label: "Critical Force for Toppling" }
      ]
    }
  ],

  // 2. Organic Chemistry
  "1190caa1-7e13-4ace-b81a-2b6fbda3118c": [
    {
      title: "1. Electronic Effects",
      equations: [
        { formula: "O^- > COO^- > C(CH_3)_3 > CH(CH_3)_2 > CH_2CH_3 > CH_3 > D > H", label: "+I Effect Power Order" },
        { formula: "NF_3^+ > NR_3^+ > NH_3^+ > NO_2 > SO_2R > CN > COOH > F > Cl > Br > I > OR > OH > C\\equiv CH > C_6H_5 > CH=CH_2 > H", label: "-I Effect Power Order" },
        { formula: "3^\\circ > 2^\\circ > 1^\\circ > \\text{methyl}", label: "Carbocation Stability Order (Stabilized by +I, +M)" },
        { formula: "\\text{methyl} > 1^\\circ > 2^\\circ > 3^\\circ", label: "Carbanion Stability Order (Stabilized by -I, -M)" },
        { formula: "3^\\circ > 2^\\circ > 1^\\circ > \\text{methyl}", label: "Free Radical Stability Order" },
        { formula: "\\text{Acidic Strength } (K_a) \\propto \\text{Stability of Conjugate Base}", label: "Acidity relation with Mesomeric/Inductive effects" },
        { formula: "\\text{Basic Strength } (K_b) \\propto \\text{Lone Pair Availability (Donating Power)}", label: "Basicity relation" },
        { formula: "2^\\circ > 1^\\circ > 3^\\circ > NH_3", label: "Alkyl Amine Basicity in Aqueous Phase (Methyl groups)" },
        { formula: "2^\\circ > 3^\\circ > 1^\\circ > NH_3", label: "Alkyl Amine Basicity in Aqueous Phase (Ethyl groups)" }
      ]
    },
    {
      title: "2. Rules of Organic Chemistry",
      equations: [
        { formula: "\\text{Markovnikov's Rule}", label: "Electrophile adds to form the most stable carbocation intermediate." },
        { formula: "\\text{Anti-Markovnikov's Rule (Peroxide Effect)}", label: "HBr adds anti-Markovnikov via free radical mechanism under peroxides." },
        { formula: "\\text{Huckel's Rule of Aromaticity}: 4n + 2\\pi \\text{ e}^-", label: "Condition for Aromaticity (Cyclic, Planar, Conjugated)" },
        { formula: "\\text{Anti-aromaticity Condition}: 4n\\pi \\text{ e}^-", label: "Anti-aromatic compound condition" },
        { formula: "\\text{Saytzeff's Rule}", label: "Elimination yields the more highly substituted, thermodynamically stable alkene." },
        { formula: "\\text{Hofmann's Rule}", label: "Elimination yields the less substituted, kinetically controlled alkene." }
      ]
    },
    {
      title: "3. Substitution & Elimination Dynamics",
      equations: [
        { formula: "\\text{Rate} = k[R\\text{-}X]", label: "S_N1 Reaction Rate Law (First Order kinetics)" },
        { formula: "3^\\circ > 2^\\circ > 1^\\circ", label: "S_N1 Reactivity Order (Intermediate Carbocation stability)" },
        { formula: "\\text{Rate} = k[R\\text{-}X][Nu^-]", label: "S_N2 Reaction Rate Law (Second Order kinetics)" },
        { formula: "1^\\circ > 2^\\circ > 3^\\circ", label: "S_N2 Reactivity Order (Steric Hindrance dominated)" },
        { formula: "\\text{Rate} = k[R\\text{-}X]", label: "E1 Reaction Rate Law (First Order elimination)" },
        { formula: "\\text{Rate} = k[R\\text{-}X][Base]", label: "E2 Reaction Rate Law (Second Order elimination)" },
        { formula: "\\text{Rate} = k[Substrate][Base]", label: "E1cB Rate Law (Carbanion conjugate base mechanism)" }
      ]
    },
    {
      title: "4. Important Name Reactions",
      equations: [
        { formula: "2R\\text{-}X + 2Na \\xrightarrow{\\text{ether}} R\\text{-}R + 2NaX", label: "Wurtz Reaction (Alkane synthesis)" },
        { formula: "R\\text{-}Cl/Br + NaI \\xrightarrow{\\text{acetone}} R\\text{-}I + NaCl/Br", label: "Finkelstein Reaction (Halogen exchange)" },
        { formula: "R\\text{-}Cl/Br + AgF \\rightarrow R\\text{-}F + AgCl/Br", label: "Swarts Reaction (Fluoride synthesis)" },
        { formula: "\\text{Phenol} + CO_2 + NaOH \\xrightarrow{H^+} \\text{Salicylic Acid}", label: "Kolbe's Reaction" },
        { formula: "\\text{Phenol} + CHCl_3 + KOH \\rightarrow \\text{Salicylaldehyde}", label: "Reimer-Tiemann Reaction" },
        { formula: "2R\\text{-}CHO \\xrightarrow{\\text{Dil. NaOH}} R\\text{-}CH(OH)\\text{-}CH_2\\text{-}CHO", label: "Aldol Condensation (Carbonyls with α-H)" },
        { formula: "2HCHO \\xrightarrow{\\text{Conc. NaOH}} CH_3OH + HCOONa", label: "Cannizzaro Reaction (Carbonyls with no α-H)" },
        { formula: "C=O \\xrightarrow{Zn-Hg / HCl} CH_2", label: "Clemmensen Reduction (Acidic medium)" },
        { formula: "C=O \\xrightarrow{NH_2NH_2 / KOH} CH_2", label: "Wolff-Kishner Reduction (Basic medium)" },
        { formula: "R\\text{-}CH_2\\text{-}COOH \\xrightarrow{X_2 / \\text{Red P}} R\\text{-}CH(X)\\text{-}COOH", label: "Hell-Volhard-Zelinsky (HVZ) α-halogenation" }
      ]
    },
    {
      title: "5. Chemical Tests",
      equations: [
        { formula: "R\\text{-}OH + HCl/ZnCl_2 \\rightarrow R\\text{-}Cl \\downarrow", label: "Lucas Test (Turbidity: 3° immediate, 2° 5min, 1° on heating)" },
        { formula: "R\\text{-}OH \\xrightarrow{P/I_2} \\xrightarrow{AgNO_2} \\xrightarrow{HNO_2} \\xrightarrow{NaOH}", label: "Victor Meyer Test (1° Red, 2° Blue, 3° Colorless)" },
        { formula: "\\text{Amine} + C_6H_5SO_2Cl \\rightarrow \\text{Sulfonamide}", label: "Hinsberg Test (1° Soluble in KOH, 2° Insoluble, 3° No reaction)" }
      ]
    }
  ],

  // 3. Integral Calculus
  "f47cdd63-0771-4ecd-84ad-bd495bf9028a": [
    {
      title: "1. Indefinite Integration Standard Integrals",
      equations: [
        { formula: "\\int x^n dx = \\frac{x^{n+1}}{n+1} + C", label: "Power Rule (n ≠ -1)" },
        { formula: "\\int \\frac{1}{x} dx = \\ln|x| + C", label: "Reciprocal Integration" },
        { formula: "\\int e^x dx = e^x + C", label: "Exponential Integration" },
        { formula: "\\int a^x dx = \\frac{a^x}{\\ln a} + C", label: "General Exponential Integration" },
        { formula: "\\int \\sin x dx = -\\cos x + C", label: "Integration of Sine" },
        { formula: "\\int \\cos x dx = \\sin x + C", label: "Integration of Cosine" },
        { formula: "\\int \\sec^2 x dx = \\tan x + C", label: "Integration of Secant Squared" },
        { formula: "\\int \\csc^2 x dx = -\\cot x + C", label: "Integration of Cosecant Squared" },
        { formula: "\\int \\sec x \\tan x dx = \\sec x + C", label: "Integration of Secant Tangent" },
        { formula: "\\int \\tan x dx = \\ln|\\sec x| + C", label: "Integration of Tangent" },
        { formula: "\\int \\cot x dx = \\ln|\\sin x| + C", label: "Integration of Cotangent" },
        { formula: "\\int \\sec x dx = \\ln|\\sec x + \\tan x| + C = \\ln|\\tan(\\frac{\\pi}{4} + \\frac{x}{2})| + C", label: "Integration of Secant" },
        { formula: "\\int \\csc x dx = \\ln|\\csc x - \\cot x| + C = \\ln|\\tan(\\frac{x}{2})| + C", label: "Integration of Cosecant" }
      ]
    },
    {
      title: "2. Special Integrals (Very Important)",
      equations: [
        { formula: "\\int \\frac{1}{x^2 + a^2} dx = \\frac{1}{a}\\tan^{-1}\\left(\\frac{x}{a}\right) + C", label: "Integration yielding Arctangent" },
        { formula: "\\int \\frac{1}{x^2 - a^2} dx = \\frac{1}{2a}\\ln\\left|\\frac{x-a}{x+a}\\right| + C", label: "Integration yielding Logarithmic fraction" },
        { formula: "\\int \\frac{1}{a^2 - x^2} dx = \\frac{1}{2a}\\ln\\left|\\frac{a+x}{a-x}\\right| + C", label: "Alternative logarithmic fraction" },
        { formula: "\\int \\frac{1}{\\sqrt{a^2 - x^2}} dx = \\sin^{-1}\\left(\\frac{x}{a}\right) + C", label: "Integration yielding Arcsine" },
        { formula: "\\int \\frac{1}{\\sqrt{x^2 + a^2}} dx = \\ln\\left|x + \\sqrt{x^2 + a^2}\\right| + C", label: "Integration yielding Logarithmic radical (positive)" },
        { formula: "\\int \\frac{1}{\\sqrt{x^2 - a^2}} dx = \\ln\\left|x + \\sqrt{x^2 - a^2}\\right| + C", label: "Integration yielding Logarithmic radical (negative)" },
        { formula: "\\int \\sqrt{a^2 - x^2} dx = \\frac{x}{2}\\sqrt{a^2 - x^2} + \\frac{a^2}{2}\\sin^{-1}\\left(\\frac{x}{a}\right) + C", label: "Standard Radical Integral (sine-based)" },
        { formula: "\\int \\sqrt{x^2 + a^2} dx = \\frac{x}{2}\\sqrt{x^2 + a^2} + \\frac{a^2}{2}\\ln\\left|x + \\sqrt{x^2 + a^2}\\right| + C", label: "Standard Radical Integral (sinh-based)" },
        { formula: "\\int \\sqrt{x^2 - a^2} dx = \\frac{x}{2}\\sqrt{x^2 - a^2} - \\frac{a^2}{2}\\ln\\left|x + \\sqrt{x^2 - a^2}\\right| + C", label: "Standard Radical Integral (cosh-based)" },
        { formula: "\\int u v dx = u \\int v dx - \\int \\left( u' \\int v dx \\right) dx", label: "Integration by Parts (ILATE Rule)" },
        { formula: "\\int e^x (f(x) + f'(x)) dx = e^x f(x) + C", label: "Integration of exponential compound derivative" }
      ]
    },
    {
      title: "3. Definite Integration Properties",
      equations: [
        { formula: "\\int_a^b f(x) dx = \\int_a^b f(a+b-x) dx", label: "King's Property" },
        { formula: "\\int_{-a}^a f(x) dx = 2\\int_0^a f(x) dx \\text{ (even), } 0 \\text{ (odd)}", label: "Odd/Even Symmetry Property" },
        { formula: "\\int_0^{2a} f(x) dx = 2\\int_0^a f(x) dx \\text{ (if } f(2a-x)=f(x)\\text{), } 0 \\text{ (if } f(2a-x)=-f(x)\\text{)", label: "Queen's Property" },
        { formula: "\\frac{d}{dx} \\left( \\int_{g(x)}^{h(x)} f(t) dt \\right) = f(h(x))h'(x) - f(g(x))g'(x)", label: "Leibniz Integral Rule" },
        { formula: "\\lim_{n\\to\\infty} \\sum_{r=1}^n \\frac{1}{n} f\\left(\\frac{r}{n}\\right) = \\int_0^1 f(x) dx", label: "Definite Integral as a Limit of a Sum" },
        { formula: "\\int_0^{\\pi/2} \\sin^n x \\cos^m x dx = \\frac{(n-1)!!(m-1)!!}{(n+m)!!} \\cdot [\\frac{\\pi}{2}]", label: "Wallis' Formula (bracket term included only if both n, m are even)" }
      ]
    },
    {
      title: "4. Integration Applications",
      equations: [
        { formula: "A = \\int_a^b |f(x)| dx", label: "Area bounded by curve y=f(x) and x-axis" },
        { formula: "A = \\int_a^b |y_1(x) - y_2(x)| dx", label: "Area enclosed between two curves" },
        { formula: "L = \\int_a^b \\sqrt{1 + \\left(\\frac{dy}{dx}\\right)^2} dx", label: "Arc length of curve y=f(x)" },
        { formula: "V = \\pi \\int_a^b y^2 dx", label: "Volume of revolution about x-axis" }
      ]
    },
    {
      title: "5. Ordinary Differential Equations (ODEs)",
      equations: [
        { formula: "\\frac{dy}{dx} + P(x)y = Q(x)", label: "First-Order Linear ODE Structure" },
        { formula: "I.F. = e^{\\int P(x) dx}", label: "Integrating Factor (I.F.)" },
        { formula: "y \\cdot I.F. = \\int Q(x) \\cdot I.F. dx + C", label: "General solution of Linear ODE" },
        { formula: "\\frac{dy}{dx} + P(x)y = Q(x)y^n", label: "Bernoulli's Differential Equation" }
      ]
    }
  ],

  // 4. Electrostatics
  "c7e0610a-b71d-4704-ba39-7fe982dfa2c1": [
    {
      title: "Foundation: Projectile Motion & Kinematics",
      equations: [
        { formula: "T = \\frac{2v_0 \\sin\\theta}{g}", label: "Time of Flight (Ground-to-Ground)" },
        { formula: "H_{max} = \\frac{v_0^2 \\sin^2\\theta}{2g}", label: "Maximum Height" },
        { formula: "R = \\frac{v_0^2 \\sin(2\\theta)}{g}", label: "Horizontal Range" },
        { formula: "y = x \\tan\\theta - \\frac{g x^2}{2 v_0^2 \\cos^2\\theta}", label: "Trajectory Equation" },
        { formula: "R_{inclined} = \\frac{v_0^2}{g \\cos^2\\beta} [\\sin(2\\theta - \\beta) - \\sin\\beta]", label: "Range on Incline (Incline Angle β)" }
      ]
    },
    {
      title: "1. Coulomb's Law & Electric Fields",
      equations: [
        { formula: "F = \\frac{1}{4\\pi\\epsilon_0} \\frac{q_1 q_2}{r^2}", label: "Coulomb's Law Force" },
        { formula: "E = \\frac{1}{4\\pi\\epsilon_0} \\frac{q}{r^2}", label: "Electric Field of Point Charge" },
        { formula: "E_{ring} = \\frac{1}{4\\pi\\epsilon_0} \\frac{Q x}{(R^2 + x^2)^{3/2}}", label: "Electric Field on Axis of Charged Ring" },
        { formula: "E_{ring\\_max} \\implies x = \\frac{R}{\\sqrt{2}}", label: "Location of Maximum Electric Field of Ring" },
        { formula: "E = \\frac{\\lambda}{2\\pi\\epsilon_0 r}", label: "Electric Field of Infinite Line Charge" },
        { formula: "E = \\frac{\\sigma}{2\\epsilon_0}", label: "Electric Field of Infinite Sheet of Charge" },
        { formula: "E_{out} = \\frac{Q}{4\\pi\\epsilon_0 r^2} \\text{ (r ≥ R), } 0 \\text{ (r < R)}", label: "Electric Field of Conducting Shell (Radius R)" },
        { formula: "E_{non\\_cond} = \\frac{Q r}{4\\pi\\epsilon_0 R^3} \\text{ (r < R)}", label: "Electric Field inside Non-Conducting Sphere" }
      ]
    },
    {
      title: "2. Gauss's Law & Electric Flux",
      equations: [
        { formula: "\\Phi = \\oint \\vec{E} \\cdot d\\vec{A} = \\frac{q_{enclosed}}{\\epsilon_0}", label: "Gauss's Law Integral Form" }
      ]
    },
    {
      title: "3. Potential & Potential Energy",
      equations: [
        { formula: "\\vec{E} = -\\vec{\\nabla} V", label: "Electric Field as Potential Gradient" },
        { formula: "V = \\frac{1}{4\\pi\\epsilon_0} \\frac{q}{r}", label: "Electric Potential of Point Charge" },
        { formula: "V_{shell\\_in} = \\frac{Q}{4\\pi\\epsilon_0 R}", label: "Electric Potential inside Conducting Shell" },
        { formula: "V_{non\\_cond\\_in} = \\frac{Q(3R^2 - r^2)}{8\\pi\\epsilon_0 R^3}", label: "Electric Potential inside Non-Conducting Sphere" },
        { formula: "U_{self\\_shell} = \\frac{Q^2}{8\\pi\\epsilon_0 R}", label: "Electrostatic Self-Energy of Conducting Shell" },
        { formula: "U_{self\\_sphere} = \\frac{3Q^2}{20\\pi\\epsilon_0 R}", label: "Electrostatic Self-Energy of Solid Sphere" },
        { formula: "U = \\frac{1}{4\\pi\\epsilon_0} \\frac{q_1 q_2}{r}", label: "Electrostatic Potential Energy of Pair" }
      ]
    },
    {
      title: "4. Electric Dipoles",
      equations: [
        { formula: "\\vec{p} = q \\cdot 2\\vec{a}", label: "Electric Dipole Moment Vector" },
        { formula: "E_{axial} = \\frac{2kp}{r^3} \\text{, } E_{equatorial} = \\frac{kp}{r^3}", label: "Short Dipole Fields (k = 1/4πε₀)" },
        { formula: "E_{general} = \\frac{kp}{r^3}\\sqrt{1 + 3\\cos^2\\theta}", label: "Dipole Field at general point (r, θ)" },
        { formula: "\\vec{\\tau} = \\vec{p} \\times \\vec{E}", label: "Torque on Dipole in Electric Field" },
        { formula: "U = -\\vec{p} \\cdot \\vec{E}", label: "Potential Energy of Dipole in Electric Field" },
        { formula: "W = pE(\\cos\\theta_1 - \\cos\\theta_2)", label: "Work done in rotating Dipole in E-Field" }
      ]
    },
    {
      title: "5. Capacitance & Energy",
      equations: [
        { formula: "C = \\frac{Q}{V}", label: "General Capacitance definition" },
        { formula: "C = \\frac{\\epsilon_0 A}{d}", label: "Parallel Plate Capacitor (Air)" },
        { formula: "C' = K \\frac{\\epsilon_0 A}{d}", label: "Parallel Plate with Dielectric Constant K" },
        { formula: "C = \\frac{\\epsilon_0 A}{d - t(1 - 1/K)}", label: "Parallel Plate with Dielectric Slab of thickness t" },
        { formula: "C_{series\\_pair} = \\frac{C_1 C_2}{C_1 + C_2}", label: "Series Combination (2 Capacitors)" },
        { formula: "C_{parallel} = \\sum C_i", label: "Parallel Combination" },
        { formula: "U = \\frac{1}{2} C V^2 = \\frac{1}{2} \\frac{Q^2}{C}", label: "Energy Stored in Capacitor" },
        { formula: "u_E = \\frac{1}{2}\\epsilon_0 E^2", label: "Energy Density of Electric Field" },
        { formula: "\\Delta U = \\frac{C_1 C_2}{2(C_1 + C_2)}(V_1 - V_2)^2", label: "Heat Loss during sharing of charges between capacitors" }
      ]
    }
  ]
};

export default function Courses() {
  const navigate = useNavigate();
  
  // Auth state
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem("edumind_user") || "{}"));
  const studentId = currentUser.id;

  // Page state
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [activeSubjectTab, setActiveSubjectTab] = useState("All");

  // Active view state
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  // Dynamic curriculum states for on-demand caching
  const [dynamicCurriculums, setDynamicCurriculums] = useState({});
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);

  useEffect(() => {
    if (activeCourseId && !dynamicCurriculums[activeCourseId]) {
      setLoadingCurriculum(true);
      api.get(`/courses/${activeCourseId}/curriculum`)
        .then(res => {
          if (res.data && res.data.modules) {
            setDynamicCurriculums(prev => ({
              ...prev,
              [activeCourseId]: res.data
            }));
            
            // Set expanded modules for the newly loaded course
            const defaultExpanded = { 0: true }; // expand first module by default
            setExpandedModules(defaultExpanded);

            // Automatically set active lesson to the first lesson of the first module
            const firstModule = res.data.modules[0];
            if (firstModule && firstModule.lessons && firstModule.lessons.length > 0) {
              setActiveLessonId(firstModule.lessons[0].id);
            }
          } else {
            throw new Error("Invalid backend curriculum payload");
          }
        })
        .catch(err => {
          console.warn("[Courses] Failed to load dynamic curriculum from API, trying static fallback:", err);
          if (CURRICULUM[activeCourseId]) {
            setDynamicCurriculums(prev => ({
              ...prev,
              [activeCourseId]: CURRICULUM[activeCourseId]
            }));
            
            const defaultExpanded = { 0: true };
            setExpandedModules(defaultExpanded);
            const firstModule = CURRICULUM[activeCourseId].modules[0];
            if (firstModule && firstModule.lessons && firstModule.lessons.length > 0) {
              setActiveLessonId(firstModule.lessons[0].id);
            }
          } else {
            toast.error("Failed to load detailed curriculum.");
          }
        })
        .finally(() => {
          setLoadingCurriculum(false);
        });
    }
  }, [activeCourseId, dynamicCurriculums]);

  // Study timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef(null);

  // Floating particles (for completion celebration)
  const [celebrationParticles, setCelebrationParticles] = useState([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Diagram state
  const [isDiagramLoading, setIsDiagramLoading] = useState(false);
  const [showDiagramModal, setShowDiagramModal] = useState(false);
  const [diagramSvg, setDiagramSvg] = useState("");
  const [sourcePage, setSourcePage] = useState(null);

  // Adaptive Quiz states
  const [quizActive, setQuizActive] = useState(false);
  const [quizSubject, setQuizSubject] = useState("");
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [chosenOption, setChosenOption] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [incorrectStreak, setIncorrectStreak] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState("Medium");
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [askedQuestionIds, setAskedQuestionIds] = useState([]);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [quizEnded, setQuizEnded] = useState(false);
  const [predictingRisk, setPredictingRisk] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [riskResult, setRiskResult] = useState(null);
  const [lastWrongTopic, setLastWrongTopic] = useState(null);
  


  // AI Flashcards states
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [flashcardsList, setFlashcardsList] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [flashcardLoading, setFlashcardLoading] = useState(false);
  const [scoreGotIt, setScoreGotIt] = useState(0);
  const [reviewedCardIds, setReviewedCardIds] = useState(new Set());

  // Tab & Formula Search states
  const [activeTab, setActiveTab] = useState("notes");
  const [formulaQuery, setFormulaQuery] = useState("");

  // Fetch courses, enrollments, and local progress
  const loadData = async (resolvedStudentId = null) => {
    const activeStudentId = resolvedStudentId || studentId;
    if (!activeStudentId) {
      console.warn("[EduMind Diagnostics] Courses activeStudentId is missing, returning early.");
      return;
    }
    console.log("[EduMind Diagnostics] Courses activeStudentId:", activeStudentId);

    try {
      setLoading(true);
      
      // 1. Fetch courses from backend API
      const coursesRes = await api.get("/courses");
      let coursesData = coursesRes.data || [];

      // Fallback if backend is empty
      if (coursesData.length === 0) {
        coursesData = Object.values(CURRICULUM).map(c => ({
          id: c.id,
          title: c.title,
          subject: c.subject,
          description: c.description || "Master core formulas and structural concepts with interactive curriculum content.",
        }));
      }

      // 2. Fetch enrollments from backend API
      const enrollmentsRes = await api.get(`/courses/my-courses/${activeStudentId}`);
      const enrollmentsData = enrollmentsRes.data || [];

      setCourses(coursesData);
      setEnrollments(enrollmentsData);
      console.log("[EduMind Diagnostics] Courses enrollments:", enrollmentsData);

      // 3. Load completed lessons from localStorage
      const savedCompleted = localStorage.getItem(`edumind_completed_lessons_${activeStudentId}`);
      if (savedCompleted) {
        setCompletedLessons(JSON.parse(savedCompleted));
      } else {
        setCompletedLessons([]);
      }

    } catch (err) {
      console.warn("Backend API failed to load courses, trying direct Supabase fallback:", err);
      try {
        const { data: coursesData } = await supabase.from("courses").select("*");
        const { data: enrollmentsData } = await supabase.from("enrollments").select("*").eq("student_id", activeStudentId);
        
        setCourses(coursesData || []);
        setEnrollments(enrollmentsData || []);
        console.log("[EduMind Diagnostics] Courses enrollments (direct fallback):", enrollmentsData);

        const savedCompleted = localStorage.getItem(`edumind_completed_lessons_${activeStudentId}`);
        if (savedCompleted) {
          setCompletedLessons(JSON.parse(savedCompleted));
        } else {
          setCompletedLessons([]);
        }
      } catch (dbErr) {
        console.error("Supabase fallback failed too:", dbErr);
        toast.error("Failed to load courses. Please refresh.");
      }
    } finally {
      // Check query parameters to auto-launch workspace
      const queryParams = new URLSearchParams(window.location.search);
      const targetCourseId = queryParams.get("courseId");
      const targetLessonId = queryParams.get("lessonId");
      const fromParam = queryParams.get("from");
      if (fromParam) {
        setSourcePage(fromParam);
      }
      if (targetCourseId) {
        setActiveCourseId(targetCourseId);
        if (targetLessonId) {
          setActiveLessonId(targetLessonId);
          const courseConfig = dynamicCurriculums[targetCourseId] || CURRICULUM[targetCourseId];
          if (courseConfig) {
            const defaultExpanded = {};
            courseConfig.modules.forEach((mod, index) => {
              if (mod.lessons.some(l => l.id === targetLessonId)) {
                defaultExpanded[index] = true;
              }
            });
            setExpandedModules(defaultExpanded);
          }
        }
        setTimerSeconds(0);
        setIsTimerRunning(true);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    const healUser = async () => {
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
            // Fetch profile asynchronously to self-heal user details, but don't block
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
                // Server offline: create local recovered representation using the decoded ID
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
        activeUserId = studentId;
      }

      if (!activeUserId) {
        navigate("/");
        return;
      }

      loadData(activeUserId);
    };

    healUser();
  }, [studentId]);

  // Resilient enrollment fetching helper (bypasses offline server)
  const fetchUpdatedEnrollments = async () => {
    try {
      const enrollmentsRes = await api.get(`/courses/my-courses/${studentId}`);
      return enrollmentsRes.data || [];
    } catch (err) {
      const { data: enrollmentsData } = await supabase
        .from("enrollments")
        .select("*")
        .eq("student_id", studentId);
      return enrollmentsData || [];
    }
  };

  // Handle Enrollment
  const handleEnroll = async (courseId) => {
    try {
      setEnrollingId(courseId);
      
      // Post to backend enroll endpoint
      await api.post(`/courses/${courseId}/enroll?student_id=${studentId}`);
      
      toast.success("Enrolled successfully! Welcome to the course.");
      localStorage.removeItem("edumind_new_user");
      
      // Refresh enrollments (resilient)
      const updatedEnrollments = await fetchUpdatedEnrollments();
      setEnrollments(updatedEnrollments);

      // Auto-launch course workspace
      launchWorkspace(courseId, true);

      // Clear any pre-seeded completed lessons for this course to start at 0%
      const courseConfig = dynamicCurriculums[courseId] || CURRICULUM[courseId];
      if (courseConfig) {
        const lessonIds = [];
        courseConfig.modules.forEach(m => {
          m.lessons.forEach(l => {
            lessonIds.push(l.id);
          });
        });
        const savedCompleted = JSON.parse(localStorage.getItem(`edumind_completed_lessons_${studentId}`) || "[]");
        const updatedCompleted = savedCompleted.filter(id => !lessonIds.includes(id));
        localStorage.setItem(`edumind_completed_lessons_${studentId}`, JSON.stringify(updatedCompleted));
        setCompletedLessons(updatedCompleted);
      }
    } catch (err) {
      console.error("Enrollment failed:", err);
      // Fallback direct insert if API isn't responding or has issues
      try {
        await supabase.from("enrollments").insert({
          student_id: studentId,
          course_id: courseId
        });
        toast.success("Enrolled successfully! (Direct Fallback)");
        localStorage.removeItem("edumind_new_user");
        
        // Refresh enrollments (resilient)
        const updatedEnrollments = await fetchUpdatedEnrollments();
        setEnrollments(updatedEnrollments);

        // Auto-launch course workspace
        launchWorkspace(courseId, true);

        const courseConfigFallback = dynamicCurriculums[courseId] || CURRICULUM[courseId];
        if (courseConfigFallback) {
          const lessonIds = [];
          courseConfigFallback.modules.forEach(m => {
            m.lessons.forEach(l => {
              lessonIds.push(l.id);
            });
          });
          const savedCompleted = JSON.parse(localStorage.getItem(`edumind_completed_lessons_${studentId}`) || "[]");
          const updatedCompleted = savedCompleted.filter(id => !lessonIds.includes(id));
          localStorage.setItem(`edumind_completed_lessons_${studentId}`, JSON.stringify(updatedCompleted));
          setCompletedLessons(updatedCompleted);
        }
      } catch (fallbackErr) {
        console.error("Fallback enrollment failed:", fallbackErr);
        const errMsg = fallbackErr.message || "";
        if (errMsg.includes("already") || errMsg.includes("duplicate") || errMsg.includes("key")) {
          toast.error("Already enrolled in this course.");
        } else {
          toast.error("Failed to enroll. Please try again.");
        }
      }
    } finally {
      setEnrollingId(null);
    }
  };

  // Check enrollment status
  const isEnrolled = (courseId) => {
    return enrollments.some(e => e.course_id === courseId);
  };

  // Calculate course progress percentage
  const getCourseProgress = (courseId) => {
    const courseConfig = dynamicCurriculums[courseId] || CURRICULUM[courseId];
    if (!courseConfig) return 0;

    let total = 0;
    let completed = 0;

    courseConfig.modules.forEach(m => {
      m.lessons.forEach(l => {
        total++;
        if (completedLessons.includes(l.id)) {
          completed++;
        }
      });
    });

    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  // Find next lesson for a course
  const getNextLesson = (courseId) => {
    const courseConfig = dynamicCurriculums[courseId] || CURRICULUM[courseId];
    if (!courseConfig) return null;

    for (const mod of courseConfig.modules) {
      for (const les of mod.lessons) {
        if (!completedLessons.includes(les.id)) {
          return les;
        }
      }
    }
    return null; // Completed all
  };

  // Get current active course details
  const activeCourse = courses.find(c => c.id === activeCourseId);
  const activeCourseConfig = dynamicCurriculums[activeCourseId] || CURRICULUM[activeCourseId] || {
    id: activeCourseId,
    title: activeCourse?.title || "Course Details",
    subject: activeCourse?.subject || "Science",
    color: activeCourse?.subject?.toLowerCase() === "physics" ? "#a855f7" :
           activeCourse?.subject?.toLowerCase() === "chemistry" ? "#06b6d4" :
           activeCourse?.subject?.toLowerCase() === "maths" || activeCourse?.subject?.toLowerCase() === "mathematics" ? "#34d399" : "#f59e0b",
    glowColor: activeCourse?.subject?.toLowerCase() === "physics" ? "rgba(168,85,247,0.4)" :
               activeCourse?.subject?.toLowerCase() === "chemistry" ? "rgba(6,182,212,0.4)" :
               activeCourse?.subject?.toLowerCase() === "maths" || activeCourse?.subject?.toLowerCase() === "mathematics" ? "rgba(52,211,153,0.4)" : "rgba(245,158,11,0.4)",
    icon: activeCourse?.subject?.toLowerCase() === "physics" ? "⚡" :
          activeCourse?.subject?.toLowerCase() === "chemistry" ? "🧪" :
          activeCourse?.subject?.toLowerCase() === "maths" || activeCourse?.subject?.toLowerCase() === "mathematics" ? "∫" : "🧬",
    modules: [
      {
        title: "Module 1: General Core Overview",
        lessons: [
          {
            id: `fallback_${activeCourseId}_1`,
            title: "Introductory Concepts & Overview",
            topic: "Foundations",
            duration: 20,
            summary: `### Core Foundations of ${activeCourse?.title || "this topic"}
This module introduces the key frameworks and concepts of ${activeCourse?.title || "this course"} necessary for competitive JEE/NEET exam preparation.

### Expected Learning Outcomes
1. **Understand Key Definitions**: Relate these parameters to other sections of the Class 11-12 curriculum.
2. **Formula Applications**: Apply dimensional and scalar checks before numerical resolutions.
3. **Problem Solving**: Practice basic questions to prepare for the diagnostic assessments.

*Note: Professor ARIA has configured fallback modules. Complete course sheets are active!*`
          }
        ]
      }
    ]
  };

  // Helper to find a lesson by ID
  const getLessonById = (lessonId) => {
    if (!activeCourseConfig) return null;
    for (const mod of activeCourseConfig.modules) {
      const found = mod.lessons.find(l => l.id === lessonId);
      if (found) return found;
    }
    return null;
  };

  const activeLesson = getLessonById(activeLessonId);

  // Handle active course click (Workspace Launch)
  const launchWorkspace = (courseId, forceBypass = false) => {
    if (!forceBypass && !isEnrolled(courseId)) {
      toast.error("Please enroll in this course first!");
      return;
    }
    setActiveCourseId(courseId);
    
    // Auto-select first lesson or next uncompleted lesson
    const courseConfig = dynamicCurriculums[courseId] || CURRICULUM[courseId];
    if (courseConfig) {
      // Find next uncompleted lesson
      const nextL = getNextLesson(courseId);
      const targetLesson = nextL || courseConfig.modules[0].lessons[0];
      setActiveLessonId(targetLesson.id);

      // Auto-expand the module containing the target lesson
      const defaultExpanded = {};
      courseConfig.modules.forEach((mod, index) => {
        const containsLesson = mod.lessons.some(l => l.id === targetLesson.id);
        if (containsLesson || index === 0) {
          defaultExpanded[index] = true;
        }
      });
      setExpandedModules(defaultExpanded);
    }
    
    // Reset timer
    setTimerSeconds(0);
    setIsTimerRunning(true);
  };

  // Toggle Module Accordion
  const toggleModule = (index) => {
    setExpandedModules(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Stopwatch timer interval hook
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Trigger celebration micro-particles
  const triggerCelebration = () => {
    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        id: Math.random(),
        x: Math.random() * 100, // percentage of screen width
        y: 100, // start at bottom
        size: Math.random() * 8 + 4,
        color: activeCourseConfig?.color || "#a855f7",
        angle: Math.random() * 360,
        speed: Math.random() * 4 + 2,
        delay: Math.random() * 0.5
      });
    }
    setCelebrationParticles(particles);
    setTimeout(() => {
      setCelebrationParticles([]);
    }, 4000);
  };

  // Handle Mark Completed & Log Study Session
  const handleMarkCompleted = async () => {
    if (!activeLesson) return;

    const durationMinutes = Math.max(1, Math.round(timerSeconds / 60));
    
    try {
      // 1. Post study session to backend (feeds ML)
      await api.post(`/students/study-session?student_id=${studentId}`, {
        course_id: activeCourseId,
        topic: activeLesson.topic,
        duration_minutes: durationMinutes
      });

      // 2. Save completion state locally
      let updatedCompleted = [...completedLessons];
      if (!updatedCompleted.includes(activeLesson.id)) {
        updatedCompleted.push(activeLesson.id);
        localStorage.setItem(`edumind_completed_lessons_${studentId}`, JSON.stringify(updatedCompleted));
        setCompletedLessons(updatedCompleted);
      }

      incrementDailyCounter(studentId, "lessons");
      addDailyXp(studentId, durationMinutes * 5);
      toast.success(`Session logged! +${durationMinutes * 5} XP earned for ${activeLesson.topic}`);
      triggerCelebration();
      window.dispatchEvent(new Event("edumind_db_sync"));

      // Pause timer and reset
      setIsTimerRunning(false);
      
      // Auto advance to next lesson if available
      const nextL = getNextLesson(activeCourseId);
      if (nextL) {
        setTimeout(() => {
          setActiveLessonId(nextL.id);
          setTimerSeconds(0);
          setIsTimerRunning(true);
        }, 1500);
      } else {
        toast.success("Congratulations! You have completed all lessons in this course!");
      }

    } catch (err) {
      console.error("Error logging study session:", err);
      // Fallback local save anyway so user doesn't get blocked
      let updatedCompleted = [...completedLessons];
      if (!updatedCompleted.includes(activeLesson.id)) {
        updatedCompleted.push(activeLesson.id);
        localStorage.setItem(`edumind_completed_lessons_${studentId}`, JSON.stringify(updatedCompleted));
        setCompletedLessons(updatedCompleted);
      }
      toast.success("Progress saved locally. (Offline Log)");
      triggerCelebration();
    }
  };

  // Close workspace and return to catalog
  const exitWorkspace = () => {
    setActiveCourseId(null);
    setActiveLessonId(null);
    setIsTimerRunning(false);
    setTimerSeconds(0);
    loadData(); // Reload to refresh progress circles in catalog
  };

  // Search filter across all courses
  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results = [];

    const allCurriculums = { ...CURRICULUM, ...dynamicCurriculums };
    Object.values(allCurriculums).forEach(course => {
      course.modules.forEach((mod, modIdx) => {
        mod.lessons.forEach(les => {
          const matchTitle = les.title.toLowerCase().includes(query);
          const matchTopic = les.topic.toLowerCase().includes(query);
          const matchSummary = les.summary.toLowerCase().includes(query);
          
          if (matchTitle || matchTopic || matchSummary) {
            results.push({
              courseId: course.id,
              courseTitle: course.title,
              courseSubject: course.subject,
              courseColor: course.color,
              courseIcon: course.icon,
              courseGlow: course.glowColor,
              moduleIndex: modIdx,
              moduleTitle: mod.title,
              lesson: les
            });
          }
        });
      });
    });

    return results;
  };

  // Select searched lesson
  const handleSelectSearchResult = async (res) => {
    const enrolled = isEnrolled(res.courseId);
    
    if (!enrolled) {
      const confirmEnroll = window.confirm(`To study "${res.lesson.title}", you need to enroll in "${res.courseTitle}". Would you like to enroll and start studying this lesson now?`);
      if (confirmEnroll) {
        await handleEnroll(res.courseId);
        setActiveCourseId(res.courseId);
        setActiveLessonId(res.lesson.id);
        setExpandedModules({
          [res.moduleIndex]: true
        });
        setTimerSeconds(0);
        setIsTimerRunning(true);
        setSearchQuery("");
      }
    } else {
      setActiveCourseId(res.courseId);
      setActiveLessonId(res.lesson.id);
      setExpandedModules({
        [res.moduleIndex]: true
      });
      setTimerSeconds(0);
      setIsTimerRunning(true);
      setSearchQuery("");
    }
  };

  // Generate SVG diagram via backend LLM
  const handleGenerateDiagram = async (forceRefresh = false) => {
    if (!activeLesson || !activeCourse) return;
    
    const isForce = forceRefresh === true;
    
    setShowDiagramModal(true);
    setIsDiagramLoading(true);
    setDiagramSvg("");
    
    try {
      const res = await api.post("/courses/generate-diagram", {
        topic: activeLesson.topic,
        subject: activeCourse.subject,
        force_refresh: isForce
      });
      
      if (res.data && res.data.svg) {
        setDiagramSvg(res.data.svg);
      } else {
        toast.error("Failed to generate diagram.");
        setShowDiagramModal(false);
      }
    } catch (err) {
      console.error("Error generating diagram:", err);
      toast.error("Diagram generation failed.");
      setShowDiagramModal(false);
    } finally {
      setIsDiagramLoading(false);
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

  const renderFormattedText = (text) => {
    if (!text) return "";
    const cleaned = cleanMathLaTeX(text);
    // Replace **bold** with <strong>
    let formatted = cleaned.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-extrabold text-white">$1</strong>');
    // Replace `code` with styled <code>
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/5 font-mono text-xs text-yellow-400 border border-white/5">$1</code>');
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const selectNextQuestion = (pool, difficulty, askedIds, lastWrongTopic = null) => {
    if (lastWrongTopic) {
      // 1. Search in current difficulty first for the last wrong topic
      const diffPool = pool[difficulty] || [];
      const topicAvailableInDiff = diffPool.filter(
        q => !askedIds.includes(q.id) && q.topic && q.topic.toLowerCase().includes(lastWrongTopic.toLowerCase())
      );
      if (topicAvailableInDiff.length > 0) {
        const idx = Math.floor(Math.random() * topicAvailableInDiff.length);
        return topicAvailableInDiff[idx];
      }
      
      // 2. Search in other difficulties for the last wrong topic
      const diffs = ["Medium", "Easy", "Hard"];
      for (const diff of diffs) {
        const altPool = pool[diff] || [];
        const topicAvailableInAlt = altPool.filter(
          q => !askedIds.includes(q.id) && q.topic && q.topic.toLowerCase().includes(lastWrongTopic.toLowerCase())
        );
        if (topicAvailableInAlt.length > 0) {
          const idx = Math.floor(Math.random() * topicAvailableInAlt.length);
          return topicAvailableInAlt[idx];
        }
      }
    }

    const diffPool = pool[difficulty] || [];
    const available = diffPool.filter(q => !askedIds.includes(q.id));
    
    if (available.length > 0) {
      const idx = Math.floor(Math.random() * available.length);
      return available[idx];
    }
    
    const diffs = ["Medium", "Easy", "Hard"];
    for (const diff of diffs) {
      const altPool = pool[diff] || [];
      const altAvailable = altPool.filter(q => !askedIds.includes(q.id));
      if (altAvailable.length > 0) {
        const idx = Math.floor(Math.random() * altAvailable.length);
        return altAvailable[idx];
      }
    }
    
    return null;
  };

  const getSimulationMapping = (topic, subject) => {
    if (!topic || !subject) return null;
    const t = topic.toLowerCase();
    const s = subject.toLowerCase();
    
    if (s === "physics") {
      if (t.includes("angular") || t.includes("torque") || t.includes("rotation") || t.includes("moment of inertia") || t.includes("rolling")) {
        return { path: "/physics-lab", sim: "tangential" };
      }
      if (t.includes("coulomb") || t.includes("electric") || t.includes("field") || t.includes("potential") || t.includes("gauss") || t.includes("capacitance")) {
        return { path: "/physics-lab", sim: "electromagnetism" };
      }
      if (t.includes("motion") || t.includes("kinematics") || t.includes("displacement") || t.includes("velocity") || t.includes("acceleration")) {
        return { path: "/physics-lab", sim: "projectile" };
      }
    } else if (s === "chemistry") {
      if (t.includes("substitution") || t.includes("organic") || t.includes("nomenclature") || t.includes("aromatic") || t.includes("alk") || t.includes("alcohol") || t.includes("phenol") || t.includes("effect") || t.includes("bonding")) {
        return { path: "/chem-lab", sim: "bonding" };
      }
    }
    return null;
  };

  const handleStartFlashcards = async (topic, subject) => {
    setFlashcardLoading(true);
    setShowFlashcardModal(true);
    setFlashcardsList([]);
    setCurrentCardIndex(0);
    setIsCardFlipped(false);
    setScoreGotIt(0);
    setReviewedCardIds(new Set());
    
    try {
      let sub = subject;
      if (sub === "Maths") sub = "Mathematics";
      
      const res = await api.post("/courses/generate-flashcards", {
        topic: topic,
        subject: sub,
        num_cards: 6
      });
      if (res.data && res.data.flashcards) {
        setFlashcardsList(res.data.flashcards);
      } else {
        toast.error("Failed to generate flashcards.");
        setShowFlashcardModal(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate flashcards. Dynamic generator unavailable.");
      setShowFlashcardModal(false);
    } finally {
      setFlashcardLoading(false);
    }
  };

  const startAdaptiveQuiz = async (courseId) => {
    const courseConfig = dynamicCurriculums[courseId] || CURRICULUM[courseId];
    if (!courseConfig) return;
    
    let subject = courseConfig.subject;
    if (subject === "Maths") subject = "Mathematics";
    
    setLoading(true);
    try {
      // 1. Extract dynamic course topics list from all module lessons
      const topicsList = [];
      if (courseConfig.modules) {
        courseConfig.modules.forEach(mod => {
          if (mod.lessons) {
            mod.lessons.forEach(les => {
              if (les.topic && !topicsList.includes(les.topic)) {
                topicsList.push(les.topic);
              }
            });
          }
        });
      }

      // 2. Pull weak topics from quiz history + mistake logs, scoped to this course
      const weakTopics = await fetchWeakTopicsForSubject(studentId, subject);
      const targetedTopics = matchCourseWeakTopics(topicsList, weakTopics);
      const topicsStr = targetedTopics.length > 0
        ? targetedTopics.slice(0, 5).join(", ")
        : topicsList.join(", ");

      if (targetedTopics.length > 0) {
        toast.success(`Adaptive quiz targeting ${targetedTopics.length} weak topic(s)`);
      }

      // 3. Fetch AI-generated questions focused on weak topics when available
      const res = await api.post("/tests/generate-custom", {
        student_id: studentId || "guest",
        subject: subject,
        topics: topicsStr
      });
      
      const pool = res.data;
      if (!pool || Object.keys(pool).length === 0) {
        toast.error("Failed to load questions pool for this subject.");
        return;
      }

      const prioritizedPool = prioritizePoolByWeakTopics(pool, targetedTopics.length > 0 ? targetedTopics : weakTopics);
      
      setQuizSubject(subject);
      setQuizQuestions(prioritizedPool);
      setCurrentQuestionIndex(0);
      setChosenOption(null);
      setAnswerSubmitted(false);
      setCorrectStreak(0);
      setIncorrectStreak(0);
      setCurrentDifficulty("Medium");
      setQuizAnswers([]);
      setAskedQuestionIds([]);
      setQuizStartTime(Date.now());
      setQuizEnded(false);
      setRiskResult(null);

      setLastWrongTopic(null); // Reset dynamic weak topic pointer
      
      const firstQ = selectNextQuestion(prioritizedPool, "Medium", []);
      if (firstQ) {
        setCurrentQuestion(firstQ);
        setAskedQuestionIds([firstQ.id]);
        setQuizActive(true);
      } else {
        toast.error("No questions available for this course.");
      }
    } catch (err) {
      console.error("Error starting adaptive quiz:", err);
      toast.error("Failed to fetch questions. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  const logMistakeAutomatically = async (question) => {
    try {
      await api.post("/students/mistake-analysis", {
        student_id: studentId || "guest",
        test_id: null,
        question_id: question.id,
        explanation_text: `Automated incorrect answer log for topic: ${question.topic}`,
        ai_classification: "Unclassified",
        confidence_score: 1.0
      });
      console.log("Automatically logged mistake for topic:", question.topic);
    } catch (err) {
      console.warn("Failed to automatically log mistake:", err);
    }
  };

  const handleAnswerSubmit = () => {
    if (chosenOption === null || answerSubmitted) return;
    
    const isCorrect = (chosenOption === currentQuestion.correct_index);
    
    let newCorrectStreak = correctStreak;
    let newIncorrectStreak = incorrectStreak;
    
    if (isCorrect) {
      newCorrectStreak += 1;
      newIncorrectStreak = 0;
      
      if (newCorrectStreak === 2) {
        if (currentDifficulty === "Easy") setCurrentDifficulty("Medium");
        else if (currentDifficulty === "Medium") setCurrentDifficulty("Hard");
        newCorrectStreak = 0;
      }
      setLastWrongTopic(null); // Clear weak topic pointer on correct answer
    } else {
      newIncorrectStreak += 1;
      newCorrectStreak = 0;
      
      if (newIncorrectStreak === 2) {
        if (currentDifficulty === "Hard") setCurrentDifficulty("Medium");
        else if (currentDifficulty === "Medium") setCurrentDifficulty("Easy");
        newIncorrectStreak = 0;
      }
      
      setLastWrongTopic(currentQuestion.topic); // Prioritize this topic on the next question selection
      
      // Automatically log mistake to backend table so it remembers the weak topic
      logMistakeAutomatically(currentQuestion);
    }
    
    setCorrectStreak(newCorrectStreak);
    setIncorrectStreak(newIncorrectStreak);
    
    const currentAns = {
      id: currentQuestion.id,
      topic: currentQuestion.topic,
      difficulty: currentQuestion.difficulty,
      is_correct: isCorrect,
      chosen_index: chosenOption,
      correct_index: currentQuestion.correct_index,
      text: currentQuestion.text,
      options: currentQuestion.options,
      solution: currentQuestion.solution
    };
    
    setQuizAnswers([...quizAnswers, currentAns]);
    setAnswerSubmitted(true);
  };

  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex >= 6) {
      endQuiz();
    } else {
      const nextQ = selectNextQuestion(quizQuestions, currentDifficulty, askedQuestionIds, lastWrongTopic);
      if (nextQ) {
        setCurrentQuestion(nextQ);
        setAskedQuestionIds([...askedQuestionIds, nextQ.id]);
        setCurrentQuestionIndex(nextIndex);
        setChosenOption(null);
        setAnswerSubmitted(false);

      } else {
        endQuiz();
      }
    }
  };

  const endQuiz = async () => {
    setQuizEnded(true);
    setPredictingRisk(true);
    setQuizSubmitting(true);
    
    const totalSecs = Math.round((Date.now() - quizStartTime) / 1000);
    const correctCount = quizAnswers.filter(a => a.is_correct).length;
    const finalScore = Math.round((correctCount / quizAnswers.length) * 100) || 0;
    
    const targetStudentId = studentId || "guest";

    // 1. Fire quiz result submission in background/parallel
    const submitPromise = api.post(`/students/quiz-result?student_id=${targetStudentId}`, {
      course_id: activeCourseId || "general",
      subject: quizSubject,
      topic: quizAnswers[0]?.topic || "General Assessment",
      score: finalScore,
      total_questions: quizAnswers.length,
      correct_answers: correctCount,
      time_taken_seconds: totalSecs
    }).catch(err => {
      console.error("Failed to submit quiz results:", err);
    });

    // 2. Fire ML cognitive risk prediction with real student metrics
    const mlMetricsPromise = fetchStudentMlMetrics(targetStudentId, finalScore);
    const riskPromise = mlMetricsPromise.then((metrics) =>
      api.post("/ml/predict-risk", metrics).then(res => {
        setRiskResult(res.data);
      })
    ).catch(err => {
      console.error("Failed to predict risk status:", err);
      let status = "On-Track";
      let prob = 0.2;
      let recs = ["Continue maintaining your consistent study streak.", "Practice similar quiz modules to target full syllabus mastery."];
      if (finalScore < 50) {
        status = "At-Risk";
        prob = 0.65;
        recs = ["Review weak concept logs. Your test scores are below baseline.", "Use the consult ARIA AI tool for instant explanation of derivations."];
      } else if (finalScore >= 80) {
        status = "Advanced";
        prob = 0.05;
        recs = ["Excellent performance! Start attempting full-length mock papers.", "Try high-difficulty questions in the Labs."];
      }
      setRiskResult({
        status: status,
        risk_probability: prob,
        feature_importances: { avg_score: 0.50, study_hours: 0.30, doubts_asked: 0.15, streak: 0.05 },
        recommendations: recs
      });
    });

    // Wait for both parallel actions to settle
    try {
      await Promise.all([submitPromise, riskPromise]);
    } catch (err) {
      console.error("Error waiting for quiz diagnostic pipelines:", err);
    } finally {
      setQuizSubmitting(false);
      setPredictingRisk(false);
    }
    
    incrementDailyCounter(targetStudentId, "quizzes");
    addDailyXp(targetStudentId, 50);
    toast.success(`Quiz Completed! Score: ${finalScore}% (+50 XP)`);
    window.dispatchEvent(new Event("edumind_db_sync"));
  };



  const filteredCourses = courses.filter(c => {
    if (activeSubjectTab === "All") return true;
    if (activeSubjectTab === "Physics") return c.subject?.toLowerCase() === "physics";
    if (activeSubjectTab === "Chemistry") return c.subject?.toLowerCase() === "chemistry";
    if (activeSubjectTab === "Mathematics") return c.subject?.toLowerCase() === "maths" || c.subject?.toLowerCase() === "mathematics";
    return true;
  });

  return (
    <div className="w-full min-h-screen text-white relative flex flex-col overflow-x-hidden" style={{ background: "#030014" }}>
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/5 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 blur-[140px] rounded-full pointer-events-none z-0" />
      
      {/* Tiny dot grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none z-0"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />

      {/* Confetti Celebration Overlay */}
      {celebrationParticles.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {celebrationParticles.map(p => (
            <motion.div
              key={p.id}
              initial={{ y: "105vh", x: `${p.x}vw`, opacity: 1, rotate: 0 }}
              animate={{ 
                y: "-10vh", 
                x: `${p.x + (Math.sin(p.angle) * 10)}vw`,
                opacity: 0,
                rotate: p.angle + 360
              }}
              transition={{ 
                duration: p.speed, 
                ease: "easeOut",
                delay: p.delay
              }}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                background: p.color,
                boxShadow: `0 0 10px ${p.color}`,
              }}
            />
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-[70vh]">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-t-purple-500 border-r-purple-500 animate-spin" />
          </div>
          <p className="mt-4 text-xs font-mono tracking-widest text-purple-300 animate-pulse">SYNCHRONIZING SYLLABUS...</p>
        </div>
      ) : !activeCourseId ? (
        
        /* ──────────────────────────────────────────────────────────
           VIEW 1: COURSE CATALOG / BROWSER
           ────────────────────────────────────────────────────────── */
        <div className="max-w-6xl mx-auto w-full relative z-10 py-12 px-6 lg:px-16 flex-1 flex flex-col">
          
          {/* Header */}
          <header className="flex justify-between items-center mb-10">
            <button 
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors py-2 px-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm"
                style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>📚</div>
              <span className="text-base font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 animate-pulse" style={{ fontFamily: "Poppins" }}>
                EduMind Curriculum
              </span>
            </div>
          </header>

          {/* Intro Hero */}
          <div className="text-center mb-12">
            <span className="px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase bg-purple-500/10 border border-purple-500/30 text-purple-300">
              ACADEMIC FOUNDATIONS
            </span>
            <h1 className="text-3xl font-extrabold mt-3 tracking-tight" style={{ fontFamily: "Poppins" }}>
              Explore Core Subject Courses
            </h1>
            <p className="text-xs text-gray-400 mt-2 max-w-xl mx-auto leading-relaxed">
              Enroll in foundational courses designed for deep mathematical rigor and conceptual mastery. Track lessons completed, log study minutes, and build subject authority.
            </p>
          </div>

          {/* Search bar */}
          <div className="max-w-md mx-auto mb-10 w-full relative z-20">
            <div className="relative">
              <input
                type="text"
                placeholder="Search topics (e.g. Torque, Nucleophilic, Integration...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#07041a]/60 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 backdrop-blur-md transition-all font-sans"
                style={{
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5), 0 0 15px rgba(168,85,247,0.05)"
                }}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <Search size={16} />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Subject Filtering Tabs */}
          {!searchQuery && (
            <div className="flex justify-center gap-2 mb-10 relative z-20 overflow-x-auto py-1 scrollbar-none">
              {["All", "Physics", "Chemistry", "Mathematics"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSubjectTab(tab)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 select-none whitespace-nowrap"
                  style={{
                    background: activeSubjectTab === tab ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.02)",
                    color: activeSubjectTab === tab ? "#c084fc" : "rgba(255,255,255,0.45)",
                    border: activeSubjectTab === tab ? "1px solid rgba(168,85,247,0.3)" : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: activeSubjectTab === tab ? "0 4px 15px -5px rgba(168,85,247,0.2)" : "none"
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {searchQuery && (
            <div className="mb-10 space-y-4 relative z-10">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase font-mono">
                  Search Results ({getSearchResults().length})
                </h3>
              </div>
              
              {getSearchResults().length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getSearchResults().map((res) => {
                    const enrolled = isEnrolled(res.courseId);
                    return (
                      <motion.div
                        key={res.lesson.id}
                        whileHover={{ y: -2 }}
                        onClick={() => handleSelectSearchResult(res)}
                        className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer flex flex-col justify-between transition-all"
                        style={{
                          borderColor: enrolled ? `${res.courseColor}20` : "rgba(255,255,255,0.06)",
                        }}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span 
                              className="text-[9px] font-mono uppercase px-2 py-0.5 rounded border"
                              style={{ 
                                color: res.courseColor,
                                borderColor: `${res.courseColor}30`,
                                backgroundColor: `${res.courseColor}10`
                              }}
                            >
                              {res.courseSubject}
                            </span>
                            {enrolled ? (
                              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-0.5">
                                <CheckCircle2 size={10} /> Enrolled
                              </span>
                            ) : (
                              <span className="text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                Not Enrolled
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-white leading-snug">{res.lesson.title}</h4>
                          <p className="text-[10px] text-gray-500 mt-1 leading-normal font-sans">
                            {res.courseIcon} {res.courseTitle} &bull; {res.moduleTitle}
                          </p>
                        </div>
                        <div className="mt-4 flex justify-between items-center text-[10px]">
                          <span className="text-gray-500">Topic: <span className="font-semibold text-gray-300 ml-1">{res.lesson.topic}</span></span>
                          <span className="font-bold flex items-center gap-1 hover:translate-x-0.5 transition-transform" style={{ color: res.courseColor }}>
                            Study Now <ChevronRight size={12} />
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl border border-white/5 bg-white/5">
                  <p className="text-xs text-gray-500 font-sans">No topics or lessons match "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}

          {/* Course Grid */}
          {!searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-start">
              {filteredCourses.map((course) => {
                const enrolled = isEnrolled(course.id);
                const progress = getCourseProgress(course.id);
                const nextLes = getNextLesson(course.id);
                const courseConfig = dynamicCurriculums[course.id] || CURRICULUM[course.id] || {
                  color: course.subject?.toLowerCase() === "physics" ? "#a855f7" :
                         course.subject?.toLowerCase() === "chemistry" ? "#06b6d4" :
                         course.subject?.toLowerCase() === "maths" || course.subject?.toLowerCase() === "mathematics" ? "#34d399" : "#f59e0b",
                  glowColor: course.subject?.toLowerCase() === "physics" ? "rgba(168,85,247,0.2)" :
                             course.subject?.toLowerCase() === "chemistry" ? "rgba(6,182,212,0.2)" :
                             course.subject?.toLowerCase() === "maths" || course.subject?.toLowerCase() === "mathematics" ? "rgba(52,211,153,0.2)" : "rgba(245,158,11,0.2)",
                  icon: course.subject?.toLowerCase() === "physics" ? "⚡" :
                        course.subject?.toLowerCase() === "chemistry" ? "🧪" :
                        course.subject?.toLowerCase() === "maths" || course.subject?.toLowerCase() === "mathematics" ? "∫" : "🧬"
                };

                return (
                  <motion.div
                    key={course.id}
                    whileHover={{ y: -4 }}
                    className="rounded-2xl p-6 relative overflow-hidden flex flex-col min-h-[260px] transition-all"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${enrolled ? `${courseConfig.color}40` : "rgba(255,255,255,0.06)"}`,
                      boxShadow: enrolled ? `0 10px 30px -10px ${courseConfig.glowColor}` : "none",
                      backdropFilter: "blur(16px)"
                    }}
                  >
                    {/* Decorative background glow gradient */}
                    <div 
                      className="absolute -right-16 -top-16 w-36 h-36 rounded-full blur-[40px] pointer-events-none opacity-20"
                      style={{ background: courseConfig.color }}
                    />

                    {/* Course Header */}
                    <div className="flex justify-between items-start gap-4 mb-4 relative z-10">
                      <div>
                        <span 
                          className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border"
                          style={{ 
                            color: courseConfig.color, 
                            borderColor: `${courseConfig.color}30`,
                            backgroundColor: `${courseConfig.color}10` 
                          }}
                        >
                          {course.subject}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-2 font-sans tracking-tight leading-snug">
                          {courseConfig.icon} {course.title}
                        </h3>
                      </div>
                      {enrolled && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={10} /> Enrolled
                        </span>
                      )}
                    </div>

                    {/* Course Description */}
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed flex-1 relative z-10">
                      {course.description || "Master core formulas and structural concepts with interactive curriculum content, timed logs, and predictive grading diagnostics."}
                    </p>

                    {/* Enrollment details / Progress */}
                    {enrolled ? (
                      <div className="space-y-4 mb-2 relative z-10">
                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-gray-500 font-medium">Syllabus Completion</span>
                            <span className="font-bold" style={{ color: courseConfig.color }}>{progress}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, ${courseConfig.color}, #ffffff)` }}
                            />
                          </div>
                        </div>

                        {/* Next Lesson Indicator */}
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                          <span className="text-gray-500">Next Lesson:</span>
                          <span className="font-semibold text-gray-300 truncate max-w-[200px]">
                            {nextLes ? nextLes.title : "🎓 Course Fully Completed!"}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => launchWorkspace(course.id)}
                            className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            style={{
                              background: `linear-gradient(135deg, ${courseConfig.color}, ${courseConfig.color}90)`,
                              boxShadow: `0 8px 20px -6px ${courseConfig.glowColor}`
                            }}
                          >
                            <Play size={11} className="fill-white" /> Continue
                          </button>
                          <button
                            onClick={() => startAdaptiveQuiz(course.id)}
                            className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 hover:bg-white/5 bg-white/3"
                          >
                            <Award size={11} className="text-yellow-400" /> Take Quiz
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10 mt-auto pt-2">
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrollingId === course.id}
                          className="w-full py-2.5 rounded-xl text-xs font-bold text-white hover:scale-[1.02] active:scale-[0.98] transition-all border flex items-center justify-center gap-2 bg-white/3 hover:bg-white/5"
                          style={{ 
                            borderColor: "rgba(255,255,255,0.08)",
                          }}
                        >
                          {enrollingId === course.id ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-t-white border-white/20 rounded-full animate-spin" />
                              <span>Enrolling Student...</span>
                            </>
                          ) : (
                            <>
                              <Zap size={11} className="text-yellow-400" /> Enroll in Course
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      ) : (
        
        /* ──────────────────────────────────────────────────────────
           VIEW 2: IMMERSIVE ACTIVE COURSE WORKSPACE
           ────────────────────────────────────────────────────────── */
        <div className="flex-1 flex flex-col lg:flex-row relative z-10 max-h-screen overflow-hidden">
          {loadingCurriculum ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#030014] text-center p-8 relative min-h-screen w-full">
              <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
              <div className="relative z-10 space-y-6 max-w-md mx-auto">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-l-cyan-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center font-bold text-xl">🎓</div>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight">Syncing Syllabus with ARIA...</h3>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    Professor ARIA is generating a comprehensive syllabus map covering every core and minor topic in detail. Please wait a moment.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
          
          {/* A. WORKSPACE LEFT BAR: CURRICULUM DRAWER */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col border-r border-white/5 bg-[#07041a]/95 backdrop-blur-xl lg:max-h-screen">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/5 flex flex-col gap-3">
              <button 
                onClick={sourcePage === "mock-tests" ? () => navigate("/mock-tests") : exitWorkspace}
                className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-white transition-colors"
              >
                <ArrowLeft size={12} /> {sourcePage === "mock-tests" ? "Back to Mock Test Analysis" : "Back to Courses Catalog"}
              </button>
              <div>
                <span 
                  className="px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider border"
                  style={{ 
                    color: activeCourseConfig.color, 
                    borderColor: `${activeCourseConfig.color}30`,
                    backgroundColor: `${activeCourseConfig.color}10` 
                  }}
                >
                  {activeCourse?.subject || activeCourseConfig.subject}
                </span>
                <h2 className="text-base font-extrabold text-white mt-1.5 tracking-tight font-sans">
                  {activeCourse?.title || activeCourseConfig.title}
                </h2>
              </div>

              {/* Progress HUD inside Drawer */}
              <div className="mt-1 space-y-1">
                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-gray-500">Course Progress</span>
                  <span className="font-bold text-gray-300">{getCourseProgress(activeCourseId)}%</span>
                </div>
                <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${getCourseProgress(activeCourseId)}%`,
                      backgroundColor: activeCourseConfig.color
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Modules List Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {activeCourseConfig.modules.map((mod, modIdx) => {
                const isExpanded = expandedModules[modIdx];
                return (
                  <div key={modIdx} className="space-y-1">
                    {/* Module Accordion Trigger */}
                    <button
                      onClick={() => toggleModule(modIdx)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left bg-white/[0.01] hover:bg-white/5 border border-white/5"
                    >
                      <span className="text-[11px] font-bold text-gray-300 truncate pr-2">
                        {mod.title}
                      </span>
                      {isExpanded ? <ChevronDown size={14} className="text-gray-500 flex-shrink-0" /> : <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />}
                    </button>

                    {/* Lessons list */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden pl-2 pt-1 flex flex-col gap-1"
                        >
                          {mod.lessons.map((les) => {
                            const isCompleted = completedLessons.includes(les.id);
                            const isActive = activeLessonId === les.id;

                            return (
                              <button
                                key={les.id}
                                onClick={() => {
                                  setActiveLessonId(les.id);
                                  setActiveTab("notes");
                                  // Don't reset timer, just transition, or reset if they choose. Let's reset the stopwatch to 0.
                                  setTimerSeconds(0);
                                  setIsTimerRunning(true);
                                }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-left text-xs transition-all border"
                                style={{
                                  background: isActive ? `${activeCourseConfig.color}15` : "transparent",
                                  borderColor: isActive ? `${activeCourseConfig.color}40` : "transparent",
                                  color: isActive ? "#ffffff" : isCompleted ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)"
                                }}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                  </div>
                                )}
                                <span className="truncate flex-1 font-medium">{les.title}</span>
                                <span className="text-[9px] font-mono text-gray-600 flex-shrink-0">{les.duration}m</span>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* B. WORKSPACE CENTER/RIGHT: CONTENT & TOOL PANEL */}
          <div className="flex-1 flex flex-col max-h-screen overflow-y-auto lg:overflow-hidden bg-[#030014]">
            {activeLesson ? (
              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                
                {/* 1. Main Lesson Notes Panel (Center) */}
                <div className="flex-1 p-6 lg:p-8 flex flex-col overflow-y-auto lg:max-h-screen">
                  {/* Lesson header */}
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <span>Curriculum</span>
                        <ChevronRight size={10} />
                        <span>{activeCourse?.title || activeCourseConfig.title}</span>
                        <ChevronRight size={10} />
                        <span className="text-gray-300">{activeLesson.topic}</span>
                      </div>
                      <h1 className="text-2xl font-black text-white tracking-tight font-sans">
                        {activeLesson.title}
                      </h1>
                    </div>
                    
                    {/* Tab Switcher */}
                    <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 self-start sm:self-auto flex-shrink-0">
                      <button
                        onClick={() => setActiveTab("notes")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          activeTab === "notes"
                            ? "bg-white/10 text-white shadow"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Study Notes
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("formulas");
                          setFormulaQuery("");
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          activeTab === "formulas"
                            ? "bg-white/10 text-white shadow"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <Zap size={12} className="text-yellow-400" /> Formula Sheet
                      </button>
                    </div>
                  </div>

                  {activeTab === "notes" ? (
                    /* Study Notes Card */
                    <div 
                      className="flex-1 p-8 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md overflow-y-auto custom-scrollbar shadow-inner relative leading-relaxed study-notes-font-premium"
                    >
                      <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500;600&family=Lora:ital,wght@1,400;1,500;1,600&display=swap');
                        .study-notes-font-premium {
                          font-family: 'Outfit', sans-serif !important;
                        }
                        .study-notes-font-premium code {
                          font-family: 'Fira Code', monospace !important;
                        }
                        .formula-font {
                          font-family: 'Lora', 'Cambria Math', 'Latin Modern Math', 'Georgia', serif !important;
                          font-style: italic !important;
                        }
                      `}</style>
                      {/* Math note backdrop watermark */}
                      <div className="absolute right-6 top-6 text-white/[0.01] text-8xl font-serif pointer-events-none select-none">
                        {activeCourseConfig.icon}
                      </div>

                      {/* Rendered Summary Content */}
                      <div className="space-y-5 text-gray-300">
                        {(() => {
                          const summaryLines = [];
                          let insideMath = false;
                          let mathBuffer = "";

                          (activeLesson.summary || "").split("\n").forEach((line) => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith("$$") && !insideMath) {
                              insideMath = true;
                              mathBuffer = line;
                            } else if (insideMath) {
                              mathBuffer += "\n" + line;
                              if (trimmed.endsWith("$$")) {
                                summaryLines.push(mathBuffer);
                                insideMath = false;
                                mathBuffer = "";
                              }
                            } else {
                              summaryLines.push(line);
                            }
                          });
                          if (insideMath && mathBuffer) {
                            if (!mathBuffer.trim().endsWith("$$")) {
                              mathBuffer += "\n$$";
                            }
                            summaryLines.push(mathBuffer);
                          }

                          return summaryLines.map((line, idx) => {
                            const trimmed = line.trim();
                            if (!trimmed) return null;

                            if (trimmed.startsWith("### ")) {
                              const cleanHeader = trimmed.replace("### ", "");
                              // Detect if there's a colon separating header name and content on the same line
                              const colonIdx = cleanHeader.indexOf(":");
                              if (colonIdx !== -1 && colonIdx < 30) {
                                const headerName = cleanHeader.substring(0, colonIdx).trim();
                                const headerContent = cleanHeader.substring(colonIdx + 1).trim();
                                return (
                                  <div key={idx} className="space-y-2.5 pt-5 pb-1">
                                    <h3 
                                      className="text-base font-bold text-white tracking-wider uppercase border-b border-white/5 pb-2.5 flex items-center gap-2"
                                      style={{ color: activeCourseConfig.color }}
                                    >
                                      <span className="w-2 h-4 rounded-full" style={{ backgroundColor: activeCourseConfig.color }} />
                                      {headerName}
                                    </h3>
                                    <p className="text-[14.5px] text-gray-300 leading-relaxed pl-1">
                                      {renderFormattedText(headerContent)}
                                    </p>
                                  </div>
                                );
                              }
                              
                              return (
                                <h3 
                                  key={idx} 
                                  className="text-base font-bold text-white tracking-wider uppercase border-b border-white/5 pb-2.5 pt-5 flex items-center gap-2"
                                  style={{ color: activeCourseConfig.color }}
                                >
                                  <span className="w-2 h-4 rounded-full" style={{ backgroundColor: activeCourseConfig.color }} />
                                  {cleanHeader}
                                </h3>
                              );
                            }
                            
                            // Block equations
                            if (trimmed.startsWith("$$")) {
                              return (
                                <div 
                                  key={idx} 
                                  className="p-6 rounded-xl border formula-font text-[17px] leading-relaxed my-4.5 shadow-md relative overflow-hidden group transition-all duration-300 hover:scale-[1.01] text-center"
                                  style={{ 
                                    background: `linear-gradient(135deg, ${activeCourseConfig.color}0c, rgba(255,255,255,0.015))`, 
                                    borderColor: `${activeCourseConfig.color}35`,
                                    color: "#ffffff",
                                    boxShadow: `0 6px 24px -6px ${activeCourseConfig.glowColor}`
                                  }}
                                >
                                  {/* Left neon border highlight indicator */}
                                  <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-md" style={{ backgroundColor: activeCourseConfig.color }} />
                                  <span className="font-extrabold text-white tracking-wide">{cleanMathLaTeX(trimmed)}</span>
                                </div>
                              );
                            }

                            // Formula blocks: matches lines that start with "- " and contain math symbols like "=", "+", "-", "*", "/", "^", or standard equations
                            const hasMathSymbol = /[\=\+\-\*\/\^θωατλσε∮·]/.test(trimmed);
                            const isFormula = (trimmed.startsWith("- ") || trimmed.startsWith("v =") || trimmed.startsWith("I =") || trimmed.startsWith("τ =") || trimmed.startsWith("P =") || trimmed.startsWith("L =")) && hasMathSymbol;
                            const isListItem = trimmed.startsWith("- ") || trimmed.match(/^\d+\./);

                            if (isFormula) {
                              return (
                                <div 
                                  key={idx} 
                                  className="p-5 rounded-xl border formula-font text-[14.5px] leading-relaxed my-3.5 shadow-md relative overflow-hidden group transition-all duration-300 hover:scale-[1.005]"
                                  style={{ 
                                    background: `linear-gradient(135deg, ${activeCourseConfig.color}08, rgba(255,255,255,0.01))`, 
                                    borderColor: `${activeCourseConfig.color}25`,
                                    color: "#ffffff",
                                    boxShadow: `0 4px 20px -5px ${activeCourseConfig.glowColor}`
                                  }}
                                >
                                  {/* Left neon border highlight indicator */}
                                  <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-md" style={{ backgroundColor: activeCourseConfig.color }} />
                                  <span className="pl-3 font-semibold text-white/95">{cleanMathLaTeX(trimmed.replace(/^[-\s]+/, ""))}</span>
                                </div>
                              );
                            }

                            if (isListItem) {
                              const boldMatch = trimmed.match(/^\d+\.\s+\*\*(.*?)\*\*:(.*)/) || trimmed.match(/^-\s+\*\*(.*?)\*\*:(.*)/);
                              if (boldMatch) {
                                return (
                                  <div key={idx} className="pl-4 py-2 flex items-start gap-3 text-[14.5px] text-gray-200">
                                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: activeCourseConfig.color }} />
                                    <p className="leading-relaxed">
                                      <span className="font-bold text-white text-[15px]">{renderFormattedText(boldMatch[1])}:</span>
                                      <span className="text-gray-300 ml-1.5">{renderFormattedText(boldMatch[2])}</span>
                                    </p>
                                  </div>
                                );
                              }

                              return (
                                <div key={idx} className="pl-4 py-2 flex items-start gap-3 text-[14.5px] text-gray-200">
                                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-gray-600" />
                                  <p className="leading-relaxed text-gray-300">
                                    {renderFormattedText(trimmed.replace(/^[-\d.]+\s*/, ""))}
                                  </p>
                                </div>
                              );
                            }

                            // Regular paragraph
                            return (
                              <p key={idx} className="text-[14.5px] text-gray-300 leading-relaxed pl-1">
                                {renderFormattedText(trimmed)}
                              </p>
                            );
                          });
                        })()}
                    </div>
                  </div>
                ) : (
                    /* Formula Sheet Tab Content */
                    <div className="flex-1 flex flex-col min-h-0 bg-white/[0.01] backdrop-blur-md rounded-2xl border border-white/5 p-6 overflow-hidden">
                      {/* Real-time search bar */}
                      <div className="mb-6 relative z-10 flex-shrink-0">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search formulas by name or symbol (e.g. range, height, torque, E-field)..."
                            value={formulaQuery}
                            onChange={(e) => setFormulaQuery(e.target.value)}
                            className="w-full bg-[#07041a]/60 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 backdrop-blur-md transition-all font-sans"
                            style={{
                              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5), 0 0 15px rgba(234,179,8,0.02)"
                            }}
                          />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                            <Search size={14} />
                          </div>
                          {formulaQuery && (
                            <button
                              onClick={() => setFormulaQuery("")}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Formulas grid list */}
                      <div className="flex-1 overflow-y-auto pr-1 space-y-6 custom-scrollbar min-h-0">
                        {(() => {
                          const courseFormulas = COURSE_FORMULAS[activeCourseId] || [];
                          const filteredCategories = courseFormulas.map(cat => {
                            const filteredEquations = cat.equations.filter(eq => 
                              eq.label.toLowerCase().includes(formulaQuery.toLowerCase()) ||
                              eq.formula.toLowerCase().includes(formulaQuery.toLowerCase())
                            );
                            return {
                              ...cat,
                              equations: filteredEquations
                            };
                          }).filter(cat => cat.equations.length > 0);

                          if (filteredCategories.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <HelpCircle size={24} className="text-gray-600 mb-2" />
                                <p className="text-xs text-gray-500 font-mono">NO FORMULAS MATCH YOUR SEARCH</p>
                              </div>
                            );
                          }

                          return filteredCategories.map((cat, catIdx) => (
                            <div key={catIdx} className="space-y-3">
                              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                <span className="w-1.5 h-3 rounded-full bg-yellow-500" />
                                {cat.title}
                              </h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cat.equations.map((eq, eqIdx) => (
                                  <div 
                                    key={eqIdx}
                                    className="p-5 rounded-2xl border border-white/5 bg-[#090520]/40 backdrop-blur-md flex flex-col justify-between hover:border-yellow-500/25 hover:bg-[#0c072c]/60 transition-all duration-300 group shadow-md"
                                  >
                                    <div className="space-y-3">
                                      <span className="text-[13px] font-bold text-gray-300 font-sans leading-snug block">
                                        {eq.label}
                                      </span>
                                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.03] flex items-center justify-center min-h-[56px] select-all formula-font text-[18px] text-white">
                                        {cleanMathLaTeX(eq.formula)}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.03]">
                                      <button
                                        onClick={() => {
                                          const cleanFormula = cleanMathLaTeX(eq.formula);
                                          const prompt = encodeURIComponent(`Derive the formula: ${eq.label} (${cleanFormula})`);
                                          navigate(`/ask-aria?q=${prompt}&subject=${activeCourse.subject}`);
                                        }}
                                        className="flex-1 py-1.5 rounded-lg border border-yellow-500/15 bg-yellow-500/5 hover:bg-yellow-500/15 text-yellow-300/90 hover:text-yellow-200 text-[10px] font-bold flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all"
                                      >
                                        <Sparkles size={11} className="text-yellow-400 animate-pulse" /> Derive Formula (AI)
                                      </button>
                                      
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(eq.formula);
                                          toast.success("LaTeX copied to clipboard!", { id: "clipboard-copy" });
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/3 hover:bg-white/5 text-gray-400 hover:text-white text-[10px] font-medium transition-all"
                                        title="Copy LaTeX"
                                      >
                                        Copy
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Workspace Sidebar Tools (Right) */}
                <div className="w-full lg:w-80 flex-shrink-0 p-6 lg:p-8 lg:border-l border-white/5 bg-[#07041a]/40 backdrop-blur-md flex flex-col gap-6 lg:max-h-screen overflow-y-auto">
                  
                  {(() => {
                    const simMapping = getSimulationMapping(activeLesson.topic, activeCourse.subject);
                    return (
                      <>
                        {/* Digital Active Timer Tool */}
                        <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl flex flex-col items-center">
                          <h4 className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mb-3 flex items-center gap-1.5">
                            <Clock size={11} className="text-purple-400 animate-pulse" /> Focus Stopwatch
                          </h4>
                          
                          <div className="text-3xl font-mono font-bold tracking-wider text-white mb-4 bg-black/30 px-6 py-2.5 rounded-2xl border border-white/5 w-full text-center shadow-inner">
                            {formatTime(timerSeconds)}
                          </div>

                          <div className="flex gap-2.5">
                            <button
                              onClick={() => setIsTimerRunning(!isTimerRunning)}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                                isTimerRunning 
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20" 
                                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                              }`}
                            >
                              {isTimerRunning ? <Pause size={15} /> : <Play size={15} className="fill-emerald-400/20" />}
                            </button>
                            <button
                              onClick={() => {
                                setIsTimerRunning(false);
                                setTimerSeconds(0);
                              }}
                              className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 bg-white/3 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                              <RotateCcw size={15} />
                            </button>
                          </div>
                          
                          <p className="text-[10px] text-gray-500 mt-3.5 text-center leading-normal max-w-[200px]">
                            Accumulate study minutes by running the stopwatch while reviewing the notes.
                          </p>
                        </div>

                        {/* 3D Science Sandbox deep link */}
                        {simMapping && (
                          <div className="p-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 backdrop-blur-xl flex flex-col shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                            <h4 className="text-[10px] text-emerald-400 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
                              <Zap size={11} className="text-emerald-400 animate-pulse" /> 3D Science Sandbox
                            </h4>
                            <p className="text-[11px] text-gray-400 leading-normal mb-4">
                              Interact with <b>{activeLesson.topic}</b> in our real-time virtual WebGL chamber. Adjust variables and observe physics outputs.
                            </p>
                            <button
                              onClick={() => navigate(`${simMapping.path}?sim=${simMapping.sim}`)}
                              className="w-full py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                              <Zap size={13} /> Launch 3D Simulation
                            </button>
                          </div>
                        )}

                        {/* AI Active Recall Flashcards */}
                        <div className="p-5 rounded-2xl border border-pink-500/25 bg-pink-500/5 backdrop-blur-xl flex flex-col shadow-[0_0_15px_rgba(236,72,153,0.05)]">
                          <h4 className="text-[10px] text-pink-400 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
                            <BookOpenCheck size={11} className="text-pink-400 animate-pulse" /> Active Recall Cards
                          </h4>
                          <p className="text-[11px] text-gray-400 leading-normal mb-4">
                            Synthesize AI study flashcards targeting <b>{activeLesson.topic}</b> to self-test derivations and formulas.
                          </p>
                          <button
                            onClick={() => handleStartFlashcards(activeLesson.topic, activeCourse?.subject || activeCourseConfig.subject)}
                            className="w-full py-2.5 rounded-xl border border-pink-500/20 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            <BookOpen size={13} /> Study Flashcards (AI)
                          </button>
                        </div>
                      </>
                    );
                  })()}

                  {/* AI Diagram Tool */}
                  <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col">
                    <h4 className="text-[10px] text-purple-400 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
                      <Sparkles size={11} className="text-purple-400 animate-pulse" /> Holographic Illustrator
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-normal mb-4">
                      Need a visual representation of <b>{activeLesson.topic}</b>? Synthesize an interactive diagram.
                    </p>
                    <button
                      onClick={() => handleGenerateDiagram(false)}
                      className="w-full py-2.5 rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Sparkles size={13} /> Visualize Topic (AI)
                    </button>
                  </div>

                  {/* AI Tutor Card (Ask Aria Launcher) */}
                  <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col">
                    <h4 className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
                      <Sparkles size={11} /> AI Integration
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-normal mb-4">
                      Confused about a formula or derivation in <b>{activeLesson.topic}</b>? Deep dive into instant explanations.
                    </p>
                    <button
                      onClick={() => {
                        const courseTitle = activeCourse?.title || activeCourseConfig.title;
                        const courseSubject = activeCourse?.subject || activeCourseConfig.subject;
                        const prompt = encodeURIComponent(`Explain the concept of ${activeLesson.topic} in ${courseTitle} with simple examples and formula derivations.`);
                        navigate(`/ask-aria?q=${prompt}&subject=${courseSubject}`);
                      }}
                      className="w-full py-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <MessageSquare size={13} /> Consult ARIA AI
                    </button>
                  </div>

                  {/* Adaptive Quiz Launcher Panel */}
                  <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col">
                    <h4 className="text-[10px] text-yellow-400 uppercase tracking-widest font-mono mb-2 flex items-center gap-1.5">
                      <Award size={11} className="text-yellow-400" /> Adaptive Evaluator
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-normal mb-4">
                      Evaluate your understanding. Difficulty shifts dynamically in real-time based on your responses.
                    </p>
                    <button
                      onClick={() => startAdaptiveQuiz(activeCourseId)}
                      className="w-full py-2.5 rounded-xl border border-yellow-500/20 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Award size={13} /> Launch Adaptive Quiz
                    </button>
                  </div>

                  {/* Study Session Completion Trigger */}
                  <div className="mt-auto pt-4 border-t border-white/5">
                      {completedLessons.includes(activeLesson.id) ? (
                        <button
                          disabled
                          className="w-full py-3.5 rounded-xl text-xs font-bold text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-not-allowed"
                          style={{
                            background: "rgba(16, 185, 129, 0.1)",
                            boxShadow: "0 0 15px rgba(16, 185, 129, 0.1)"
                          }}
                        >
                          <CheckCircle2 size={14} className="text-emerald-400" /> Lesson Completed
                        </button>
                      ) : (
                        <button
                          onClick={handleMarkCompleted}
                          className="w-full py-3.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          style={{
                            background: `linear-gradient(135deg, ${activeCourseConfig.color}, ${activeCourseConfig.color}a0)`,
                            boxShadow: `0 8px 25px -5px ${activeCourseConfig.color}50`
                          }}
                        >
                          <Award size={14} /> Mark Lesson Completed
                        </button>
                      )}
                    <p className="text-[9px] text-gray-600 mt-2 text-center">
                      Saving logs the active minutes into your cognitive analytics database.
                    </p>
                  </div>

                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center">
                <HelpCircle size={32} className="text-gray-600 mb-2 animate-bounce" />
                <p className="text-xs text-gray-400 font-mono">NO LESSON SELECTED</p>
              </div>
            )}
          </div>
          </>
        )}
        </div>
      )}
      {/* Dynamic Diagram Visualization Modal */}
      <AnimatePresence>
        {showDiagramModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-2xl p-6 border flex flex-col max-h-[90vh] overflow-hidden"
              style={{
                background: "rgba(10,5,25,0.96)",
                borderColor: `${activeCourseConfig?.color || "#a855f7"}30`,
                boxShadow: `0 20px 50px -10px ${(activeCourseConfig?.glowColor || "rgba(168,85,247,0.4)")}`
              }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                <div>
                  <span className="text-[9px] font-mono tracking-widest text-purple-400 uppercase">ARIA COGNITIVE VISUALIZER</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{activeLesson.topic} Diagram</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={isDiagramLoading}
                    onClick={() => handleGenerateDiagram(true)}
                    className="text-xs text-purple-300 hover:text-white px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all flex items-center gap-1 disabled:opacity-50"
                  >
                    <Sparkles size={12} className={isDiagramLoading ? "animate-spin" : ""} /> Regenerate (AI)
                  </button>
                  <button
                    onClick={() => setShowDiagramModal(false)}
                    className="text-xs text-gray-500 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-black/40 rounded-xl border border-white/5 min-h-[300px] max-h-[60vh] relative">
                {isDiagramLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-t-purple-500 border-purple-500/20 rounded-full animate-spin" />
                    <p className="text-[10px] font-mono text-purple-300 tracking-wider animate-pulse">SYNTHESIZING HOLOGRAPHIC BLUEPRINT...</p>
                  </div>
                ) : diagramSvg ? (
                  <div 
                    className="w-full h-full flex items-center justify-center select-none"
                    style={{ aspectRatio: "600 / 350", maxHeight: "100%", maxWidth: "100%" }}
                  >
                    <style>{`
                      .diagram-svg-container svg {
                        width: 100% !important;
                        height: 100% !important;
                        max-height: 100% !important;
                        max-width: 100% !important;
                      }
                    `}</style>
                    <div 
                      className="diagram-svg-container w-full h-full flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: diagramSvg }}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Failed to render diagram. Please try again.</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-4 flex justify-between items-center text-[10px] text-gray-500 font-mono">
                <span>Subject: {activeCourse?.subject}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 size={11} /> 100% Vector Rendered
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Flashcards Modal */}
      <AnimatePresence>
        {showFlashcardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <style>{`
              .flashcard-perspective {
                perspective: 1200px;
              }
              .flashcard-inner {
                transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                transform-style: preserve-3d;
              }
              .flashcard-inner.flipped {
                transform: rotateY(180deg);
              }
              .flashcard-face {
                backface-visibility: hidden;
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              .flashcard-back {
                transform: rotateY(180deg);
              }
            `}</style>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-[28px] p-6 border flex flex-col max-h-[90vh] overflow-hidden"
              style={{
                background: "rgba(10,5,25,0.96)",
                borderColor: "rgba(236,72,153,0.3)",
                boxShadow: "0 20px 50px -10px rgba(236,72,153,0.4)"
              }}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5">
                <div>
                  <span className="text-[9px] font-mono tracking-widest text-pink-400 uppercase">ACTIVE RECALL CHAMBER</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{activeLesson?.topic} Cards</h3>
                </div>
                <button
                  onClick={() => setShowFlashcardModal(false)}
                  className="text-xs text-gray-500 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 transition-all animate-pulse"
                >
                  Close
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 flex flex-col justify-center min-h-[350px]">
                {flashcardLoading ? (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <div className="w-10 h-10 border-2 border-t-pink-500 border-pink-500/20 rounded-full animate-spin" />
                    <p className="text-[10px] font-mono text-pink-300 tracking-wider animate-pulse">SYNTHESIZING COGNITIVE FLASHCARDS...</p>
                  </div>
                ) : flashcardsList.length > 0 && currentCardIndex < flashcardsList.length ? (
                  <>
                    {/* Progress Bar */}
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-6">
                      <div 
                        className="bg-pink-500 h-full transition-all duration-300"
                        style={{ width: `${(currentCardIndex / flashcardsList.length) * 100}%` }}
                      />
                    </div>

                    {/* Counter */}
                    <div className="text-center text-xs text-gray-500 font-mono mb-4">
                      CARD {currentCardIndex + 1} OF {flashcardsList.length}
                    </div>

                    {/* Flashcard 3D Block */}
                    <div 
                      onClick={() => setIsCardFlipped(!isCardFlipped)}
                      className="w-full h-64 flashcard-perspective cursor-pointer select-none group relative mb-6"
                    >
                      <div className={`w-full h-full flashcard-inner rounded-2xl relative ${isCardFlipped ? "flipped" : ""}`}>
                        {/* Front Face */}
                        <div 
                          className="flashcard-face rounded-2xl p-6 border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-lg flex flex-col justify-between"
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          <div className="text-xs font-mono text-pink-400/60 uppercase">Question / Prompt</div>
                          <div className="flex-1 flex items-center justify-center text-center px-4">
                            <span className="text-lg font-bold text-white leading-relaxed font-mono">
                              {cleanMathLaTeX(flashcardsList[currentCardIndex].front)}
                            </span>
                          </div>
                          <div className="text-center text-[10px] text-gray-600 font-mono group-hover:text-pink-400/60 transition-colors">
                            TAP TO FLIP / REVEAL DEEP EXPLANATION
                          </div>
                        </div>

                        {/* Back Face */}
                        <div 
                          className="flashcard-face flashcard-back rounded-2xl p-6 border border-pink-500/30 bg-pink-950/20 backdrop-blur-xl shadow-lg flex flex-col justify-between"
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          <div className="text-xs font-mono text-emerald-400 uppercase">Analysis / Derivation</div>
                          <div className="flex-1 flex items-center justify-center text-center px-4 overflow-y-auto max-h-[160px] my-2">
                            <span className="text-sm text-gray-200 leading-relaxed font-mono whitespace-pre-wrap">
                              {cleanMathLaTeX(flashcardsList[currentCardIndex].back)}
                            </span>
                          </div>
                          <div className="text-center text-[10px] text-gray-600 font-mono">
                            TAP TO FLIP BACK TO PROMPT
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isCardFlipped) {
                            setIsCardFlipped(true);
                            return;
                          }
                          const currentCard = flashcardsList[currentCardIndex];
                          setFlashcardsList(prev => [...prev, { ...currentCard, id: `${currentCard.id}_r` }]);
                          setCurrentCardIndex(currentCardIndex + 1);
                          setIsCardFlipped(false);
                          toast.error("Card scheduled for review!", { id: "sr-review" });
                        }}
                        className={`flex-1 py-3 rounded-xl border text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                          !isCardFlipped
                            ? "border-white/10 bg-white/5 hover:bg-white/10 text-white"
                            : "border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {!isCardFlipped ? "Flip Card" : "Need Review"}
                      </button>
                      
                      {isCardFlipped && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setScoreGotIt(scoreGotIt + 1);
                            setCurrentCardIndex(currentCardIndex + 1);
                            setIsCardFlipped(false);
                            toast.success("Nice job!", { id: "sr-correct" });
                            
                            if (currentCardIndex + 1 === flashcardsList.length) {
                              triggerCelebration();
                            }
                          }}
                          className="flex-1 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase transition-all duration-300"
                        >
                          Got it Right
                        </button>
                      )}
                    </div>
                  </>
                ) : flashcardsList.length > 0 && currentCardIndex === flashcardsList.length ? (
                  <div className="text-center py-6 space-y-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 text-2xl animate-bounce">
                      🎉
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white font-mono">Revision Completed!</h4>
                      <p className="text-xs text-gray-400 mt-1">Excellent job recalling these critical derivations.</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 max-w-sm mx-auto space-y-2.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-500">Correct Recall</span>
                        <span className="text-emerald-400 font-bold">{scoreGotIt} Cards</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-500">Self-Evaluation Accuracy</span>
                        <span className="text-white font-bold">{Math.round((scoreGotIt / flashcardsList.length) * 100)}%</span>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-center max-w-sm mx-auto">
                      <button
                        onClick={() => handleStartFlashcards(activeLesson.topic, activeCourse.subject)}
                        className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold tracking-widest uppercase transition-all"
                      >
                        Review Again
                      </button>
                      <button
                        onClick={() => setShowFlashcardModal(false)}
                        className="flex-1 py-3 rounded-xl text-black font-bold text-xs tracking-widest uppercase bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg shadow-pink-500/20 hover:scale-[1.02] transition-all"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 font-mono text-xs">
                    Failed to synthesize flashcards. Try again.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Adaptive Quiz Fullscreen Modal */}
      <AnimatePresence>
        {quizActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl rounded-2xl p-6 border flex flex-col my-8 relative overflow-hidden"
              style={{
                background: "rgba(10,5,25,0.96)",
                borderColor: "rgba(168,85,247,0.3)",
                boxShadow: "0 20px 50px -10px rgba(168,85,247,0.4)"
              }}
            >
              <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full blur-[80px] pointer-events-none opacity-25 bg-[#7c3aed]" />
              
              {!quizEnded ? (
                <>
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5 relative z-10">
                    <div>
                      <span className="text-[9px] font-mono tracking-widest text-[#a855f7] uppercase font-bold">
                        {quizSubject} Adaptive Assessment
                      </span>
                      <h3 className="text-base font-black text-white mt-0.5">
                        Question {currentQuestionIndex + 1} of 6
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded border animate-pulse ${
                        currentDifficulty === "Easy" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                        currentDifficulty === "Medium" ? "text-amber-400 bg-amber-500/10 border-emerald-500/20" :
                        "text-red-400 bg-red-500/10 border-red-500/20"
                      }`}>
                        Difficulty: {currentDifficulty}
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to exit the quiz? Progress will not be saved.")) {
                            setQuizActive(false);
                          }
                        }}
                        className="text-xs text-gray-500 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 transition-all"
                      >
                        Exit
                      </button>
                    </div>
                  </div>

                  {/* Question Area */}
                  <div className="space-y-4 mb-6 relative z-10 text-left">
                    <span className="text-[10px] font-mono text-gray-400">
                      Topic: <span className="text-gray-200 font-bold">{currentQuestion?.topic}</span>
                    </span>
                    
                    <p className="text-sm font-semibold text-white leading-relaxed">
                      {cleanMathLaTeX(currentQuestion?.text)}
                    </p>
                    
                    <div className="grid grid-cols-1 gap-2.5 pt-2">
                      {currentQuestion?.options.map((opt, oIdx) => {
                        const isSelected = chosenOption === oIdx;
                        const isCorrectOpt = oIdx === currentQuestion.correct_index;
                        
                        let optStyle = {
                          background: "rgba(255,255,255,0.02)",
                          borderColor: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.7)"
                        };
                        
                        if (answerSubmitted) {
                          if (isCorrectOpt) {
                            optStyle = {
                              background: "rgba(16, 185, 129, 0.15)",
                              borderColor: "rgba(16, 185, 129, 0.35)",
                              color: "#34d399"
                            };
                          } else if (isSelected) {
                            optStyle = {
                              background: "rgba(239, 68, 68, 0.15)",
                              borderColor: "rgba(239, 68, 68, 0.35)",
                              color: "#f87171"
                            };
                          }
                        } else if (isSelected) {
                          optStyle = {
                            background: "rgba(168, 85, 247, 0.15)",
                            borderColor: "rgba(168, 85, 247, 0.4)",
                            color: "#c084fc"
                          };
                        }
                        
                        return (
                          <button
                            key={oIdx}
                            disabled={answerSubmitted}
                            onClick={() => setChosenOption(oIdx)}
                            className="p-4 rounded-xl text-left text-xs font-semibold border flex items-center justify-between transition-all hover:scale-[1.005] active:scale-[0.995]"
                            style={optStyle}
                          >
                            <span>{cleanMathLaTeX(opt)}</span>
                            {answerSubmitted && isCorrectOpt && <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Correct</span>}
                            {answerSubmitted && isSelected && !isCorrectOpt && <span className="text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Wrong</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Feedback and Solution Section */}
                  {answerSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl border mb-6 text-left bg-white/[0.01]"
                      style={{
                        borderColor: chosenOption === currentQuestion.correct_index ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"
                      }}
                    >
                      <h4 className="text-[11px] uppercase font-bold text-white mb-1.5 flex items-center gap-1">
                        <span>📖</span> Solution Derivation
                      </h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
                        {cleanMathLaTeX(currentQuestion.solution)}
                      </p>
                    </motion.div>
                  )}

                  {/* Action Footer */}
                  <div className="flex justify-end gap-3 mt-4 relative z-10">
                    {!answerSubmitted ? (
                      <button
                        disabled={chosenOption === null}
                        onClick={handleAnswerSubmit}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all bg-purple-600 hover:bg-purple-500"
                      >
                        {currentQuestionIndex >= 5 ? "View Results" : "Next Question"}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* Quiz Report Card */
                <div className="space-y-6 text-center py-4 relative z-10">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase font-black">
                      Evaluation Complete
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">
                      Personalized Performance Diagnostics
                    </h3>
                  </div>
                  
                  <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] inline-block mx-auto min-w-[200px]">
                    <span className="text-gray-500 text-xs block mb-1">Final Accuracy</span>
                    <span className="text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                      {Math.round((quizAnswers.filter(a => a.is_correct).length / quizAnswers.length) * 100)}%
                    </span>
                    <span className="text-gray-500 text-[10px] block mt-1.5 font-mono">
                      {quizAnswers.filter(a => a.is_correct).length} of {quizAnswers.length} correct
                    </span>
                  </div>

                  {predictingRisk ? (
                    <div className="flex flex-col items-center gap-2 py-6">
                      <div className="w-6 h-6 border-2 border-t-cyan-400 border-r-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-mono text-cyan-300 animate-pulse">COMPUTING XGBOOST COGNITIVE RISK MODEL...</p>
                    </div>
                  ) : riskResult ? (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center w-full"
                    >
                      <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col justify-between max-w-md w-full text-left">
                        <div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold">Actionable Remediation</span>
                            <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded border ${
                              riskResult.status === "Advanced" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                              riskResult.status === "On-Track" ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" :
                              "text-amber-400 bg-amber-500/10 border-amber-500/20"
                            }`}>
                              Status: {riskResult.status}
                            </span>
                          </div>
                          
                          <div className="space-y-4 mt-4">
                            {riskResult.recommendations.map((rec, rIdx) => (
                              <div key={rIdx} className="flex gap-3 items-start text-xs text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                                <p className="leading-relaxed">{rec}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => setQuizActive(false)}
                          className="w-full mt-8 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-cyan-500 hover:scale-[1.01] active:scale-[0.99] transition-all"
                        >
                          Return to Course Workspace
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
