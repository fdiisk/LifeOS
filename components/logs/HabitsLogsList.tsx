'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: string;
  is_active: boolean;
}

interface HabitCompletion {
  habit_id: string;
  completion_date: string;
  completed: boolean;
  notes?: string;
}

export default function HabitsLogsList() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch habits
      const habitsRes = await fetch('/api/habits');
      const habitsData = await habitsRes.json();
      setHabits(habitsData.habits || []);

      // Fetch completions for the date
      if (dateFilter) {
        const completionsRes = await fetch(`/api/habits/calendar?date=${dateFilter}`);
        const completionsData = await completionsRes.json();
        setCompletions(completionsData.completions || []);
      } else {
        setCompletions([]);
      }
    } catch (error) {
      console.error('Error fetching habits data:', error);
      setMessage({ type: 'error', text: 'Failed to load habits data' });
    } finally {
      setLoading(false);
    }
  }

  const getHabitName = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    return habit?.name || 'Unknown Habit';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Habits Tracking</h2>
        <button
          onClick={fetchData}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Date Filter */}
      <div className="mb-6">
        <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1">
          View completions for specific date
        </label>
        <input
          type="date"
          id="dateFilter"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Clear date filter
          </button>
        )}
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
      ) : (
        <div className="space-y-6">
          {/* Active Habits List */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Active Habits</h3>
            {habits.filter((h) => h.is_active).length === 0 ? (
              <p className="text-gray-500 text-sm">No active habits. Create habits from the Input page!</p>
            ) : (
              <div className="space-y-2">
                {habits
                  .filter((h) => h.is_active)
                  .map((habit) => (
                    <div key={habit.id} className="p-3 border border-gray-200 rounded-md">
                      <p className="font-medium text-gray-900">{habit.name}</p>
                      {habit.description && (
                        <p className="text-sm text-gray-600">{habit.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">Frequency: {habit.frequency}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Completions for Selected Date */}
          {dateFilter && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Completions for {format(new Date(dateFilter), 'MMMM d, yyyy')}
              </h3>
              {completions.length === 0 ? (
                <p className="text-gray-500 text-sm">No habits completed on this date.</p>
              ) : (
                <div className="space-y-2">
                  {completions.map((completion, idx) => (
                    <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-green-900">{getHabitName(completion.habit_id)}</p>
                        <span className="text-sm text-green-700">
                          {completion.completed ? '✓ Completed' : '○ Not completed'}
                        </span>
                      </div>
                      {completion.notes && (
                        <p className="text-sm text-green-800 mt-1">Notes: {completion.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Inactive Habits */}
          {habits.filter((h) => !h.is_active).length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Inactive Habits</h3>
              <div className="space-y-2">
                {habits
                  .filter((h) => !h.is_active)
                  .map((habit) => (
                    <div key={habit.id} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                      <p className="font-medium text-gray-600">{habit.name}</p>
                      {habit.description && (
                        <p className="text-sm text-gray-500">{habit.description}</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
