import { useState, useEffect } from 'react';
import { useTasks } from '../../../context/TaskContext.jsx';
import { useGame } from '../../../context/GameContext.jsx';
import { api } from '../../../utils/api.js';

export default function BetOnYourself() {
  const { incompleteTasks } = useTasks();
  const { stats, fetchStats, recordQuestProgress, recordAchievementProgress } = useGame();

  const [bets, setBets] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [wager, setWager] = useState(10);
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/tools/bets').then((d) => setBets(d.bets || [])).catch(() => {});
  }, []);

  async function placeBet(e) {
    e.preventDefault();
    setError('');
    if (!selectedTask || !deadline) { setError('Select a task and deadline'); return; }
    if (wager < 5) { setError('Minimum wager is 5 ✦'); return; }
    if (wager > (stats?.stardust_balance || 0)) { setError('Not enough Stardust'); return; }

    try {
      const data = await api.post('/tools/bets', { taskId: parseInt(selectedTask), amount: wager, deadline });
      setBets((prev) => [data.bet, ...prev]);
      setSelectedTask('');
      setWager(10);
      setDeadline('');
      await recordQuestProgress('place_bet');
      await fetchStats();
    } catch (err) { setError(err.message); }
  }

  async function resolveBet(betId, outcome) {
    try {
      await api.put(`/tools/bets/${betId}/resolve`, { outcome });
      setBets((prev) => prev.map((b) => b.id === betId ? { ...b, outcome } : b));
      if (outcome === 'won') {
        await recordAchievementProgress('high_roller');
        const bet = bets.find((b) => b.id === betId);
        if (bet && bet.amount_wagered >= 500) await recordAchievementProgress('all_in');
      }
      await fetchStats();
    } catch { /* empty */ }
  }

  const pendingBets = bets.filter((b) => b.outcome === 'pending');
  const pastBets = bets.filter((b) => b.outcome !== 'pending');

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">🎲 Bet on Yourself</h1>
      <p className="text-ink-muted text-sm mb-6">Wager Stardust on completing a task. Win = double your wager. Fail = lose it.</p>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Place bet */}
        <div>
          <h3 className="font-semibold text-ink mb-3">Place a Bet</h3>
          <form onSubmit={placeBet} className="bg-surface border border-border rounded-card p-5 space-y-4">
            {error && <div className="bg-red-50 text-red-600 text-sm rounded-btn px-4 py-2">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Task</label>
              <select value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)} className="w-full px-3 py-2 rounded-btn border border-border bg-white text-ink text-sm cursor-pointer">
                <option value="">Pick a task...</option>
                {incompleteTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Wager (✦ Stardust)</label>
              <input type="number" min="5" max={stats?.stardust_balance || 0} value={wager} onChange={(e) => setWager(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-btn border border-border bg-white text-ink text-sm" />
              <p className="text-xs text-ink-muted mt-1">You have {stats?.stardust_balance ?? 0} ✦</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1">Deadline</label>
              <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-btn border border-border bg-white text-ink text-sm" />
            </div>

            <button type="submit" className="w-full py-2.5 rounded-btn bg-bet text-ink font-bold hover:opacity-90 transition cursor-pointer">
              Place Bet 🎲
            </button>
          </form>
        </div>

        {/* Active bets */}
        <div>
          <h3 className="font-semibold text-ink mb-3">Active Bets</h3>
          {pendingBets.length === 0 && <p className="text-ink-muted text-sm">No active bets. Place one!</p>}
          <div className="space-y-3">
            {pendingBets.map((bet) => {
              const task = incompleteTasks.find((t) => t.id === bet.task_id);
              const isOverdue = new Date(bet.deadline) < new Date();
              return (
                <div key={bet.id} className="bg-surface border border-border rounded-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-ink text-sm">{task?.title || `Task #${bet.task_id}`}</span>
                    <span className="font-bold text-stardust">{bet.amount_wagered} ✦</span>
                  </div>
                  <p className="text-xs text-ink-muted mb-3">
                    Due: {new Date(bet.deadline).toLocaleString()}
                    {isOverdue && <span className="text-warm-coral ml-1">(overdue!)</span>}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => resolveBet(bet.id, 'won')}
                      className="flex-1 py-1.5 rounded-btn bg-cool-teal text-white text-sm font-medium hover:opacity-90 transition cursor-pointer">
                      I did it! ✓
                    </button>
                    <button onClick={() => resolveBet(bet.id, 'lost')}
                      className="flex-1 py-1.5 rounded-btn bg-warm-coral text-white text-sm font-medium hover:opacity-90 transition cursor-pointer">
                      I failed ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {pastBets.length > 0 && (
            <>
              <h3 className="font-semibold text-ink mt-6 mb-3">History</h3>
              <div className="space-y-2">
                {pastBets.slice(0, 10).map((bet) => (
                  <div key={bet.id} className={`flex items-center justify-between px-4 py-2 rounded-card text-sm ${bet.outcome === 'won' ? 'bg-cool-teal/10' : 'bg-warm-coral/10'}`}>
                    <span className="text-ink">{bet.amount_wagered} ✦</span>
                    <span className={bet.outcome === 'won' ? 'text-cool-teal font-medium' : 'text-warm-coral font-medium'}>
                      {bet.outcome === 'won' ? `Won +${bet.amount_wagered * 2} ✦` : 'Lost'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
