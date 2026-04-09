import { useState, useEffect } from 'react';
import { useTasks } from '../../../context/TaskContext.jsx';
import { useGame } from '../../../context/GameContext.jsx';
import { api } from '../../../utils/api.js';

const STAGES = ['🌰', '🌱', '🌿', '🌳', '🌸'];
const WILTED = '🥀';

function getStage(plant) {
  if (plant.wilted) return WILTED;
  if (plant.completed) return STAGES[4];
  return STAGES[Math.min(plant.waterings, 3)];
}

export default function TaskGarden() {
  const { incompleteTasks, completeTask } = useTasks();
  const { addStardust, recordAchievementProgress, recordQuestProgress, fetchStats } = useGame();
  const [plants, setPlants] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/tools/state/garden').then((d) => {
      if (d.state?.plants) {
        const updated = d.state.plants.map((p) => {
          if (!p.completed && !p.wilted) {
            const daysSince = Math.floor((Date.now() - new Date(p.lastWatered).getTime()) / 86400000);
            return daysSince >= 3 ? { ...p, wilted: true } : p;
          }
          return p;
        });
        setPlants(updated);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  async function savePlants(updated) {
    setPlants(updated);
    await api.put('/tools/state/garden', { state: { plants: updated } });
  }

  async function plantSeed(task) {
    const plant = {
      taskId: task.id,
      title: task.title,
      waterings: 0,
      completed: false,
      wilted: false,
      plantedAt: new Date().toISOString(),
      lastWatered: new Date().toISOString(),
    };
    await savePlants([...plants, plant]);
  }

  async function waterPlant(index) {
    const updated = [...plants];
    updated[index] = { ...updated[index], waterings: updated[index].waterings + 1, lastWatered: new Date().toISOString() };
    await savePlants(updated);
  }

  async function harvestPlant(index) {
    const plant = plants[index];
    if (plant.taskId) {
      await completeTask(plant.taskId);
      await recordQuestProgress('complete_tasks');
      await recordAchievementProgress('getting_started');
      await recordAchievementProgress('century');
      await recordAchievementProgress('green_thumb');
      await addStardust('plant_harvested');
      await fetchStats();
    }
    const updated = [...plants];
    updated[index] = { ...updated[index], completed: true };
    await savePlants(updated);
  }

  const activePlants = plants.filter((p) => !p.completed && !p.wilted);
  const completedPlants = plants.filter((p) => p.completed);
  const availableTasks = incompleteTasks.filter((t) => !plants.some((p) => p.taskId === t.id && !p.completed && !p.wilted));

  if (!loaded) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">🌱 Task Garden</h1>
      <p className="text-ink-muted text-sm mb-6">Plant seeds for tasks. Water them daily. They wilt if ignored for 3 days.</p>

      {/* Garden */}
      <div className="bg-green-50 border border-green-200 rounded-card p-6 mb-6 min-h-[200px]">
        {activePlants.length === 0 && completedPlants.length === 0 && (
          <p className="text-center text-ink-muted py-12">Your garden is empty. Plant a seed below!</p>
        )}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {plants.map((plant, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-3xl">{getStage(plant)}</span>
              <span className="text-[10px] text-ink-muted text-center leading-tight truncate max-w-[60px]">{plant.title}</span>
              {!plant.completed && !plant.wilted && (
                <div className="flex gap-1">
                  <button onClick={() => waterPlant(i)} className="text-xs bg-cool-sky/20 px-1.5 py-0.5 rounded text-cool-sky hover:bg-cool-sky/30 cursor-pointer" title="Water">💧</button>
                  {plant.waterings >= 3 && (
                    <button onClick={() => harvestPlant(i)} className="text-xs bg-stardust/20 px-1.5 py-0.5 rounded text-stardust hover:bg-stardust/30 cursor-pointer" title="Harvest">🌸</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Plant a seed */}
      <h3 className="font-semibold text-ink mb-3">Plant a New Seed</h3>
      <div className="grid sm:grid-cols-2 gap-2">
        {availableTasks.length === 0 && <p className="text-ink-muted text-sm">No available tasks to plant.</p>}
        {availableTasks.slice(0, 10).map((task) => (
          <button
            key={task.id}
            onClick={() => plantSeed(task)}
            className="flex items-center gap-3 bg-surface border border-border rounded-card px-4 py-3 hover:border-garden hover:shadow-sm transition cursor-pointer text-left"
          >
            <span className="text-xl">🌰</span>
            <span className="text-sm text-ink truncate">{task.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
