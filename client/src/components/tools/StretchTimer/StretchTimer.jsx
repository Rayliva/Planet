import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../../../context/GameContext.jsx';

const STRETCHES = [
  { name: 'Neck Roll', instruction: 'Slowly roll your head in a circle. 5 times each direction.', duration: 30, icon: '🔄' },
  { name: 'Shoulder Shrug', instruction: 'Raise both shoulders to your ears, hold 3 seconds, release.', duration: 20, icon: '💪' },
  { name: 'Wrist Circles', instruction: 'Rotate your wrists slowly. 10 times each direction.', duration: 20, icon: '🤲' },
  { name: 'Seated Twist', instruction: 'Sit tall, twist to one side holding the chair. Hold 15 seconds each side.', duration: 30, icon: '🪑' },
  { name: 'Standing Stretch', instruction: 'Stand up, reach arms overhead, and stretch side to side.', duration: 25, icon: '🧍' },
  { name: 'Forward Fold', instruction: 'Stand or sit, bend forward and let your arms hang. Breathe deeply.', duration: 30, icon: '🙇' },
  { name: 'Chest Opener', instruction: 'Clasp hands behind your back, squeeze shoulder blades together.', duration: 20, icon: '🫁' },
  { name: 'Eye Rest', instruction: 'Close your eyes. Look up, down, left, right behind closed lids.', duration: 20, icon: '👁️' },
];

export default function StretchTimer() {
  const { recordQuestProgress, recordAchievementProgress } = useGame();
  const [running, setRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [completed, setCompleted] = useState(0);
  const intervalRef = useRef(null);
  const trackedRef = useRef(false);

  const current = STRETCHES[currentIndex];

  const nextStretch = useCallback(() => {
    setCompleted((prev) => prev + 1);
    if (currentIndex + 1 >= STRETCHES.length) {
      setRunning(false);
      clearInterval(intervalRef.current);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(STRETCHES[currentIndex + 1].duration);
    }

    if (!trackedRef.current) {
      trackedRef.current = true;
      recordQuestProgress('use_relaxation');
      recordAchievementProgress('zen_master');
    }
  }, [currentIndex, recordQuestProgress, recordAchievementProgress]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { nextStretch(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, nextStretch]);

  function start() {
    setRunning(true);
    setCurrentIndex(0);
    setTimeLeft(STRETCHES[0].duration);
    setCompleted(0);
    trackedRef.current = false;
  }

  function skip() { nextStretch(); }

  if (!running) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-ink mb-1">🧘 Stretch Timer</h1>
        <p className="text-ink-muted text-sm mb-8">Quick guided stretches to reset your body and mind.</p>

        <div className="max-w-md mx-auto">
          <div className="space-y-3 mb-8">
            {STRETCHES.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-surface border border-border rounded-card px-4 py-3">
                <span className="text-xl">{s.icon}</span>
                <div className="flex-1">
                  <span className="text-sm font-medium text-ink">{s.name}</span>
                  <span className="text-xs text-ink-muted ml-2">{s.duration}s</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            {completed > 0 && <p className="text-sm text-ink-muted mb-3">Last session: {completed} stretches completed</p>}
            <button onClick={start} className="px-8 py-3 rounded-btn bg-stretch text-white font-bold hover:opacity-90 transition cursor-pointer">
              Start Stretching
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = current ? ((current.duration - timeLeft) / current.duration) * 100 : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">🧘 Stretch Timer</h1>

      <div className="max-w-md mx-auto text-center">
        <span className="text-6xl block mb-4">{current.icon}</span>
        <h2 className="text-xl font-bold text-ink mb-2">{current.name}</h2>
        <p className="text-ink-muted mb-6">{current.instruction}</p>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-pill h-3 mb-4 overflow-hidden">
          <div className="h-full bg-stretch rounded-pill transition-all duration-1000 ease-linear" style={{ width: `${progress}%` }} />
        </div>

        <p className="text-3xl font-bold text-ink tabular-nums mb-6">{timeLeft}s</p>

        <div className="flex gap-3 justify-center">
          <button onClick={skip} className="px-6 py-2 rounded-btn bg-gray-100 text-ink-muted font-medium hover:bg-gray-200 transition cursor-pointer">
            Skip →
          </button>
          <button onClick={() => { setRunning(false); clearInterval(intervalRef.current); }} className="px-6 py-2 rounded-btn bg-gray-100 text-ink-muted font-medium hover:bg-gray-200 transition cursor-pointer">
            Stop
          </button>
        </div>

        <p className="text-xs text-ink-muted mt-4">{currentIndex + 1} of {STRETCHES.length} stretches</p>
      </div>
    </div>
  );
}
