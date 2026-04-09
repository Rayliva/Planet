import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../../context/GameContext.jsx';

const PATTERNS = [
  { name: '4-7-8 Relaxing', phases: [{ label: 'Inhale', duration: 4 }, { label: 'Hold', duration: 7 }, { label: 'Exhale', duration: 8 }] },
  { name: 'Box Breathing', phases: [{ label: 'Inhale', duration: 4 }, { label: 'Hold', duration: 4 }, { label: 'Exhale', duration: 4 }, { label: 'Hold', duration: 4 }] },
  { name: 'Calm Breath', phases: [{ label: 'Inhale', duration: 4 }, { label: 'Exhale', duration: 6 }] },
];

export default function Breathing() {
  const { recordQuestProgress, recordAchievementProgress } = useGame();
  const [pattern, setPattern] = useState(PATTERNS[0]);
  const [active, setActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeInPhase, setTimeInPhase] = useState(0);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef(null);
  const trackedRef = useRef(false);

  const currentPhase = pattern.phases[phaseIndex];
  const progress = currentPhase ? timeInPhase / currentPhase.duration : 0;

  const isExpanding = currentPhase?.label === 'Inhale';
  const bubbleScale = isExpanding ? 0.5 + progress * 0.5 : currentPhase?.label === 'Exhale' ? 1 - progress * 0.5 : (phaseIndex === 0 ? 0.5 : 1);

  const advancePhase = useCallback(() => {
    setPhaseIndex((prev) => {
      const next = (prev + 1) % pattern.phases.length;
      if (next === 0) {
        setCycles((c) => c + 1);
        if (!trackedRef.current) {
          trackedRef.current = true;
          recordQuestProgress('use_relaxation');
          recordAchievementProgress('zen_master');
        }
      }
      return next;
    });
    setTimeInPhase(0);
  }, [pattern.phases.length, recordQuestProgress, recordAchievementProgress]);

  useEffect(() => {
    if (!active) return;
    intervalRef.current = setInterval(() => {
      setTimeInPhase((prev) => {
        if (prev + 0.1 >= currentPhase.duration) {
          advancePhase();
          return 0;
        }
        return prev + 0.1;
      });
    }, 100);
    return () => clearInterval(intervalRef.current);
  }, [active, currentPhase, advancePhase]);

  function start() { setActive(true); setPhaseIndex(0); setTimeInPhase(0); setCycles(0); trackedRef.current = false; }
  function stop() { setActive(false); clearInterval(intervalRef.current); }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">🫧 Breathing Bubbles</h1>
      <p className="text-ink-muted text-sm mb-8">Follow the bubble. Breathe in, hold, breathe out.</p>

      {/* Pattern selector */}
      <div className="flex gap-2 justify-center mb-8">
        {PATTERNS.map((p) => (
          <button
            key={p.name}
            onClick={() => { if (!active) setPattern(p); }}
            className={`px-4 py-1.5 rounded-pill text-sm font-medium transition cursor-pointer ${
              pattern.name === p.name ? 'bg-breathing text-white' : 'bg-gray-100 text-ink-muted hover:bg-gray-200'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Bubble */}
      <div className="flex flex-col items-center">
        <div className="relative w-64 h-64 flex items-center justify-center mb-6">
          <div
            className="rounded-full bg-breathing/20 border-4 border-breathing/40 flex items-center justify-center transition-all"
            style={{
              width: `${bubbleScale * 100}%`,
              height: `${bubbleScale * 100}%`,
              transitionDuration: active ? '100ms' : '0ms',
            }}
          >
            <span className="text-lg font-medium text-breathing">
              {active ? currentPhase?.label : 'Ready'}
            </span>
          </div>
        </div>

        {/* Timer */}
        {active && (
          <p className="text-2xl font-bold text-ink tabular-nums mb-4">
            {Math.ceil(currentPhase.duration - timeInPhase)}
          </p>
        )}

        <button
          onClick={active ? stop : start}
          className={`px-8 py-3 rounded-btn font-bold transition cursor-pointer ${
            active ? 'bg-gray-200 text-ink hover:bg-gray-300' : 'bg-breathing text-white hover:opacity-90'
          }`}
        >
          {active ? 'Stop' : 'Begin'}
        </button>

        {cycles > 0 && (
          <p className="text-sm text-ink-muted mt-4">{cycles} cycle{cycles !== 1 ? 's' : ''} completed</p>
        )}
      </div>
    </div>
  );
}
