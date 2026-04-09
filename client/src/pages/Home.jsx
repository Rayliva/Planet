import ToolGrid from '../components/layout/ToolGrid.jsx';
import { useGame } from '../context/GameContext.jsx';

const productivityTools = [
  { id: 'master-list', name: 'Master List', description: 'Your central task hub — add, organize, and conquer your to-dos.', icon: '📋', color: '#1e1e2e' },
  { id: 'bingo', name: 'Bingo Board', description: 'Fill a 5×5 board from your tasks. Complete them to get bingo!', icon: '🎯', color: '#ff6b6b' },
  { id: 'wheel', name: 'Wheel of To-Dos', description: 'Spin the wheel and do whatever it lands on.', icon: '🎡', color: '#ff8c42' },
  { id: 'bet', name: 'Bet on Yourself', description: 'Wager Stardust on completing a task by the deadline.', icon: '🎲', color: '#ffd166' },
  { id: 'jar', name: 'Jar of Marbles', description: 'Watch colorful marbles fill up your jar with each completed task.', icon: '🫙', color: '#4ecdc4' },
  { id: 'pomodoro', name: 'Pomodoro Timer', description: 'Focus in timed sprints. Earn bricks for your fortress!', icon: '🍅', color: '#f4845f' },
  { id: 'calendar', name: 'Calendar', description: 'See your tasks, deadlines, and wins on a monthly view.', icon: '📅', color: '#7ec8e3' },
  { id: 'boss', name: 'Boss Battle', description: 'Turn a big task into a boss fight. Break it down and attack!', icon: '🐉', color: '#f5a623' },
  { id: 'garden', name: 'Task Garden', description: 'Plant seeds for tasks. They grow, bloom, or wilt.', icon: '🌱', color: '#81ecb6' },
  { id: 'fortress', name: 'Focus Fortress', description: 'Build a fortress brick by brick with Pomodoro sessions.', icon: '🏰', color: '#a78bfa' },
  { id: 'dice', name: 'Dice Roll', description: 'Roll the dice and commit to that many tasks this hour.', icon: '🎲', color: '#ffb088' },
];

const relaxationTools = [
  { id: 'void', name: 'Vent Into the Void', description: 'Type it out. Watch it disappear. Nothing is saved.', icon: '🕳️', color: '#374151' },
  { id: 'breathing', name: 'Breathing Bubbles', description: 'Follow the bubble. Inhale, hold, exhale, repeat.', icon: '🫧', color: '#818cf8' },
  { id: 'soundscape', name: 'Soundscape Mixer', description: 'Layer rain, fire, cafe, forest — build your perfect ambiance.', icon: '🎧', color: '#94a3b8' },
  { id: 'doodle', name: 'Doodle Pad', description: 'Draw freely. No rules, no judgment.', icon: '🎨', color: '#fbbf24' },
  { id: 'affirmations', name: 'Affirmation Cards', description: 'Flip through encouraging words when you need a boost.', icon: '💜', color: '#a78bfa' },
  { id: 'stretch', name: 'Stretch Timer', description: 'Quick guided stretches to reset your body.', icon: '🧘', color: '#4ecdc4' },
  { id: 'mindful', name: 'Mindful Minute', description: 'One minute of calm. Watch, breathe, be.', icon: '🌊', color: '#7ec8e3' },
];

export default function Home() {
  const { stats, dailyQuests } = useGame();
  const questsDone = dailyQuests.filter((q) => q.completed).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Hero */}
      <div className="text-center mb-14">
        <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight">
          <span className="mr-2">🪐</span> Welcome to Planet
        </h1>
        <p className="text-ink-muted text-lg mt-3 max-w-xl mx-auto">
          Your productivity universe. Pick a tool, get things done your way.
        </p>

        {/* Quick stats for mobile */}
        <div className="flex sm:hidden items-center justify-center gap-6 mt-6 text-sm font-medium">
          <span className="flex items-center gap-1">
            <span className="text-stardust">✦</span> {stats?.stardust_balance ?? 0}
          </span>
          <span className="flex items-center gap-1">
            🔥 {stats?.current_streak ?? 0}d
          </span>
          <span className="flex items-center gap-1">
            ⚡ {questsDone}/3
          </span>
        </div>
      </div>

      <ToolGrid
        title="🚀 Get It Done"
        subtitle="Tackle your tasks with tools that match your energy."
        tools={productivityTools}
      />

      <ToolGrid
        title="🌿 Recharge"
        subtitle="Taking a break is part of getting things done."
        tools={relaxationTools}
      />
    </div>
  );
}
