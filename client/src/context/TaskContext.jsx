import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { api } from '../utils/api.js';

const TaskContext = createContext(null);

const LS_KEY = 'planet-guest-tasks';
let nextLocalId = Date.now();

function loadLocalTasks() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}

function saveLocalTasks(tasks) {
  localStorage.setItem(LS_KEY, JSON.stringify(tasks));
}

export function TaskProvider({ children }) {
  const { user } = useAuth();
  const isGuest = user?.guest;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    if (isGuest) { setTasks(loadLocalTasks()); return; }
    setLoading(true);
    try {
      const data = await api.get('/tasks');
      setTasks(data.tasks || []);
    } catch { /* empty */ }
    setLoading(false);
  }, [user, isGuest]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = useCallback(async (task) => {
    if (isGuest) {
      const newTask = { ...task, id: nextLocalId++, status: 'pending', created_at: new Date().toISOString(), title: task.title, description: task.description || '' };
      setTasks((prev) => { const updated = [newTask, ...prev]; saveLocalTasks(updated); return updated; });
      return newTask;
    }
    const data = await api.post('/tasks', task);
    setTasks((prev) => [data.task, ...prev]);
    return data.task;
  }, [isGuest]);

  const updateTask = useCallback(async (id, updates) => {
    if (isGuest) {
      let updated;
      setTasks((prev) => { updated = prev.map((t) => t.id === id ? { ...t, ...updates } : t); saveLocalTasks(updated); return updated; });
      return updated?.find((t) => t.id === id);
    }
    const data = await api.put(`/tasks/${id}`, updates);
    setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
    return data.task;
  }, [isGuest]);

  const deleteTask = useCallback(async (id) => {
    if (isGuest) {
      setTasks((prev) => { const updated = prev.filter((t) => t.id !== id); saveLocalTasks(updated); return updated; });
      return;
    }
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [isGuest]);

  const completeTask = useCallback(async (id) => {
    if (isGuest) {
      let task;
      setTasks((prev) => {
        const updated = prev.map((t) => {
          if (t.id === id) { task = { ...t, status: 'completed', completed_at: new Date().toISOString() }; return task; }
          return t;
        });
        saveLocalTasks(updated);
        return updated;
      });
      return task;
    }
    const data = await api.put(`/tasks/${id}/complete`);
    setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
    return data.task;
  }, [isGuest]);

  const incompleteTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <TaskContext.Provider value={{ tasks, incompleteTasks, completedTasks, loading, fetchTasks, addTask, updateTask, deleteTask, completeTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
}
