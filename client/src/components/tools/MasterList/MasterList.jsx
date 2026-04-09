import { useState } from 'react';
import { useTasks } from '../../../context/TaskContext.jsx';
import { useGame } from '../../../context/GameContext.jsx';

const CATEGORIES = ['general', 'work', 'personal', 'health', 'learning', 'creative'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function MasterList() {
  const { tasks, incompleteTasks, completedTasks, addTask, updateTask, deleteTask, completeTask } = useTasks();
  const { recordQuestProgress, recordAchievementProgress, fetchStats } = useGame();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('general');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await addTask({ title: title.trim(), description: description.trim(), priority, category, dueDate: dueDate || undefined });
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory('general');
    setDueDate('');
  }

  async function handleComplete(id) {
    await completeTask(id);
    await recordQuestProgress('complete_tasks');
    await recordAchievementProgress('getting_started');
    await recordAchievementProgress('century');
    await fetchStats();
  }

  async function handleSaveEdit(id) {
    if (!editTitle.trim()) return;
    await updateTask(id, { title: editTitle.trim() });
    setEditingId(null);
  }

  const displayed = (showCompleted ? completedTasks : incompleteTasks)
    .filter((t) => filter === 'all' || t.category === filter)
    .filter((t) => !search || t.title?.toLowerCase().includes(search.toLowerCase()));

  const priorityColor = { high: 'bg-warm-coral', medium: 'bg-warm-yellow', low: 'bg-cool-teal' };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">📋 Master List</h1>
      <p className="text-ink-muted text-sm mb-6">Your central task hub. Everything flows from here.</p>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-surface border border-border rounded-card p-5 mb-6 space-y-3">
        <div className="flex gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs doing?"
            className="flex-1 px-3 py-2 rounded-btn border border-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-cool-lavender/50 transition"
          />
          <button type="submit" className="px-5 py-2 rounded-btn bg-ink text-white font-medium hover:opacity-90 transition cursor-pointer shrink-0">Add</button>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 min-w-[200px] px-3 py-1.5 rounded-btn border border-border bg-white text-ink text-sm focus:outline-none focus:ring-2 focus:ring-cool-lavender/50 transition"
          />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 py-1.5 rounded-btn border border-border bg-white text-ink text-sm cursor-pointer">
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-1.5 rounded-btn border border-border bg-white text-ink text-sm cursor-pointer">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="px-3 py-1.5 rounded-btn border border-border bg-white text-ink text-sm" />
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="px-3 py-1.5 rounded-btn border border-border bg-white text-ink text-sm w-48 focus:outline-none focus:ring-2 focus:ring-cool-lavender/50 transition"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-1.5 rounded-btn border border-border bg-white text-ink text-sm cursor-pointer">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={`px-3 py-1.5 rounded-btn text-sm font-medium transition cursor-pointer ${showCompleted ? 'bg-cool-teal text-white' : 'bg-gray-100 text-ink-muted hover:bg-gray-200'}`}
        >
          {showCompleted ? 'Showing completed' : 'Show completed'}
        </button>
        <span className="text-xs text-ink-muted ml-auto">{displayed.length} tasks</span>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {displayed.length === 0 && (
          <p className="text-center text-ink-muted py-12">
            {showCompleted ? 'No completed tasks yet. Get going!' : 'No tasks yet. Add one above!'}
          </p>
        )}
        {displayed.map((task) => (
          <div key={task.id} className="group flex items-center gap-3 bg-surface border border-border rounded-card px-4 py-3 hover:shadow-sm transition">
            {task.status !== 'completed' ? (
              <button
                onClick={() => handleComplete(task.id)}
                className="w-5 h-5 rounded-full border-2 border-border hover:border-cool-teal hover:bg-cool-teal/20 transition cursor-pointer shrink-0"
                title="Complete"
              />
            ) : (
              <span className="w-5 h-5 rounded-full bg-cool-teal flex items-center justify-center text-white text-xs shrink-0">✓</span>
            )}

            <div className="flex-1 min-w-0">
              {editingId === task.id ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => handleSaveEdit(task.id)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(task.id)}
                  className="w-full px-2 py-1 rounded border border-border text-sm"
                  autoFocus
                />
              ) : (
                <span
                  className={`text-sm ${task.status === 'completed' ? 'line-through text-ink-muted' : 'text-ink'}`}
                  onDoubleClick={() => { setEditingId(task.id); setEditTitle(task.title); }}
                >
                  {task.title}
                </span>
              )}
              {task.description && <p className="text-xs text-ink-muted mt-0.5 truncate">{task.description}</p>}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`w-2 h-2 rounded-full ${priorityColor[task.priority] || 'bg-gray-300'}`} title={task.priority} />
              <span className="text-xs text-ink-muted hidden sm:inline">{task.category}</span>
              {task.due_date && <span className="text-xs text-ink-muted hidden sm:inline">{new Date(task.due_date).toLocaleDateString()}</span>}
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-warm-coral text-sm transition cursor-pointer"
                title="Delete"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
