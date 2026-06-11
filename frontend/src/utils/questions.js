// src/utils/questions.js
// Static Question Bank and Client-side Quiz Generator Fallback for offline resilience

export const LOCAL_QUESTION_BANK = {
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
      },
      {
        "id": "p_e_5", "subject": "Physics", "topic": "Kinematics", "difficulty": "Easy",
        "text": "A stone is dropped from a height of 80 m. How long does it take to reach the ground? (Use g = 10 m/s²)",
        "options": ["2 s", "4 s", "6 s", "8 s"],
        "correct_index": 1,
        "solution": "Using s = ut + 0.5*g*t²: 80 = 0 + 0.5*10*t² => t² = 16 => t = 4 seconds."
      },
      {
        "id": "p_e_6", "subject": "Physics", "topic": "Work, Energy & Power", "difficulty": "Easy",
        "text": "What is the kinetic energy of a 2 kg object moving at a velocity of 5 m/s?",
        "options": ["10 J", "25 J", "50 J", "100 J"],
        "correct_index": 1,
        "solution": "Kinetic Energy = 0.5 * m * v² = 0.5 * 2 * (5)² = 25 J."
      },
      {
        "id": "p_e_7", "subject": "Physics", "topic": "Electrostatics", "difficulty": "Easy",
        "text": "The electrostatic force between two point charges in vacuum is 10 N. If a dielectric medium of dielectric constant K = 2 is introduced between them, the new force is:",
        "options": ["5 N", "10 N", "20 N", "40 N"],
        "correct_index": 0,
        "solution": "F' = F / K = 10 / 2 = 5 N."
      },
      {
        "id": "p_e_8", "subject": "Physics", "topic": "Units & Dimensions", "difficulty": "Easy",
        "text": "If the frequency of a tuning fork is 50 Hz, what is the time period of its vibrations?",
        "options": ["0.02 seconds", "0.2 seconds", "2.0 seconds", "0.5 seconds"],
        "correct_index": 0,
        "solution": "Time period T = 1 / f = 1 / 50 = 0.02 seconds."
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
      },
      {
        "id": "p_m_5", "subject": "Physics", "topic": "Electrostatics", "difficulty": "Medium",
        "text": "Two point charges +q and +4q are separated by a distance r. At what distance from charge +q along the line joining them is the net electric field zero?",
        "options": ["r/3", "r/2", "r/4", "2r/3"],
        "correct_index": 0,
        "solution": "Electric field E1 = E2 => kq/x² = k(4q)/(r-x)² => 1/x = 2/(r-x) => r-x = 2x => 3x = r => x = r/3."
      },
      {
        "id": "p_m_6", "subject": "Physics", "topic": "Thermodynamics", "difficulty": "Medium",
        "text": "In an adiabatic expansion of an ideal gas, the pressure of the gas is found to be proportional to the cube of its absolute temperature. The value of adiabatic index γ (Cp/Cv) is:",
        "options": ["1.5", "1.67", "1.4", "1.33"],
        "correct_index": 0,
        "solution": "Using relation T^γ * P^(1-γ) = const => P ∝ T^(γ/(γ-1)). Here power is 3, so γ/(γ-1) = 3 => γ = 3γ - 3 => 2γ = 3 => γ = 1.5."
      },
      {
        "id": "p_m_7", "subject": "Physics", "topic": "Rotational Motion", "difficulty": "Medium",
        "text": "A thin circular ring of mass M and radius R rotates about its axis with angular velocity ω. Two particles of mass m are placed gently on opposite ends of a diameter. The new angular velocity of the ring is:",
        "options": ["Mω / (M + 2m)", "Mω / (M + m)", "(M - 2m)ω / M", "(M + 2m)ω / M"],
        "correct_index": 0,
        "solution": "By conservation of angular momentum: I1*ω1 = I2*ω2 => MR²*ω = (MR² + 2mR²)*ω_new => ω_new = Mω / (M + 2m)."
      },
      {
        "id": "p_m_8", "subject": "Physics", "topic": "Kinematics", "difficulty": "Medium",
        "text": "A projectile is thrown with an initial velocity of (6i + 8j) m/s. Taking g = 10 m/s², what is the horizontal range of the projectile?",
        "options": ["9.6 m", "4.8 m", "19.2 m", "12.0 m"],
        "correct_index": 0,
        "solution": "u_x = 6 m/s, u_y = 8 m/s. Range R = 2 * u_x * u_y / g = 2 * 6 * 8 / 10 = 96 / 10 = 9.6 meters."
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
        "solution": "Let equivalent capacitance be C. Then C = 1 + (1 * C)/(1 + C) ➜ C(1 + C) = (1+C) + C ➜ C + C² = 1 + 2C ➜ C² - C - 1 = 0. Solving quadratic: C = (1 + √5)/2. C_eq = (√5 - 1)/2 μF."
      },
      {
        "id": "p_h_5", "subject": "Physics", "topic": "Magnetic Fields", "difficulty": "Hard",
        "text": "A circular coil of radius R carries a current I. The magnetic field at a distance x from the center along the axis is 1/8th of its value at the center. Find the value of x.",
        "options": ["R √3", "R", "R / √3", "2R"],
        "correct_index": 0,
        "solution": "B_axis = B_center * [R² / (R² + x²)^(1.5)]. Given B_axis / B_center = 1/8 => (R² + x²)^(1.5) = 8 R³ => R² + x² = 4 R² => x² = 3 R² => x = R √3."
      },
      {
        "id": "p_h_6", "subject": "Physics", "topic": "Electrostatics", "difficulty": "Hard",
        "text": "A solid conducting sphere of radius R is given a charge Q. The electric potential at a distance r = R/2 from the center of the sphere is:",
        "options": ["Q / (4πε₀R)", "Q / (2πε₀R)", "Zero", "Q / (8πε₀R)"],
        "correct_index": 0,
        "solution": "For a conducting sphere, the entire charge resides on the surface. The electric field inside is zero, meaning potential inside is constant and equal to the potential at the surface: V = Q / (4πε₀R)."
      },
      {
        "id": "p_h_7", "subject": "Physics", "topic": "Rotational Dynamics", "difficulty": "Hard",
        "text": "A uniform solid sphere of mass M and radius R rolls without slipping on a flat horizontal surface. What fraction of its total kinetic energy is rotational kinetic energy?",
        "options": ["2/7", "5/7", "2/5", "1/2"],
        "correct_index": 0,
        "solution": "KE_rot = 0.5*I*ω² = 0.5*(2/5 MR²)*ω² = 0.2 MR²ω². KE_trans = 0.5 Mv² = 0.5 MR²ω². Total KE = 0.7 MR²ω². Fraction = KE_rot / KE_total = 0.2 / 0.7 = 2/7."
      },
      {
        "id": "p_h_8", "subject": "Physics", "topic": "Simple Harmonic Motion", "difficulty": "Hard",
        "text": "A block of mass m is suspended from a vertical spring of force constant k. The block is pulled down by a distance x from its equilibrium position and released. The maximum tension in the spring during its motion is:",
        "options": ["mg + kx", "mg - kx", "kx", "mg"],
        "correct_index": 0,
        "solution": "At equilibrium, tension is mg. During SHM, the block oscillates about the equilibrium position with amplitude x. The maximum elongation occurs at the lowest point, where displacement is x. Total elongation is (mg/k) + x. Maximum tension T = k * [(mg/k) + x] = mg + kx."
      }
    ],
    "Numerical": [
      {
        "id": "p_n_1", "subject": "Physics", "topic": "Rotational Dynamics", "difficulty": "Medium",
        "text": "A uniform solid cylinder of mass 2 kg and radius 0.5 m is free to rotate about its longitudinal axis of symmetry. A constant force of 10 N is applied tangentially to the cylinder's curved surface. Calculate the angular acceleration of the cylinder (in rad/s²).",
        "correct_value": 20,
        "solution": "Torque $\\tau = F \\times R = 10 \\times 0.5 = 5\\text{ N}\\cdot\\text{m}$.\nMoment of Inertia of a solid cylinder $I = \\frac{1}{2} M R^2 = \\frac{1}{2} \\times 2 \\times (0.5)^2 = 0.25\\text{ kg}\\cdot\\text{m}^2$.\nAngular acceleration $\\alpha = \\frac{\\tau}{I} = \\frac{5}{0.25} = 20\\text{ rad/s}^2$."
      },
      {
        "id": "p_n_2", "subject": "Physics", "topic": "Simple Harmonic Motion", "difficulty": "Hard",
        "text": "A particle executing simple harmonic motion (SHM) has a velocity of 3 m/s when its displacement is 4 m from the mean position, and a velocity of 4 m/s when its displacement is 3 m from the mean position. Find the amplitude of the oscillation (in meters).",
        "correct_value": 5,
        "solution": "Using the SHM velocity equation: $v^2 = \\omega^2 (A^2 - x^2)$.\nFor displacement $x_1 = 4\\text{ m}$, $v_1 = 3\\text{ m/s}$: $9 = \\omega^2 (A^2 - 16)$\nFor displacement $x_2 = 3\\text{ m}$, $v_2 = 4\\text{ m/s}$: $16 = \\omega^2 (A^2 - 9)$\nDividing these equations gives: $\\frac{9}{16} = \\frac{A^2 - 16}{A^2 - 9} \\implies 9A^2 - 81 = 16A^2 - 256 \\implies 7A^2 = 175 \\implies A^2 = 25 \\implies A = 5\\text{ m}$."
      },
      {
        "id": "p_n_3", "subject": "Physics", "topic": "Electrostatics", "difficulty": "Medium",
        "text": "A point charge of $Q = 53.1\\text{ }\\mu\\text{C}$ is placed at the center of a cube. What is the electric flux through one face of the cube (in units of $10^6\\text{ N}\\cdot\\text{m}^2/\\text{C}$)? (Use permittivity of free space $\\varepsilon_0 = 8.85 \\times 10^{-12}\\text{ C}^2/\\text{N}\\cdot\\text{m}^2$)",
        "correct_value": 1,
        "solution": "By Gauss's Law, the total electric flux through a closed cube is $\\Phi_{\\text{total}} = \\frac{Q}{\\varepsilon_0} = \\frac{53.1 \\times 10^{-6}\\text{ C}}{8.85 \\times 10^{-12}\\text{ C}^2/\\text{N}\\cdot\\text{m}^2} = 6 \\times 10^6\\text{ N}\\cdot\\text{m}^2/\\text{C}$.\nSince a cube has 6 identical faces, the flux through one face is: $\\Phi_{\\text{face}} = \\frac{\\Phi_{\\text{total}}}{6} = 1 \\times 10^6\\text{ N}\\cdot\\text{m}^2/\\text{C}$. Therefore, the numerical answer is 1."
      },
      {
        "id": "p_n_4", "subject": "Physics", "topic": "Capacitors", "difficulty": "Medium",
        "text": "Two parallel plate capacitors of capacitances $3\\text{ }\\mu\\text{F}$ and $6\\text{ }\\mu\\text{F}$ are connected in series across a $12\\text{ V}$ battery. What is the magnitude of the charge (in $\\mu\\text{C}$) stored on the $3\\text{ }\\mu\\text{F}$ capacitor?",
        "correct_value": 24,
        "solution": "For two capacitors connected in series, the equivalent capacitance $C_{\\text{eq}}$ is: $\\frac{1}{C_{\\text{eq}}} = \\frac{1}{3} + \\frac{1}{6} \\implies C_{\\text{eq}} = \\frac{3 \\times 6}{3 + 6} = 2\\text{ }\\mu\\text{F}$.\nIn a series circuit, the charge stored on each capacitor is identical to the total charge: $Q = C_{\\text{eq}} \\times V = 2\\text{ }\\mu\\text{F} \\times 12\\text{ V} = 24\\text{ }\\mu\\text{C}$."
      },
      {
        "id": "p_n_5", "subject": "Physics", "topic": "Thermodynamics", "difficulty": "Hard",
        "text": "A Carnot engine operates between two reservoirs at absolute temperatures of $400\\text{ K}$ and $300\\text{ K}$. If the net work output of the engine per cycle is $50\\text{ J}$, calculate the amount of heat energy (in Joules) rejected to the cold reservoir per cycle.",
        "correct_value": 150,
        "solution": "The efficiency $\\eta$ of a Carnot engine is: $\\eta = 1 - \\frac{T_c}{T_h} = 1 - \\frac{300}{400} = 0.25$.\nAlso, $\\eta = \\frac{W}{Q_h} \\implies 0.25 = \\frac{50}{Q_h} \\implies Q_h = 200\\text{ J}$ absorbed from the hot reservoir.\nBy conservation of energy, the heat rejected to the cold reservoir is: $Q_c = Q_h - W = 200 - 50 = 150\\text{ J}$."
      },
      {
        "id": "p_n_6", "subject": "Physics", "topic": "Kinematics", "difficulty": "Medium",
        "text": "A ball is thrown vertically upwards with an initial velocity of $20\\text{ m/s}$ from the top of a building of height $25\\text{ m}$. Find the total time (in seconds) taken by the ball to strike the ground. (Take $g = 10\\text{ m/s}^2$ and assume upward direction as positive)",
        "correct_value": 5,
        "solution": "Using the second equation of motion: $s = ut + \\frac{1}{2} a t^2$.\nHere, displacement $s = -25\\text{ m}$ (downward), initial velocity $u = 20\\text{ m/s}$ (upward), acceleration $a = -g = -10\\text{ m/s}^2$.\n$-25 = 20t - 5t^2 \\implies 5t^2 - 20t - 25 = 0 \\implies t^2 - 4t - 5 = 0$.\nFactoring the quadratic equation: $(t - 5)(t + 1) = 0$.\nSince time $t$ must be positive, we get $t = 5\\text{ seconds}$."
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
      },
      {
        "id": "c_e_5", "subject": "Chemistry", "topic": "Periodic Table", "difficulty": "Easy",
        "text": "Which of the following group 17 elements exists as a liquid at room temperature?",
        "options": ["Fluorine", "Chlorine", "Bromine", "Iodine"],
        "correct_index": 2,
        "solution": "Bromine is the only non-metallic element in the periodic table that is liquid at standard temperature and pressure."
      },
      {
        "id": "c_e_6", "subject": "Chemistry", "topic": "Chemical Reactions", "difficulty": "Easy",
        "text": "What is the oxidation state of Manganese (Mn) in potassium permanganate (KMnO₄)?",
        "options": ["+5", "+6", "+7", "+4"],
        "correct_index": 2,
        "solution": "In KMnO₄: K is +1, O is -2. Thus: +1 + Mn + 4(-2) = 0 => Mn = +7."
      },
      {
        "id": "c_e_7", "subject": "Chemistry", "topic": "Acids & Bases", "difficulty": "Easy",
        "text": "Which of the following molecules acts as a Lewis acid?",
        "options": ["NH₃", "H₂O", "BF₃", "F⁻"],
        "correct_index": 2,
        "solution": "BF₃ has an incomplete octet on boron, making it capable of accepting an electron pair. Hence it is a Lewis acid."
      },
      {
        "id": "c_e_8", "subject": "Chemistry", "topic": "Chemical Kinetics", "difficulty": "Easy",
        "text": "For a zero-order reaction, the half-life period (t_1/2) is directly proportional to:",
        "options": ["Initial concentration [A]₀", "Reciprocal of initial concentration 1/[A]₀", "[A]₀²", "Independent of initial concentration"],
        "correct_index": 0,
        "solution": "For zero order: t_1/2 = [A]₀ / 2k. Thus it is directly proportional to the initial concentration."
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
      },
      {
        "id": "c_m_5", "subject": "Chemistry", "topic": "Organic Chemistry", "difficulty": "Medium",
        "text": "Which of the following carbocations is the most stable?",
        "options": ["t-Butyl carbocation", "Isopropyl carbocation", "Ethyl carbocation", "Methyl carbocation"],
        "correct_index": 0,
        "solution": "The tertiary carbocation (t-butyl) has 9 hyperconjugative structures (9 alpha hydrogens) and strong +I effects from three methyl groups, making it the most stable."
      },
      {
        "id": "c_m_6", "subject": "Chemistry", "topic": "Chemical Bonding", "difficulty": "Medium",
        "text": "The geometry/shape of CIF₃ molecule according to VSEPR theory is:",
        "options": ["T-shaped", "Trigonal planar", "Trigonal bipyramidal", "See-saw"],
        "correct_index": 0,
        "solution": "ClF₃ has 3 bond pairs and 2 lone pairs around Cl (Steric Number = 5, sp³d). To minimize repulsion, lone pairs occupy equatorial positions, resulting in a slightly bent T-shaped geometry."
      },
      {
        "id": "c_m_7", "subject": "Chemistry", "topic": "Chemical Kinetics", "difficulty": "Medium",
        "text": "If the activation energy of a chemical reaction is zero, then the rate constant k of the reaction is:",
        "options": ["Equal to the pre-exponential factor A", "Zero", "Infinite", "Negative"],
        "correct_index": 0,
        "solution": "From the Arrhenius equation: k = A * e^(-Ea/RT). If Ea = 0, then k = A * e⁰ = A."
      },
      {
        "id": "c_m_8", "subject": "Chemistry", "topic": "Periodic Table", "difficulty": "Medium",
        "text": "The correct order of increasing ionic radii of the isoelectronic species N³⁻, O²⁻, F⁻, Na⁺ is:",
        "options": ["Na⁺ < F⁻ < O²⁻ < N³⁻", "N³⁻ < O²⁻ < F⁻ < Na⁺", "F⁻ < Na⁺ < O²⁻ < N³⁻", "Na⁺ < O²⁻ < F⁻ < N³⁻"],
        "correct_index": 0,
        "solution": "For isoelectronic species, as the nuclear charge (atomic number) increases, the attraction for electrons increases, causing a decrease in ionic radius: Na⁺ (Z=11) < F⁻ (Z=9) < O²⁻ (Z=8) < N³⁻ (Z=7)."
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
      },
      {
        "id": "c_h_5", "subject": "Chemistry", "topic": "Coordination Compounds", "difficulty": "Hard",
        "text": "The spin-only magnetic moment of [Fe(H₂O)₆]²⁺ is approximately:",
        "options": ["4.90 BM", "5.92 BM", "2.83 BM", "1.73 BM"],
        "correct_index": 0,
        "solution": "Fe²⁺ is a d⁶ system. Since H₂O is a weak field ligand, it does not pair up the electrons. Number of unpaired electrons n = 4. Magnetic moment = √[n(n+2)] = √[4(6)] = √24 ≈ 4.90 BM."
      },
      {
        "id": "c_h_6", "subject": "Chemistry", "topic": "Equilibrium", "difficulty": "Hard",
        "text": "For the gaseous phase synthesis of ammonia: N₂(g) + 3H₂(g) ⇌ 2NH₃(g), the relation between Kp and Kc is:",
        "options": ["Kp = Kc(RT)⁻²", "Kp = Kc(RT)²,", "Kp = Kc(RT)⁻¹", "Kp = Kc"],
        "correct_index": 0,
        "solution": "Kp = Kc(RT)^Δn. Here, Δn = moles of gaseous products - moles of gaseous reactants = 2 - (1 + 3) = -2. Therefore, Kp = Kc(RT)⁻²."
      },
      {
        "id": "c_h_7", "subject": "Chemistry", "topic": "Organic Chemistry", "difficulty": "Hard",
        "text": "The major product of the reaction of salicylic acid with acetic anhydride in the presence of an acid catalyst like H₂SO₄ is:",
        "options": ["Acetylsalicylic acid (Aspirin)", "Phenyl salicylate (Salol)", "Methyl salicylate", "Paracetamol"],
        "correct_index": 0,
        "solution": "Acetylation of the phenolic -OH group of salicylic acid yields acetylsalicylic acid, commonly known as Aspirin."
      },
      {
        "id": "c_h_8", "subject": "Chemistry", "topic": "Thermodynamics", "difficulty": "Hard",
        "text": "For which of the following chemical reactions is the enthalpy change (ΔH) exactly equal to the internal energy change (ΔU)?",
        "options": ["H₂(g) + I₂(g) ⇌ 2HI(g)", "N₂(g) + 3H₂(g) ⇌ 2NH₃(g)", "PCl₅(g) ⇌ PCl₃(g) + Cl₂(g)", "C(s) + O₂(g) ⇌ CO₂(g)"],
        "correct_index": 0,
        "solution": "Using ΔH = ΔU + Δn_g RT. For H₂(g) + I₂(g) ⇌ 2HI(g), the change in gaseous moles Δn_g = 2 - (1 + 1) = 0. Thus, ΔH = ΔU."
      }
    ],
    "Numerical": [
      {
        "id": "c_n_1", "subject": "Chemistry", "topic": "Acids & Bases", "difficulty": "Easy",
        "text": "Calculate the pH of a $0.05\\text{ M }\\text{H}_2\\text{SO}_4$ aqueous solution at $298\\text{ K}$, assuming complete dissociation of the acid.",
        "correct_value": 1,
        "solution": "$\\text{H}_2\\text{SO}_4$ is a strong dibasic acid, which dissociates fully in dilute solutions as:\n$\\text{H}_2\\text{SO}_4 \\rightarrow 2\\text{H}^+ + \\text{SO}_4^{2-}$.\nTherefore, the concentration of hydrogen ions is: $[\\text{H}^+] = 2 \\times 0.05\\text{ M} = 0.1\\text{ M} = 10^{-1}\\text{ M}$.\n$\\text{pH} = -\\log[\\text{H}^+] = -\\log(10^{-1}) = 1$."
      },
      {
        "id": "c_n_2", "subject": "Chemistry", "topic": "Chemical Kinetics", "difficulty": "Medium",
        "text": "A first-order chemical reaction has a rate constant of $0.0693\\text{ min}^{-1}$. Calculate the total time (in minutes) required for the reactant concentration to decrease to $12.5\\%$ of its initial value.",
        "correct_value": 30,
        "solution": "First, calculate the half-life ($t_{1/2}$) of the reaction:\n$t_{1/2} = \\frac{\\ln 2}{k} = \\frac{0.693}{0.0693\\text{ min}^{-1}} = 10\\text{ minutes}$.\nA decrease to $12.5\\%$ of the initial concentration corresponds to: $100\\% \\rightarrow 50\\% \\rightarrow 25\\% \\rightarrow 12.5\\%$, which is exactly three half-lives ($3 \\times t_{1/2}$).\nTotal time = $3 \\times 10\\text{ minutes} = 30\\text{ minutes}$."
      },
      {
        "id": "c_n_3", "subject": "Chemistry", "topic": "Chemical Bonding", "difficulty": "Medium",
        "text": "Determine the total number of lone pairs of electrons on the central Xenon (Xe) atom in a $\\text{XeF}_2$ molecule.",
        "correct_value": 3,
        "solution": "Xenon is a noble gas with 8 valence electrons. In $\\text{XeF}_2$, it shares 2 electrons to form 2 single covalent bonds with two fluorine atoms.\nRemaining valence electrons = $8 - 2 = 6$ electrons.\nThese 6 electrons form $\\frac{6}{2} = 3$ lone pairs on the central Xenon atom."
      },
      {
        "id": "c_n_4", "subject": "Chemistry", "topic": "Coordination Compounds", "difficulty": "Medium",
        "text": "What is the coordination number of the cobalt central metal ion in the complex $[\\text{Co(en)}_2(\\text{C}_2\\text{O}_4)]\\text{Cl}$? (Note: 'en' stands for ethylenediamine, and 'C₂O₄' represents the oxalate ion)",
        "correct_value": 6,
        "solution": "Ethylenediamine ('en') is a neutral bidentate ligand, so two 'en' molecules form $2 \\times 2 = 4$ coordinate bonds.\nThe oxalate ion ($C_2O_4^{2-}$) is also a bidentate ligand, forming 2 coordinate bonds.\nTotal coordinate bonds around the cobalt ion = $4 + 2 = 6$. Thus, the coordination number is 6."
      },
      {
        "id": "c_n_5", "subject": "Chemistry", "topic": "Thermodynamics", "difficulty": "Hard",
        "text": "For a chemical reaction, the enthalpy change is $\\Delta H = 35.5\\text{ kJ/mol}$ and the entropy change is $\\Delta S = 83.6\\text{ J/mol}\\cdot\\text{K}$. Calculate the temperature (in Kelvin) above which the reaction becomes thermodynamically spontaneous. (Round off your answer to the nearest integer)",
        "correct_value": 425,
        "solution": "A reaction is spontaneous when Gibbs free energy change $\\Delta G = \\Delta H - T\\Delta S < 0 \\implies T > \\frac{\\Delta H}{\\Delta S}$.\nGiven $\\Delta H = 35.5 \\times 10^3\\text{ J/mol}$ and $\\Delta S = 83.6\\text{ J/mol}\\cdot\\text{K}$:\n$T > \\frac{35500}{83.6} \\approx 424.64\\text{ K}$.\nRounding to the nearest integer gives 425 K."
      },
      {
        "id": "c_n_6", "subject": "Chemistry", "topic": "Equilibrium", "difficulty": "Hard",
        "text": "The solubility product constant ($K_{\\text{sp}}$) of a sparingly soluble salt $\\text{MX}_2$ in pure water is $4.0 \\times 10^{-12}$ at $298\\text{ K}$. Find the solubility of this salt (in units of $10^{-4}\\text{ mol/L}$).",
        "correct_value": 1,
        "solution": "The salt dissolves as: $\\text{MX}_2(s) \\rightleftharpoons \\text{M}^{2+}(aq) + 2\\text{X}^-(aq)$.\nLet solubility be $s\\text{ mol/L}$. Then $[\\text{M}^{2+}] = s$ and $[\\text{X}^-] = 2s$.\n$K_{\\text{sp}} = [\\text{M}^{2+}][\\text{X}^-]^2 = s \\times (2s)^2 = 4s^3$.\nGiven $K_{\\text{sp}} = 4.0 \\times 10^{-12}$:\n$4s^3 = 4.0 \\times 10^{-12} \\implies s^3 = 10^{-12} \\implies s = 10^{-4}\\text{ mol/L}$.\nThus, solubility is $1 \\times 10^{-4}\\text{ mol/L}$, and the numerical answer is 1."
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
      },
      {
        "id": "m_e_5", "subject": "Mathematics", "topic": "Calculus", "difficulty": "Easy",
        "text": "Find the derivative of cos(3x) with respect to x.",
        "options": ["-3 sin(3x)", "3 sin(3x)", "-sin(3x)", "cos(3x)"],
        "correct_index": 0,
        "solution": "Using the chain rule: d/dx [cos(3x)] = -sin(3x) * d/dx[3x] = -3 sin(3x)."
      },
      {
        "id": "m_e_6", "subject": "Mathematics", "topic": "Coordinate Geometry", "difficulty": "Easy",
        "text": "Find the distance between the two parallel straight lines: 3x - 4y + 5 = 0 and 3x - 4y - 5 = 0.",
        "options": ["2", "10", "1", "5"],
        "correct_index": 0,
        "solution": "Distance d = |c1 - c2| / √(a² + b²) = |5 - (-5)| / √(3² + (-4)²) = 10 / 5 = 2."
      },
      {
        "id": "m_e_7", "subject": "Mathematics", "topic": "Limits", "difficulty": "Easy",
        "text": "Evaluate the limit: lim (x ➜ 2) [(x² - 4) / (x - 2)].",
        "options": ["4", "2", "0", "undefined"],
        "correct_index": 0,
        "solution": "lim (x² - 4)/(x - 2) = lim (x-2)(x+2)/(x-2) = lim (x+2) as x ➜ 2 = 2 + 2 = 4."
      },
      {
        "id": "m_e_8", "subject": "Mathematics", "topic": "Integrals", "difficulty": "Easy",
        "text": "Evaluate the indefinite integral: ∫ e^(2x) dx.",
        "options": ["0.5 e^(2x) + C", "e^(2x) + C", "2 e^(2x) + C", "0.5 e^x + C"],
        "correct_index": 0,
        "solution": "Using substitution u = 2x, du = 2dx, the integral is 0.5 * ∫ e^u du = 0.5 e^(2x) + C."
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
        "solution": "The number of terms in a multinomial expansion (x1 + x2 + ... + xr)^n is given by (n + r - 1)C(r - 1). Here n=10, r=3. Thus 12C2 = 66."
      },
      {
        "id": "m_m_5", "subject": "Mathematics", "topic": "Quadratic Equations", "difficulty": "Medium",
        "text": "If the discriminant of a quadratic equation ax² + bx + c = 0 (a ≠ 0) is zero, then the roots of the equation are:",
        "options": ["Real and equal", "Real and unequal", "Complex conjugates", "Rational"],
        "correct_index": 0,
        "solution": "When discriminant D = b² - 4ac = 0, the roots are given by -b / 2a, which represents two identical, real values."
      },
      {
        "id": "m_m_6", "subject": "Mathematics", "topic": "Coordinate Geometry", "difficulty": "Medium",
        "text": "Find the eccentricity of the ellipse given by the equation: x²/16 + y²/9 = 1.",
        "options": ["√7 / 4", "7 / 16", "3 / 4", "5 / 4"],
        "correct_index": 0,
        "solution": "For ellipse: a² = 16, b² = 9. Eccentricity e = √(1 - b²/a²) = √(1 - 9/16) = √(7/16) = √7 / 4."
      },
      {
        "id": "m_m_7", "subject": "Mathematics", "topic": "Limits", "difficulty": "Medium",
        "text": "Evaluate the limit: lim (x ➜ 0) [(tan x - sin x) / x³].",
        "options": ["1/2", "1", "0", "2"],
        "correct_index": 0,
        "solution": "lim (tan x - sin x)/x³ = lim sin x * (1 - cos x) / (x³ * cos x) = lim (sin x / x) * (2 sin²(x/2) / x²) * (1/cos x) = 1 * 2 * (1/4) * 1 = 1/2."
      },
      {
        "id": "m_m_8", "subject": "Mathematics", "topic": "Binomial Theorem", "difficulty": "Medium",
        "text": "What is the sum of all binomial coefficients in the expansion of (x + y)⁵?",
        "options": ["32", "16", "64", "10"],
        "correct_index": 0,
        "solution": "The sum of coefficients is found by setting x = 1 and y = 1. (1 + 1)⁵ = 2⁵ = 32."
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
        "solution": "Points of intersection: x = 0, 1. Area = ∫ (0 to 1) [√x - x²] dx = [ (2/3)x^(1.5) - x³/3 ] (0 to 1) = 2/3 - 1/3 = 1/3."
      },
      {
        "id": "m_h_3", "subject": "Mathematics", "topic": "Limits", "difficulty": "Hard",
        "text": "Evaluate the limit: lim (x ➜ ∞) [(1 + 2/x)ˣ].",
        "options": ["e", "e²", "1", "∞"],
        "correct_index": 1,
        "solution": "Limit is of the form 1^∞. Limit is given by e^L where L = lim (x ➜ ∞) [x * ((1 + 2/x) - 1)] = lim [x * 2/x] = 2. Thus limit = e²."
      },
      {
        "id": "m_h_4", "subject": "Mathematics", "topic": "Infinite Series", "difficulty": "Hard",
        "text": "Find the sum of the infinite series: S = 1/2 + 2/4 + 3/8 + 4/16 + ...",
        "options": ["1.5", "2", "3", "4"],
        "correct_index": 1,
        "solution": "This is an Arithmetico-Geometric Progression (AGP). Multiplying by 1/2 and subtracting yields S = 2."
      },
      {
        "id": "m_h_5", "subject": "Mathematics", "topic": "Integrals", "difficulty": "Hard",
        "text": "Evaluate the definite integral: ∫ (0 to 1) [arctan(x)] dx.",
        "options": ["π/4 - 0.5 ln 2", "π/4 + 0.5 ln 2", "π/2 - ln 2", "π/2 + ln 2"],
        "correct_index": 0,
        "solution": "Using integration by parts: ∫ 1 * arctan(x) dx = x * arctan(x) - 0.5 * ln(1 + x²). Evaluated from 0 to 1: 1 * arctan(1) - 0.5 * ln(2) = π/4 - 0.5 ln 2."
      },
      {
        "id": "m_h_6", "subject": "Mathematics", "topic": "Coordinate Geometry", "difficulty": "Hard",
        "text": "Find the equation of the common tangent to the parabolas y² = 4x and x² = 4y.",
        "options": ["x + y + 1 = 0", "x - y + 1 = 0", "x + y - 1 = 0", "x - y - 1 = 0"],
        "correct_index": 0,
        "solution": "Tangent to y² = 4x is y = mx + 1/m. Since it is also tangent to x² = 4y => x² = 4(mx + 1/m) => x² - 4mx - 4/m = 0. For tangency, Discriminant D = 0 => 16m² - 4(1)(-4/m) = 0 => 16m² + 16/m = 0 => m³ = -1 => m = -1. Tangent is y = -x - 1 => x + y + 1 = 0."
      },
      {
        "id": "m_h_7", "subject": "Mathematics", "topic": "Infinite Series", "difficulty": "Hard",
        "text": "Find the sum of the infinite series: S = 1 + 1/2! + 1/4! + 1/6! + ...",
        "options": ["(e + e⁻¹) / 2", "(e - e⁻¹) / 2", "e", "e²"],
        "correct_index": 0,
        "solution": "Using Taylor expansions: e^x = 1 + x/1! + x²/2! + ..., and e^(-x) = 1 - x/1! + x²/2! - ... Adding them yields e^x + e^(-x) = 2 * (1 + x²/2! + x⁴/4! + ...). For x = 1, we get S = (e + e⁻¹) / 2."
      },
      {
        "id": "m_h_8", "subject": "Mathematics", "topic": "Limits", "difficulty": "Hard",
        "text": "Evaluate the limit: lim (x ➜ 0) [(1 + sin x)^(1/x)].",
        "options": ["e", "1", "e²", "0"],
        "correct_index": 0,
        "solution": "Limit is of 1^∞ form. L = exp(lim x➜0 [1/x * (1 + sin x - 1)]) = exp(lim x➜0 [sin x / x]) = e¹ = e."
      }
    ],
    "Numerical": [
      {
        "id": "m_n_1", "subject": "Mathematics", "topic": "Integrals", "difficulty": "Medium",
        "text": "Evaluate the definite integral: $\\int_0^2 (3x^2 - 4x + 5) dx$.",
        "correct_value": 10,
        "solution": "Compute the antiderivative: $\\int (3x^2 - 4x + 5) dx = x^3 - 2x^2 + 5x + C$.\nEvaluate from 0 to 2:\n$\\left[ x^3 - 2x^2 + 5x \\right]_0^2 = (2^3 - 2(2)^2 + 5(2)) - 0 = (8 - 8 + 10) = 10$."
      },
      {
        "id": "m_n_2", "subject": "Mathematics", "topic": "Limits", "difficulty": "Medium",
        "text": "Evaluate the limit: $\\lim_{x \\to 0} \\frac{1 - \\cos(6x)}{x \\sin(3x)}$.",
        "correct_value": 6,
        "solution": "Using trigonometric double-angle formula: $1 - \\cos(6x) = 2 \\sin^2(3x)$.\nThe expression becomes: $\\lim_{x \\to 0} \\frac{2 \\sin^2(3x)}{x \\sin(3x)} = \\lim_{x \\to 0} \\frac{2 \\sin(3x)}{x}$.\nMultiply numerator and denominator by 3:\n$\\lim_{x \\to 0} 2 \\times 3 \\times \\frac{\\sin(3x)}{3x} = 6 \\times \\lim_{3x \\to 0} \\frac{\\sin(3x)}{3x} = 6 \\times 1 = 6$."
      },
      {
        "id": "m_n_3", "subject": "Mathematics", "topic": "Coordinate Geometry", "difficulty": "Hard",
        "text": "Find the perpendicular distance between the directrix of the parabola $y^2 = 12x$ and the focus of the parabola $x^2 = -8y$.",
        "correct_value": 3,
        "solution": "For parabola $y^2 = 12x$, the standard form is $y^2 = 4ax \\implies a = 3$. The equation of its directrix is $x = -a \\implies x = -3$.\nFor parabola $x^2 = -8y$, the standard form is $x^2 = -4ay \\implies a = 2$. Its focus is located at $(0, -a) \\implies (0, -2)$.\nThe perpendicular distance from focus $(0, -2)$ to directrix line $x + 3 = 0$ is: $d = |x_0 + 3| = |0 + 3| = 3$."
      },
      {
        "id": "m_n_4", "subject": "Mathematics", "topic": "Calculus", "difficulty": "Medium",
        "text": "Let $f(x) = x^3 - 3x^2 - 9x + 5$. Find the value of $x$ (where $x > 0$) at which the function $f(x)$ achieves a local minimum.",
        "correct_value": 3,
        "solution": "Find critical points using the first derivative: $f'(x) = 3x^2 - 6x - 9 = 3(x^2 - 2x - 3) = 3(x - 3)(x + 1)$.\nSetting $f'(x) = 0$ gives $x = 3$ and $x = -1$.\nUsing the second derivative test: $f''(x) = 6x - 6$.\nAt $x = 3$, $f''(3) = 6(3) - 6 = 12 > 0$, indicating a local minimum.\nSince the question asks for $x > 0$, the answer is $3$."
      },
      {
        "id": "m_n_5", "subject": "Mathematics", "topic": "Quadratic Equations", "difficulty": "Easy",
        "text": "If $\\alpha$ and $\\beta$ are the roots of the quadratic equation $x^2 - 5x + 6 = 0$, calculate the value of $\\alpha^3 + \\beta^3$.",
        "correct_value": 35,
        "solution": "From coefficients of the quadratic equation: $\\alpha + \\beta = 5$ (sum of roots) and $\\alpha\\beta = 6$ (product of roots).\nUsing the algebraic identity: $\\alpha^3 + \\beta^3 = (\\alpha + \\beta)^3 - 3\\alpha\\beta(\\alpha + \\beta)$.\nSubstituting the values: $\\alpha^3 + \\beta^3 = (5)^3 - 3(6)(5) = 125 - 90 = 35$."
      },
      {
        "id": "m_n_6", "subject": "Mathematics", "topic": "Binomial Theorem", "difficulty": "Medium",
        "text": "Find the value of the middle term in the binomial expansion of $(x + 2)^6$ evaluated at $x = 1$.",
        "correct_value": 160,
        "solution": "The binomial expansion of $(x + 2)^6$ contains $n + 1 = 7$ terms. The middle term is the 4th term ($T_4$).\nUsing the general term formula: $T_{r+1} = \\binom{n}{r} x^{n-r} a^r$.\nFor $n = 6$, $r = 3$, $a = 2$: $T_4 = \\binom{6}{3} x^3 2^3 = 20 \\times 8 \\times x^3 = 160x^3$.\nSubstituting $x = 1$ gives: $160(1)^3 = 160$."
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
};

export function getLocalFallbackPool(subject) {
  const normSubject = subject?.toLowerCase() === "maths" || subject?.toLowerCase() === "mathematics" ? "Mathematics" :
                      subject?.toLowerCase() === "physics" ? "Physics" :
                      subject?.toLowerCase() === "chemistry" ? "Chemistry" :
                      subject?.toLowerCase() === "biology" ? "Biology" : "Physics";
  
  return LOCAL_QUESTION_BANK[normSubject] || LOCAL_QUESTION_BANK["Physics"];
}

export function getLocalCustomFallbackPool(subject, topicsStr) {
  const normSubject = subject?.toLowerCase() === "maths" || subject?.toLowerCase() === "mathematics" ? "Mathematics" :
                      subject?.toLowerCase() === "physics" ? "Physics" :
                      subject?.toLowerCase() === "chemistry" ? "Chemistry" :
                      subject?.toLowerCase() === "biology" ? "Biology" : "Physics";

  const pool = LOCAL_QUESTION_BANK[normSubject] || LOCAL_QUESTION_BANK["Physics"];
  const topicFilters = topicsStr 
    ? topicsStr.split(/[,;]/).map(t => t.trim().toLowerCase()).filter(Boolean) 
    : [];

  const clientPool = {};
  for (const diff of ["Easy", "Medium", "Hard"]) {
    const qList = pool[diff] || [];
    let filtered = [];
    
    if (topicFilters.length > 0) {
      filtered = qList.filter(q => 
        topicFilters.some(tf => q.topic.toLowerCase().includes(tf) || tf.includes(q.topic.toLowerCase()))
      );
      
      if (filtered.length === 0) {
        // Fallback: search by individual keywords
        const keywords = topicFilters.flatMap(t => t.split(/\s+/)).filter(w => w.length > 2);
        filtered = qList.filter(q => 
          keywords.some(w => q.topic.toLowerCase().includes(w) || w.includes(q.topic.toLowerCase()))
        );
      }
    }

    clientPool[diff] = (filtered.length > 0 ? filtered : qList).map(q => ({
      ...q,
      solution: q.solution || `Automated step-by-step verification on topic ${q.topic}.`
    }));
  }
  
  return clientPool;
}

export function getLocalCompetitiveTest(subject, difficulty) {
  const normSubject = subject?.toLowerCase() === "maths" || subject?.toLowerCase() === "mathematics" ? "Mathematics" :
                      subject?.toLowerCase() === "physics" ? "Physics" :
                      subject?.toLowerCase() === "chemistry" ? "Chemistry" : "Physics";

  const pool = LOCAL_QUESTION_BANK[normSubject] || LOCAL_QUESTION_BANK["Physics"];
  
  // MCQ selection - We need exactly 20 MCQs
  let easyCount = 5, mediumCount = 10, hardCount = 5;
  if (difficulty === "Easy") {
    easyCount = 12; mediumCount = 6; hardCount = 2;
  } else if (difficulty === "Hard") {
    easyCount = 2; mediumCount = 6; hardCount = 12;
  }
  
  const getRandomSubset = (arr, n) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  };
  
  const easyPool = pool["Easy"] || [];
  const mediumPool = pool["Medium"] || [];
  const hardPool = pool["Hard"] || [];
  
  let chosenEasy = getRandomSubset(easyPool, easyCount);
  let chosenMedium = getRandomSubset(mediumPool, mediumCount);
  let chosenHard = getRandomSubset(hardPool, hardCount);
  
  let mcqList = [...chosenEasy, ...chosenMedium, ...chosenHard];
  
  // Fill up to 20 MCQs
  if (mcqList.length < 20) {
    const allMcqs = [...easyPool, ...mediumPool, ...hardPool];
    const presentIds = new Set(mcqList.map(q => q.id));
    for (const q of allMcqs) {
      if (mcqList.length >= 20) break;
      if (!presentIds.has(q.id)) {
        mcqList.push(q);
      }
    }
  }
  
  while (mcqList.length < 20 && mcqList.length > 0) {
    mcqList.push({ ...mcqList[Math.floor(Math.random() * mcqList.length)], id: `dup_${Math.random()}` });
  }

  mcqList = mcqList.sort(() => 0.5 - Math.random());
  
  // Select 5 numerical questions from the "Numerical" pool
  const numericalPool = pool["Numerical"] || [];
  let chosenNumerical = getRandomSubset(numericalPool, 5);
  
  while (chosenNumerical.length < 5 && numericalPool.length > 0) {
    chosenNumerical.push({ ...numericalPool[Math.floor(Math.random() * numericalPool.length)], id: `dup_num_${Math.random()}` });
  }

  // Map types and numbers
  const formattedMcqs = mcqList.map((q, idx) => ({ ...q, type: "mcq", qNo: idx + 1 }));
  const formattedNumericals = chosenNumerical.map((q, idx) => ({ ...q, type: "numerical", qNo: 20 + idx + 1 }));
  
  return [...formattedMcqs, ...formattedNumericals];
}

export function getLocalFullJeeTest(difficulty) {
  const physicsSection = getLocalCompetitiveTest("Physics", difficulty).map(q => ({ ...q, section: "Physics" }));
  const chemistrySection = getLocalCompetitiveTest("Chemistry", difficulty).map(q => ({ ...q, section: "Chemistry" }));
  const mathsSection = getLocalCompetitiveTest("Mathematics", difficulty).map(q => ({ ...q, section: "Mathematics" }));
  
  return [...physicsSection, ...chemistrySection, ...mathsSection];
}
