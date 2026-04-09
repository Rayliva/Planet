import { useState, useRef, useEffect } from 'react';
import { useGame } from '../../../context/GameContext.jsx';

const SOUNDS = [
  { id: 'rain', name: 'Rain', icon: '🌧️', frequency: 200 },
  { id: 'fire', name: 'Fireplace', icon: '🔥', frequency: 150 },
  { id: 'cafe', name: 'Cafe', icon: '☕', frequency: 300 },
  { id: 'forest', name: 'Forest', icon: '🌲', frequency: 250 },
  { id: 'ocean', name: 'Ocean', icon: '🌊', frequency: 100 },
  { id: 'thunder', name: 'Thunder', icon: '⛈️', frequency: 80 },
  { id: 'wind', name: 'Wind', icon: '💨', frequency: 180 },
  { id: 'birds', name: 'Birds', icon: '🐦', frequency: 400 },
];

function createNoise(audioCtx, frequency) {
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);

  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
    b6 = white * 0.115926;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = frequency;

  const gain = audioCtx.createGain();
  gain.gain.value = 0;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();

  return { source, gain, filter };
}

export default function Soundscape() {
  const { recordQuestProgress, recordAchievementProgress } = useGame();
  const [volumes, setVolumes] = useState(() => Object.fromEntries(SOUNDS.map((s) => [s.id, 0])));
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const nodesRef = useRef({});
  const trackedRef = useRef(false);

  function ensureAudioCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      for (const sound of SOUNDS) {
        nodesRef.current[sound.id] = createNoise(audioCtxRef.current, sound.frequency);
      }
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  }

  function togglePlay() {
    if (!playing) {
      ensureAudioCtx();
      setPlaying(true);
      if (!trackedRef.current) {
        trackedRef.current = true;
        recordQuestProgress('use_relaxation');
        recordAchievementProgress('zen_master');
      }
    } else {
      audioCtxRef.current?.suspend();
      setPlaying(false);
    }
  }

  function setVolume(id, value) {
    const v = parseFloat(value);
    setVolumes((prev) => ({ ...prev, [id]: v }));
    if (nodesRef.current[id]) {
      nodesRef.current[id].gain.gain.setTargetAtTime(v, audioCtxRef.current.currentTime, 0.1);
    }
  }

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  const anyActive = Object.values(volumes).some((v) => v > 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">🎧 Soundscape Mixer</h1>
      <p className="text-ink-muted text-sm mb-8">Layer ambient sounds to build your perfect focus environment.</p>

      <div className="max-w-lg mx-auto">
        <div className="space-y-4 mb-8">
          {SOUNDS.map((sound) => (
            <div key={sound.id} className="flex items-center gap-4">
              <span className="text-2xl w-8 text-center">{sound.icon}</span>
              <span className="text-sm font-medium text-ink w-20">{sound.name}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volumes[sound.id]}
                onChange={(e) => setVolume(sound.id, e.target.value)}
                className="flex-1 accent-cool-lavender"
              />
              <span className="text-xs text-ink-muted w-8 text-right tabular-nums">
                {Math.round(volumes[sound.id] * 100)}%
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={togglePlay}
            className={`px-8 py-3 rounded-btn font-bold text-lg transition cursor-pointer ${
              playing ? 'bg-gray-200 text-ink hover:bg-gray-300' : 'bg-soundscape text-white hover:opacity-90'
            }`}
          >
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
        </div>

        {!anyActive && playing && (
          <p className="text-center text-ink-muted text-sm mt-4">Slide some sounds up to hear them!</p>
        )}
      </div>
    </div>
  );
}
