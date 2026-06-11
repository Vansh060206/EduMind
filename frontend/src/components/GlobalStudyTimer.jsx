// GlobalStudyTimer.jsx
// Tracks active study seconds on the website in real-time across tabs (using visibilityState)
// Syncs every 60 seconds to the backend study-sessions table.
// Daily timer resets at 6:00 AM local time.

import { useEffect } from "react";
import api from "../services/api";
import { ensureDailyReset } from "../utils/dailyReset";

export default function GlobalStudyTimer() {
  useEffect(() => {
    const token = localStorage.getItem("edumind_token");
    const userStr = localStorage.getItem("edumind_user");
    if (!token || !userStr) return;

    let userId = null;
    try {
      const user = JSON.parse(userStr);
      userId = user.id;
    } catch (e) {
      return;
    }
    if (!userId) return;

    ensureDailyReset(userId);

    const unsyncedKey = `edumind_unsynced_seconds_${userId}`;
    const dailyKey = `edumind_daily_seconds_${userId}`;

    const interval = setInterval(() => {
      ensureDailyReset(userId);

      if (document.visibilityState !== "visible") return;

      const currentUnsynced = Number(localStorage.getItem(unsyncedKey) || 0);
      const currentDaily = Number(localStorage.getItem(dailyKey) || 0);

      const nextUnsynced = currentUnsynced + 1;
      const nextDaily = currentDaily + 1;

      localStorage.setItem(unsyncedKey, String(nextUnsynced));
      localStorage.setItem(dailyKey, String(nextDaily));

      window.dispatchEvent(new Event("edumind_study_tick"));

      if (nextUnsynced >= 60) {
        localStorage.setItem(unsyncedKey, String(nextUnsynced - 60));

        api.post(`/students/study-session?student_id=${userId}`, {
          course_id: null,
          topic: "General Study",
          duration_minutes: 1,
        })
          .then(() => {
            window.dispatchEvent(new Event("edumind_db_sync"));
          })
          .catch((err) => {
            console.warn("[GlobalStudyTimer] Failed to sync study session to database, will retry...", err);
            const rolledBackUnsynced = Number(localStorage.getItem(unsyncedKey) || 0) + 60;
            localStorage.setItem(unsyncedKey, String(rolledBackUnsynced));
          });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
