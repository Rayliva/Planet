import { useAuth } from '../context/AuthContext.jsx';
import { useGame } from '../context/GameContext.jsx';

export default function Profile() {
  const { user } = useAuth();
  const { stats, achievements } = useGame();

  const unlockedAchievements = achievements.filter((a) => a.unlocked_at);
  const lockedAchievements = achievements.filter((a) => !a.unlocked_at);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="bg-surface rounded-card border border-border p-8 mb-8 text-center">
        <div className="w-20 h-20 rounded-full bg-cool-lavender/20 flex items-center justify-center mx-auto mb-4 text-4xl">
          🪐
        </div>
        <h1 className="text-2xl font-bold text-ink">{user?.display_name}</h1>
        <p className="text-ink-muted text-sm mt-1">{user?.email}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Stardust', value: stats?.stardust_balance ?? 0, icon: '✦', color: 'text-stardust' },
          { label: 'Streak', value: `${stats?.current_streak ?? 0}d`, icon: '🔥', color: 'text-warm-orange' },
          { label: 'Longest Streak', value: `${stats?.longest_streak ?? 0}d`, icon: '🏆', color: 'text-warm-yellow' },
          { label: 'Tasks Done', value: stats?.total_tasks_completed ?? 0, icon: '✅', color: 'text-cool-teal' },
        ].map((s) => (
          <div key={s.label} className="bg-surface rounded-card border border-border p-4 text-center">
            <span className={`text-2xl ${s.color}`}>{s.icon}</span>
            <div className="text-2xl font-bold text-ink mt-1">{s.value}</div>
            <div className="text-xs text-ink-muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* More stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Bingo Wins', value: stats?.bingo_wins ?? 0 },
          { label: 'Bosses Defeated', value: stats?.bosses_defeated ?? 0 },
          { label: 'Pomodoros', value: stats?.pomodoros_completed ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-surface rounded-card border border-border p-4 text-center">
            <div className="text-xl font-bold text-ink">{s.value}</div>
            <div className="text-xs text-ink-muted mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <h2 className="text-xl font-bold text-ink mb-4">Achievements</h2>
      {unlockedAchievements.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {unlockedAchievements.map((a) => (
            <div key={a.id} className="bg-stardust/10 border border-stardust/30 rounded-card p-4 flex items-center gap-3">
              <span className="text-2xl">{a.icon}</span>
              <div>
                <div className="font-semibold text-ink text-sm">{a.name}</div>
                <div className="text-ink-muted text-xs">{a.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {lockedAchievements.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {lockedAchievements.map((a) => (
            <div key={a.id} className="bg-gray-50 border border-border rounded-card p-4 flex items-center gap-3 opacity-60">
              <span className="text-2xl grayscale">🔒</span>
              <div>
                <div className="font-semibold text-ink text-sm">{a.name}</div>
                <div className="text-ink-muted text-xs">{a.progress ?? 0}/{a.threshold} — {a.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
