# routes/courses.py
from fastapi import APIRouter, HTTPException
from database import supabase
from schemas.models import CourseCreate
from pydantic import BaseModel
import os
import requests
import re
import logging
import string
from pathlib import Path

logger = logging.getLogger("uvicorn")
router = APIRouter()

class DiagramRequest(BaseModel):
    topic: str
    subject: str
    force_refresh: bool = False

def generate_fallback_svg(subject: str, topic: str) -> str:
    subject_lower = subject.lower()
    topic_lower = topic.lower()
    
    # Maths - Permutations & Combinations / Probability / Arrangements / Counting
    if "permutation" in topic_lower or "combination" in topic_lower or "arrangement" in topic_lower or "probability" in topic_lower or "counting" in topic_lower:
        return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="100%" height="100%">
  <defs>
    <linearGradient id="chairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#311042" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="600" height="350" fill="#030014" rx="16" />
  
  <text x="25" y="35" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="15">Visualizing Permutations (Chairs Arrangement)</text>
  <text x="25" y="55" fill="#34d399" font-family="sans-serif" font-size="11">Arranging 3 people on 3 distinct chairs out of 5 people {A,B,C,D,E}</text>

  <g>
    <text x="25" y="100" fill="#94a3b8" font-family="sans-serif" font-weight="bold" font-size="11">PEOPLE POOL:</text>
    <circle cx="110" cy="95" r="14" fill="#06b6d4" opacity="0.8" />
    <text x="110" y="99" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold">A</text>
    <circle cx="145" cy="95" r="14" fill="#a855f7" opacity="0.8" />
    <text x="145" y="99" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold">B</text>
    <circle cx="180" cy="95" r="14" fill="#34d399" opacity="0.8" />
    <text x="180" y="99" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold">C</text>
    <circle cx="215" cy="95" r="14" fill="#f59e0b" opacity="0.8" />
    <text x="215" y="99" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold">D</text>
    <circle cx="250" cy="95" r="14" fill="#ec4899" opacity="0.8" />
    <text x="250" y="99" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold">E</text>
  </g>

  <rect x="35" y="150" width="70" height="70" rx="8" fill="url(#chairGrad)" stroke="#06b6d4" stroke-width="2" filter="url(#glow)" />
  <path d="M 45 200 L 55 165 L 85 165 L 95 200 Z" fill="none" stroke="#06b6d4" stroke-dasharray="2" />
  <text x="70" y="235" text-anchor="middle" fill="#06b6d4" font-family="sans-serif" font-weight="bold" font-size="11">Chair 1</text>
  <text x="70" y="250" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="11">5 choices</text>
  
  <rect x="130" y="150" width="70" height="70" rx="8" fill="url(#chairGrad)" stroke="#a855f7" stroke-width="2" filter="url(#glow)" />
  <path d="M 140 200 L 150 165 L 180 165 L 190 200 Z" fill="none" stroke="#a855f7" stroke-dasharray="2" />
  <text x="165" y="235" text-anchor="middle" fill="#a855f7" font-family="sans-serif" font-weight="bold" font-size="11">Chair 2</text>
  <text x="165" y="250" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="11">4 choices</text>

  <rect x="225" y="150" width="70" height="70" rx="8" fill="url(#chairGrad)" stroke="#34d399" stroke-width="2" filter="url(#glow)" />
  <path d="M 235 200 L 245 165 L 275 165 L 285 200 Z" fill="none" stroke="#34d399" stroke-dasharray="2" />
  <text x="260" y="235" text-anchor="middle" fill="#34d399" font-family="sans-serif" font-weight="bold" font-size="11">Chair 3</text>
  <text x="260" y="250" text-anchor="middle" fill="#94a3b8" font-family="monospace" font-size="11">3 choices</text>

  <text x="117" y="190" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">×</text>
  <text x="212" y="190" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="bold">×</text>
  
  <text x="25" y="300" fill="#ffffff" font-family="sans-serif" font-size="12">Total Ways = <tspan fill="#06b6d4">5</tspan> × <tspan fill="#a855f7">4</tspan> × <tspan fill="#34d399">3</tspan> = <tspan fill="#f59e0b" font-weight="bold" font-size="14">60 ways</tspan></text>
  <text x="25" y="318" fill="#94a3b8" font-family="monospace" font-size="10">Formula: P(5, 3) = 5! / (5-3)! = 120 / 2 = 60</text>

  <foreignObject x="340" y="20" width="240" height="310">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #cbd5e1; font-family: system-ui, sans-serif; font-size: 11px; line-height: 1.4; word-wrap: break-word; word-break: break-word;">
      <h3 style="color: #ffffff; font-size: 13px; font-weight: bold; margin: 0 0 6px 0; border-bottom: 1px solid #334155; padding-bottom: 4px;">Permutations &amp; Combinations</h3>
      <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 10.5px;">
        Visualizing how objects are placed in distinct order-sensitive slots (like chairs).
      </p>
      
      <div style="margin-bottom: 8px;">
        <strong style="color: #06b6d4; font-size: 11px;">1. Permutation (Order Matters)</strong>
        <div style="padding-left: 6px; margin-top: 2px;">
          Arranging r items out of n:
          <div style="color: #38bdf8; font-family: monospace; font-size: 11px; margin: 2px 0;">P(n, r) = n! / (n-r)!</div>
          Every unique sequence is counted as a distinct arrangement (e.g. ABC ≠ BAC).
        </div>
      </div>
      
      <div style="margin-bottom: 8px;">
        <strong style="color: #a855f7; font-size: 11px;">2. Combination (Order Doesn't Matter)</strong>
        <div style="padding-left: 6px; margin-top: 2px;">
          Selecting r items out of n:
          <div style="color: #c084fc; font-family: monospace; font-size: 11px; margin: 2px 0;">C(n, r) = n! / [r!(n-r)!]</div>
          Only the group members matter, not their sequence (e.g. ABC = BAC).
        </div>
      </div>

      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 6px; border-radius: 6px;">
        <strong style="color: #f59e0b; font-size: 10.5px;">🔑 Multiplication Principle:</strong>
        <span style="color: #94a3b8; font-size: 10px; display: block; margin-top: 2px;">
          If an event can occur in m ways, and a second in n ways, then both can occur in m × n ways.
        </span>
      </div>
    </div>
  </foreignObject>
</svg>"""

    # Maths - Coordinate Geometry / Ellipse / Parabola / Hyperbola / Conics
    elif "coordinate" in topic_lower or "ellipse" in topic_lower or "parabola" in topic_lower or "hyperbola" in topic_lower or "conic" in topic_lower or "geometry" in topic_lower or "quadrics" in topic_lower:
        return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="100%" height="100%">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="600" height="350" fill="#030014" rx="16" />
  
  <text x="25" y="35" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="15">Coordinate Geometry: Conic Section (Ellipse)</text>
  <text x="25" y="55" fill="#34d399" font-family="sans-serif" font-size="11">Standard Ellipse: x²/a² + y²/b² = 1 (a &gt; b)</text>

  <line x1="40" y1="180" x2="320" y2="180" stroke="#475569" stroke-width="1.5" />
  <text x="325" y="185" fill="#94a3b8" font-family="monospace" font-size="12">X</text>
  <line x1="180" y1="60" x2="180" y2="300" stroke="#475569" stroke-width="1.5" />
  <text x="175" y="50" fill="#94a3b8" font-family="monospace" font-size="12">Y</text>

  <ellipse cx="180" cy="180" rx="110" ry="70" fill="none" stroke="#34d399" stroke-width="2.5" filter="url(#glow)" />
  
  <circle cx="290" cy="180" r="4" fill="#ffffff" />
  <text x="295" y="195" fill="#94a3b8" font-family="sans-serif" font-size="10">(a, 0)</text>
  
  <circle cx="180" cy="110" r="4" fill="#ffffff" />
  <text x="185" y="105" fill="#94a3b8" font-family="sans-serif" font-size="10">(0, b)</text>

  <circle cx="255" cy="180" r="4" fill="#06b6d4" />
  <text x="250" y="195" fill="#06b6d4" font-family="sans-serif" font-size="10">F₁(ae, 0)</text>

  <circle cx="105" cy="180" r="4" fill="#06b6d4" />
  <text x="85" y="195" fill="#06b6d4" font-family="sans-serif" font-size="10">F₂(-ae, 0)</text>

  <line x1="310" y1="70" x2="310" y2="290" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3" />
  <text x="315" y="85" fill="#f59e0b" font-family="sans-serif" font-size="9">x = a/e (Directrix)</text>

  <circle cx="235" cy="135" r="5" fill="#a855f7" />
  <text x="240" y="130" fill="#a855f7" font-family="sans-serif" font-size="10" font-weight="bold">P(x₁, y₁)</text>
  
  <line x1="235" y1="135" x2="255" y2="180" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
  <line x1="235" y1="135" x2="105" y2="180" stroke="rgba(255,255,255,0.4)" stroke-width="1" />

  <foreignObject x="340" y="20" width="240" height="310">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #cbd5e1; font-family: system-ui, sans-serif; font-size: 11px; line-height: 1.4; word-wrap: break-word; word-break: break-word;">
      <h3 style="color: #ffffff; font-size: 13px; font-weight: bold; margin: 0 0 6px 0; border-bottom: 1px solid #334155; padding-bottom: 4px;">Properties of Ellipse</h3>
      <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 10.5px;">
        An ellipse is the locus of a point whose sum of distances from two fixed points (foci) is constant and equal to the major axis.
      </p>
      
      <div style="margin-bottom: 6px;">
        <strong style="color: #06b6d4; font-size: 11px;">1. Focal Property:</strong>
        <span style="color: #94a3b8; display: block; padding-left: 6px;">
          For any point P, PF₁ + PF₂ = 2a (Constant sum).
        </span>
      </div>

      <div style="margin-bottom: 6px;">
        <strong style="color: #a855f7; font-size: 11px;">2. Eccentricity (e):</strong>
        <span style="color: #94a3b8; display: block; padding-left: 6px;">
          e = √(1 - b²/a²) &lt; 1. Measures the deviation from circular shape.
        </span>
      </div>

      <div style="margin-bottom: 6px;">
        <strong style="color: #f59e0b; font-size: 11px;">3. Directrix &amp; Focus Ratio:</strong>
        <span style="color: #94a3b8; display: block; padding-left: 6px;">
          For any point P on ellipse, Distance(P, Focus) / Distance(P, Directrix) = e (constant).
        </span>
      </div>
    </div>
  </foreignObject>
</svg>"""

    # Maths - Limits / Sequences / Series / Continuity
    elif "limit" in topic_lower or "sequence" in topic_lower or "series" in topic_lower or "continuity" in topic_lower:
        return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="100%" height="100%">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="600" height="350" fill="#030014" rx="16" />
  
  <text x="25" y="35" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="15">Visualizing Limits (ε-δ Definition)</text>
  <text x="25" y="55" fill="#34d399" font-family="sans-serif" font-size="11">As x approaches c, f(x) approaches L within the ε-neighborhood.</text>

  <line x1="60" y1="280" x2="310" y2="280" stroke="#475569" stroke-width="2" />
  <text x="315" y="285" fill="#94a3b8" font-family="monospace" font-size="12">x</text>
  <line x1="80" y1="80" x2="80" y2="300" stroke="#475569" stroke-width="2" />
  <text x="75" y="70" fill="#94a3b8" font-family="monospace" font-size="12">y</text>

  <rect x="80" y="140" width="220" height="60" fill="rgba(6,182,212,0.06)" />
  <line x1="80" y1="170" x2="300" y2="170" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="3" />
  <text x="50" y="174" fill="#06b6d4" font-family="monospace" font-size="11">L</text>
  
  <line x1="80" y1="140" x2="300" y2="140" stroke="rgba(6,182,212,0.3)" stroke-width="1" stroke-dasharray="2" />
  <text x="35" y="144" fill="rgba(6,182,212,0.6)" font-family="monospace" font-size="10">L+ε</text>
  <line x1="80" y1="200" x2="300" y2="200" stroke="rgba(6,182,212,0.3)" stroke-width="1" stroke-dasharray="2" />
  <text x="35" y="204" fill="rgba(6,182,212,0.6)" font-family="monospace" font-size="10">L-ε</text>

  <rect x="160" y="80" width="60" height="200" fill="rgba(168,85,247,0.06)" />
  <line x1="190" y1="80" x2="190" y2="280" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="3" />
  <text x="187" y="295" fill="#a855f7" font-family="monospace" font-size="11">c</text>

  <line x1="160" y1="80" x2="160" y2="280" stroke="rgba(168,85,247,0.3)" stroke-width="1" stroke-dasharray="2" />
  <text x="145" y="295" fill="rgba(168,85,247,0.6)" font-family="monospace" font-size="10">c-δ</text>
  <line x1="220" y1="80" x2="220" y2="280" stroke="rgba(168,85,247,0.3)" stroke-width="1" stroke-dasharray="2" />
  <text x="215" y="295" fill="rgba(168,85,247,0.6)" font-family="monospace" font-size="10">c+δ</text>

  <path d="M 90 250 Q 150 180 190 170 T 290 110" fill="none" stroke="#34d399" stroke-width="3" filter="url(#glow)" />
  
  <circle cx="190" cy="170" r="5" fill="#ffffff" stroke="#34d399" stroke-width="2" />

  <foreignObject x="340" y="20" width="240" height="310">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #cbd5e1; font-family: system-ui, sans-serif; font-size: 11px; line-height: 1.4; word-wrap: break-word; word-break: break-word;">
      <h3 style="color: #ffffff; font-size: 13px; font-weight: bold; margin: 0 0 6px 0; border-bottom: 1px solid #334155; padding-bottom: 4px;">Concept of Limits</h3>
      <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 10.5px;">
        A limit describes the behavior of a function near a specific point, rather than at that point itself.
      </p>
      
      <div style="margin-bottom: 8px;">
        <strong style="color: #06b6d4; font-size: 11px;">🔍 Formal ε-δ Definition:</strong>
        <div style="padding-left: 6px; margin-top: 2px;">
          lim<sub>x→c</sub> f(x) = L means:
          <div style="color: #38bdf8; font-size: 10.5px; margin: 3px 0; font-style: italic;">
            For every ε &gt; 0, there exists a δ &gt; 0 such that if 0 &lt; |x - c| &lt; δ, then |f(x) - L| &lt; ε.
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 8px;">
        <strong style="color: #a855f7; font-size: 11px;">1. Delta (δ) Neighborhood</strong>
        <span style="color: #94a3b8; display: block; padding-left: 6px;">
          The interval along the x-axis: (c-δ, c+δ). Represents how close x must be to c.
        </span>
      </div>

      <div style="margin-bottom: 8px;">
        <strong style="color: #34d399; font-size: 11px;">2. Epsilon (ε) Neighborhood</strong>
        <span style="color: #94a3b8; display: block; padding-left: 6px;">
          The interval along the y-axis: (L-ε, L+ε). Represents the tolerance of f(x) from the limit L.
        </span>
      </div>
    </div>
  </foreignObject>
</svg>"""

    # Maths - Quadratic Equations / Binomial Theorem / Series Expansion
    elif "quadratic" in topic_lower or "binomial" in topic_lower or "expansion" in topic_lower:
        return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="100%" height="100%">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="600" height="350" fill="#030014" rx="16" />
  
  <text x="25" y="35" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="15">Quadratic Equations (Roots &amp; Vertex)</text>
  <text x="25" y="55" fill="#34d399" font-family="sans-serif" font-size="11">y = ax² + bx + c (a &gt; 0, D &gt; 0)</text>

  <line x1="50" y1="200" x2="310" y2="200" stroke="#475569" stroke-width="2" />
  <text x="315" y="205" fill="#94a3b8" font-family="monospace" font-size="12">x</text>
  <line x1="120" y1="60" x2="120" y2="280" stroke="#475569" stroke-width="2" />
  <text x="115" y="50" fill="#94a3b8" font-family="monospace" font-size="12">y</text>

  <path d="M 80 100 Q 180 340 280 100" fill="none" stroke="#34d399" stroke-width="3" filter="url(#glow)" />

  <circle cx="126" cy="200" r="5" fill="#06b6d4" />
  <text x="118" y="218" fill="#06b6d4" font-family="sans-serif" font-weight="bold" font-size="11">α</text>

  <circle cx="234" cy="200" r="5" fill="#06b6d4" />
  <text x="238" y="218" fill="#06b6d4" font-family="sans-serif" font-weight="bold" font-size="11">β</text>

  <line x1="180" y1="70" x2="180" y2="260" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="3" />
  <text x="185" y="85" fill="#a855f7" font-family="sans-serif" font-size="9">x = -b/(2a)</text>

  <circle cx="180" cy="220" r="5" fill="#f59e0b" />
  <text x="190" y="235" fill="#f59e0b" font-family="sans-serif" font-weight="bold" font-size="11">Vertex (-b/2a, -D/4a)</text>

  <foreignObject x="340" y="20" width="240" height="310">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #cbd5e1; font-family: system-ui, sans-serif; font-size: 11px; line-height: 1.4; word-wrap: break-word; word-break: break-word;">
      <h3 style="color: #ffffff; font-size: 13px; font-weight: bold; margin: 0 0 6px 0; border-bottom: 1px solid #334155; padding-bottom: 4px;">Quadratic Properties</h3>
      <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 10.5px;">
        For a quadratic function y = ax² + bx + c with roots α and β:
      </p>
      
      <div style="margin-bottom: 6px;">
        <strong style="color: #06b6d4; font-size: 11px;">1. Discriminant (D):</strong>
        <div style="padding-left: 6px; margin-top: 2px;">
          D = b² - 4ac.
          <ul style="margin: 2px 0 0 0; padding-left: 10px; color: #94a3b8;">
            <li>D &gt; 0: Two distinct real roots (shown)</li>
            <li>D = 0: Two equal real roots</li>
            <li>D &lt; 0: Complex conjugate roots</li>
          </ul>
        </div>
      </div>

      <div style="margin-bottom: 6px;">
        <strong style="color: #a855f7; font-size: 11px;">2. Relations between Roots:</strong>
        <div style="padding-left: 6px; margin-top: 2px; color: #94a3b8;">
          • Sum of Roots: α + β = -b/a<br/>
          • Product of Roots: α &middot; β = c/a
        </div>
      </div>

      <div style="margin-bottom: 6px;">
        <strong style="color: #f59e0b; font-size: 11px;">3. Vertex coordinates:</strong>
        <span style="color: #94a3b8; display: block; padding-left: 6px;">
          The minimum value (when a &gt; 0) or maximum (when a &lt; 0) occurs at x = -b/(2a) with value y = -D/(4a).
        </span>
      </div>
    </div>
  </foreignObject>
</svg>"""

    # Physics - Rolling / Torque / Rotational
    elif "rolling" in topic_lower or "incline" in topic_lower or "rotational" in topic_lower or "torque" in topic_lower or "momentum" in topic_lower:
        return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="100%" height="100%">
  <defs>
    <linearGradient id="inclineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b0764" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
    <linearGradient id="cylinderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="600" height="350" fill="#030014" rx="16" />
  
  <path d="M 50 300 L 500 300 L 500 120 Z" fill="url(#inclineGrad)" stroke="#6366f1" stroke-width="2" />
  
  <path d="M 120 300 A 70 70 0 0 1 100 280" fill="none" stroke="#34d399" stroke-width="2" />
  <text x="130" y="290" fill="#34d399" font-family="monospace" font-size="14">θ</text>
  
  <circle cx="280" cy="205" r="45" fill="url(#cylinderGrad)" stroke="#a855f7" stroke-width="2" filter="url(#glow)" />
  <circle cx="280" cy="205" r="5" fill="#ffffff" />
  
  <path d="M 280 150 A 55 55 0 0 1 330 190" fill="none" stroke="#f59e0b" stroke-width="3" stroke-dasharray="4" />
  <text x="320" y="150" fill="#f59e0b" font-family="monospace" font-size="12">ω (Rotation)</text>
  
  <line x1="280" y1="205" x2="280" y2="280" stroke="#f87171" stroke-width="2" />
  <text x="290" y="275" fill="#f87171" font-family="monospace" font-size="12">mg (Gravity)</text>
  
  <line x1="280" y1="205" x2="240" y2="120" stroke="#38bdf8" stroke-width="2" />
  <text x="210" y="110" fill="#38bdf8" font-family="monospace" font-size="12">N (Normal Force)</text>
  
  <line x1="262" y1="243" x2="310" y2="220" stroke="#34d399" stroke-width="2" />
  <text x="320" y="240" fill="#34d399" font-family="monospace" font-size="12">f (Friction)</text>
  
  <text x="30" y="40" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="16">Rolling Motion on Inclined Plane</text>
  <text x="30" y="60" fill="#a855f7" font-family="monospace" font-size="12">Pure Rolling: v_cm = R * ω</text>
</svg>"""

    # Chemistry - SN2 / Reaction / substitution / Organic
    elif "substitution" in topic_lower or "sn1" in topic_lower or "sn2" in topic_lower or "reaction" in topic_lower or "organic" in topic_lower or "nomenclature" in topic_lower or "effects" in topic_lower:
        return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="100%" height="100%">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="600" height="350" fill="#030014" rx="16" />
  
  <circle cx="300" cy="180" r="22" fill="#1e293b" stroke="#94a3b8" stroke-width="2" />
  <text x="294" y="186" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="18">C</text>
  
  <circle cx="430" cy="180" r="18" fill="#7f1d1d" stroke="#ef4444" stroke-width="2" filter="url(#glow)" />
  <text x="424" y="185" fill="#ffffff" font-family="sans-serif" font-size="14">L</text>
  <line x1="322" y1="180" x2="412" y2="180" stroke="#ef4444" stroke-width="2" stroke-dasharray="4" />
  <text x="350" y="170" fill="#ef4444" font-family="monospace" font-size="11">Breaking Bond</text>
  
  <circle cx="170" cy="180" r="18" fill="#064e3b" stroke="#10b981" stroke-width="2" filter="url(#glow)" />
  <text x="160" y="185" fill="#ffffff" font-family="sans-serif" font-size="14">Nu</text>
  <line x1="188" y1="180" x2="278" y2="180" stroke="#10b981" stroke-width="2" stroke-dasharray="4" />
  <text x="200" y="170" fill="#10b981" font-family="monospace" font-size="11">Forming Bond</text>
  
  <line x1="300" y1="158" x2="300" y2="80" stroke="#38bdf8" stroke-width="2" />
  <circle cx="300" cy="80" r="14" fill="#0c4a6e" stroke="#38bdf8" stroke-width="2" />
  <text x="294" y="84" fill="#ffffff" font-family="sans-serif" font-size="12">R</text>
  
  <line x1="285" y1="195" x2="250" y2="250" stroke="#38bdf8" stroke-width="2" />
  <circle cx="250" cy="250" r="14" fill="#0c4a6e" stroke="#38bdf8" stroke-width="2" />
  <text x="244" y="254" fill="#ffffff" font-family="sans-serif" font-size="12">H</text>
  
  <line x1="315" y1="195" x2="350" y2="250" stroke="#38bdf8" stroke-width="2" />
  <circle cx="350" cy="250" r="14" fill="#0c4a6e" stroke="#38bdf8" stroke-width="2" />
  <text x="344" y="254" fill="#ffffff" font-family="sans-serif" font-size="12">H</text>

  <text x="30" y="40" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="16">SN2 Transition State Diagram</text>
  <text x="30" y="60" fill="#06b6d4" font-family="monospace" font-size="12">Pentacoordinate Carbon - Backside Attack &amp; Inversion</text>
</svg>"""

    # Maths - Integration / Limits / Curve / Area
    elif "integral" in topic_lower or "area" in topic_lower or "calculus" in topic_lower or "curve" in topic_lower or "differential" in topic_lower:
        return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="100%" height="100%">
  <defs>
    <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(52,211,153,0.3)" stroke-width="2" />
    </pattern>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="600" height="350" fill="#030014" rx="16" />
  
  <line x1="80" y1="280" x2="520" y2="280" stroke="#475569" stroke-width="2" />
  <text x="530" y="285" fill="#94a3b8" font-family="monospace" font-size="14">X</text>
  <line x1="100" y1="50" x2="100" y2="300" stroke="#475569" stroke-width="2" />
  <text x="95" y="40" fill="#94a3b8" font-family="monospace" font-size="14">Y</text>
  
  <path d="M 180 280 L 180 185 Q 300 90 420 160 L 420 280 Z" fill="url(#diagonalHatch)" />
  
  <path d="M 120 230 Q 300 70 480 210" fill="none" stroke="#34d399" stroke-width="3" filter="url(#glow)" />
  <text x="320" y="100" fill="#34d399" font-family="monospace" font-size="14">y = f(x)</text>
  
  <line x1="180" y1="185" x2="180" y2="280" stroke="#60a5fa" stroke-width="1.5" stroke-dasharray="3" />
  <text x="175" y="295" fill="#60a5fa" font-family="monospace" font-size="12">a</text>
  
  <line x1="420" y1="160" x2="420" y2="280" stroke="#60a5fa" stroke-width="1.5" stroke-dasharray="3" />
  <text x="415" y="295" fill="#60a5fa" font-family="monospace" font-size="12">b</text>
  
  <text x="270" y="220" fill="#ffffff" font-family="serif" font-style="italic" font-weight="bold" font-size="20">Area A</text>
  
  <text x="30" y="40" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="16">Definite Integral as Area</text>
  <text x="30" y="60" fill="#34d399" font-family="monospace" font-size="14">A = ∫ [a to b] f(x) dx</text>
</svg>"""

    # Physics - Electrostatics / Capacitor / Dipole
    elif "electrostatics" in topic_lower or "charge" in topic_lower or "field" in topic_lower or "capacitance" in topic_lower or "dipole" in topic_lower or "potential" in topic_lower or "gauss" in topic_lower:
        return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="100%" height="100%">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="600" height="350" fill="#030014" rx="16" />
  
  <circle cx="200" cy="175" r="18" fill="#db2777" stroke="#f472b6" stroke-width="2" filter="url(#glow)" />
  <text x="194" y="180" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="16">+</text>
  
  <circle cx="400" cy="175" r="18" fill="#0891b2" stroke="#22d3ee" stroke-width="2" filter="url(#glow)" />
  <text x="395" y="180" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="16">-</text>
  
  <line x1="218" y1="175" x2="382" y2="175" stroke="#22d3ee" stroke-width="1.5" />
  
  <path d="M 215 165 C 260 110 340 110 385 165" fill="none" stroke="#22d3ee" stroke-width="1.5" />
  <path d="M 215 185 C 260 240 340 240 385 185" fill="none" stroke="#22d3ee" stroke-width="1.5" />
  
  <path d="M 210 160 C 240 70 360 70 390 160" fill="none" stroke="#22d3ee" stroke-width="1.5" />
  <path d="M 210 190 C 240 280 360 280 390 190" fill="none" stroke="#22d3ee" stroke-width="1.5" />

  <text x="30" y="40" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="16">Electric Dipole Field Lines</text>
  <text x="30" y="60" fill="#f472b6" font-family="monospace" font-size="12">Arrows point from Positive (+) to Negative (-) charge</text>
</svg>"""

    # General Blueprint Fallback
    else:
        color = "#a855f7" if subject_lower == "physics" else "#06b6d4" if subject_lower == "chemistry" else "#34d399"
        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350" width="100%" height="100%">
  <defs>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="600" height="350" fill="#030014" rx="16" />
  
  <rect x="80" y="140" width="120" height="60" rx="8" fill="rgba(255,255,255,0.02)" stroke="{color}" stroke-width="1.5" />
  <text x="140" y="175" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="12">Concept Node</text>
  
  <line x1="200" y1="170" x2="380" y2="170" stroke="{color}" stroke-width="2" stroke-dasharray="3" />
  
  <rect x="380" y="140" width="140" height="60" rx="8" fill="rgba(255,255,255,0.02)" stroke="{color}" stroke-width="1.5" filter="url(#glow)" />
  <text x="450" y="175" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="12">{topic}</text>
  
  <text x="30" y="40" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="16">{topic} Conceptual Schematic</text>
  <text x="30" y="60" fill="{color}" font-family="monospace" font-size="12">Subject: {subject}</text>
</svg>"""

@router.get("/")
async def get_all_courses():
    # Fetch all courses with teacher name
    result = supabase.table("courses")\
        .select("*, users(name)")\
        .execute()
    return result.data

@router.post("/")
async def create_course(data: CourseCreate, teacher_id: str):
    result = supabase.table("courses").insert({
        "title": data.title,
        "subject": data.subject,
        "description": data.description,
        "teacher_id": teacher_id
    }).execute()
    return result.data[0]

@router.post("/{course_id}/enroll")
async def enroll(course_id: str, student_id: str):
    try:
        result = supabase.table("enrollments").insert({
            "student_id": student_id,
            "course_id": course_id
        }).execute()
        return {"message": "Enrolled successfully!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Already enrolled")

@router.get("/my-courses/{student_id}")
async def my_courses(student_id: str):
    result = supabase.table("enrollments")\
        .select("*, courses(*)")\
        .eq("student_id", student_id)\
        .execute()
    return result.data

@router.post("/generate-diagram")
async def generate_diagram(data: DiagramRequest):
    # Clean topic name to generate a safe cache file name
    safe_topic = "".join(c for c in data.topic if c in f"-_.() {string.ascii_letters}{string.digits}")
    safe_topic = safe_topic.replace(" ", "_").lower()
    
    cache_dir = Path("diagram_cache")
    cache_dir.mkdir(exist_ok=True)
    cache_file = cache_dir / f"{safe_topic}.svg"
    
    # If cache exists and force_refresh is not True, return cached diagram
    if cache_file.exists() and not data.force_refresh:
        try:
            svg_code = cache_file.read_text(encoding="utf-8")
            if svg_code.strip():
                logger.info(f"Returning cached diagram for: {data.topic}")
                return {"svg": svg_code}
        except Exception as cache_err:
            logger.warning(f"Failed to read cache file {cache_file}: {cache_err}")

    # If it is not a force refresh (initial load), check if we have a custom topic-specific fallback SVG.
    # If so, return it directly for absolute visual excellence and zero latency!
    if not data.force_refresh:
        fallback_svg = generate_fallback_svg(data.subject, data.topic)
        if "Conceptual Schematic" not in fallback_svg:
            logger.info(f"Returning handcrafted high-fidelity SVG for core topic: {data.topic}")
            try:
                cache_file.write_text(fallback_svg, encoding="utf-8")
            except Exception as write_err:
                logger.warning(f"Failed to write diagram cache file {cache_file}: {write_err}")
            return {"svg": fallback_svg}

    api_key = os.getenv("GROQ_API_KEY")
    svg_code = ""

    if not api_key:
        logger.warning("GROQ_API_KEY is not defined in .env, using local fallback SVG.")
        svg_code = generate_fallback_svg(data.subject, data.topic)
    else:
        prompt = f"""You are an expert Class 11-12 scientific diagram designer and illustrator.
Create a responsive, modern, dark-mode themed SVG diagram to visually explain the academic topic: '{data.topic}' in the subject '{data.subject}' for Class 11-12 students preparing for competitive exams like JEE/NEET.
The diagram must look professional, clean, and highly educational (similar to high-quality interactive geometry/science graphics).

Design specifications:
- Set viewBox="0 0 600 350" and width="100%", height="100%".
- Use a dark background (#030014) or transparent background.
- Apply high-contrast glowing neon colors for key components (e.g. purple #a855f7, cyan #06b6d4, emerald #34d399, amber #f59e0b).

CRITICAL Layout and Alignment Standards (To prevent shifted elements and text clipping):
1. ABSOLUTE POSITIONING ONLY: Do NOT wrap the entire drawing or large parts of it in translation groups (e.g., <g transform="translate(dx, dy)">) that shift the coordinates. Place all lines, circles, curves, paths, texts, and foreignObjects directly using absolute x/y coordinates inside the 600 x 350 viewBox coordinate space.
2. HORIZONTAL SPLIT LAYOUT:
   - Left half (x = 20 to 330): Keep all graphical elements (molecules, vectors, axes, cylinders, curves, grids) strictly in this zone. Ensure there is at least 15px padding from the top, bottom, and left edges of the viewBox.
   - Right half (x = 350 to 570): Use a single <foreignObject x="350" y="30" width="220" height="290"> to embed an HTML block containing the legend and keys. Placing the foreignObject at x="350" with a width of "220" guarantees a safe 30px padding on the right edge of the 600px viewBox, preventing text from ever clipping.
3. NO CLIPPED SHAPES OR TEXT: Keep all labels and drawings safely away from the canvas edges. Standard SVG <text> elements should only be used for small single-word labels (e.g., "x", "y", "θ", "C").
4. HTML inside foreignObject MUST contain word-wrap/word-break rules:
   <div xmlns="http://www.w3.org/1999/xhtml" style="color: #94a3b8; font-family: system-ui, sans-serif; font-size: 11px; line-height: 1.5; word-wrap: break-word; word-break: break-word;">
5. RENDER ACTUAL TOPIC GRAPHICS: Draw concrete visual representations of the specific topic rather than generic node blocks. For example, if the topic is Permutations and Combinations (or arrangements of items), draw concrete graphical representations (e.g., a row of chairs/slots with items filled, selection trees, grid mappings, or factorials) to show the visual intuition of how permutations/selections are counted.
6. MATHEMATICAL TOPICS MUST SHOW CONCRETE GRAPHICS: For mathematical topics, draw actual coordinates, shapes, grids, and concrete arrangements (e.g., chairs, slots, circles, triangles, vectors, matrices) rather than concept boxes. If the topic is Permutations and Combinations, you MUST draw slots/chairs with items, show arrows representing choice counts (like 5 × 4 × 3), and place the calculations clearly.

Example structure of the right half <foreignObject>:
  <foreignObject x="350" y="30" width="220" height="290">
    <div xmlns="http://www.w3.org/1999/xhtml" style="color: #94a3b8; font-family: system-ui, sans-serif; font-size: 11px; line-height: 1.5; word-wrap: break-word; word-break: break-word;">
      <h3 style="color: #ffffff; font-size: 13px; font-weight: bold; margin: 0 0 8px 0;">Key Details:</h3>
      <ul style="margin: 0; padding-left: 14px; color: #cbd5e1;">
        <li style="margin-bottom: 6px;"><strong style="color: #34d399;">Point Name:</strong> Brief explanation.</li>
      </ul>
    </div>
  </foreignObject>

Output ONLY valid, clean XML SVG code starting with '<svg' and ending with '</svg>'. Do not write any explanations before or after the code block. Do not wrap the code block in markdown backticks."""

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
                    "content": "You are a specialized SVG drawing generator. You only output valid, compilable raw SVG code. No explanations, no markdown blocks."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.2,
            "max_tokens": 1500
        }
        
        try:
            logger.info("Generating diagram using primary model llama-3.3-70b-versatile...")
            res = requests.post(url, headers=headers, json=payload, timeout=20)
            if res.status_code == 200:
                res_data = res.json()
                answer_text = res_data["choices"][0]["message"]["content"]
                svg_match = re.search(r"<svg.*?>.*?</svg>", answer_text, re.DOTALL)
                if svg_match:
                    svg_code = svg_match.group(0)
                else:
                    raise Exception("No svg tag found in primary model response.")
            else:
                raise Exception(f"Primary model returned status {res.status_code}: {res.text}")
        except Exception as e:
            logger.warning(f"Primary model failed to generate diagram: {e}. Trying backup model (llama-3.1-8b-instant)...")
            payload["model"] = "llama-3.1-8b-instant"
            try:
                res = requests.post(url, headers=headers, json=payload, timeout=20)
                if res.status_code == 200:
                    res_data = res.json()
                    answer_text = res_data["choices"][0]["message"]["content"]
                    svg_match = re.search(r"<svg.*?>.*?</svg>", answer_text, re.DOTALL)
                    if svg_match:
                        svg_code = svg_match.group(0)
                    else:
                        raise Exception("No svg tag found in backup model response.")
                else:
                    raise Exception(f"Backup model returned status {res.status_code}: {res.text}")
            except Exception as e2:
                logger.error(f"Backup model also failed to generate diagram: {e2}. Using fallback SVG.")
                svg_code = generate_fallback_svg(data.subject, data.topic)

    # Save to cache if valid SVG was returned/generated
    if svg_code:
        try:
            cache_file.write_text(svg_code, encoding="utf-8")
            logger.info(f"Saved generated diagram to cache: {cache_file}")
        except Exception as write_err:
            logger.warning(f"Failed to write diagram cache file {cache_file}: {write_err}")

    return {"svg": svg_code}

class FlashcardRequest(BaseModel):
    topic: str
    subject: str
    num_cards: int = 6

def get_fallback_flashcards(subject: str, topic: str, num_cards: int) -> dict:
    topic_lower = topic.lower()
    
    if "torque" in topic_lower:
        cards = [
            {"front": "What is Torque physically?", "back": "Torque is the rotational equivalent of force, measuring the tendency of a force to rotate an object about an axis: $\\tau = r \\times F$."},
            {"front": "Write the vector formula for Torque and its SI unit.", "back": "$\\vec{\\tau} = \\vec{r} \\times \\vec{F}$. The SI unit is Newton-meter ($N\\cdot m$)."},
            {"front": "What is the condition for complete mechanical equilibrium?", "back": "Both external force and external torque must sum to zero: $\\sum \\vec{F} = 0$ (translational) and $\\sum \\vec{\\tau} = 0$ (rotational)."},
            {"front": "How does torque relate to angular acceleration?", "back": "$\\tau = I \\alpha$, where $I$ is the moment of inertia and $\\alpha$ is the angular acceleration (analogous to $F = ma$)."},
            {"front": "Why is it easier to open a door by pushing near the edge rather than near the hinge?", "back": "Pushing near the edge increases the distance ($r$) from the hinge axis, producing greater torque for the same applied force: $\\tau = r F \\sin(\\theta)$."}
        ]
    elif "displacement" in topic_lower or "kinematic" in topic_lower:
        cards = [
            {"front": "Define Angular Displacement ($d\\theta$).", "back": "The angle (in radians) swept by a particle revolving in a circular path. It is dimensionless ($M^0 L^0 T^0$) but measured in radians."},
            {"front": "What is the relation between linear velocity ($v$) and angular velocity ($\\omega$)?", "back": "$v = r \\omega$. In vector form, $\\vec{v} = \\vec{\\omega} \\times \\vec{r}$."},
            {"front": "Write the three equations of rotational motion under constant angular acceleration.", "back": "1) $\\omega = \\omega_0 + \\alpha t$\n2) $\\theta = \\omega_0 t + \\frac{1}{2} \\alpha t^2$\n3) $\\omega^2 = \\omega_0^2 + 2 \\alpha \\theta$"},
            {"front": "State the difference between tangential and centripetal acceleration.", "back": "Tangential acceleration changes the speed ($a_t = r \\alpha$), while centripetal acceleration changes the direction of motion ($a_c = v^2/r = \\omega^2 r$)."},
            {"front": "What is the conversion factor from RPM to radians per second?", "back": "To convert rotations per minute ($N$) to rad/s ($\\omega$): $\\omega = \\frac{2\\pi N}{60}$."}
        ]
    elif "moment of inertia" in topic_lower:
        cards = [
            {"front": "Define Moment of Inertia ($I$).", "back": "The rotational analogue of mass, measuring resistance to change in rotational state: $I = \\sum m_i r_i^2$ for discrete systems."},
            {"front": "State the Parallel Axis Theorem.", "back": "$I = I_{cm} + M d^2$, where $I_{cm}$ is the moment of inertia about a parallel axis passing through the center of mass, and $d$ is the distance between axes."},
            {"front": "State the Perpendicular Axis Theorem.", "back": "For planar objects: $I_z = I_x + I_y$, where $x$ and $y$ are orthogonal axes in the plane and $z$ is perpendicular to it."},
            {"front": "What is the moment of inertia of a solid sphere of mass $M$ and radius $R$ about its diameter?", "back": "$I = \\frac{2}{5} M R^2$. (For a hollow sphere, it is $\\frac{2}{3} M R^2$)."},
            {"front": "What is the moment of inertia of a solid cylinder of mass $M$ and radius $R$ about its longitudinal axis?", "back": "$I = \\frac{1}{2} M R^2$."}
        ]
    else:
        cards = [
            {"front": f"Define the core goal of studying {topic}.", "back": f"Studying {topic} helps master the fundamental principles of Class 11-12 {subject} necessary for competitive exams like JEE & NEET."},
            {"front": f"What is a key formula associated with {topic}?", "back": "Check the textbook derivations to practice resolving vectors, units, and structural equations related to this section."},
            {"front": f"Why is active recall important for {topic}?", "back": "Active recall forces the brain to retrieve information, strengthening synaptic connections and long-term memory retrieval under exam pressure."},
            {"front": f"How does {topic} connect to prior Class 11/12 chapters?", "back": f"Concepts in {topic} build on foundation mechanics/dynamics in {subject} to explain complex systems and physical/chemical interactions."},
            {"front": f"State a common trick for solving numericals in {topic}.", "back": "Always sketch free-body diagrams or reaction coordinate structures first. Ensure units are converted to standard SI format before computing."}
        ]
    
    for idx, card in enumerate(cards):
        card["id"] = f"fc_{idx+1}"
        
    return {
        "topic": topic,
        "flashcards": cards[:num_cards]
    }

@router.post("/generate-flashcards")
async def generate_flashcards(data: FlashcardRequest):
    import os
    import requests
    import json
    
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.warning("GROQ_API_KEY is not defined in .env, using local fallback for flashcards.")
        return get_fallback_flashcards(data.subject, data.topic, data.num_cards)
        
    prompt = f"""
You are Professor ARIA, a genius AI Science Tutor. Generate a set of exactly {data.num_cards} interactive flashcards for Class 11-12 {data.subject} active-recall revision targeting the topic: "{data.topic}".

Each flashcard must have:
- "front": A concise, clear question, conceptual puzzle, or formula completion prompt.
- "back": A clear, concise answer, step-by-step mathematical calculation, or explanation using LaTeX notation where necessary. Keep it punchy and clear.

Return a raw, valid JSON object matching the following structure:
{{
  "topic": "{data.topic}",
  "flashcards": [
    {{
      "id": "fc_1",
      "front": "What is the angular displacement of a particle making 3 full revolutions?",
      "back": "One revolution is $2\\pi$ radians. Therefore, 3 revolutions equals $3 \\times 2\\pi = 6\\pi$ radians."
    }},
    ...
  ]
}}

Guidelines:
- Return ONLY valid raw JSON. Do not include markdown codeblocks, "```json", or any preamble/postamble.
- Ensure all content is highly educational and tailored for competitive JEE/NEET exams.
- LaTeX math expressions should be formatted using inline $...$ or block $$...$$ where appropriate.
- Ensure IDs are unique (e.g. fc_1, fc_2, etc.).
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
            "max_tokens": 1000
        }
        res = requests.post(url, headers=headers, json=payload, timeout=12)
        if res.status_code == 200:
            res_data = res.json()
            answer_text = res_data["choices"][0]["message"]["content"]
            parsed_data = json.loads(answer_text)
            for i, card in enumerate(parsed_data.get("flashcards", [])):
                card["id"] = f"fc_{i+1}"
            return parsed_data
        else:
            logger.warning(f"Groq API returned error {res.status_code}: {res.text}. Using fallback flashcards.")
            return get_fallback_flashcards(data.subject, data.topic, data.num_cards)
    except Exception as e:
        logger.warning(f"Failed to query Groq API for flashcards: {str(e)}. Using fallback.")
        return get_fallback_flashcards(data.subject, data.topic, data.num_cards)

def get_subject_meta(subject: str):
    sub = subject.lower()
    if "phys" in sub:
        return "#a855f7", "rgba(168,85,247,0.4)", "⚡"
    elif "chem" in sub:
        return "#06b6d4", "rgba(6,182,212,0.4)", "🧪"
    elif "math" in sub:
        return "#34d399", "rgba(52,211,153,0.4)", "∫"
    else:
        return "#f59e0b", "rgba(245,158,11,0.4)", "🧬"

def get_default_curriculum_fallback(course_id: str, title: str, subject: str):
    color, glow, icon = get_subject_meta(subject)
    return {
        "id": course_id,
        "title": title,
        "subject": subject,
        "color": color,
        "glowColor": glow,
        "icon": icon,
        "modules": [
            {
                "title": "Module 1: General Core Overview",
                "lessons": [
                    {
                        "id": f"fb_{course_id}_1",
                        "title": f"Introductory Concepts & Overview of {title}",
                        "topic": "Foundations",
                        "duration": 20,
                        "summary": f"### Core Foundations of {title}\nThis module introduces the key frameworks and concepts of {title} necessary for competitive JEE/NEET exam preparation.\n\n### Expected Learning Outcomes\n1. **Understand Key Definitions**: Relate these parameters to other sections of the Class 11-12 curriculum.\n2. **Formula Applications**: Apply dimensional and scalar checks before numerical resolutions.\n3. **Problem Solving**: Practice basic questions to prepare for the diagnostic assessments.\n\n*Note: Professor ARIA has configured fallback modules. Complete course sheets are active!*"
                    }
                ]
            }
        ]
    }

def make_groq_request_with_retry(url, headers, payload, timeout=60, max_retries=6):
    import time
    import re
    backoff = 10
    for attempt in range(max_retries):
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=timeout)
            if res.status_code == 200:
                return res
            elif res.status_code == 429:
                retry_after = 20
                try:
                    err_json = res.json()
                    msg = err_json.get("error", {}).get("message", "")
                    match = re.search(r"try again in (\d+(\.\d+)?)s", msg)
                    if match:
                        retry_after = float(match.group(1)) + 2.0
                except Exception:
                    pass
                wait_time = max(retry_after, backoff)
                logger.warning(f"Groq API 429 Rate Limited. Waiting {wait_time:.2f} seconds before retry {attempt + 1}/{max_retries}...")
                time.sleep(wait_time)
                backoff *= 2
            elif res.status_code in [500, 502, 503, 504]:
                logger.warning(f"Groq API server error {res.status_code}. Waiting {backoff} seconds before retry {attempt + 1}/{max_retries}...")
                time.sleep(backoff)
                backoff *= 2
            else:
                raise Exception(f"HTTP {res.status_code}: {res.text}")
        except (requests.exceptions.RequestException, Exception) as e:
            if attempt == max_retries - 1:
                raise e
            logger.warning(f"Request attempt {attempt + 1} failed: {e}. Retrying in {backoff} seconds...")
            time.sleep(backoff)
            backoff *= 2
def heal_json_string(s):
    s = s.strip()
    if not s.startswith("{"):
        return s
        
    # Count unescaped quotes to see if we have an odd number
    quote_count = 0
    escaped = False
    for char in s:
        if char == '\\':
            escaped = not escaped
        elif char == '"':
            if not escaped:
                quote_count += 1
            escaped = False
        else:
            escaped = False
            
    if quote_count % 2 != 0:
        # Odd number of quotes, string is unterminated. Let's close it!
        s += '"'
        
    if not s.endswith("}"):
        s += "\n}"
        
    return s

def escape_nested_quotes(json_str):
    import re
    json_str = re.sub(r'"id"\s*:\s*', '"id":', json_str)
    json_str = re.sub(r'"summary"\s*:\s*', '"summary":', json_str)
    
    id_key_pos = json_str.find('"id":')
    if id_key_pos == -1:
        return json_str
    
    val_start_pos = json_str.find('"', id_key_pos + 5)
    if val_start_pos == -1:
        return json_str
    val_end_pos = json_str.find('"', val_start_pos + 1)
    if val_end_pos == -1:
        return json_str
        
    summary_key_pos = json_str.find('"summary":')
    if summary_key_pos == -1:
        return json_str
        
    sum_val_start = json_str.find('"', summary_key_pos + 10)
    if sum_val_start == -1:
        return json_str
        
    sum_val_end = json_str.rfind('"')
    if sum_val_end <= sum_val_start:
        return json_str
        
    keep_positions = {
        id_key_pos, id_key_pos + 3,
        val_start_pos, val_end_pos,
        summary_key_pos, summary_key_pos + 8,
        sum_val_start, sum_val_end
    }
    
    new_chars = []
    for idx, char in enumerate(json_str):
        if char == '"' and idx not in keep_positions:
            if idx > 0 and json_str[idx-1] == '\\':
                new_chars.append(char)
            else:
                new_chars.append('\\"')
        else:
            new_chars.append(char)
            
    return "".join(new_chars)

def generate_curriculum_via_llm(course_id: str, title: str, subject: str, api_key: str):
    import json
    import time
    color, glow, icon = get_subject_meta(subject)
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Step 1: Generate structure with retries for API and parsing
    structure_prompt = f"""You are Professor ARIA, a genius Class 11-12 Science Tutor.
Generate a course outline for the Class 11-12 course titled: "{title}" in the subject "{subject}" for students preparing for JEE & NEET.
Generate exactly 4 modules. Each module must contain exactly 3 lessons.
For each lesson, generate:
1. "id": A unique string ID (e.g. "{title.lower().replace(' ', '_').replace('&', 'and')}_1_1").
2. "title": Specific lesson title.
3. "topic": Main topic area.
4. "duration": Study duration in minutes.

Output format must be a single raw JSON object matching this schema:
{{
  "id": "{course_id}",
  "title": "{title}",
  "subject": "{subject}",
  "color": "{color}",
  "glowColor": "{glow}",
  "icon": "{icon}",
  "modules": [
    {{
      "title": "Module 1: [Module Title]",
      "lessons": [
        {{
          "id": "[lesson_id_1]",
          "title": "[Lesson Title 1]",
          "topic": "[Topic 1]",
          "duration": 20
        }},
        ...
      ]
    }},
    ...
  ]
}}

Return ONLY the raw JSON object. Do not include markdown code block wrappers (like ```json). Ensure the JSON is completely valid.
"""
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": "You are a specialized JSON generator. You output only raw, valid JSON. Never output any introductory text, markdown code blocks, explanation or commentary."},
            {"role": "user", "content": structure_prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
        "max_tokens": 1200
    }
    
    curriculum = None
    for attempt in range(3):
        logger.info(f"Generating curriculum structure for '{title}' - Attempt {attempt + 1}")
        try:
            res = make_groq_request_with_retry(url, headers, payload, timeout=30)
            res_content = res.json()["choices"][0]["message"]["content"]
            curriculum = json.loads(heal_json_string(res_content))
            # Validate structure
            if "modules" in curriculum and len(curriculum["modules"]) == 4:
                break
            else:
                logger.warning(f"Generated structure has invalid number of modules (got {len(curriculum.get('modules', []))}, expected 4). Retrying...")
        except Exception as err:
            if attempt == 2:
                raise err
            logger.warning(f"Attempt {attempt + 1} to parse curriculum structure failed: {err}. Retrying...")
            time.sleep(5)

    if not curriculum:
        raise Exception("Failed to generate valid curriculum structure after all attempts.")

    # Step 2: Generate summaries lesson-by-lesson
    for idx, module in enumerate(curriculum.get("modules", [])):
        module_title = module.get("title", "")
        lessons = module.get("lessons", [])
        
        for les_idx, les in enumerate(lessons):
            les_id = les["id"]
            les_title = les["title"]
            les_topic = les["topic"]
            
            summary_prompt = f"""You are Professor ARIA, a genius AI Science Tutor.
For the course "{title}" in "{subject}", write the highly detailed, Class 11-12 exam-oriented study notes for the following lesson in "{module_title}":
Lesson ID: {les_id}
Title: {les_title}
Topic: {les_topic}

Write a comprehensive, textbook-level study summary.
The summary MUST contain the following four sections, each starting with the heading on a SEPARATE line followed by at least 2-3 detailed paragraphs or bullet points of explanation:
- "### Core Concepts" (definitions, core theories, key equations).
- "### Real-World Analogy & Story" (memorable, illustrative analogy explaining the intuition).
- "### Deep-Dive & Derivations" (extensive mathematical equations, step-by-step proofs/derivations, and physical reasoning).
- "### Exam Applications & Tips" (critical shortcuts, common exam pitfalls, and detailed problem-solving tips).

CRITICAL rules:
- Do NOT combine headings and content on the same line. Heading must be on its own line.
- Cover all minor sub-topics and provide rigorous mathematical or chemical explanations.
- All equations and mathematical expressions MUST be formatted using LaTeX: block equations inside $$...$$ and inline equations inside $...$.
- Escaped backslashes must be properly escaped in JSON.

Output format must be a JSON object:
{{
  "id": "{les_id}",
  "summary": "[Detailed markdown summary as specified above]"
}}
Return ONLY the raw JSON object.
"""
            payload_summary = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": "You are a specialized JSON generator. You output only raw, valid JSON. Never output any introductory text, markdown code blocks, explanation or commentary."},
                    {"role": "user", "content": summary_prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 2000
            }
            
            summary_data = None
            for summary_attempt in range(3):
                logger.info(f"Generating summary for Lesson {les_idx+1} ({les_title}) - Attempt {summary_attempt + 1}")
                try:
                    res_summary = make_groq_request_with_retry(url, headers, payload_summary, timeout=60)
                    raw_text = res_summary.json()["choices"][0]["message"]["content"]
                    # Clean python-style triple quotes if generated by the LLM
                    raw_text = raw_text.replace('"""', '"')
                    
                    # Find JSON boundaries
                    start_idx = raw_text.find("{")
                    end_idx = raw_text.rfind("}")
                    if start_idx != -1 and end_idx != -1:
                        json_str = raw_text[start_idx:end_idx+1]
                    else:
                        json_str = raw_text
                        
                    # Escape nested unescaped quotes inside JSON string values
                    json_str = escape_nested_quotes(json_str)
                        
                    # Escape actual newlines inside double-quoted JSON strings before sanitizing backslashes
                    chars = []
                    in_string = False
                    backslash_count = 0
                    for char in json_str:
                        if char == '"':
                            if backslash_count % 2 == 0:
                                in_string = not in_string
                            chars.append(char)
                            backslash_count = 0
                        elif char == '\\':
                            backslash_count += 1
                            chars.append(char)
                        else:
                            if char == '\n' and in_string:
                                chars.append('\\n')
                            elif char == '\r' and in_string:
                                pass
                            else:
                                chars.append(char)
                            backslash_count = 0
                    escaped_json_str = "".join(chars)
                        
                    # Sanitize single backslashes that are not valid JSON escape sequences
                    cleaned_json = re.sub(r'\\(?!["\\/bfnrt]|u[0-9a-fA-F]{4})', r'\\\\', escaped_json_str)
                    # Strip trailing commas inside arrays and objects
                    cleaned_json = re.sub(r',\s*([\]}])', r'\1', cleaned_json)
                    
                    try:
                        summary_data = json.loads(heal_json_string(cleaned_json))
                    except Exception as parse_err:
                        logger.error(f"Failed to parse sanitized JSON: {parse_err}. Trying simple escape...")
                        try:
                            simple_json = escaped_json_str.replace('\\', '\\\\')
                            simple_json = simple_json.replace('\\\\n', '\\n').replace('\\\\t', '\\t')
                            summary_data = json.loads(heal_json_string(simple_json))
                        except Exception as final_err:
                            raise Exception(f"JSON validation failed for LLM response: {final_err}. Output: {raw_text}")
                    
                    if "summary" in summary_data and len(summary_data["summary"]) > 50:
                        break
                    else:
                        logger.warning(f"Summary missing or too short in LLM response on attempt {summary_attempt + 1}. Retrying...")
                except Exception as summary_err:
                    if summary_attempt == 2:
                        raise summary_err
                    logger.warning(f"Attempt {summary_attempt + 1} to generate summary failed: {summary_err}. Retrying...")
                    time.sleep(5)
                    
            if not summary_data or "summary" not in summary_data:
                raise Exception(f"Failed to generate valid summary for {les_title} after all attempts.")
                
            les["summary"] = summary_data["summary"]
            
    return curriculum

@router.get("/{course_id}/curriculum")
async def get_course_curriculum(course_id: str):
    # Fetch course from database
    course_res = supabase.table("courses").select("*").eq("id", course_id).execute()
    if not course_res.data:
        raise HTTPException(status_code=404, detail="Course not found")
        
    course_data = course_res.data[0]
    course_title = course_data.get("title", "Course Details")
    course_subject = course_data.get("subject", "Science")
    
    # Check cache directory
    cache_dir = Path("curriculum_cache")
    cache_dir.mkdir(exist_ok=True)
    cache_file = cache_dir / f"{course_id}.json"
    
    if cache_file.exists():
        try:
            import json
            with open(cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to read cached curriculum: {e}")
            
    # Check if we have GROQ API key
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return get_default_curriculum_fallback(course_id, course_title, course_subject)
        
    try:
        generated = generate_curriculum_via_llm(course_id, course_title, course_subject, api_key)
        # Write to cache
        import json
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump(generated, f, ensure_ascii=False, indent=2)
        return generated
    except Exception as e:
        logger.error(f"Failed to generate curriculum for {course_title}: {e}")
        return get_default_curriculum_fallback(course_id, course_title, course_subject)

