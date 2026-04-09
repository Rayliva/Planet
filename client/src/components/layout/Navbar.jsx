import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useGame } from '../../context/GameContext.jsx';
import { useDarkMode } from '../../hooks/useDarkMode.js';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { stats, dailyQuests } = useGame();
  const location = useLocation();
  const [dark, setDark] = useDarkMode();

  const questsDone = dailyQuests.filter((q) => q.completed).length;
  const isHome = location.pathname === '/';
  const isGuest = user?.guest;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-surface-dark/80 border-b border-border dark:border-border-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className="text-2xl">🪐</span>
          <span className="font-bold text-xl tracking-tight text-ink dark:text-ink-dark">Planet</span>
        </Link>

        <div className="flex items-center gap-5">
          <div className="hidden sm:flex items-center gap-4 text-sm font-medium">
            <span className="flex items-center gap-1" title="Stardust">
              <span className="text-stardust text-base">✦</span>
              <span className="dark:text-ink-dark">{stats?.stardust_balance ?? 0}</span>
            </span>
            <span className="flex items-center gap-1" title="Streak">
              <span className="text-warm-orange text-base">🔥</span>
              <span className="dark:text-ink-dark">{stats?.current_streak ?? 0}d</span>
            </span>
            <span className="flex items-center gap-1" title="Daily quests">
              <span className="text-cool-teal text-base">⚡</span>
              <span className="dark:text-ink-dark">{questsDone}/3</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark(!dark)}
              className="px-2 py-1.5 rounded-btn text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title="Toggle dark mode"
            >
              {dark ? '☀️' : '🌙'}
            </button>
            {!isHome && (
              <Link to="/" className="px-3 py-1.5 rounded-btn text-sm font-medium text-ink dark:text-ink-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-underline">Home</Link>
            )}
            {isGuest ? (
              <Link
                to="/register"
                className="px-3 py-1.5 rounded-btn text-sm font-medium bg-cool-lavender text-white hover:opacity-90 transition-opacity no-underline"
              >
                Sign up to save
              </Link>
            ) : (
              <Link to="/profile" className="px-3 py-1.5 rounded-btn text-sm font-medium text-ink dark:text-ink-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors no-underline">
                {user?.display_name || 'Profile'}
              </Link>
            )}
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-btn text-sm font-medium text-ink-muted hover:text-ink dark:text-ink-muted-dark dark:hover:text-ink-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              {isGuest ? 'Exit' : 'Log out'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
