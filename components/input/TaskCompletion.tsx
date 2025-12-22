'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
}

export default function TaskCompletion() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [date]);

  async function fetchTasks() {
    try {
      const res = await fetch(`/api/tasks?due_date=${date}&status=pending,in_progress`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }

  async function toggleTaskComplete(taskId: string, currentStatus: string) {
    setLoading(true);
    setMessage(null);

    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update task');

      setMessage({ type: 'success', text: 'Task updated!' });
      await fetchTasks();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update task.' });
    } finally {
      setLoading(false);
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-l-red-500';
      case 'high':
        return 'border-l-4 border-l-orange-500';
      case 'medium':
        return 'border-l-4 border-l-yellow-500';
      default:
        return 'border-l-4 border-l-gray-300';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Task Completion</h2>

      <div className="mb-4">
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {message && (
        <div
          className={`p-3 rounded-md mb-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tasks for this date.</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 bg-gray-50 rounded-md flex items-center gap-3 ${getPriorityColor(
                task.priority
              )}`}
            >
              <input
                type="checkbox"
                checked={task.status === 'completed'}
                onChange={() => toggleTaskComplete(task.id, task.status)}
                disabled={loading}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {task.title}
                </p>
                <p className="text-xs text-gray-500">Priority: {task.priority}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {tasks.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">
              {tasks.filter((t) => t.status === 'completed').length} of {tasks.length}
            </span>{' '}
            tasks completed
          </p>
        </div>
      )}
    </div>
  );
}
