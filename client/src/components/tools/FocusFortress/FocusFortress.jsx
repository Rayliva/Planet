import { useState, useEffect } from 'react';
import { useGame } from '../../../context/GameContext.jsx';
import { api } from '../../../utils/api.js';

const ROWS = 10;
const COLS = 10;
const TOTAL_BRICKS = ROWS * COLS;

const BRICK_COLORS = ['#d4a574', '#c99a65', '#be9056', '#b38647', '#deb287'];

export default function FocusFortress() {
  const { stats, recordAchievementProgress } = useGame();
  const [bricks, setBricks] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/tools/state/fortress').then((d) => {
      if (d.state?.bricks) setBricks(d.state.bricks);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const pomodoros = stats?.pomodoros_completed || 0;
    if (pomodoros > bricks) {
      const newBricks = Math.min(pomodoros, TOTAL_BRICKS);
      setBricks(newBricks);
      api.put('/tools/state/fortress', { state: { bricks: newBricks } });
      if (newBricks >= TOTAL_BRICKS) recordAchievementProgress('architect');
    }
  }, [stats?.pomodoros_completed, loaded, bricks, recordAchievementProgress]);

  const isComplete = bricks >= TOTAL_BRICKS;
  const filledRows = [];
  for (let r = ROWS - 1; r >= 0; r--) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const idx = r * COLS + c;
      row.push(idx < bricks);
    }
    filledRows.push(row);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">🏰 Focus Fortress</h1>
      <p className="text-ink-muted text-sm mb-6">Each Pomodoro session adds a brick. Build your castle!</p>

      <div className="flex flex-col items-center">
        {/* Fortress */}
        <div className="mb-6">
          {/* Roof */}
          {isComplete && (
            <div className="flex justify-center mb-1">
              <div className="w-0 h-0 border-l-[80px] border-r-[80px] border-b-[40px] border-l-transparent border-r-transparent border-b-amber-700" />
            </div>
          )}
          {/* Flag */}
          {isComplete && <div className="text-center text-2xl mb-1">🏴</div>}

          {/* Bricks */}
          <div className="border-2 border-amber-800/30 rounded-sm p-1 bg-amber-50">
            {filledRows.map((row, ri) => (
              <div key={ri} className="flex gap-[2px] mb-[2px]">
                {row.map((filled, ci) => (
                  <div
                    key={ci}
                    className="w-6 h-4 sm:w-8 sm:h-5 rounded-sm transition-all duration-300"
                    style={{
                      backgroundColor: filled ? BRICK_COLORS[(ri + ci) % BRICK_COLORS.length] : '#f5f0e8',
                      opacity: filled ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg font-bold text-ink">{bricks} / {TOTAL_BRICKS} bricks</p>
          <p className="text-sm text-ink-muted mt-1">
            {isComplete ? '🎉 Fortress complete! You are an Architect!' : `Complete ${TOTAL_BRICKS - bricks} more Pomodoro sessions`}
          </p>
        </div>
      </div>
    </div>
  );
}
