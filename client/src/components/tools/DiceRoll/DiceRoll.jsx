import { useState } from 'react';
import { useTasks } from '../../../context/TaskContext.jsx';
import { useGame } from '../../../context/GameContext.jsx';

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function DiceRoll() {
  const { incompleteTasks, completeTask } = useTasks();
  const { addStardust, recordQuestProgress, recordAchievementProgress, fetchStats } = useGame();

  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [completed, setCompleted] = useState(new Set());
  const [challengeDone, setChallengeDone] = useState(false);

  function rollDice() {
    if (rolling) return;
    setRolling(true);
    setChallengeDone(false);
    setCompleted(new Set());

    let count = 0;
    const interval = setInterval(() => {
      setResult(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 15) {
        clearInterval(interval);
        const final = Math.floor(Math.random() * 6) + 1;
        setResult(final);
        setRolling(false);

        const shuffled = [...incompleteTasks].sort(() => Math.random() - 0.5);
        setAssignedTasks(shuffled.slice(0, final));
      }
    }, 100);
  }

  async function handleComplete(taskId) {
    await completeTask(taskId);
    await recordQuestProgress('complete_tasks');
    await recordAchievementProgress('getting_started');
    await recordAchievementProgress('century');
    const newCompleted = new Set([...completed, taskId]);
    setCompleted(newCompleted);

    if (newCompleted.size >= assignedTasks.length) {
      setChallengeDone(true);
      const action = result >= 5 ? 'dice_challenge_high' : result >= 3 ? 'dice_challenge_mid' : 'dice_challenge_low';
      await addStardust(action);
      await recordQuestProgress('dice_challenge');
      await recordAchievementProgress('dice_master');
      await fetchStats();
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">🎲 Dice Roll</h1>
      <p className="text-ink-muted text-sm mb-8">Roll the dice. Do that many tasks. High rolls = bonus Stardust.</p>

      <div className="flex flex-col items-center">
        {/* Dice */}
        <div className={`text-8xl mb-6 transition-transform ${rolling ? 'animate-bounce' : ''}`}>
          {result ? DICE_FACES[result - 1] : '🎲'}
        </div>

        {!assignedTasks.length || challengeDone ? (
          <button
            onClick={rollDice}
            disabled={rolling || incompleteTasks.length === 0}
            className="px-8 py-3 rounded-btn bg-dice text-white font-bold text-lg hover:opacity-90 transition cursor-pointer disabled:opacity-50"
          >
            {rolling ? 'Rolling...' : challengeDone ? 'Roll Again!' : 'Roll the Dice!'}
          </button>
        ) : null}

        {incompleteTasks.length === 0 && (
          <p className="text-ink-muted text-sm mt-4">Add tasks to your Master List first!</p>
        )}

        {challengeDone && (
          <div className="mt-6 bg-stardust/20 border border-stardust rounded-card p-6 text-center">
            <span className="text-3xl block mb-2">🎉</span>
            <p className="font-bold text-ink">Challenge Complete!</p>
            <p className="text-sm text-ink-muted">You earned bonus ✦ Stardust!</p>
          </div>
        )}

        {/* Assigned tasks */}
        {assignedTasks.length > 0 && !challengeDone && (
          <div className="mt-8 w-full max-w-md">
            <p className="text-center text-ink font-medium mb-4">
              You rolled a <span className="text-xl font-bold">{result}</span>! Complete these {result} task{result !== 1 ? 's' : ''}:
            </p>
            <div className="space-y-2">
              {assignedTasks.map((task) => (
                <div key={task.id} className={`flex items-center gap-3 bg-surface border border-border rounded-card px-4 py-3 ${completed.has(task.id) ? 'opacity-50' : ''}`}>
                  {completed.has(task.id) ? (
                    <span className="w-5 h-5 rounded-full bg-cool-teal flex items-center justify-center text-white text-xs shrink-0">✓</span>
                  ) : (
                    <button onClick={() => handleComplete(task.id)}
                      className="w-5 h-5 rounded-full border-2 border-border hover:border-cool-teal hover:bg-cool-teal/20 transition cursor-pointer shrink-0" />
                  )}
                  <span className={`text-sm ${completed.has(task.id) ? 'line-through text-ink-muted' : 'text-ink'}`}>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
