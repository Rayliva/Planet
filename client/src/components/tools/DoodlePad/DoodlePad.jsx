import { useRef, useState, useEffect, useCallback } from 'react';
import { useGame } from '../../../context/GameContext.jsx';

const COLORS = ['#1e1e2e', '#ff6b6b', '#ff8c42', '#ffd166', '#4ecdc4', '#81ecb6', '#a78bfa', '#818cf8', '#7ec8e3', '#ffffff'];

export default function DoodlePad() {
  const { recordQuestProgress, recordAchievementProgress } = useGame();
  const canvasRef = useRef(null);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const drawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const trackedRef = useRef(false);

  const getCtx = () => canvasRef.current?.getContext('2d');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    const ctx = getCtx();
    ctx.scale(2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
  }, []);

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const startDraw = useCallback((e) => {
    e.preventDefault();
    drawingRef.current = true;
    lastPosRef.current = getPos(e);
    if (!trackedRef.current) {
      trackedRef.current = true;
      recordQuestProgress('use_relaxation');
      recordAchievementProgress('zen_master');
    }
  }, [getPos, recordQuestProgress, recordAchievementProgress]);

  const draw = useCallback((e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = getCtx();
    const pos = getPos(e);
    const last = lastPosRef.current;

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineWidth = isEraser ? brushSize * 3 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPosRef.current = pos;
  }, [color, brushSize, isEraser, getPos]);

  const stopDraw = useCallback(() => { drawingRef.current = false; }, []);

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">🎨 Doodle Pad</h1>
      <p className="text-ink-muted text-sm mb-6">Draw freely. No rules, no judgment.</p>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setIsEraser(false); }}
              className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${color === c && !isEraser ? 'border-ink scale-110' : 'border-border'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">Size:</span>
          <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} className="w-20 accent-cool-lavender" />
        </div>

        <button
          onClick={() => setIsEraser(!isEraser)}
          className={`px-3 py-1 rounded-btn text-sm font-medium transition cursor-pointer ${isEraser ? 'bg-ink text-white' : 'bg-gray-100 text-ink-muted hover:bg-gray-200'}`}
        >
          Eraser
        </button>

        <button onClick={clearCanvas} className="px-3 py-1 rounded-btn bg-gray-100 text-ink-muted text-sm font-medium hover:bg-gray-200 transition cursor-pointer">
          Clear
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-[500px] rounded-card border border-border bg-white cursor-crosshair touch-none"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
    </div>
  );
}
