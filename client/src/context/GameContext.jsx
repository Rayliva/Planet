import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { api } from '../utils/api.js';

const GameContext = createContext(null);

const LS_STATS = 'planet-guest-stats';
const LS_QUESTS = 'planet-guest-quests';

const DEFAULT_STATS = {
  stardust_balance: 50, current_streak: 0, longest_streak: 0,
  bingo_wins: 0, bosses_defeated: 0, pomodoros_completed: 0,
  total_tasks_completed: 0, total_bets_won: 0, total_bets_lost: 0, relaxation_uses: 0,
};

function loadLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

function saveLS(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

export function GameProvider({ children }) {
  const { user } = useAuth();
  const isGuest = user?.guest;
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [dailyQuests, setDailyQuests] = useState([]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    if (isGuest) { setStats(loadLS(LS_STATS, DEFAULT_STATS)); return; }
    try {
      const data = await api.get('/game/stats');
      setStats(data.stats);
    } catch { /* empty */ }
  }, [user, isGuest]);

  const fetchAchievements = useCallback(async () => {
    if (!user) return;
    if (isGuest) { setAchievements([]); return; }
    try {
      const data = await api.get('/game/achievements');
      setAchievements(data.achievements || []);
    } catch { /* empty */ }
  }, [user, isGuest]);

  const fetchDailyQuests = useCallback(async () => {
    if (!user) return;
    if (isGuest) {
      setDailyQuests(loadLS(LS_QUESTS, [
        { quest_type: 'complete_tasks', description: 'Complete 5 tasks', target_count: 5, progress: 0, completed: false },
        { quest_type: 'spin_wheel', description: 'Spin the wheel 3 times', target_count: 3, progress: 0, completed: false },
        { quest_type: 'use_relaxation', description: 'Use a relaxation tool', target_count: 1, progress: 0, completed: false },
      ]));
      return;
    }
    try {
      const data = await api.get('/game/daily-quests');
      setDailyQuests(data.quests || []);
    } catch { /* empty */ }
  }, [user, isGuest]);

  useEffect(() => {
    fetchStats();
    fetchAchievements();
    fetchDailyQuests();
  }, [fetchStats, fetchAchievements, fetchDailyQuests]);

  const STARDUST_AMOUNTS = {
    task_completed_jar: 5, jar_filled: 30,
    dice_challenge_low: 10, dice_challenge_mid: 15, dice_challenge_high: 30,
    plant_harvested: 10, boss_defeated: 75, pomodoro_completed: 15,
    wheel_respin: -10, bingo_win: 50,
  };

  const addStardust = useCallback(async (action) => {
    const amount = STARDUST_AMOUNTS[action];
    if (amount === undefined) return;
    if (isGuest) {
      setStats((prev) => {
        const updated = { ...prev, stardust_balance: (prev?.stardust_balance || 0) + amount };
        saveLS(LS_STATS, updated);
        return updated;
      });
      return { balance: (stats?.stardust_balance || 0) + amount };
    }
    const data = await api.post('/game/stardust', { action });
    setStats((prev) => prev ? { ...prev, stardust_balance: data.balance } : prev);
    return data;
  }, [isGuest, stats]);

  const recordQuestProgress = useCallback(async (questType, amount = 1) => {
    if (isGuest) {
      setDailyQuests((prev) => {
        const updated = prev.map((q) => {
          if (q.quest_type === questType && !q.completed) {
            const newProgress = Math.min((q.progress || 0) + amount, q.target_count);
            return { ...q, progress: newProgress, completed: newProgress >= q.target_count };
          }
          return q;
        });
        saveLS(LS_QUESTS, updated);
        return updated;
      });
      return;
    }
    try {
      const data = await api.post('/game/quest-progress', { questType, amount });
      setDailyQuests(data.quests || []);
      if (data.stats) setStats(data.stats);
      return data;
    } catch { /* empty */ }
  }, [isGuest]);

  const recordAchievementProgress = useCallback(async (achievementKey, amount = 1) => {
    if (isGuest) return null;
    try {
      const data = await api.post('/game/achievement-progress', { achievementKey, amount });
      if (data.achievements) setAchievements(data.achievements);
      if (data.newUnlock) return data.newUnlock;
    } catch { /* empty */ }
    return null;
  }, [isGuest]);

  const refreshAll = useCallback(() => {
    fetchStats();
    fetchAchievements();
    fetchDailyQuests();
  }, [fetchStats, fetchAchievements, fetchDailyQuests]);

  return (
    <GameContext.Provider value={{
      stats, achievements, dailyQuests,
      addStardust, recordQuestProgress, recordAchievementProgress, refreshAll, fetchStats,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
