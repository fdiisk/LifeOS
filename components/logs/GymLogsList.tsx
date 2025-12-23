'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface GymLog {
  id: string;
  log_date: string;
  workout_type?: string;
  exercises: any[];
  total_duration_minutes?: number;
  notes?: string;
  created_at: string;
}

export default function GymLogsList() {
  const [logs, setLogs] = useState<GymLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [dateFilter]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.append('log_date', dateFilter);

      const res = await fetch(`/api/gym-logs?${params.toString()}`);
      const data = await res.json();
      setLogs(data.gym_logs || []);
    } catch (error) {
      console.error('Error fetching gym logs:', error);
      setMessage({ type: 'error', text: 'Failed to load gym logs' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this workout?')) return;

    try {
      const res = await fetch(`/api/gym-logs?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success !== false) {
        setMessage({ type: 'success', text: 'Workout deleted successfully' });
        fetchLogs();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete workout' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete workout' });
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Workout Logs</h2>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Date Filter */}
      <div className="mb-6">
        <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1">
          Filter by Date
        </label>
        <input
          type="date"
          id="dateFilter"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No workout logs found.</p>
          <p className="text-sm mt-2">Start logging workouts from the Input page!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {format(new Date(log.log_date), 'MMMM d, yyyy')}
                    {log.workout_type && (
                      <span className="ml-2 text-gray-600">({log.workout_type})</span>
                    )}
                  </h3>
                  {log.total_duration_minutes && (
                    <p className="text-sm text-gray-600">Duration: {log.total_duration_minutes} minutes</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>

              {log.exercises && log.exercises.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Exercises:</p>
                  {log.exercises.map((exercise: any, idx: number) => (
                    <div key={idx} className="pl-4 text-sm text-gray-600">
                      <p className="font-medium text-gray-900">{exercise.name || exercise.exercise_name}</p>
                      {exercise.sets && exercise.reps && (
                        <p>
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.weight_lbs && <span> @ {exercise.weight_lbs} lbs</span>}
                        </p>
                      )}
                      {exercise.duration_minutes && (
                        <p>{exercise.duration_minutes} minutes</p>
                      )}
                      {exercise.notes && <p className="italic">{exercise.notes}</p>}
                    </div>
                  ))}
                </div>
              )}

              {log.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Notes:</span> {log.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
