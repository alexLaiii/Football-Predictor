"use client";

import { useCallback, useEffect, useState } from "react";
import { getJTracker, resetJStreak, type JTrackerData, type JUserData } from "@/lib/api";

const START_DATE = "2026-05-20";
const USER_LABELS: Record<string, string> = { sir_kim: "Sir Kim", me: "Me" };
const USER_COLOR: Record<string, { tick: string; reset: string; badge: string }> = {
  sir_kim: { tick: "text-blue-400", reset: "text-red-400",  badge: "bg-blue-900/60 text-blue-300 border-blue-700" },
  me:      { tick: "text-green-400", reset: "text-red-400", badge: "bg-green-900/60 text-green-300 border-green-700" },
};
const USERS = ["sir_kim", "me"] as const;

type User = typeof USERS[number];

function getDayStatus(
  userData: JUserData,
  dateStr: string,
  isPast: boolean,
): "tick" | "reset" | "future" | "before_start" {
  if (dateStr < START_DATE) return "before_start";
  if (!isPast) return "future";
  if (userData.reset_dates.includes(dateStr)) return "reset";
  return "tick";
}

export default function JTrackerPage() {
  const [data, setData] = useState<JTrackerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<{ open: boolean; message: string; user: string }>({
    open: false, message: "", user: "",
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const fetchData = useCallback(async () => {
    const result = await getJTracker();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleReset(user: User) {
    setResetting((p) => ({ ...p, [user]: true }));
    try {
      const { grok_response } = await resetJStreak(user);
      setModal({ open: true, message: grok_response, user });
      await fetchData();
    } catch {
      alert("Reset failed.");
    } finally {
      setResetting((p) => ({ ...p, [user]: false }));
    }
  }

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  function toDateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  if (loading) return <p className="text-wc-muted p-8">Loading…</p>;
  if (!data)   return <p className="text-wc-muted p-8">Failed to load.</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Days Without Hitting J</h1>
        <p className="text-wc-muted mt-1 text-sm">Stay strong. Don&apos;t hit J.</p>
      </div>

      {/* User cards */}
      <div className="grid grid-cols-2 gap-4">
        {USERS.map((user) => {
          const ud = data[user];
          const colors = USER_COLOR[user];
          return (
            <div key={user} className="rounded-xl border border-wc-border bg-wc-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colors.badge}`}>
                  {USER_LABELS[user]}
                </span>
              </div>
              <div>
                <span className="text-4xl font-bold text-white">{ud.current_streak}</span>
                <span className="text-sm text-wc-muted ml-1">days clean</span>
              </div>
              <div className="text-xs text-wc-muted">
                Longest streak:{" "}
                <span className="text-white font-semibold">{ud.longest_streak} days</span>
              </div>
              <button
                onClick={() => handleReset(user)}
                disabled={resetting[user]}
                className="w-full rounded-lg bg-wc-red px-4 py-2 text-sm font-medium text-white hover:bg-[#a50d25] disabled:opacity-50 transition-colors"
              >
                {resetting[user] ? "Resetting…" : "I hit J 😔"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-wc-border bg-wc-card p-5">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className="text-wc-muted hover:text-white px-3 py-1 rounded transition-colors"
          >
            ◀
          </button>
          <span className="text-white font-semibold">
            {currentMonth.toLocaleString("en-GB", { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className="text-wc-muted hover:text-white px-3 py-1 rounded transition-colors"
          >
            ▶
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-wc-muted mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dateStr = toDateStr(day);
            const isToday = dateStr === todayStr;
            const isPast = dateStr <= todayStr;
            const isBeforeStart = dateStr < START_DATE;

            return (
              <div
                key={day}
                className={`rounded-lg p-1 min-h-[54px] flex flex-col items-center gap-0.5 pt-1 border ${
                  isBeforeStart
                    ? "border-wc-border/10 opacity-30"
                    : isToday
                    ? "border-wc-gold bg-wc-gold/5"
                    : "border-wc-border/20"
                }`}
              >
                <span className={`text-[11px] font-semibold ${isToday ? "text-wc-gold" : "text-wc-muted"}`}>
                  {day}
                </span>
                <div className="flex flex-col items-center gap-0.5 w-full">
                  {USERS.map((user) => {
                    const status = getDayStatus(data[user], dateStr, isPast);
                    const colors = USER_COLOR[user];
                    if (status === "future" || status === "before_start") return <div key={user} className="h-3" />;
                    return (
                      <span
                        key={user}
                        title={`${USER_LABELS[user]}: ${status === "tick" ? "clean" : "reset"}`}
                        className={`text-[11px] font-bold leading-none ${
                          status === "tick" ? colors.tick : colors.reset
                        }`}
                      >
                        {status === "tick" ? "✓" : "✗"}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-wc-muted border-t border-wc-border pt-3">
          <span><span className="text-blue-400 font-bold">✓</span> Sir Kim clean</span>
          <span><span className="text-green-400 font-bold">✓</span> Me clean</span>
          <span><span className="text-red-400 font-bold">✗</span> Reset</span>
        </div>
      </div>

      {/* Grok modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-wc-card border border-wc-border rounded-xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤬</span>
              <div>
                <p className="text-wc-gold font-semibold text-xs uppercase tracking-widest">垃圾</p>
                <p className="text-wc-muted text-xs">To {USER_LABELS[modal.user]}</p>
              </div>
            </div>
            <p className="text-white text-lg leading-relaxed">{modal.message}</p>
            <button
              onClick={() => setModal({ open: false, message: "", user: "" })}
              className="w-full rounded-lg border border-wc-border px-4 py-2 text-sm text-wc-muted hover:text-white hover:border-wc-blue transition-colors"
            >
              收皮
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
