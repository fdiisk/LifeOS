'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  target_count: number;
}

interface HabitWithCompletion extends Habit {
  completed: boolean;
}

export default function HabitCheckin() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [habits, setHabits] = useState<HabitWithCompletion[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchHabits();
  }, [date]);

  async function fetchHabits() {
    try {
      // Fetch active habits
      const habitsRes = await fetch('/api/habits?is_active=true');
      if (!habitsRes.ok) throw new Error('Failed to fetch habits');
      const habitsData = await habitsRes.json();

      // Fetch completions for the date
      const completionsRes = await fetch(`/api/habits/calendar?date=${date}`);
      const completionsData = completionsRes.ok ? await completionsRes.json() : { completions: [] };

      const completedHabitIds = new Set(
        completionsData.completions?.map((c: any) => c.habit_id) || []
      );

      const habitsWithStatus: HabitWithCompletion[] = (habitsData.habits || []).map(
        (habit: Habit) => ({
          ...habit,
          completed: completedHabitIds.has(habit.id),
        })
      );

      setHabits(habitsWithStatus);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  }

  async function toggleHabitCompletion(habitId: string, currentlyCompleted: boolean) {
    setLoading(true);
    setMessage(null);

    try {
      if (currentlyCompleted) {
        // TODO: Would need a delete endpoint for habit completions
        setMessage({ type: 'error', text: 'Unchecking habits not yet supported.' });
        setLoading(false);
        return;
      }

      const res = await fetch('/api/habits/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habit_id: habitId,
          completion_date: date,
        }),
      });

      if (!res.ok) throw new Error('Failed to mark habit as complete');

      setMessage({ type: 'success', text: 'Habit marked as complete!' });
      await fetchHabits();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update habit.' });
    } finally {
      setLoading(false);
    }
  }

  const completedCount = habits.filter((h) => h.completed).length;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Habit Check-in</h2>

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
        {habits.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No active habits. Create habits to track them here.
          </p>
        ) : (
          habits.map((habit) => (
            <div key={habit.id} className="p-3 bg-gray-50 rounded-md flex items-start gap-3">
              <input
                type="checkbox"
                checked={habit.completed}
                onChange={() => toggleHabitCompletion(habit.id, habit.completed)}
                disabled={loading}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    habit.completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  {habit.name}
                </p>
                {habit.description && (
                  <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {habit.frequency} • Target: {habit.target_count}x
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {habits.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">
              {completedCount} of {habits.length}
            </span>{' '}
            habits completed today
          </p>
        </div>
      )}
    </div>
  );
}
