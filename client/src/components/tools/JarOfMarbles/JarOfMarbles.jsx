import { useState, useRef, useCallback, useEffect } from 'react';
import { useTasks } from '../../../context/TaskContext.jsx';
import { useGame } from '../../../context/GameContext.jsx';

const MARBLE_COLORS = {
  general: '#94a3b8', work: '#ff8c42', personal: '#a78bfa',
  health: '#4ecdc4', learning: '#7ec8e3', creative: '#ffd166',
};
const CATEGORY_LABELS = {
  general: 'General', work: 'Work', personal: 'Personal',
  health: 'Health', learning: 'Learning', creative: 'Creative',
};
const JAR_CAPACITY = 30;
const R = 6;
const D = R * 2;
const JAR_FLOOR = 148;
const DROP_Y = 15;

function lighten(hex, amt = 60) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.min(255, (n >> 16) + amt)},${Math.min(255, ((n >> 8) & 0xff) + amt)},${Math.min(255, (n & 0xff) + amt)})`;
}

function colorKey(color) {
  return Object.entries(MARBLE_COLORS).find(([, c]) => c === color)?.[0] || 'general';
}

// ── Jar geometry ─────────────────────────────────────────────

function jarBounds(y) {
  if (y <= 34) return { left: 36, right: 84 };
  if (y <= 140) {
    const t = (y - 34) / 106;
    return { left: 35 - t * 5, right: 85 + t * 5 };
  }
  const t = Math.min(1, (y - 140) / 12);
  return { left: 30 + t * 16, right: 90 - t * 16 };
}

function spotOpen(x, y, placed) {
  if (y > JAR_FLOOR) return false;
  const b = jarBounds(y);
  if (x < b.left || x > b.right) return false;
  for (const m of placed) {
    if (Math.hypot(x - m.x, y - m.y) < D - 0.3) return false;
  }
  return true;
}

// ── Physics-based settling ───────────────────────────────────
// Finds the lowest open position a marble can occupy given the
// jar walls, floor, and all previously-placed marbles.

function findRestPosition(dropX, placed) {
  if (placed.length === 0) {
    const b = jarBounds(JAR_FLOOR);
    return { x: Math.max(b.left, Math.min(b.right, dropX)), y: JAR_FLOOR };
  }

  const candidates = [];

  // 1 — Floor positions
  const fb = jarBounds(JAR_FLOOR);
  for (let x = fb.left; x <= fb.right; x += 1.5) {
    if (spotOpen(x, JAR_FLOOR, placed)) candidates.push({ x, y: JAR_FLOOR });
  }

  // 2 — Nestled between two marbles
  for (let i = 0; i < placed.length; i++) {
    const a = placed[i];
    for (let j = i + 1; j < placed.length; j++) {
      const b = placed[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (dist >= D * 2.1 || dist < D * 0.8) continue;
      const halfD = dist / 2;
      const hSq = D * D - halfD * halfD;
      if (hSq <= 0) continue;
      const h = Math.sqrt(hSq);
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const nx = -(b.y - a.y) / dist, ny = (b.x - a.x) / dist;
      for (const s of [1, -1]) {
        const px = mx + s * nx * h, py = my + s * ny * h;
        if (py >= Math.min(a.y, b.y)) continue;
        if (spotOpen(px, py, placed)) candidates.push({ x: px, y: py });
      }
    }
  }

  // 3 — Leaning on wall + one marble
  for (const m of placed) {
    const bounds = jarBounds(m.y - R);
    for (const wallX of [bounds.left, bounds.right]) {
      const dx = wallX - m.x, sq = D * D - dx * dx;
      if (sq <= 0) continue;
      const py = m.y - Math.sqrt(sq);
      if (spotOpen(wallX, py, placed)) candidates.push({ x: wallX, y: py });
    }
  }

  if (candidates.length === 0) {
    const topY = Math.min(...placed.map((m) => m.y)) - D;
    return { x: 60, y: Math.max(34, topY) };
  }

  // Prefer the lowest spot (highest y), biased toward dropX
  candidates.sort((a, b) => b.y - a.y);
  const best = candidates[0].y;
  const near = candidates.filter((c) => c.y >= best - 2);
  near.sort((a, b) => Math.abs(a.x - dropX) - Math.abs(b.x - dropX));
  return near[0];
}

// ── SVG defs ─────────────────────────────────────────────────

function MarbleDefs() {
  return (
    <defs>
      {Object.entries(MARBLE_COLORS).map(([key, color]) => (
        <radialGradient key={key} id={`marble-${key}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={lighten(color, 100)} />
          <stop offset="40%" stopColor={lighten(color, 30)} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      ))}
      <linearGradient id="jar-glass" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
        <stop offset="30%" stopColor="rgba(255,255,255,0.05)" />
        <stop offset="70%" stopColor="rgba(255,255,255,0.02)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
      </linearGradient>
      <linearGradient id="jar-fill" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="rgba(209,213,219,0.12)" />
        <stop offset="100%" stopColor="rgba(209,213,219,0.06)" />
      </linearGradient>
      <linearGradient id="jar-reflection" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>
      <filter id="marble-shadow">
        <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.18" />
      </filter>
      <filter id="jar-shadow">
        <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.08" />
      </filter>
    </defs>
  );
}

// ── Jar visual ───────────────────────────────────────────────

function JarSVG({ marbles, fillRatio }) {
  const glowOpacity = Math.min(fillRatio * 0.4, 0.35);

  return (
    <svg viewBox="0 0 120 170" className="w-full h-full" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.06))' }}>
      <MarbleDefs />

      {/* Ambient glow that grows with fill */}
      <ellipse cx="60" cy="130" rx={30 + fillRatio * 15} ry={10 + fillRatio * 6}
        fill="#4ecdc4" opacity={glowOpacity} style={{ transition: 'all 0.6s ease' }} />

      {/* Jar body */}
      <path d="M28,32 L22,140 Q22,155 38,155 L82,155 Q98,155 98,140 L92,32 Z"
        fill="url(#jar-fill)" stroke="#c9cdd4" strokeWidth="2" filter="url(#jar-shadow)" />
      <path d="M30,34 L25,138 Q25,152 39,152 L81,152 Q95,152 95,138 L90,34 Z"
        fill="url(#jar-glass)" />
      <path d="M32,40 L28,135 Q28,142 34,142 L36,142 L40,40 Z"
        fill="url(#jar-reflection)" opacity="0.7" />

      {/* Rim */}
      <rect x="25" y="26" width="70" height="8" rx="4"
        fill="rgba(209,213,219,0.25)" stroke="#c9cdd4" strokeWidth="2" />
      <rect x="28" y="27" width="64" height="3" rx="2" fill="rgba(255,255,255,0.3)" />

      {/* ── Marbles ── */}
      {marbles.map((m) => {
        const cat = colorKey(m.color);
        const fall = m.y - DROP_Y;
        const dur = (0.35 + Math.sqrt(fall / 135) * 0.45).toFixed(2);
        const bounce1 = Math.round(fall * 0.06);
        const bounce2 = Math.max(1, Math.round(fall * 0.018));

        return (
          <g key={m.id} filter="url(#marble-shadow)">
            {/* Drop + bounce (SMIL so units stay in SVG coords) */}
            {m.isNew && (
              <animateTransform
                attributeName="transform" type="translate"
                values={`0 ${-fall}; 0 4; 0 ${-bounce1}; 0 ${bounce2}; 0 0`}
                keyTimes="0; 0.48; 0.68; 0.85; 1"
                calcMode="spline"
                keySplines="0.4 0 0.9 0.4; 0 0 0.25 1; 0.4 0 0.9 0.4; 0 0 0.25 1"
                dur={`${dur}s`} fill="freeze" begin="0s" restart="never"
              />
            )}
            <circle cx={m.x} cy={m.y} r={R} fill={`url(#marble-${cat})`}>
              {/* Impact pulse */}
              {m.isNew && (
                <animate attributeName="r"
                  values={`${R}; ${R}; ${R * 1.25}; ${R * 0.88}; ${R}`}
                  keyTimes="0; 0.45; 0.52; 0.6; 0.72"
                  dur={`${dur}s`} fill="freeze" begin="0s" restart="never"
                />
              )}
            </circle>
            <circle cx={m.x - 1.8} cy={m.y - 1.8} r="2" fill="rgba(255,255,255,0.45)" />
          </g>
        );
      })}

      {/* Subtle fill-level line */}
      {marbles.length > 0 && marbles.length < JAR_CAPACITY && (() => {
        const topY = Math.min(...marbles.map((m) => m.y)) - R;
        return <line x1="24" y1={topY} x2="96" y2={topY}
          stroke="#4ecdc4" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.25" />;
      })()}
    </svg>
  );
}

// ── Progress ring ────────────────────────────────────────────

function ProgressRing({ ratio }) {
  const r = 18, circ = 2 * Math.PI * r, offset = circ * (1 - ratio);
  return (
    <svg width="44" height="44" className="shrink-0">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(78,205,196,0.15)" strokeWidth="3" />
      <circle cx="22" cy="22" r={r} fill="none" stroke="#4ecdc4" strokeWidth="3"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 22 22)" style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
      <text x="22" y="23" textAnchor="middle" dominantBaseline="middle"
        className="text-[10px] font-bold fill-ink">{Math.round(ratio * 100)}%</text>
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────

const STORAGE_MARBLES = 'planet-jar-marbles';
const STORAGE_FILLS = 'planet-jar-fills';

function loadMarbles() {
  try {
    const raw = localStorage.getItem(STORAGE_MARBLES);
    if (!raw) return [];
    return JSON.parse(raw).map((m) => ({ ...m, isNew: false }));
  } catch { return []; }
}

function loadFills() {
  try { return parseInt(localStorage.getItem(STORAGE_FILLS), 10) || 0; }
  catch { return 0; }
}

export default function JarOfMarbles() {
  const { incompleteTasks, completeTask } = useTasks();
  const { addStardust, recordQuestProgress, recordAchievementProgress, fetchStats } = useGame();

  const [marbles, setMarbles] = useState(loadMarbles);
  const [jarFills, setJarFills] = useState(loadFills);
  const [celebrating, setCelebrating] = useState(false);
  const [pending, setPending] = useState({});
  const filledRef = useRef(false);

  const isFull = marbles.length >= JAR_CAPACITY;
  const fillRatio = marbles.length / JAR_CAPACITY;

  useEffect(() => {
    const toSave = marbles.map(({ isNew, ...rest }) => rest);
    localStorage.setItem(STORAGE_MARBLES, JSON.stringify(toSave));
  }, [marbles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_FILLS, String(jarFills));
  }, [jarFills]);

  const handleComplete = useCallback(async (task) => {
    if (isFull) return;

    setPending((p) => ({ ...p, [task.id]: true }));

    const color = MARBLE_COLORS[task.category] || MARBLE_COLORS.general;
    const id = Date.now() + Math.random();
    const dropX = 38 + Math.random() * 44;

    setMarbles((prev) => {
      const pos = findRestPosition(dropX, prev);
      const updated = [...prev, { id, color, x: pos.x, y: pos.y, isNew: true }];
      if (updated.length >= JAR_CAPACITY) {
        filledRef.current = true;
        setCelebrating(true);
        setJarFills((f) => f + 1);
        setTimeout(() => { setMarbles([]); setCelebrating(false); }, 2200);
      }
      return updated;
    });

    try {
      await completeTask(task.id);
      await recordQuestProgress('complete_tasks');
      await recordQuestProgress('fill_marbles');
      await recordAchievementProgress('getting_started');
      await recordAchievementProgress('century');
      await addStardust('task_completed_jar');
      if (filledRef.current) {
        filledRef.current = false;
        await addStardust('jar_filled');
        await recordAchievementProgress('marble_collector');
      }
      await fetchStats();
    } finally {
      setPending((p) => { const { [task.id]: _, ...rest } = p; return rest; });
    }
  }, [isFull, completeTask, recordQuestProgress, recordAchievementProgress, addStardust, fetchStats]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink tracking-tight flex items-center gap-3">
          <span className="text-4xl">🫙</span> Jar of Marbles
        </h1>
        <p className="text-ink-muted mt-1">Complete tasks to drop marbles. Fill the jar for bonus Stardust.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* ── Jar column ── */}
        <div className="flex flex-col items-center lg:w-72 shrink-0">
          <div className={`relative w-56 h-80 transition-transform duration-300 ${celebrating ? 'jar-celebrate' : ''}`}>
            <JarSVG marbles={marbles} fillRatio={fillRatio} />
            {celebrating && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="celebration-burst" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4 bg-surface border border-border rounded-card px-5 py-3 shadow-sm w-full max-w-xs">
            <ProgressRing ratio={fillRatio} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">{marbles.length} / {JAR_CAPACITY} marbles</p>
              <p className="text-xs text-ink-muted">
                {jarFills > 0 ? `${jarFills} jar${jarFills !== 1 ? 's' : ''} filled — keep going!` : 'Complete tasks to fill the jar'}
              </p>
            </div>
          </div>

          {celebrating && (
            <div className="mt-4 bg-stardust/15 border border-stardust/40 rounded-card px-5 py-4 text-center animate-fade-in-up w-full max-w-xs">
              <p className="text-2xl mb-1">🎉✨</p>
              <p className="font-semibold text-ink text-sm">Jar filled!</p>
              <p className="text-stardust text-xs font-medium">+30 ✦ Stardust</p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {Object.entries(MARBLE_COLORS).map(([key, color]) => (
              <span key={key} className="flex items-center gap-1 text-[11px] text-ink-muted">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
                {CATEGORY_LABELS[key]}
              </span>
            ))}
          </div>
        </div>

        {/* ── Task list ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-semibold text-ink text-lg">Tasks</h3>
            <span className="text-xs text-ink-muted">{incompleteTasks.length} remaining</span>
          </div>

          {incompleteTasks.length === 0 ? (
            <div className="text-center py-16 text-ink-muted">
              <p className="text-4xl mb-3">🪹</p>
              <p className="text-sm font-medium">No tasks yet</p>
              <p className="text-xs mt-1">Head to the Master List to add some!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1 scrollbar-thin">
              {incompleteTasks.map((task) => {
                const cat = task.category || 'general';
                const color = MARBLE_COLORS[cat] || MARBLE_COLORS.general;
                return (
                  <button key={task.id} onClick={() => handleComplete(task)}
                    disabled={!!pending[task.id] || isFull}
                    className="w-full group flex items-center gap-3 bg-surface border border-border rounded-card px-4 py-3 transition-all duration-150 hover:border-jar/50 hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-left">
                    <span className="w-5 h-5 rounded-full shrink-0"
                      style={{ background: `radial-gradient(circle at 35% 35%, ${lighten(color, 80)}, ${color})`, boxShadow: `0 0 0 2px ${color}33` }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-ink truncate block">{task.title}</span>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-pill shrink-0"
                      style={{ backgroundColor: `${color}18`, color }}>
                      {CATEGORY_LABELS[cat]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
