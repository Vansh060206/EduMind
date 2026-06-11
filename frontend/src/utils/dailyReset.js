export const DAILY_RESET_HOUR = 6;

export function getDailyPeriodStart(now = new Date()) {
  const periodStart = new Date(now);
  periodStart.setHours(DAILY_RESET_HOUR, 0, 0, 0);
  if (now < periodStart) {
    periodStart.setDate(periodStart.getDate() - 1);
  }
  return periodStart;
}

export function getDailyPeriodKey(now = new Date()) {
  return getDailyPeriodStart(now).toISOString().split("T")[0];
}

export function getPreviousDailyPeriodKey(now = new Date()) {
  const prev = new Date(getDailyPeriodStart(now));
  prev.setDate(prev.getDate() - 1);
  return prev.toISOString().split("T")[0];
}

export function isInCurrentDailyPeriod(timestamp) {
  if (!timestamp) return false;
  return new Date(timestamp) >= getDailyPeriodStart();
}

export function countSinceDailyPeriodStart(items, dateField = "attempted_at") {
  const periodStart = getDailyPeriodStart();
  return (items || []).filter((item) => {
    const value = item?.[dateField];
    return value && new Date(value) >= periodStart;
  }).length;
}

function resetPlannerChecklistForToday(userId) {
  const todayStr = new Date().toLocaleDateString("en-CA");
  const plannerKey = `edumind_planner_tasks_${userId}`;
  const saved = JSON.parse(localStorage.getItem(plannerKey) || "{}");

  if (saved[todayStr]?.length) {
    saved[todayStr] = saved[todayStr].map((task) => ({ ...task, done: false }));
    localStorage.setItem(plannerKey, JSON.stringify(saved));
  }
}

export function ensureDailyReset(userId) {
  const periodKey = getDailyPeriodKey();
  if (!userId || userId === "guest") return periodKey;

  const storedKey = localStorage.getItem(`edumind_daily_period_${userId}`);
  if (storedKey === periodKey) return periodKey;

  localStorage.setItem(`edumind_daily_period_${userId}`, periodKey);
  localStorage.setItem(`edumind_daily_seconds_${userId}`, "0");
  localStorage.setItem(`edumind_unsynced_seconds_${userId}`, "0");
  localStorage.setItem(`edumind_daily_xp_${userId}`, "0");
  localStorage.setItem(`edumind_daily_awarded_${userId}`, "[]");
  localStorage.setItem(`edumind_daily_lessons_${userId}`, "0");
  localStorage.setItem(`edumind_daily_quizzes_${userId}`, "0");
  localStorage.removeItem(`edumind_streak_animation_played_${userId}`);

  resetPlannerChecklistForToday(userId);
  window.dispatchEvent(new Event("edumind_daily_reset"));
  return periodKey;
}

export function getDailySeconds(userId) {
  if (userId) ensureDailyReset(userId);
  return Number(localStorage.getItem(`edumind_daily_seconds_${userId}`) || 0);
}

export function getDailyXp(userId) {
  if (userId) ensureDailyReset(userId);
  return Number(localStorage.getItem(`edumind_daily_xp_${userId}`) || 0);
}

export function addDailyXp(userId, amount) {
  if (!userId || userId === "guest") return 0;
  ensureDailyReset(userId);
  const next = getDailyXp(userId) + amount;
  localStorage.setItem(`edumind_daily_xp_${userId}`, String(next));
  window.dispatchEvent(new Event("edumind_xp_update"));
  return next;
}

export function incrementDailyCounter(userId, counterKey) {
  if (!userId || userId === "guest") return 0;
  ensureDailyReset(userId);
  const storageKey = `edumind_daily_${counterKey}_${userId}`;
  const next = Number(localStorage.getItem(storageKey) || 0) + 1;
  localStorage.setItem(storageKey, String(next));
  return next;
}

export function getDailyCounter(userId, counterKey) {
  if (userId) ensureDailyReset(userId);
  return Number(localStorage.getItem(`edumind_daily_${counterKey}_${userId}`) || 0);
}

export function awardTargetXpOnce(userId, targetId, xp) {
  if (!userId || userId === "guest" || !targetId) return;
  ensureDailyReset(userId);
  const awardedKey = `edumind_daily_awarded_${userId}`;
  const awarded = JSON.parse(localStorage.getItem(awardedKey) || "[]");
  if (awarded.includes(targetId)) return;
  awarded.push(targetId);
  localStorage.setItem(awardedKey, JSON.stringify(awarded));
  addDailyXp(userId, xp);
}

export function scheduleDailyResetCheck(userId, onReset) {
  if (!userId) return () => {};

  const check = () => {
    const before = localStorage.getItem(`edumind_daily_period_${userId}`);
    ensureDailyReset(userId);
    const after = localStorage.getItem(`edumind_daily_period_${userId}`);
    if (before !== after) onReset?.();
  };

  check();
  const interval = setInterval(check, 60_000);
  return () => clearInterval(interval);
}
