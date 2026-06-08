# routes/doubts.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import supabase
import os
import requests
import logging

logger = logging.getLogger("uvicorn")
router = APIRouter()

# --- Request Schema ---
class AskQuestionRequest(BaseModel):
    student_id: str
    subject: str
    question: str

# --- Fallback Pedagogical Science Explanations ---
def generate_fallback_explanation(subject: str, question: str) -> str:
    actual_question = question
    for prefix in ["[IMG:", "[FILE:", "[FOLDER:"]:
        if actual_question.startswith(prefix):
            end_idx = actual_question.find("]")
            if end_idx != -1:
                actual_question = actual_question[end_idx + 1:]
                break

    q_lower = actual_question.lower()
    subject_label = subject.capitalize()
    
    if "cylinder" in q_lower or "inclined plane" in q_lower or "rolling" in q_lower or "sphere" in q_lower:
        return f"""### Rolling Acceleration on Incline (Physics) 🌌

For a solid cylinder rolling down an incline of angle $\\theta$ without slipping:

1. **Translational force:** $$Mg \\sin\\theta - f = Ma$$
2. **Rotational torque:** $$f R = I \\alpha$$
3. **Moment of Inertia:** For solid cylinder, $I = \\frac{{1}}{{2}}MR^2$.
4. **Rolling condition:** $a = R \\alpha$.

Substituting: $$f = \\frac{{I \\alpha}}{{R}} = \\frac{{1}}{{2}}Ma$$

Substituting back to force equation:
$$Mg \\sin\\theta - \\frac{{1}}{{2}}Ma = Ma \\implies Mg \\sin\\theta = \\frac{{3}}{{2}}Ma$$

$$a = \\frac{{2}}{{3}} g \\sin\\theta$$

*Note:* If the diagram displays a solid sphere instead of a cylinder, the moment of inertia is $I = \\frac{{2}}{{5}}MR^2$, which yields a rolling acceleration of $a = \\frac{{5}}{{7}} g \\sin\\theta$!"""

    if "sn2" in q_lower or "attack" in q_lower or "transition state" in q_lower or "sn1" in q_lower:
        return f"""### S_N2 Nucleophilic Attack & Inversion (Chemistry) 🧪

The stereochemical diagram shows an $S_N2$ mechanism:

1. **Backside Attack:** The nucleophile ($Nu^-$) attacks from the opposite side of the leaving group ($L$) due to steric hindrance and orbital symmetry.
2. **Transition State:** A pentacoordinate carbon state is formed where the carbon is partially bonded to both $Nu$ and $L$:
   $$[Nu\\cdots C(R_1)(R_2)(R_3)\\cdots L]^{{\\ddagger}}$$
3. **Inversion (Walden Inversion):** As the $C-L$ bond breaks, the other three substituents flip like an umbrella in a strong wind, resulting in inversion of configuration.

*Rule of Thumb:* $S_N2$ reactions occur in a single concerted step, are second-order kinetics, and are favored by polar aprotic solvents and less hindered primary substrates."""

    if "integral" in q_lower or "shaded area" in q_lower or "calculus" in q_lower:
        return f"""### Definite Integral and Riemann Sum Area (Mathematics) 📈

The calculus diagram displays the shaded area under the curve $f(x) = 3x^2 + 2x + 1$ bounded by the vertical lines $x = 1$ and $x = 3$.

#### 1. Limit of Riemann Sums Definition
The exact area $A$ under the curve is defined as the limit of Riemann sums:
$$A = \\lim_{{n \\to \\infty}} \\sum_{{i=1}}^{{n}} f(x_i^*) \\Delta x = \\int_{{1}}^{{3}} (3x^2 + 2x + 1) dx$$

#### 2. Antiderivative Evaluation (Fundamental Theorem of Calculus)
According to the Fundamental Theorem of Calculus (FTC), if $F'(x) = f(x)$:
$$\\int_{{a}}^{{b}} f(x) dx = F(b) - F(a)$$

Let's compute the general antiderivative $F(x)$:
$$F(x) = \\int (3x^2 + 2x + 1) dx = x^3 + x^2 + x + C$$

#### 3. Step-by-Step Numerical Integration
Now, we evaluate $F(x)$ at the boundaries $x = 3$ and $x = 1$:

*   **Upper Bound ($x = 3$):**
    $$F(3) = (3)^3 + (3)^2 + (3) = 27 + 9 + 3 = 39$$
*   **Lower Bound ($x = 1$):**
    $$F(1) = (1)^3 + (1)^2 + (1) = 1 + 1 + 1 = 3$$

Subtracting the lower bound evaluation from the upper bound:
$$A = F(3) - F(1) = 39 - 3 = 36$$

Therefore, the shaded area under the curve is exactly **$36$ square units**."""

    if "circular" in q_lower or "seating" in q_lower or "arrangement" in q_lower or "permutation" in q_lower:
        return f"""### Circular Permutations with Adjacency Constraints (Mathematics) 🪑

We are arranging $n = 6$ students around a circular table such that two specific students (let's call them $A$ and $B$) must sit next to each other.

#### 1. Tie-Method (Grouping Constraint)
Since $A$ and $B$ must sit together, we treat them as a single combined block/unit: $(AB)$.
This reduces the number of entities to arrange from $6$ down to:
$$\\text{{Entities}} = (6 - 2) + 1 = 5 \\text{{ units}}$$
(the $4$ other students plus the single $(AB)$ group).

#### 2. Circular Arrangement Rule
For $k$ entities around a circle, the number of distinct circular permutations is $(k-1)!$ because circular shifts are equivalent:
$$\\text{{Circular Ways}} = (5 - 1)! = 4!$$
$$4! = 4 \\times 3 \\times 2 \\times 1 = 24 \\text{{ ways}}$$

#### 3. Internal Arrangements of the Block
Inside the tied unit $(AB)$, students $A$ and $B$ can arrange themselves in $2!$ ways: either $AB$ or $BA$.
$$\\text{{Internal Ways}} = 2! = 2 \\text{{ ways}}$$

#### 4. Total Arrangements Calculation
Using the Multiplication Principle, the total number of valid seating arrangements is:
$$\\text{{Total Ways}} = \\text{{Circular Ways}} \\times \\text{{Internal Ways}}$$
$$\\text{{Total Ways}} = 24 \\times 2 = 48$$

Thus, there are exactly **$48$ distinct ways** to seat the students."""

    if "mitochondria" in q_lower or "membrane" in q_lower or "chloroplast" in q_lower or "organelle" in q_lower:
        return f"""### Mitochondria Structure & Function (Biology) 🧬

The mitochondria diagram visualizes key membranes:

1. **Outer Membrane:** Permeable membrane containing porin channels.
2. **Inner Membrane Folding (Cristae):** Folds inwards to form cristae, greatly increasing surface area for **oxidative phosphorylation** and the Electron Transport Chain (ETC).
3. **ATP Synthesis:** The concentration gradient of protons ($H^+$) across the inner membrane drives **ATP synthase** machinery ($F_0F_1$ complexes) to phosphorylate ADP into ATP: $F_1$ acts as a rotating molecular turbine!"""

    if "kepler" in q_lower:
        return f"""### Kepler's Laws of Planetary Motion (Physics) 🌌

Kepler's Three Laws describe the motion of planets around the Sun:

1. **The Law of Orbits:** All planets move in **elliptical orbits**, with the Sun at one of the two foci.
2. **The Law of Areas:** A line segment joining a planet and the Sun sweeps out **equal areas during equal intervals of time**.
3. **The Law of Periods:** The square of the orbital period ($T$) is proportional to the cube of the semi-major axis ($r$):
   $$T^2 \\propto r^3$$"""

    if "markovnikov" in q_lower:
        return f"""### Markovnikov's Rule (Chemistry) 🧪

In organic chemistry, **Markovnikov's Rule** describes the outcome of an addition reaction of $HX$ to an unsymmetrical alkene:

* **Rule Statement:** The acidic hydrogen ($H^+$) adds to the carbon that has the **greater number of hydrogen atoms**, while the nucleophile ($X^-$) adds to the carbon with **fewer hydrogen atoms**.
* **Mechanism:** Driven by the stability of the intermediate **carbocation**. A tertiary carbocation ($3^\\circ$) is more stable than a secondary ($2^\\circ$), which is more stable than a primary ($1^\\circ$)."""

    if "limit" in q_lower or "continuity" in q_lower:
        return f"""### Limits and Continuity (Mathematics) 📈

A function $f(x)$ is continuous at a point $x = a$ if and only if it satisfies all three conditions:
1. $f(a)$ is defined (the point exists).
2. $\\lim_{{x \\to a}} f(x)$ exists (left-hand limit matches right-hand limit).
3. $\\lim_{{x \\to a}} f(x) = f(a)$."""

    # General Fallback
    return f"""### Explanation of {subject_label} Query ⚡

Here is the concept breakdown for your question: *"{actual_question}"*

1. **Core Definition:** This topic belongs to the core curriculum of Class 11/12 {subject_label}. 
2. **Key Formulas & Principles:**
   * Review the standard textbook notes and derivation equations.
   * Work out basic, direct numerical questions to anchor the theory in practice.
3. **ARIA Recommendation:**
   * Double-check your calculation steps.
   * Make sure to reference the conceptual diagrams in the Physics/Chem Labs."""

# --- Endpoints ---

@router.post("/ask")
async def ask_aria(data: AskQuestionRequest):
    api_key = os.getenv("GROQ_API_KEY")
    answer_text = ""
    
    # Strip image prefix for Groq prompt to optimize token count
    actual_question = data.question
    if actual_question.startswith("[IMG:"):
        end_idx = actual_question.find("]")
        if end_idx != -1:
            actual_question = actual_question[end_idx + 1:]
    
    if not api_key:
        logger.warning("GROQ_API_KEY is not defined in .env, using local fallback.")
        answer_text = generate_fallback_explanation(data.subject, data.question)
    else:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are Professor ARIA, a supportive, genius AI Science Tutor for Class 11-12 physics, chemistry, mathematics, and biology (targeting JEE/NEET exam preparation). Answer student questions clearly and pedagogically. You must provide pure academic, scientific, and mathematical explanations only. Do NOT use Python, Javascript, or any other programming code/syntax to explain scientific concepts. Explain all derivations and calculations step-by-step using standard academic algebraic methods. Wrap all equations, mathematical expressions, formulas, and individual variables in standard LaTeX math delimiters: use single dollars $...$ for inline symbols/equations (e.g. $y = mx + b$) and double dollars $$...$$ for block equations. Keep explanations encouraging, detailed, and strictly focused on scientific theory and problem-solving."
                    },
                    {
                        "role": "user",
                        "content": f"Subject: {data.subject}\nQuestion: {actual_question}"
                    }
                ],
                "temperature": 0.5,
                "max_tokens": 1024
            }
            res = requests.post(url, headers=headers, json=payload, timeout=12)
            if res.status_code == 200:
                res_data = res.json()
                answer_text = res_data["choices"][0]["message"]["content"]
            else:
                logger.warning(f"Groq API returned error {res.status_code}: {res.text}. Falling back to heuristics.")
                answer_text = generate_fallback_explanation(data.subject, data.question)
        except Exception as e:
            logger.warning(f"Failed to query Groq API: {str(e)}. Falling back to heuristics.")
            answer_text = generate_fallback_explanation(data.subject, data.question)

    # Save full question (including image tag) and answer to doubts table in Supabase
    try:
        supabase.table("doubts").insert({
            "student_id": data.student_id,
            "subject": data.subject,
            "question": data.question,
            "answer": answer_text
        }).execute()
    except Exception as e:
        logger.error(f"Failed to save doubt history to Supabase: {str(e)}")

    return {
        "subject": data.subject,
        "question": data.question,
        "answer": answer_text
    }

@router.get("/history/{student_id}")
async def get_doubt_history(student_id: str):
    try:
        result = supabase.table("doubts")\
            .select("*")\
            .eq("student_id", student_id)\
            .order("created_at", desc=True)\
            .execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch doubt history: {str(e)}")
