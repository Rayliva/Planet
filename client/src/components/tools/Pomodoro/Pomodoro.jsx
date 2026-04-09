import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../../context/GameContext.jsx';

const PRESETS = [
  { label: '25 / 5', work: 25, rest: 5 },
  { label: '50 / 10', work: 50, rest: 10 },
  { label: '15 / 3', work: 15, rest: 3 },
];

export default function Pomodoro() {
  const { addStardust, recordQuestProgress, recordAchievementProgress, fetchStats } = useGame();

  const [preset, setPreset] = useState(PRESETS[0]);
  const [phase, setPhase] = useState('idle'); // idle | work | rest | done
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].work * 60);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef(null);

  const totalTime = phase === 'work' ? preset.work * 60 : preset.rest * 60;
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const finishWork = useCallback(async () => {
    const newSessions = sessions + 1;
    setSessions(newSessions);
    await addStardust('pomodoro_completed');
    await recordQuestProgress('pomodoro_sessions');
    await recordAchievementProgress('pomodoro_pro');
    await fetchStats();
    setPhase('rest');
    setTimeLeft(preset.rest * 60);
  }, [sessions, addStardust, recordQuestProgress, recordAchievementProgress, fetchStats, preset.rest]);

  useEffect(() => {
    if (phase === 'idle' || phase === 'done') return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          if (phase === 'work') {
            finishWork();
          } else {
            setPhase('done');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [phase, finishWork]);

  function start() {
    setPhase('work');
    setTimeLeft(preset.work * 60);
    setSessions(0);
  }

  function reset() {
    clearInterval(intervalRef.current);
    setPhase('idle');
    setTimeLeft(preset.work * 60);
  }

  function changePreset(p) {
    setPreset(p);
    if (phase === 'idle') setTimeLeft(p.work * 60);
  }

  const ringColor = phase === 'work' ? '#f4845f' : phase === 'rest' ? '#4ecdc4' : '#e5e7eb';

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">🍅 Pomodoro Timer</h1>
      <p className="text-ink-muted text-sm mb-8">Focus in sprints. Earn Stardust and bricks for your fortress.</p>

      <div className="flex flex-col items-center">
        {/* Presets */}
        <div className="flex gap-2 mb-8">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => changePreset(p)}
              className={`px-4 py-1.5 rounded-pill text-sm font-medium transition cursor-pointer ${
                preset === p ? 'bg-pomodoro text-white' : 'bg-gray-100 text-ink-muted hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Timer ring */}
        <div className="relative w-64 h-64 mb-8">
          <svg viewBox="0 0 260 260" className="w-full h-full -rotate-90">
            <circle cx="130" cy="130" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="8" />
            <circle
              cx="130" cy="130" r={radius} fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-ink tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-sm text-ink-muted mt-1 capitalize">
              {phase === 'idle' ? 'Ready' : phase === 'done' ? 'Done!' : phase}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {phase === 'idle' || phase === 'done' ? (
            <button onClick={start} className="px-8 py-3 rounded-btn bg-pomodoro text-white font-bold hover:opacity-90 transition cursor-pointer">
              {phase === 'done' ? 'Start Again' : 'Start'}
            </button>
          ) : (
            <button onClick={reset} className="px-8 py-3 rounded-btn bg-gray-200 text-ink font-bold hover:bg-gray-300 transition cursor-pointer">
              Reset
            </button>
          )}
        </div>

        {/* Session count */}
        <div className="mt-8 text-center">
          <div className="flex gap-1 justify-center mb-2">
            {Array.from({ length: Math.min(sessions, 12) }).map((_, i) => (
              <span key={i} className="text-lg">🍅</span>
            ))}
            {sessions === 0 && <span className="text-ink-muted text-sm">No sessions yet</span>}
          </div>
          {sessions > 0 && (
            <p className="text-sm text-ink-muted">{sessions} session{sessions !== 1 ? 's' : ''} completed</p>
          )}
        </div>
      </div>
    </div>
  );
}
