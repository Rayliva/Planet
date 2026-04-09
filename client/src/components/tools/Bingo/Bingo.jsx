import { useState, useEffect, useCallback } from 'react';
import { useTasks } from '../../../context/TaskContext.jsx';
import { useGame } from '../../../context/GameContext.jsx';

function shuffle(arr, seed = Date.now()) {
  const a = [...arr];
  let m = a.length, t, i;
  let s = seed;
  while (m) {
    s = (s * 9301 + 49297) % 233280;
    i = Math.floor((s / 233280) * m--);
    t = a[m]; a[m] = a[i]; a[i] = t;
  }
  return a;
}

function checkBingo(marked) {
  const lines = [];
  for (let r = 0; r < 5; r++) lines.push([0,1,2,3,4].map((c) => r * 5 + c));
  for (let c = 0; c < 5; c++) lines.push([0,1,2,3,4].map((r) => r * 5 + c));
  lines.push([0,6,12,18,24]);
  lines.push([4,8,12,16,20]);
  return lines.some((line) => line.every((i) => marked[i]));
}

export default function Bingo() {
  const { incompleteTasks, completeTask } = useTasks();
  const { addStardust, recordQuestProgress, recordAchievementProgress, fetchStats } = useGame();

  const [board, setBoard] = useState([]);
  const [marked, setMarked] = useState(Array(25).fill(false));
  const [won, setWon] = useState(false);

  const generateBoard = useCallback(() => {
    const shuffled = shuffle(incompleteTasks, Date.now());
    const selected = shuffled.slice(0, 25);
    while (selected.length < 25) {
      selected.push({ id: null, title: '(free space)', isFree: true });
    }
    // center is always free
    if (!selected[12]?.isFree) {
      selected[12] = { id: null, title: '⭐ FREE', isFree: true };
    }
    setBoard(selected);
    const newMarked = Array(25).fill(false);
    newMarked[12] = true; // free space
    setMarked(newMarked);
    setWon(false);
  }, [incompleteTasks]);

  useEffect(() => {
    if (board.length === 0 && incompleteTasks.length > 0) generateBoard();
  }, [incompleteTasks, board.length, generateBoard]);

  async function handleMark(index) {
    if (won || marked[index]) return;
    const cell = board[index];
    if (!cell || cell.isFree) return;

    if (cell.id) {
      await completeTask(cell.id);
      await recordQuestProgress('complete_tasks');
      await recordAchievementProgress('getting_started');
      await recordAchievementProgress('century');
    }

    const newMarked = [...marked];
    newMarked[index] = true;
    setMarked(newMarked);

    if (checkBingo(newMarked)) {
      setWon(true);
      await addStardust('bingo_win');
      await recordQuestProgress('win_bingo');
      await recordAchievementProgress('bingo_master');
      await fetchStats();
    }
  }

  if (incompleteTasks.length === 0) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl block mb-4">🎯</span>
        <h2 className="text-xl font-bold text-ink mb-2">No tasks for Bingo</h2>
        <p className="text-ink-muted">Add some tasks to your Master List first!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">🎯 Bingo Board</h1>
          <p className="text-ink-muted text-sm">Complete tasks to mark squares. Get 5 in a row to win!</p>
        </div>
        <button
          onClick={generateBoard}
          className="px-4 py-2 rounded-btn bg-bingo text-white font-medium hover:opacity-90 transition cursor-pointer"
        >
          New Board
        </button>
      </div>

      {won && (
        <div className="bg-stardust/20 border border-stardust rounded-card p-6 mb-6 text-center animate-pulse">
          <span className="text-4xl block mb-2">🎉</span>
          <h2 className="text-xl font-bold text-ink">BINGO!</h2>
          <p className="text-ink-muted">You earned 50 ✦ Stardust!</p>
        </div>
      )}

      <div className="grid grid-cols-5 gap-2 max-w-lg mx-auto">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleMark(i)}
            disabled={marked[i] || won}
            className={`aspect-square rounded-card p-2 text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center justify-center text-center leading-tight
              ${marked[i]
                ? 'bg-bingo text-white scale-95 shadow-inner'
                : 'bg-surface border border-border hover:bg-bingo/10 hover:border-bingo/30'
              }
              ${cell?.isFree ? 'bg-stardust/30 text-ink font-bold' : ''}
            `}
          >
            {marked[i] && !cell?.isFree ? '✓' : (cell?.title || '—')}
          </button>
        ))}
      </div>
    </div>
  );
}
