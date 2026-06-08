// GlobalStudyTimer.jsx
// Tracks active study seconds on the website in real-time across tabs (using visibilityState)
// Syncs every 60 seconds to the backend study-sessions table.

import { useEffect } from "react";
import api from "../services/api";

export default function GlobalStudyTimer() {
  useEffect(() => {
    // Check login state
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

    const unsyncedKey = `edumind_unsynced_seconds_${userId}`;
    const totalKey = `edumind_total_seconds_${userId}`;

    // 1. Fetch initial database values to initialize/heal local storage accumulator
    api.get(`/students/study-sessions/${userId}`)
      .then((res) => {
        const studySessions = res.data || [];
        const totalMinutes = studySessions.reduce((acc, curr) => acc + curr.duration_minutes, 0);
        const dbSeconds = totalMinutes * 60;
        const currentLocal = Number(localStorage.getItem(totalKey) || 0);
        
        // If local is uninitialized or behind the DB (e.g. studied on another device), sync it
        if (currentLocal < dbSeconds) {
          localStorage.setItem(totalKey, String(dbSeconds));
          window.dispatchEvent(new Event("edumind_study_tick"));
        }
      })
      .catch((err) => {
        console.warn("[GlobalStudyTimer] Failed to fetch study sessions on mount:", err);
      });

    // 2. Set up interval
    const interval = setInterval(() => {
      // Only track if the page is visible to the student
      if (document.visibilityState !== "visible") return;

      // Increment total and unsynced seconds
      const currentUnsynced = Number(localStorage.getItem(unsyncedKey) || 0);
      const currentTotal = Number(localStorage.getItem(totalKey) || 0);

      const nextUnsynced = currentUnsynced + 1;
      const nextTotal = currentTotal + 1;

      localStorage.setItem(unsyncedKey, String(nextUnsynced));
      localStorage.setItem(totalKey, String(nextTotal));

      // Dispatch custom event to notify components (like Dashboard) to update display
      window.dispatchEvent(new Event("edumind_study_tick"));

      // If we accumulated 60 seconds (1 minute), sync to database
      if (nextUnsynced >= 60) {
        // Optimistically subtract 60 to prevent double trigger
        localStorage.setItem(unsyncedKey, String(nextUnsynced - 60));

        api.post(`/students/study-session?student_id=${userId}`, {
          course_id: null,
          topic: "General Study",
          duration_minutes: 1
        })
        .then(() => {
          // Notify dashboard to re-fetch database metrics
          window.dispatchEvent(new Event("edumind_db_sync"));
        })
        .catch((err) => {
          console.warn("[GlobalStudyTimer] Failed to sync study session to database, will retry...", err);
          // Rollback the unsynced seconds so we try syncing it again
          const rolledBackUnsynced = Number(localStorage.getItem(unsyncedKey) || 0) + 60;
          localStorage.setItem(unsyncedKey, String(rolledBackUnsynced));
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
