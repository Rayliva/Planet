import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../../context/GameContext.jsx';

export default function MindfulMinute() {
  const { recordQuestProgress, recordAchievementProgress } = useGame();
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [done, setDone] = useState(false);
  const [particles, setParticles] = useState([]);
  const intervalRef = useRef(null);
  const particleRef = useRef(null);

  const finish = useCallback(() => {
    setActive(false);
    setDone(true);
    clearInterval(intervalRef.current);
    clearInterval(particleRef.current);
    recordQuestProgress('use_relaxation');
    recordAchievementProgress('zen_master');
  }, [recordQuestProgress, recordAchievementProgress]);

  useEffect(() => {
    if (!active) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { finish(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [active, finish]);

  // Particle animation
  useEffect(() => {
    if (!active) return;
    particleRef.current = setInterval(() => {
      setParticles((prev) => {
        const newP = prev.filter((p) => Date.now() - p.born < 4000);
        if (newP.length < 20) {
          newP.push({
            id: Date.now() + Math.random(),
            x: Math.random() * 100,
            y: 100,
            born: Date.now(),
          });
        }
        return newP;
      });
    }, 200);
    return () => clearInterval(particleRef.current);
  }, [active]);

  function start() {
    setActive(true);
    setDone(false);
    setTimeLeft(60);
    setParticles([]);
  }

  const progress = ((60 - timeLeft) / 60) * 100;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">🌊 Mindful Minute</h1>
      <p className="text-ink-muted text-sm mb-8">One minute of calm. Watch, breathe, be present.</p>

      <div className="flex flex-col items-center">
        {/* Visualization */}
        <div className="relative w-full max-w-lg h-80 bg-gradient-to-b from-cool-sky/20 to-cool-periwinkle/10 rounded-card overflow-hidden mb-8">
          {active && particles.map((p) => {
            const age = Date.now() - p.born;
            const opacity = Math.max(0, 1 - age / 4000);
            const y = p.y - (age / 4000) * 100;
            return (
              <div
                key={p.id}
                className="absolute w-2 h-2 rounded-full bg-cool-lavender/60"
                style={{
                  left: `${p.x}%`,
                  top: `${y}%`,
                  opacity,
                  transition: 'opacity 0.2s',
                }}
              />
            );
          })}

          {!active && !done && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-ink-muted text-lg">Take a moment for yourself.</p>
            </div>
          )}

          {done && (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
              <span className="text-5xl">🕊️</span>
              <p className="text-xl font-medium text-ink">Moment complete.</p>
              <p className="text-sm text-ink-muted">You gave yourself a gift.</p>
            </div>
          )}

          {active && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-light text-cool-lavender/70 tabular-nums">{timeLeft}</span>
            </div>
          )}
        </div>

        {/* Progress ring */}
        {active && (
          <div className="w-full max-w-lg bg-gray-100 rounded-pill h-1.5 mb-6 overflow-hidden">
            <div className="h-full bg-cool-lavender rounded-pill transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} />
          </div>
        )}

        <button
          onClick={start}
          disabled={active}
          className={`px-8 py-3 rounded-btn font-bold transition cursor-pointer ${
            active ? 'bg-gray-200 text-ink-muted' : 'bg-mindful text-white hover:opacity-90'
          }`}
        >
          {done ? 'Again' : active ? 'Breathing...' : 'Begin'}
        </button>
      </div>
    </div>
  );
}
