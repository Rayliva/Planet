import { useState, useEffect } from 'react';
import { useGame } from '../../../context/GameContext.jsx';

const DEFAULT_AFFIRMATIONS = [
  "You're doing better than you think.",
  "Progress isn't always visible, but it's happening.",
  "It's okay to take things one step at a time.",
  "You are worthy of good things.",
  "Your pace is valid.",
  "Rest is productive too.",
  "You've survived every hard day so far.",
  "Small steps still move you forward.",
  "You don't have to be perfect to be amazing.",
  "It's okay to ask for help.",
  "Your brain works differently, and that's a superpower.",
  "You are more capable than you feel right now.",
  "Be gentle with yourself today.",
  "You are not your to-do list.",
  "Every finished task is proof you can do hard things.",
  "You deserve the same compassion you give others.",
  "Today's effort matters, even if it doesn't feel like it.",
  "Mistakes are data, not failures.",
  "You're allowed to take up space.",
  "The world is better with you in it.",
];

const CARD_COLORS = ['#ff6b6b', '#ff8c42', '#ffd166', '#4ecdc4', '#81ecb6', '#a78bfa', '#818cf8', '#7ec8e3', '#f4845f', '#ffb088'];

export default function Affirmations() {
  const { recordQuestProgress, recordAchievementProgress } = useGame();
  const [index, setIndex] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [tracked, setTracked] = useState(false);

  function next() {
    setFlipping(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % DEFAULT_AFFIRMATIONS.length);
      setFlipping(false);
    }, 300);

    if (!tracked) {
      setTracked(true);
      recordQuestProgress('use_relaxation');
      recordAchievementProgress('zen_master');
    }
  }

  function prev() {
    setFlipping(true);
    setTimeout(() => {
      setIndex((prev) => (prev - 1 + DEFAULT_AFFIRMATIONS.length) % DEFAULT_AFFIRMATIONS.length);
      setFlipping(false);
    }, 300);
  }

  const bgColor = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">💜 Affirmation Cards</h1>
      <p className="text-ink-muted text-sm mb-10">Flip through encouraging words. Take what you need.</p>

      <div className="flex flex-col items-center">
        {/* Card */}
        <div
          className={`w-full max-w-md aspect-[3/2] rounded-2xl flex items-center justify-center p-8 shadow-lg transition-all duration-300 ${
            flipping ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
          }`}
          style={{ backgroundColor: bgColor }}
        >
          <p className="text-white text-xl sm:text-2xl font-medium text-center leading-relaxed">
            {DEFAULT_AFFIRMATIONS[index]}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mt-8">
          <button onClick={prev} className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center text-lg cursor-pointer">
            ←
          </button>
          <span className="text-sm text-ink-muted tabular-nums">{index + 1} / {DEFAULT_AFFIRMATIONS.length}</span>
          <button onClick={next} className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center text-lg cursor-pointer">
            →
          </button>
        </div>
      </div>
    </div>
  );
}
