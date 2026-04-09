import { useState, useMemo } from 'react';
import { useTasks } from '../../../context/TaskContext.jsx';

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function Calendar() {
  const { tasks } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const tasksByDate = useMemo(() => {
    const map = {};
    for (const task of tasks) {
      const date = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : null;
      const completedDate = task.completed_at ? new Date(task.completed_at).toISOString().split('T')[0] : null;
      if (date) { map[date] = map[date] || []; map[date].push({ ...task, type: 'due' }); }
      if (completedDate) { map[completedDate] = map[completedDate] || []; map[completedDate].push({ ...task, type: 'completed' }); }
    }
    return map;
  }, [tasks]);

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-1">📅 Calendar</h1>
      <p className="text-ink-muted text-sm mb-6">See your task due dates and completed history.</p>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="px-3 py-1 rounded-btn bg-gray-100 hover:bg-gray-200 transition cursor-pointer">←</button>
        <h2 className="text-lg font-bold text-ink">{monthName} {year}</h2>
        <button onClick={nextMonth} className="px-3 py-1 rounded-btn bg-gray-100 hover:bg-gray-200 transition cursor-pointer">→</button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-ink-muted py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTasks = tasksByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          const hasDue = dayTasks.some((t) => t.type === 'due' && t.status !== 'completed');
          const hasCompleted = dayTasks.some((t) => t.type === 'completed');

          return (
            <div
              key={i}
              className={`min-h-[60px] sm:min-h-[80px] p-1 rounded-card border transition ${
                isToday ? 'border-cool-lavender bg-cool-lavender/5' : 'border-border hover:bg-gray-50'
              }`}
            >
              <span className={`text-xs font-medium ${isToday ? 'text-cool-lavender' : 'text-ink'}`}>{day}</span>
              <div className="mt-0.5 space-y-0.5">
                {dayTasks.slice(0, 3).map((t, ti) => (
                  <div
                    key={ti}
                    className={`text-[10px] leading-tight truncate rounded px-1 py-0.5 ${
                      t.type === 'completed' ? 'bg-cool-teal/15 text-cool-teal' : 'bg-warm-coral/15 text-warm-coral'
                    }`}
                  >
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 3 && <span className="text-[10px] text-ink-muted">+{dayTasks.length - 3} more</span>}
              </div>
              <div className="flex gap-0.5 mt-0.5">
                {hasDue && <span className="w-1.5 h-1.5 rounded-full bg-warm-coral" />}
                {hasCompleted && <span className="w-1.5 h-1.5 rounded-full bg-cool-teal" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warm-coral" /> Due</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cool-teal" /> Completed</span>
      </div>
    </div>
  );
}
