# routes/tests.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import supabase
from typing import List, Dict, Any
import uuid
import logging
from datetime import datetime

logger = logging.getLogger("uvicorn")
router = APIRouter()

# --- Question Bank Database (Static Pool for JEE/NEET Class 11-12) ---
QUESTION_BANK = {
    "Physics": {
        "Easy": [
            {
                "id": "p_e_1", "subject": "Physics", "topic": "Units & Dimensions", "difficulty": "Easy",
                "text": "What are the dimensional formulae of Universal Gravitational Constant G?",
                "options": ["[M⁻¹ L³ T⁻²]", "[M¹ L² T⁻²]", "[M⁻² L³ T⁻¹]", "[M⁻¹ L² T⁻³]"],
                "correct_index": 0,
                "solution": "Using F = G*m1*m2/r², G = F*r²/(m1*m2). Dimensions are [M L T⁻²] * [L²] / [M²] = [M⁻¹ L³ T⁻²]."
            },
            {
                "id": "p_e_2", "subject": "Physics", "topic": "Kinematics", "difficulty": "Easy",
                "text": "A vehicle starts from rest and accelerates uniformly at 2 m/s² for 10 seconds. Find the distance covered.",
                "options": ["50 meters", "100 meters", "150 meters", "200 meters"],
                "correct_index": 1,
                "solution": "Using s = ut + 0.5*a*t², s = 0 + 0.5*2*(10)² = 100 meters."
            },
            {
                "id": "p_e_3", "subject": "Physics", "topic": "Work, Energy & Power", "difficulty": "Easy",
                "text": "Which of the following physical quantities is a scalar?",
                "options": ["Force", "Velocity", "Work done", "Acceleration"],
                "correct_index": 2,
                "solution": "Work is the dot product of Force and Displacement vector, which yields a scalar."
            },
            {
                "id": "p_e_4", "subject": "Physics", "topic": "Electrostatics", "difficulty": "Easy",
                "text": "What is the SI unit of electric charge?",
                "options": ["Ampere", "Volt", "Coulomb", "Farad"],
                "correct_index": 2,
                "solution": "The SI unit of electric charge is the Coulomb (C)."
            }
        ],
        "Medium": [
            {
                "id": "p_m_1", "subject": "Physics", "topic": "Collisions", "difficulty": "Medium",
                "text": "A body of mass 2 kg moving at 3 m/s collides elastically with a stationary body of mass 1 kg. Find the velocity of the 1 kg body after collision.",
                "options": ["2 m/s", "3 m/s", "4 m/s", "1.5 m/s"],
                "correct_index": 2,
                "solution": "By conservation of momentum and mechanical energy, v2' = [2*m1 / (m1+m2)] * u1 = [4 / 3] * 3 = 4 m/s."
            },
            {
                "id": "p_m_2", "subject": "Physics", "topic": "Rotational Motion", "difficulty": "Medium",
                "text": "What is the moment of inertia of a uniform solid cylinder of mass M and radius R about its longitudinal axis of symmetry?",
                "options": ["MR²", "0.5 MR²", "0.4 MR²", "2 MR²"],
                "correct_index": 1,
                "solution": "The moment of inertia of a solid cylinder of mass M and radius R is given by I = 0.5 * M * R²."
            },
            {
                "id": "p_m_3", "subject": "Physics", "topic": "Electrostatics", "difficulty": "Medium",
                "text": "If the separation distance between two point charges is halved, the electrostatic force between them changes by a factor of:",
                "options": ["0.5", "2", "0.25", "4"],
                "correct_index": 3,
                "solution": "Coulomb's Law states F ∝ 1/r². If r becomes r/2, F becomes 4F."
            },
            {
                "id": "p_m_4", "subject": "Physics", "topic": "Simple Harmonic Motion", "difficulty": "Medium",
                "text": "A particle executes SHM with amplitude A. At what displacement from the mean position is its kinetic energy equal to its potential energy?",
                "options": ["A/2", "A / √2", "A √3 / 2", "A/4"],
                "correct_index": 1,
                "solution": "KE = PE ➜ 0.5*k*(A² - x²) = 0.5*k*x² ➜ A² - x² = x² ➜ 2x² = A² ➜ x = A / √2."
            }
        ],
        "Hard": [
            {
                "id": "p_h_1", "subject": "Physics", "topic": "Rotational Dynamics", "difficulty": "Hard",
                "text": "Find the angular acceleration of a uniform solid disc of mass M and radius R rolling down a rough inclined plane of inclination angle θ without slipping.",
                "options": ["(2g sin θ) / (3R)", "(g sin θ) / R", "(2g sin θ) / R", "(3g sin θ) / (2R)"],
                "correct_index": 0,
                "solution": "Acceleration down incline: a = g sin θ / (1 + I/MR²) = g sin θ / (1 + 0.5) = (2/3)g sin θ. Angular acceleration α = a/R = (2g sin θ) / (3R)."
            },
            {
                "id": "p_h_2", "subject": "Physics", "topic": "Magnetic Fields", "difficulty": "Hard",
                "text": "An electron enters a uniform magnetic field B perpendicular to its velocity vector v. What is the orbital radius of its circular trajectory?",
                "options": ["mv / (qB)", "mB / (qv)", "qv / (mB)", "qB / (mv)"],
                "correct_index": 0,
                "solution": "The centripetal force is supplied by the magnetic Lorentz force: mv²/r = qvB ➜ r = mv / (qB)."
            },
            {
                "id": "p_h_3", "subject": "Physics", "topic": "Thermodynamics", "difficulty": "Hard",
                "text": "A Carnot heat engine operates between temperatures of 300K and 600K. If it absorbs 1000 J of heat from the hot reservoir, what is the work done per cycle?",
                "options": ["250 J", "500 J", "750 J", "1000 J"],
                "correct_index": 1,
                "solution": "Efficiency η = 1 - Tc/Th = 1 - 300/600 = 0.50. Work done W = η * Qh = 0.5 * 1000 J = 500 J."
            },
            {
                "id": "p_h_4", "subject": "Physics", "topic": "Capacitors", "difficulty": "Hard",
                "text": "Find the equivalent capacitance between terminals A and B of an infinite ladder network of 1 μF capacitors.",
                "options": ["(√5 + 1) / 2 μF", "(√5 - 1) / 2 μF", "1.618 μF", "0.618 μF"],
                "correct_index": 1,
                "solution": "Let equivalent capacitance be C. Then C = 1 + (1 * C)/(1 + C) ➜ C(1 + C) = (1+C) + C ➜ C + C² = 1 + 2C ➜ C² - C - 1 = 0. Solving quadratic: C = (1 + √5)/2 (taking positive root) but the ladder is series/parallel. C_eq = (√5 - 1)/2 μF."
            }
        ]
    },
    "Chemistry": {
        "Easy": [
            {
                "id": "c_e_1", "subject": "Chemistry", "topic": "Acids & Bases", "difficulty": "Easy",
                "text": "What is the pH value of a 0.01 M HCl aqueous solution at 298 K?",
                "options": ["1", "2", "3", "7"],
                "correct_index": 1,
                "solution": "HCl is a strong acid, so [H+] = 0.01 M. pH = -log[H+] = -log(10⁻²) = 2."
            },
            {
                "id": "c_e_2", "subject": "Chemistry", "topic": "Periodic Table", "difficulty": "Easy",
                "text": "Which of the following elements has the highest electronegativity value?",
                "options": ["Oxygen", "Nitrogen", "Fluorine", "Chlorine"],
                "correct_index": 2,
                "solution": "Fluorine is the most electronegative element on the Pauling scale, with a value of 4.0."
            },
            {
                "id": "c_e_3", "subject": "Chemistry", "topic": "Redox Reactions", "difficulty": "Easy",
                "text": "What is the primary chemical formula of rust?",
                "options": ["Fe₂O₃·xH₂O", "Fe₃O₄", "FeO", "Fe(OH)₃"],
                "correct_index": 0,
                "solution": "Rust is hydrated iron(III) oxide, chemically written as Fe₂O₃·xH₂O."
            },
            {
                "id": "c_e_4", "subject": "Chemistry", "topic": "Chemical Reactions", "difficulty": "Easy",
                "text": "Which gas is evolved when zinc metal reacts with dilute sulfuric acid?",
                "options": ["Oxygen", "Hydrogen", "Sulfur dioxide", "Carbon dioxide"],
                "correct_index": 1,
                "solution": "Zn + H₂SO₄ ➜ ZnSO₄ + H₂(gas)."
            }
        ],
        "Medium": [
            {
                "id": "c_m_1", "subject": "Chemistry", "topic": "Organic Chemistry", "difficulty": "Medium",
                "text": "What is the major organic product formed when propene reacts with HBr in the presence of organic peroxides?",
                "options": ["2-Bromopropane", "1-Bromopropane", "1,2-Dibromopropane", "2-Bromopropene"],
                "correct_index": 1,
                "solution": "In the presence of peroxides, addition of HBr to unsymmetrical alkenes follows the Anti-Markovnikov pathway (Kharasch effect), yielding 1-Bromopropane."
            },
            {
                "id": "c_m_2", "subject": "Chemistry", "topic": "Chemical Bonding", "difficulty": "Medium",
                "text": "What is the hybridization state of the central Xenon atom in XeF₄?",
                "options": ["sp³d", "sp³d²", "sp³", "dsp²"],
                "correct_index": 1,
                "solution": "Xe has 8 valence electrons. In XeF₄, it forms 4 single bonds and holds 2 lone pairs. Steric number = 6, yielding sp³d² hybridization (square planar shape)."
            },
            {
                "id": "c_m_3", "subject": "Chemistry", "topic": "Chemical Kinetics", "difficulty": "Medium",
                "text": "The rate constant of a reaction has the units L mol⁻¹ s⁻¹. The overall order of this reaction is:",
                "options": ["Zero order", "First order", "Second order", "Third order"],
                "correct_index": 2,
                "solution": "Unit for rate constant: (mol/L)^(1-n) s⁻¹. For n = 2 (second order), the units are L mol⁻¹ s⁻¹."
            },
            {
                "id": "c_m_4", "subject": "Chemistry", "topic": "Intermolecular Forces", "difficulty": "Medium",
                "text": "Which of the following organic compounds is expected to have the highest boiling point?",
                "options": ["Ethanol", "Diethyl ether", "Acetone", "n-Butane"],
                "correct_index": 0,
                "solution": "Ethanol is capable of extensive intermolecular hydrogen bonding, which requires significantly more heat energy to break compared to dipole-dipole or London forces."
            }
        ],
        "Hard": [
            {
                "id": "c_h_1", "subject": "Chemistry", "topic": "Thermodynamics", "difficulty": "Hard",
                "text": "Calculate the entropy change (ΔS) for the isothermal expansion of 1 mole of an ideal gas when its volume is doubled.",
                "options": ["R ln 2", "R ln 0.5", "2R", "R"],
                "correct_index": 0,
                "solution": "For isothermal expansion of an ideal gas, ΔS = n R ln(V2/V1). For n=1, and V2 = 2V1, ΔS = R ln 2."
            },
            {
                "id": "c_h_2", "subject": "Chemistry", "topic": "Coordination Compounds", "difficulty": "Hard",
                "text": "Which of the following transition metal complexes has the highest value of crystal field splitting energy (Δ₀)?",
                "options": ["[Co(H₂O)₆]³⁺", "[Co(NH₃)₆]³⁺", "[Co(CN)₆]³⁻", "[CoF₆]³⁻"],
                "correct_index": 2,
                "solution": "According to the spectrochemical series, cyanide (CN⁻) is a very strong field ligand, producing the largest crystal field splitting energy (Δ₀)."
            },
            {
                "id": "c_h_3", "subject": "Chemistry", "topic": "Organic Chemistry", "difficulty": "Hard",
                "text": "What is the primary organic product of the reaction of toluene with chromyl chloride (CrO₂Cl₂) followed by hydrolysis?",
                "options": ["Benzyl alcohol", "Benzoic acid", "Benzaldehyde", "Acetophenone"],
                "correct_index": 2,
                "solution": "This is the Etard reaction, where toluene is selectively oxidized to benzaldehyde using chromyl chloride."
            },
            {
                "id": "c_h_4", "subject": "Chemistry", "topic": "Equilibrium", "difficulty": "Hard",
                "text": "If the solubility product constant (Ksp) of Ag₂CrO₄ is 1.1 × 10⁻¹², calculate its solubility in pure water.",
                "options": ["6.5 × 10⁻⁵ mol/L", "1.3 × 10⁻⁴ mol/L", "1.1 × 10⁻⁶ mol/L", "2.2 × 10⁻⁴ mol/L"],
                "correct_index": 0,
                "solution": "Ag₂CrO₄ dissolves as 2Ag⁺ + CrO₄²⁻. Ksp = [2s]² * [s] = 4s³. 4s³ = 1.1 × 10⁻¹² ➜ s³ = 2.75 × 10⁻¹³ ➜ s ≈ 6.5 × 10⁻⁵ mol/L."
            }
        ]
    },
    "Mathematics": {
        "Easy": [
            {
                "id": "m_e_1", "subject": "Mathematics", "topic": "Calculus", "difficulty": "Easy",
                "text": "If f(x) = x² + 3x + 5, calculate f'(2).",
                "options": ["5", "7", "9", "4"],
                "correct_index": 1,
                "solution": "f'(x) = 2x + 3. Substituting x=2: f'(2) = 2(2) + 3 = 7."
            },
            {
                "id": "m_e_2", "subject": "Mathematics", "topic": "Limits", "difficulty": "Easy",
                "text": "What is the value of the limit: lim (x ➜ 0) [sin(x) / x]?",
                "options": ["0", "1", "undefined", "∞"],
                "correct_index": 1,
                "solution": "This is a fundamental calculus trigonometric limit theorem, lim (x ➜ 0) [sin(x) / x] = 1."
            },
            {
                "id": "m_e_3", "subject": "Mathematics", "topic": "Calculus", "difficulty": "Easy",
                "text": "What is the derivative of ln(x) with respect to x?",
                "options": ["eˣ", "1/x", "x", "1/x²"],
                "correct_index": 1,
                "solution": "The derivative of the natural log function is d/dx [ln(x)] = 1/x."
            },
            {
                "id": "m_e_4", "subject": "Mathematics", "topic": "Coordinate Geometry", "difficulty": "Easy",
                "text": "Find the slope of the straight line given by: 3x - 4y = 8.",
                "options": ["3/4", "-3/4", "4/3", "3"],
                "correct_index": 0,
                "solution": "Rearranging to y = mx + c form: 4y = 3x - 8 ➜ y = (3/4)x - 2. Thus slope m = 3/4."
            }
        ],
        "Medium": [
            {
                "id": "m_m_1", "subject": "Mathematics", "topic": "Integrals", "difficulty": "Medium",
                "text": "Evaluate the definite integral: ∫ (0 to π/2) [sin²(x)] dx.",
                "options": ["π/2", "π/4", "1", "0"],
                "correct_index": 1,
                "solution": "Using properties of definite integrals, I = ∫ sin²(x) dx, also I = ∫ cos²(x) dx. Adding them: 2I = ∫ 1 dx = [x] (0 to π/2) = π/2 ➜ I = π/4."
            },
            {
                "id": "m_m_2", "subject": "Mathematics", "topic": "Limits", "difficulty": "Medium",
                "text": "Evaluate the limit: lim (x ➜ 0) [(e²ˣ - 1) / x].",
                "options": ["1", "2", "e", "0"],
                "correct_index": 1,
                "solution": "Applying L'Hopital's Rule or standard exponential limit: lim [2*e²ˣ / 1] as x ➜ 0 = 2*e⁰ = 2."
            },
            {
                "id": "m_m_3", "subject": "Mathematics", "topic": "Quadratic Equations", "difficulty": "Medium",
                "text": "Find the coordinates of the vertex of the parabola: y = 2x² - 8x + 5.",
                "options": ["(2, 5)", "(2, -3)", "(4, 5)", "(-2, -3)"],
                "correct_index": 1,
                "solution": "x-coordinate of vertex h = -b/2a = -(-8)/(2*2) = 2. y-coordinate k = 2(2)² - 8(2) + 5 = 8 - 16 + 5 = -3. Vertex is at (2, -3)."
            },
            {
                "id": "m_m_4", "subject": "Mathematics", "topic": "Binomial Theorem", "difficulty": "Medium",
                "text": "What is the total number of terms in the algebraic expansion of (x + y + z)¹⁰?",
                "options": ["11", "55", "66", "121"],
                "correct_index": 2,
                "solution": "The number of terms in a multinomial expansion (x1 + x2 + ... + xr)^n is given by (n + r - 1)C(r - 1). Here n=10, r=3. Thus (10 + 3 - 1)C(3 - 1) = 12C2 = (12 * 11) / 2 = 66."
            }
        ],
        "Hard": [
            {
                "id": "m_h_1", "subject": "Mathematics", "topic": "Integrals", "difficulty": "Hard",
                "text": "Evaluate the definite integral: ∫ (0 to π) [x * sin(x)] dx.",
                "options": ["π/2", "π", "2π", "0"],
                "correct_index": 1,
                "solution": "Using integration by parts: ∫ x sin(x) dx = -x cos(x) + sin(x). Evaluating from 0 to π: [-π cos(π) + sin(π)] - [0 + sin(0)] = -π(-1) = π."
            },
            {
                "id": "m_h_2", "subject": "Mathematics", "topic": "Calculus", "difficulty": "Hard",
                "text": "Find the area of the region bounded by the curves: y = x² and y² = x.",
                "options": ["1/2", "1/3", "2/3", "1/4"],
                "correct_index": 1,
                "solution": "Points of intersection: x² = √x ➜ x⁴ = x ➜ x(x³ - 1) = 0 ➜ x = 0, 1. Area = ∫ (0 to 1) [√x - x²] dx = [ (2/3)x^(1.5) - x³/3 ] (0 to 1) = 2/3 - 1/3 = 1/3."
            },
            {
                "id": "m_h_3", "subject": "Mathematics", "topic": "Limits", "difficulty": "Hard",
                "text": "Evaluate the limit: lim (x ➜ ∞) [(1 + 2/x)ˣ].",
                "options": ["e", "e²", "1", "∞"],
                "correct_index": 1,
                "solution": "This is of the form 1^∞. Limit is given by e^L where L = lim (x ➜ ∞) [x * ((1 + 2/x) - 1)] = lim [x * 2/x] = 2. Thus limit = e²."
            },
            {
                "id": "m_h_4", "subject": "Mathematics", "topic": "Infinite Series", "difficulty": "Hard",
                "text": "Find the sum of the infinite series: S = 1/2 + 2/4 + 3/8 + 4/16 + ...",
                "options": ["1.5", "2", "3", "4"],
                "correct_index": 1,
                "solution": "This is an Arithmetico-Geometric Progression (AGP). S = sum (n=1 to ∞) [n / 2ⁿ]. S = 1/2 + 2/4 + 3/8 + ... Multiplying by 1/2: 0.5 S = 1/4 + 2/8 + 3/16 + ... Subtracting: 0.5 S = 1/2 + 1/4 + 1/8 + ... = 1 (GP sum) ➜ S = 2."
            }
        ]
    },
    "Biology": {
        "Easy": [
            {
                "id": "b_e_1", "subject": "Biology", "topic": "Cell Structure", "difficulty": "Easy",
                "text": "Which cellular organelle is universally referred to as the powerhouse of the cell?",
                "options": ["Nucleus", "Ribosome", "Mitochondria", "Lysosome"],
                "correct_index": 2,
                "solution": "Mitochondria are the sites of cellular respiration and ATP generation."
            },
            {
                "id": "b_e_2", "subject": "Biology", "topic": "Plant Biology", "difficulty": "Easy",
                "text": "Photosynthesis in green plants takes place inside which specialized cell organelle?",
                "options": ["Chloroplast", "Vacuole", "Mitochondria", "Golgi Body"],
                "correct_index": 0,
                "solution": "Chloroplasts contain chlorophyll pigments which capture solar energy for photosynthesis."
            },
            {
                "id": "b_e_3", "subject": "Biology", "topic": "Vitamins", "difficulty": "Easy",
                "text": "Which essential vitamin is synthesized in human skin when exposed to ultraviolet B (UVB) sunlight?",
                "options": ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"],
                "correct_index": 2,
                "solution": "Vitamin D (cholecalciferol) is synthesized in the skin from cholesterol derivatives upon exposure to sunlight."
            },
            {
                "id": "b_e_4", "subject": "Biology", "topic": "Genetics", "difficulty": "Easy",
                "text": "The famous double-helix structure model of DNA molecules was proposed in 1953 by:",
                "options": ["Gregor Mendel", "Watson & Crick", "Charles Darwin", "Louis Pasteur"],
                "correct_index": 1,
                "solution": "James Watson and Francis Crick proposed the double helical configuration of DNA."
            }
        ],
        "Medium": [
            {
                "id": "b_m_1", "subject": "Biology", "topic": "Cell Respiration", "difficulty": "Medium",
                "text": "During the process of glycolysis, a single molecule of glucose is split into two molecules of:",
                "options": ["Lactic acid", "Citric acid", "Pyruvic acid", "Acetyl CoA"],
                "correct_index": 2,
                "solution": "Glycolysis breaks down one 6-carbon glucose molecule into two 3-carbon pyruvate (pyruvic acid) molecules."
            },
            {
                "id": "b_m_2", "subject": "Biology", "topic": "Plant Hormones", "difficulty": "Medium",
                "text": "Which plant hormone is primarily responsible for maintaining apical dominance in plant shoots?",
                "options": ["Auxin", "Gibberellin", "Cytokinin", "Abscisic acid"],
                "correct_index": 0,
                "solution": "Auxins produced in the shoot apical meristem suppress the growth of lateral buds, maintaining apical dominance."
            },
            {
                "id": "b_m_3", "subject": "Biology", "topic": "Human Physiology", "difficulty": "Medium",
                "text": "The oxygen dissociation curve showing binding affinity of hemoglobin relative to partial pressure of oxygen is typically:",
                "options": ["Linear", "Hyperbolic", "Sigmoid", "Parabolic"],
                "correct_index": 2,
                "solution": "The cooperative binding of oxygen to the four subunits of hemoglobin results in a Sigmoid (S-shaped) curve."
            },
            {
                "id": "b_m_4", "subject": "Biology", "topic": "Mendelian Genetics", "difficulty": "Medium",
                "text": "In a classic Mendelian monohybrid cross of heterozygous tall plants (Tt x Tt), what is the phenotypic ratio of offspring?",
                "options": ["1:2:1", "3:1", "9:3:3:1", "1:1"],
                "correct_index": 1,
                "solution": "The genotypic ratio is 1 TT : 2 Tt : 1 tt, but the phenotypic ratio (visual traits) is 3 Tall (TT, Tt) to 1 Dwarf (tt)."
            }
        ],
        "Hard": [
            {
                "id": "b_h_1", "subject": "Biology", "topic": "Molecular Biology", "difficulty": "Hard",
                "text": "Which class of enzymes is utilized in molecular gene cloning to covalently seal and link DNA fragments together?",
                "options": ["DNA Polymerase", "DNA Ligase", "Restriction Endonuclease", "Helicase"],
                "correct_index": 1,
                "solution": "DNA Ligase catalyzes the formation of phosphodiester bonds to join adjacent DNA nucleotides."
            },
            {
                "id": "b_h_2", "subject": "Biology", "topic": "Taxonomy", "difficulty": "Hard",
                "text": "Select the correct biological taxonomic hierarchy from the highest (most inclusive) rank to the lowest (most specific):",
                "options": [
                    "Kingdom, Phylum, Class, Order, Family, Genus, Species",
                    "Kingdom, Class, Phylum, Family, Order, Genus, Species",
                    "Phylum, Kingdom, Class, Order, Genus, Family, Species",
                    "Kingdom, Phylum, Order, Class, Family, Genus, Species"
                ],
                "correct_index": 0,
                "solution": "The standard sequence is Kingdom ➜ Phylum ➜ Class ➜ Order ➜ Family ➜ Genus ➜ Species."
            },
            {
                "id": "b_h_3", "subject": "Biology", "topic": "Plant Physiology", "difficulty": "Hard",
                "text": "What is the primary, initial carbon dioxide (CO₂) chemical acceptor molecule in C₄ photosynthetic pathway plants?",
                "options": ["RuBP", "Phosphoenolpyruvate (PEP)", "Oxaloacetate (OAA)", "PGA"],
                "correct_index": 1,
                "solution": "In C₄ plants, CO₂ is initial fixed by Phosphoenolpyruvate (PEP) catalyzed by PEP carboxylase in mesophyll cells."
            },
            {
                "id": "b_h_4", "subject": "Biology", "topic": "Cell Division", "difficulty": "Hard",
                "text": "During which specific sub-phase of prophase I in meiosis does crossing over and genetic recombination occur?",
                "options": ["Leptotene", "Zygotene", "Pachytene", "Diplotene"],
                "correct_index": 2,
                "solution": "Recombination and crossing over between homologous chromosomes takes place in the Pachytene stage."
            }
        ]
    }
}

# --- Schemas ---
class GenerateTestRequest(BaseModel):
    student_id: str
    subject: str

class SubmitTestRequest(BaseModel):
    student_id: str
    subject: str
    answers: Dict[str, int]  # Maps question_id to selected_option_index
    time_taken_seconds: int
    questions: List[Dict[str, Any]] = None  # Optional custom generated questions definitions for grading

class GenerateCustomTestRequest(BaseModel):
    student_id: str
    subject: str
    topics: str

class RetrySimilarRequest(BaseModel):
    student_id: str
    subject: str
    topics: List[str]

def get_fallback_custom_pool(subject: str, topics: str = None) -> Dict[str, Any]:
    import re
    import string
    if subject not in QUESTION_BANK:
        subject = "Physics"
    pool = QUESTION_BANK[subject]
    
    # Parse topics if provided
    topic_filters = []
    topic_words = set()
    if topics:
        raw_topics = [t.strip().lower() for t in re.split(r'[,;]', topics) if t.strip()]
        topic_filters = raw_topics
        
        # Extract individual significant words for broader keyword-based fallback matching
        stopwords = {"and", "of", "in", "the", "to", "for", "a", "an", "with", "or", "on", "at", "by", "is"}
        for t in raw_topics:
            words = [w.strip(string.punctuation) for w in t.split() if w.strip()]
            for w in words:
                if w not in stopwords and len(w) > 2:
                    topic_words.add(w)

    client_pool = {}
    for diff in ["Easy", "Medium", "Hard"]:
        q_list = pool[diff]
        if topic_filters:
            # Pass 1: Strict substring/exact matching on topic names
            filtered = [
                q for q in q_list
                if any(tf in q["topic"].lower() or q["topic"].lower() in tf for tf in topic_filters)
            ]
            # Pass 2: Keyword token matching if exact matches yield zero questions
            if not filtered and topic_words:
                filtered = [
                    q for q in q_list
                    if any(w in q["topic"].lower() for w in topic_words)
                ]
            if filtered:
                q_list = filtered
                
        client_pool[diff] = [
            {
                "id": q["id"],
                "subject": q["subject"],
                "topic": q["topic"],
                "difficulty": q["difficulty"],
                "text": q["text"],
                "options": q["options"],
                "correct_index": q["correct_index"],
                "solution": q["solution"]
            }
            for q in q_list
        ]
    return client_pool

@router.post("/generate")
async def generate_test(data: GenerateTestRequest):
    import random
    subject = data.subject
    if subject not in QUESTION_BANK:
        raise HTTPException(status_code=400, detail="Invalid subject name")

    # Fetch pool of questions for that subject
    pool = QUESTION_BANK[subject]
    
    # Build a local lookup map of question ID to question dictionary
    flat_questions = {}
    for sub, diffs in QUESTION_BANK.items():
        for diff, q_list in diffs.items():
            for q in q_list:
                flat_questions[q["id"]] = q

    # Fetch student's mistake analysis to check for weak topics
    weak_topics = set()
    try:
        if data.student_id and data.student_id != "guest":
            res = supabase.table("mistake_analysis").select("question_id").eq("student_id", data.student_id).execute()
            if res.data:
                for row in res.data:
                    q_id = row.get("question_id")
                    if q_id in flat_questions:
                        weak_topics.add(flat_questions[q_id]["topic"])
    except Exception as e:
        logger.warning(f"Could not load student mistake history for personalization: {e}")

    # Format and randomize/prioritize questions
    client_pool = {}
    for diff in ["Easy", "Medium", "Hard"]:
        q_list = pool[diff]
        
        # Split into weak topic questions and standard questions
        weak_pile = []
        standard_pile = []
        for q in q_list:
            formatted_q = {
                "id": q["id"],
                "subject": q["subject"],
                "topic": q["topic"],
                "difficulty": q["difficulty"],
                "text": q["text"],
                "options": q["options"],
                "correct_index": q["correct_index"]
            }
            if q["topic"] in weak_topics:
                weak_pile.append(formatted_q)
            else:
                standard_pile.append(formatted_q)
                
        # Shuffle both piles individually to ensure randomness across sessions
        random.shuffle(weak_pile)
        random.shuffle(standard_pile)
        
        # Combine piles with weak topics prioritized at the beginning
        client_pool[diff] = weak_pile + standard_pile
        
    return client_pool

@router.post("/generate-custom")
async def generate_custom_test(data: GenerateCustomTestRequest):
    import os
    import requests
    import json
    
    subject = data.subject
    topics = data.topics
    
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.warning("GROQ_API_KEY is not defined in .env, using local fallback for custom test.")
        return get_fallback_custom_pool(subject, topics)
        
    prompt = f"""
You are Professor ARIA, a genius AI Science Tutor. Generate a mock test question pool for Class 11-12 {subject} targeting JEE/NEET exam preparation, strictly based on the following student's weak topics:
"{topics}"

You must generate exactly 12 unique questions divided into three difficulties: Easy (4 questions), Medium (4 questions), and Hard (4 questions).
Return a raw, valid JSON object matching the following structure:
{{
  "Easy": [
    {{
      "id": "custom_e_1",
      "subject": "{subject}",
      "topic": "Name of specific sub-topic",
      "difficulty": "Easy",
      "text": "Detailed question text. Use standard inline LaTeX math ($...$) for formulas and block LaTeX math ($$...$$) for equations if needed.",
      "solution": "1. Formula: \\tau = r \\times F\n2. Given: r = 0.5 m, F = 5 N perpendicular to the radius\n3. Calculate: \\tau = 0.5 * 5 = 2.5 N·m\n4. Therefore, 2.5 N·m is the correct answer.",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correct_index": 0
    }},
    ...
  ],
  "Medium": [
    ...
  ],
  "Hard": [
    ...
  ]
}}

Guidelines:
- Return ONLY valid raw JSON. Do not include markdown codeblocks, "```json", or any preamble/postamble.
- Ensure all questions are highly academic, challenging, and strictly related to the provided topics: "{topics}".
- Ensure all keys exist and option arrays have exactly 4 choices.
- CRITICAL: You must generate the "solution" field BEFORE generating the "options" and "correct_index" fields. First evaluate the correct answer step-by-step in the solution, then write the four options (ensuring the calculated correct answer is present in the list), and finally set the "correct_index" to the index of that option.
- CRITICAL: The correct_index must point to the EXACT index of the correct answer in the options array. For example, if the calculated answer is 1 rad/s² and the options are ["1 rad/s²", "2 rad/s²", "3 rad/s²", "4 rad/s²"], then correct_index MUST be 0. Verify your calculations, options list, and index assignments step-by-step to guarantee 100% logical consistency with no mismatches.
- CRITICAL: The solution derivation MUST explicitly state the final correct value and name the correct option at the very end of the solution (e.g., "Therefore, 10 m/s is the correct answer."). The calculated value, options list, correct_index, and final answer statement in the solution MUST be 100% consistent and point to the exact same option.
- Ensure the solution derivation is concise, formatted in clear sequential steps, and avoids wordy paragraphs.
- ID must be unique (e.g. custom_e_1, custom_e_2, etc.).
- Ensure LaTeX formulas are clean and valid.
"""

    # Try querying the primary model first
    model_name = "llama-3.3-70b-versatile"
    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model_name,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a specialized JSON generator. You output only raw, valid JSON. Never output any introductory text, markdown code blocks, explanation or commentary."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.5,
            "max_tokens": 4096
        }
        res = requests.post(url, headers=headers, json=payload, timeout=25)
        if res.status_code == 200:
            res_data = res.json()
            content = res_data["choices"][0]["message"]["content"]
            parsed_pool = json.loads(content)
            if "Easy" in parsed_pool and "Medium" in parsed_pool and "Hard" in parsed_pool:
                return parsed_pool
            else:
                logger.warning(f"Primary model {model_name} response did not have all difficulties.")
        
        raise Exception(f"Primary model {model_name} failed with status {res.status_code}: {res.text}")
    except Exception as primary_err:
        logger.warning(f"Primary model {model_name} failed: {primary_err}. Trying backup model (llama-3.1-8b-instant)...")
        backup_model = "llama-3.1-8b-instant"
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": backup_model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a specialized JSON generator. You output only raw, valid JSON. Never output any introductory text, markdown code blocks, explanation or commentary."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.5,
                "max_tokens": 4096
            }
            res = requests.post(url, headers=headers, json=payload, timeout=25)
            if res.status_code == 200:
                res_data = res.json()
                content = res_data["choices"][0]["message"]["content"]
                parsed_pool = json.loads(content)
                if "Easy" in parsed_pool and "Medium" in parsed_pool and "Hard" in parsed_pool:
                    logger.info("Backup model successfully generated custom test.")
                    return parsed_pool
                else:
                    logger.warning(f"Backup model {backup_model} response did not have all difficulties.")
            
            raise Exception(f"Backup model {backup_model} failed with status {res.status_code}: {res.text}")
        except Exception as backup_err:
            logger.warning(f"Backup model {backup_model} also failed: {backup_err}. Using filtered static fallback pool.")
            
    return get_fallback_custom_pool(subject, topics)

@router.post("/submit")
async def submit_test(data: SubmitTestRequest):
    subject = data.subject
    if subject not in QUESTION_BANK and not data.questions:
        raise HTTPException(status_code=400, detail="Invalid subject or empty questions list")

    # Create flat question bank for quick grading
    flat_questions = {}
    if data.questions:
        for q in data.questions:
            flat_questions[q["id"]] = q
    else:
        for diff in ["Easy", "Medium", "Hard"]:
            for q in QUESTION_BANK[subject][diff]:
                flat_questions[q["id"]] = q

    correct_count = 0
    total_count = len(data.answers)
    graded_details = []

    for q_id, chosen_idx in data.answers.items():
        if q_id not in flat_questions:
            continue
            
        q = flat_questions[q_id]
        is_correct = (chosen_idx == q["correct_index"])
        if is_correct:
            correct_count += 1
        else:
            if data.student_id and data.student_id != "guest":
                try:
                    supabase.table("mistake_analysis").insert({
                        "student_id": data.student_id,
                        "test_id": None,
                        "question_id": q["id"],
                        "explanation_text": f"Automated grading log for incorrect mock test answer on topic: {q['topic']}",
                        "ai_classification": "Unclassified",
                        "confidence_score": 1.0
                    }).execute()
                except Exception as db_err:
                    logger.warning(f"Failed to automatically log mistake to Supabase: {str(db_err)}")
            
        graded_details.append({
            "id": q["id"],
            "topic": q["topic"],
            "difficulty": q["difficulty"],
            "text": q["text"],
            "options": q["options"],
            "chosen_index": chosen_idx,
            "correct_index": q["correct_index"],
            "is_correct": is_correct,
            "solution": q["solution"]
        })

    # Calculate overall score percentage
    score = (correct_count / total_count * 100) if total_count > 0 else 0.0
    score = round(score, 1)

    # Calculate mock predicted exam score based on accuracy
    # E.g. accuracy * 0.4 + 50 (capped at 99%)
    predicted_exam_score = min(99.0, round(score * 0.45 + 52.0, 1))

    # 1. Insert into mock_tests table in Supabase
    try:
        supabase.table("mock_tests").insert({
            "student_id": data.student_id,
            "subject": data.subject,
            "questions": graded_details,
            "answers": data.answers,
            "score": score,
            "predicted_exam_score": predicted_exam_score
        }).execute()
    except Exception as e:
        logger.error(f"Failed to save mock_test to Supabase: {str(e)}")

    # 2. Insert summary record into quiz_results to update study stats & forecast charts
    # Locate/create a course reference. We can query the first course matching the subject
    course_id = None
    try:
        courses_res = supabase.table("courses").select("id").eq("subject", subject).execute()
        if courses_res.data:
            course_id = courses_res.data[0]["id"]
    except Exception as e:
        logger.warning(f"Could not retrieve course reference for {subject}: {str(e)}")

    try:
        # Get a primary topic name from graded details to log
        primary_topic = graded_details[0]["topic"] if graded_details else "Comprehensive Review"
        
        supabase.table("quiz_results").insert({
            "student_id": data.student_id,
            "course_id": course_id, # Can be None if no course seeded
            "subject": subject,
            "topic": primary_topic,
            "score": score,
            "total_questions": total_count,
            "correct_answers": correct_count,
            "time_taken_seconds": data.time_taken_seconds
        }).execute()
    except Exception as e:
        logger.error(f"Failed to log quiz result for mock_test: {str(e)}")

    return {
        "status": "success",
        "score": score,
        "total_questions": total_count,
        "correct_answers": correct_count,
        "predicted_exam_score": predicted_exam_score,
        "graded_details": graded_details
    }

@router.post("/retry-similar")
async def retry_similar_questions(data: RetrySimilarRequest):
    import os
    import requests
    import json
    
    subject = data.subject
    topics = data.topics
    topics_str = ", ".join(topics)
    
    # Try using Groq if API key is present for a personalized smart retest
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        prompt = f"""
You are Professor ARIA, a genius AI Science Tutor. Generate a targeted follow-up "Retry Assessment" for Class 11-12 {subject} targeting JEE/NEET.
The student recently made mistakes in questions covering these topics: "{topics_str}".

Generate exactly 5 new, unique, challenging questions covering these topics.
Divide them into difficulties: Easy (1 question), Medium (2 questions), Hard (2 questions).
Return a raw, valid JSON object matching the following structure:
{{
  "Easy": [
    {{
      "id": "retry_e_1",
      "subject": "{subject}",
      "topic": "Name of sub-topic",
      "difficulty": "Easy",
      "text": "Question text using LaTeX math.",
      "solution": "1. Formula: \\tau = r \\times F\n2. Given: r = 0.5 m, F = 5 N perpendicular to the radius\n3. Calculate: \\tau = 0.5 * 5 = 2.5 N·m\n4. Therefore, 2.5 N·m is the correct answer.",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0
    }}
  ],
  "Medium": [
    ...
  ],
  "Hard": [
    ...
  ]
}}
Ensure the JSON is raw and contains exactly 5 questions total.
Guidelines:
- CRITICAL: You must generate the "solution" field BEFORE generating the "options" and "correct_index" fields. First evaluate the correct answer step-by-step in the solution, then write the four options (ensuring the calculated correct answer is present in the list), and finally set the "correct_index" to the index of that option.
- CRITICAL: The correct_index must point to the EXACT index of the correct answer in the options array. For example, if the calculated answer is 1 rad/s² and the options are ["1 rad/s²", "2 rad/s²", "3 rad/s²", "4 rad/s²"], then correct_index MUST be 0. Verify your calculations, options list, and index assignments step-by-step to guarantee 100% logical consistency with no mismatches.
- CRITICAL: The solution derivation MUST explicitly state the final correct value and name the correct option at the very end of the solution (e.g., "Therefore, 10 m/s is the correct answer."). The calculated value, options list, correct_index, and final answer statement in the solution MUST be 100% consistent and point to the exact same option.
- Ensure the solution derivation is concise, formatted in clear sequential steps, and avoids wordy paragraphs.
- Ensure all keys exist and option arrays have exactly 4 choices.
- ID must be unique (e.g. retry_e_1, retry_m_1, etc.).
- Ensure LaTeX formulas are clean and valid.
"""
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": "You are a specialized JSON generator. You output only raw, valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.5,
                "max_tokens": 2048
            }
            res = requests.post(url, headers=headers, json=payload, timeout=20)
            if res.status_code == 200:
                content = res.json()["choices"][0]["message"]["content"]
                parsed_pool = json.loads(content)
                if "Easy" in parsed_pool or "Medium" in parsed_pool or "Hard" in parsed_pool:
                    return parsed_pool
        except Exception as e:
            logger.warning(f"Error generating retry test via Groq: {e}")

    # Fallback to local QUESTION_BANK matching topics
    fallback_pool = {"Easy": [], "Medium": [], "Hard": []}
    if subject in QUESTION_BANK:
        for diff in ["Easy", "Medium", "Hard"]:
            for q in QUESTION_BANK[subject][diff]:
                # If question topic matches any of the target topics
                if any(t.lower() in q["topic"].lower() or q["topic"].lower() in t.lower() for t in topics):
                    fallback_pool[diff].append({
                        "id": f"retry_{q['id']}",
                        "subject": q["subject"],
                        "topic": q["topic"],
                        "difficulty": q["difficulty"],
                        "text": q["text"],
                        "options": q["options"],
                        "correct_index": q["correct_index"],
                        "solution": q["solution"]
                    })
                    
    # If fallback pool is empty, return standard subset
    has_any = any(len(fallback_pool[d]) > 0 for d in ["Easy", "Medium", "Hard"])
    if not has_any:
        return get_fallback_custom_pool(subject, topics_str)
        
    return fallback_pool
