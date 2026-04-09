import { useState, useRef } from 'react';
import { useTasks } from '../../../context/TaskContext.jsx';
import { useGame } from '../../../context/GameContext.jsx';

const COLORS = ['#ff6b6b', '#ff8c42', '#ffd166', '#4ecdc4', '#81ecb6', '#a78bfa', '#818cf8', '#7ec8e3', '#f4845f', '#ffb088'];

export default function WheelOfTodos() {
  const { incompleteTasks, completeTask } = useTasks();
  const { stats, addStardust, recordQuestProgress, recordAchievementProgress, fetchStats } = useGame();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const spinCount = useRef(0);

  const items = incompleteTasks.slice(0, 10);
  const sliceAngle = items.length > 0 ? 360 / items.length : 360;

  function spin() {
    if (spinning || items.length === 0) return;
    setSpinning(true);
    setShowResult(false);
    setSelected(null);

    const extraRotations = 5 + Math.floor(Math.random() * 5);
    const randomOffset = Math.random() * 360;
    const totalRotation = rotation + extraRotations * 360 + randomOffset;

    setRotation(totalRotation);
    spinCount.current++;

    setTimeout(async () => {
      const normalizedAngle = (360 - (totalRotation % 360)) % 360;
      const index = Math.floor(normalizedAngle / sliceAngle) % items.length;
      setSelected(items[index]);
      setShowResult(true);
      setSpinning(false);

      await recordQuestProgress('spin_wheel');
      await recordAchievementProgress('spinner');
    }, 4000);
  }

  async function handleRespin() {
    if (!stats || stats.stardust_balance < 10) return;
    await addStardust('wheel_respin');
    await fetchStats();
    spin();
  }

  async function handleComplete() {
    if (!selected?.id) return;
    await completeTask(selected.id);
    await recordQuestProgress('complete_tasks');
    await recordAchievementProgress('getting_started');
    await recordAchievementProgress('century');
    await fetchStats();
    setShowResult(false);
    setSelected(null);
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <span className="text-5xl block mb-4">🎡</span>
        <h2 className="text-xl font-bold text-ink mb-2">No tasks to spin</h2>
        <p className="text-ink-muted">Add some tasks to your Master List first!</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">🎡 Wheel of To-Dos</h1>
      <p className="text-ink-muted text-sm mb-8">Spin it. Do whatever it lands on. No excuses.</p>

      <div className="flex flex-col items-center">
        {/* Pointer */}
        <div className="text-3xl mb-2">▼</div>

        {/* Wheel */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 mb-8">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full drop-shadow-lg"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            }}
          >
            {items.map((item, i) => {
              const startAngle = i * sliceAngle;
              const endAngle = startAngle + sliceAngle;
              const startRad = (startAngle - 90) * (Math.PI / 180);
              const endRad = (endAngle - 90) * (Math.PI / 180);
              const x1 = 100 + 95 * Math.cos(startRad);
              const y1 = 100 + 95 * Math.sin(startRad);
              const x2 = 100 + 95 * Math.cos(endRad);
              const y2 = 100 + 95 * Math.sin(endRad);
              const largeArc = sliceAngle > 180 ? 1 : 0;
              const midRad = ((startAngle + endAngle) / 2 - 90) * (Math.PI / 180);
              const textX = 100 + 60 * Math.cos(midRad);
              const textY = 100 + 60 * Math.sin(midRad);
              const textRotation = (startAngle + endAngle) / 2;

              return (
                <g key={i}>
                  <path
                    d={`M100,100 L${x1},${y1} A95,95 0 ${largeArc},1 ${x2},${y2} Z`}
                    fill={COLORS[i % COLORS.length]}
                    stroke="white"
                    strokeWidth="1"
                  />
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize="5"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                  >
                    {(item.title || '').slice(0, 14)}
                  </text>
                </g>
              );
            })}
            <circle cx="100" cy="100" r="15" fill="white" stroke="#e5e7eb" strokeWidth="2" />
            <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fontSize="12">🎡</text>
          </svg>
        </div>

        <button
          onClick={spin}
          disabled={spinning}
          className="px-8 py-3 rounded-btn bg-wheel text-white font-bold text-lg hover:opacity-90 transition cursor-pointer disabled:opacity-50"
        >
          {spinning ? 'Spinning...' : 'SPIN!'}
        </button>

        {showResult && selected && (
          <div className="mt-8 bg-surface border border-border rounded-card p-6 text-center max-w-sm w-full">
            <p className="text-ink-muted text-sm mb-2">The wheel has spoken:</p>
            <h3 className="text-lg font-bold text-ink mb-4">{selected.title}</h3>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleComplete}
                className="px-5 py-2 rounded-btn bg-cool-teal text-white font-medium hover:opacity-90 transition cursor-pointer"
              >
                Done! ✓
              </button>
              <button
                onClick={handleRespin}
                disabled={!stats || stats.stardust_balance < 10}
                className="px-5 py-2 rounded-btn bg-gray-100 text-ink-muted font-medium hover:bg-gray-200 transition cursor-pointer disabled:opacity-50"
              >
                Re-spin (10 ✦)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
