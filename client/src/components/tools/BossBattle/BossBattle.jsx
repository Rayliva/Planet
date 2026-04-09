import { useState } from 'react';
import { useGame } from '../../../context/GameContext.jsx';

export default function BossBattle() {
  const { addStardust, recordQuestProgress, recordAchievementProgress, fetchStats } = useGame();

  const [bossName, setBossName] = useState('');
  const [subtasks, setSubtasks] = useState(['']);
  const [boss, setBoss] = useState(null);
  const [defeated, setDefeated] = useState(false);

  function addSubtask() { setSubtasks([...subtasks, '']); }
  function updateSubtask(i, val) { setSubtasks(subtasks.map((s, j) => j === i ? val : s)); }
  function removeSubtask(i) { setSubtasks(subtasks.filter((_, j) => j !== i)); }

  function createBoss(e) {
    e.preventDefault();
    const validSubs = subtasks.filter((s) => s.trim());
    if (!bossName.trim() || validSubs.length === 0) return;
    const maxHp = validSubs.length * 20;
    setBoss({
      name: bossName.trim(),
      subtasks: validSubs.map((s, i) => ({ id: i, text: s.trim(), done: false, damage: 20 })),
      maxHp,
      currentHp: maxHp,
    });
    setDefeated(false);
  }

  async function attackBoss(subtaskId) {
    if (!boss || defeated) return;
    const updated = {
      ...boss,
      subtasks: boss.subtasks.map((s) => s.id === subtaskId ? { ...s, done: true } : s),
    };
    const sub = boss.subtasks.find((s) => s.id === subtaskId);
    updated.currentHp = Math.max(0, updated.currentHp - (sub?.damage || 20));
    setBoss(updated);

    if (updated.currentHp <= 0) {
      setDefeated(true);
      await addStardust('boss_defeated');
      await recordQuestProgress('defeat_boss');
      await recordAchievementProgress('boss_slayer');
      await fetchStats();
    }
  }

  function reset() {
    setBoss(null);
    setBossName('');
    setSubtasks(['']);
    setDefeated(false);
  }

  if (!boss) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ink mb-1">🐉 Boss Battle</h1>
        <p className="text-ink-muted text-sm mb-6">Turn a big task into a boss. Break it into subtasks to attack!</p>

        <form onSubmit={createBoss} className="bg-surface border border-border rounded-card p-6 max-w-lg mx-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Boss Name (the big task)</label>
            <input value={bossName} onChange={(e) => setBossName(e.target.value)} placeholder="e.g. Finish the project report"
              className="w-full px-3 py-2 rounded-btn border border-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-boss/50 transition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Subtasks (attacks)</label>
            {subtasks.map((s, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={s} onChange={(e) => updateSubtask(i, e.target.value)} placeholder={`Subtask ${i + 1}`}
                  className="flex-1 px-3 py-1.5 rounded-btn border border-border bg-white text-ink text-sm" />
                {subtasks.length > 1 && (
                  <button type="button" onClick={() => removeSubtask(i)} className="px-2 text-ink-muted hover:text-warm-coral cursor-pointer">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addSubtask} className="text-sm text-cool-lavender font-medium hover:underline cursor-pointer">+ Add subtask</button>
          </div>

          <button type="submit" className="w-full py-2.5 rounded-btn bg-boss text-white font-bold hover:opacity-90 transition cursor-pointer">
            ⚔️ Start Battle!
          </button>
        </form>
      </div>
    );
  }

  const hpPercent = (boss.currentHp / boss.maxHp) * 100;
  const hpColor = hpPercent > 50 ? '#ff6b6b' : hpPercent > 25 ? '#f5a623' : '#4ecdc4';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">🐉 Boss Battle</h1>
        <button onClick={reset} className="px-4 py-1.5 rounded-btn bg-gray-100 text-ink-muted text-sm font-medium hover:bg-gray-200 transition cursor-pointer">New Boss</button>
      </div>

      {/* Boss HP */}
      <div className="bg-surface border border-border rounded-card p-6 mb-6 text-center">
        <span className="text-5xl block mb-3">{defeated ? '💀' : '🐉'}</span>
        <h2 className="text-xl font-bold text-ink mb-3">{boss.name}</h2>

        {defeated ? (
          <div className="animate-pulse">
            <p className="text-xl font-bold text-cool-teal mb-1">DEFEATED!</p>
            <p className="text-ink-muted text-sm">You earned 75 ✦ Stardust!</p>
          </div>
        ) : (
          <div>
            <div className="w-full max-w-md mx-auto bg-gray-100 rounded-pill h-6 overflow-hidden mb-2">
              <div className="h-full rounded-pill transition-all duration-500" style={{ width: `${hpPercent}%`, backgroundColor: hpColor }} />
            </div>
            <p className="text-sm font-medium text-ink">{boss.currentHp} / {boss.maxHp} HP</p>
          </div>
        )}
      </div>

      {/* Subtask attacks */}
      <div className="grid sm:grid-cols-2 gap-3">
        {boss.subtasks.map((sub) => (
          <button
            key={sub.id}
            onClick={() => !sub.done && attackBoss(sub.id)}
            disabled={sub.done || defeated}
            className={`p-4 rounded-card text-left transition cursor-pointer ${
              sub.done
                ? 'bg-cool-teal/10 border border-cool-teal/30'
                : 'bg-surface border border-border hover:border-boss hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{sub.done ? '✅' : '⚔️'}</span>
              <div>
                <p className={`text-sm font-medium ${sub.done ? 'line-through text-ink-muted' : 'text-ink'}`}>{sub.text}</p>
                <p className="text-xs text-ink-muted">{sub.done ? 'Done!' : `-${sub.damage} HP`}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
