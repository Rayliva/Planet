import { useState, useRef, useEffect, useCallback } from 'react';
import { useGame } from '../../../context/GameContext.jsx';

export default function VentVoid() {
  const { recordQuestProgress, recordAchievementProgress } = useGame();
  const [chars, setChars] = useState([]);
  const [tracked, setTracked] = useState(false);
  const nextId = useRef(0);
  const inputRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Backspace' || e.key === 'Delete' || e.ctrlKey || e.metaKey) return;
    if (e.key.length !== 1) return;

    const id = nextId.current++;
    setChars((prev) => [...prev, { id, char: e.key, x: 30 + Math.random() * 40, born: Date.now() }]);
  }, []);

  // Fade out chars
  useEffect(() => {
    const interval = setInterval(() => {
      setChars((prev) => prev.filter((c) => Date.now() - c.born < 2000));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Track relaxation use once
  useEffect(() => {
    if (!tracked && chars.length > 10) {
      setTracked(true);
      recordQuestProgress('use_relaxation');
      recordAchievementProgress('zen_master');
    }
  }, [chars.length, tracked, recordQuestProgress, recordAchievementProgress]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">🕳️ Vent Into the Void</h1>
      <p className="text-ink-muted text-sm mb-6">Type freely. Watch it dissolve. Nothing is saved. Ever.</p>

      <div
        className="relative w-full h-[500px] bg-gray-900 rounded-card overflow-hidden cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Hidden input to capture keystrokes */}
        <input
          ref={inputRef}
          onKeyDown={handleKeyDown}
          className="absolute opacity-0 w-0 h-0"
          aria-label="Vent input"
        />

        {/* Floating dissolving chars */}
        {chars.map((c) => {
          const age = Date.now() - c.born;
          const opacity = Math.max(0, 1 - age / 2000);
          const yOffset = (age / 2000) * 60;
          return (
            <span
              key={c.id}
              className="absolute text-xl font-mono text-white select-none pointer-events-none"
              style={{
                left: `${c.x}%`,
                top: `${50 - yOffset}%`,
                opacity,
                transition: 'opacity 0.1s',
              }}
            >
              {c.char}
            </span>
          );
        })}

        {/* Prompt */}
        {chars.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 text-lg">Click here and start typing...</p>
          </div>
        )}

        {/* Void gradient at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
      </div>

      <p className="text-xs text-ink-muted text-center mt-3">
        Nothing you type here is saved or transmitted. It stays between you and the void.
      </p>
    </div>
  );
}
