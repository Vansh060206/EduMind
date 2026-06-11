import api from "../services/api";

function computeStudyStreak(studySessions, quizResults) {
  const dates = new Set();
  (studySessions || []).forEach((s) => {
    if (s.date) dates.add(s.date.split("T")[0]);
  });
  (quizResults || []).forEach((q) => {
    if (q.attempted_at) dates.add(q.attempted_at.split("T")[0]);
  });

  if (dates.size === 0) return 1;

  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const key = day.toISOString().split("T")[0];
    if (dates.has(key)) {
      streak += 1;
    } else if (i > 0) {
      break;
    }
  }

  return Math.max(1, Math.min(streak || 1, 30));
}

export function matchCourseWeakTopics(courseTopics, weakTopics) {
  if (!courseTopics?.length || !weakTopics?.length) return [];

  const matched = [];
  courseTopics.forEach((courseTopic) => {
    const ct = courseTopic.toLowerCase();
    const hit = weakTopics.some((wt) => {
      const w = wt.toLowerCase();
      return ct.includes(w) || w.includes(ct);
    });
    if (hit && !matched.includes(courseTopic)) {
      matched.push(courseTopic);
    }
  });

  return matched;
}

export function prioritizePoolByWeakTopics(pool, weakTopics) {
  if (!pool || !weakTopics?.length) return pool;

  const result = {};
  for (const diff of ["Easy", "Medium", "Hard"]) {
    const list = pool[diff] || [];
    const weakPile = [];
    const standardPile = [];

    list.forEach((q) => {
      const topic = (q.topic || "").toLowerCase();
      const isWeak = weakTopics.some((wt) => {
        const w = wt.toLowerCase();
        return topic.includes(w) || w.includes(topic);
      });
      if (isWeak) weakPile.push(q);
      else standardPile.push(q);
    });

    const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
    result[diff] = [...shuffle(weakPile), ...shuffle(standardPile)];
  }

  return result;
}

export async function fetchStudentMlMetrics(studentId, sessionQuizScore = null) {
  const fallback = {
    avg_score: sessionQuizScore ?? 50,
    study_hours: 0,
    doubts_asked: 0,
    quizzes_done: sessionQuizScore !== null ? 1 : 0,
    streak: 1,
  };

  if (!studentId || studentId === "guest") {
    return fallback;
  }

  try {
    const [perfRes, studyRes, doubtsRes] = await Promise.all([
      api.get(`/students/performance/${studentId}`),
      api.get(`/students/study-sessions/${studentId}`),
      api.get(`/doubts/history/${studentId}`).catch(() => ({ data: [] })),
    ]);

    const quizResults = perfRes.data || [];
    const studySessions = studyRes.data || [];
    const doubts = doubtsRes.data || [];

    const quizzesCount = quizResults.length;
    const totalScore = quizResults.reduce((acc, q) => acc + (q.score || 0), 0);

    let avgScore = quizzesCount > 0 ? Math.round(totalScore / quizzesCount) : 0;
    let quizzesDone = quizzesCount;

    if (sessionQuizScore !== null && sessionQuizScore !== undefined) {
      avgScore = Math.round((totalScore + sessionQuizScore) / (quizzesCount + 1));
      quizzesDone = quizzesCount + 1;
    }

    const totalMinutes = studySessions.reduce(
      (acc, s) => acc + (s.duration_minutes || 0),
      0
    );
    const studyHours = Math.round((totalMinutes / 60) * 10) / 10;

    return {
      avg_score: avgScore,
      study_hours: studyHours,
      doubts_asked: doubts.length,
      quizzes_done: quizzesDone,
      streak: computeStudyStreak(studySessions, quizResults),
    };
  } catch (err) {
    console.warn("Failed to fetch student ML metrics:", err);
    return fallback;
  }
}

export function buildForecastHistory(quizResults) {
  return (quizResults || [])
    .filter((q) => q.attempted_at && q.score != null)
    .map((q) => ({
      date: q.attempted_at.split("T")[0],
      score: q.score,
    }));
}

export async function fetchWeakTopicsForSubject(studentId, subject) {
  if (!studentId || studentId === "guest" || !subject) return [];

  try {
    const res = await api.get(
      `/tests/weak-topics/${studentId}?subject=${encodeURIComponent(subject)}`
    );
    return res.data?.weak_topics || [];
  } catch (err) {
    console.warn("Failed to fetch weak topics:", err);
    return [];
  }
}
