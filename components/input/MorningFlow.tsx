'use client';

import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';

interface YesterdayStats {
  tasks_completed: number;
  habits_completed: number;
  time_blocks: number;
  total_focus_hours: number;
  nutrition_entries: number;
  gym_sessions: number;
}

interface MorningFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export default function MorningFlow({ onComplete, onSkip }: MorningFlowProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [yesterdayStats, setYesterdayStats] = useState<YesterdayStats | null>(null);

  // Form data
  const [whatWentWell, setWhatWentWell] = useState(['', '', '']);
  const [evenBetterIf, setEvenBetterIf] = useState(['', '', '']);
  const [dayRating, setDayRating] = useState(5);
  const [gratitude, setGratitude] = useState('');
  const [sleepStart, setSleepStart] = useState('22:00');
  const [sleepWake, setSleepWake] = useState('06:00');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const today = new Date();
  const yesterday = subDays(today, 1);
  const yesterdayDate = format(yesterday, 'yyyy-MM-dd');
  const todayDate = format(today, 'yyyy-MM-dd');

  useEffect(() => {
    fetchYesterdayStats();
  }, []);

  async function fetchYesterdayStats() {
    try {
      // Fetch yesterday's data in parallel
      const [tasksRes, habitsRes, blocksRes, nutritionRes, gymRes] = await Promise.all([
        fetch(`/api/tasks?due_date=${yesterdayDate}&status=completed`),
        fetch(`/api/habits/calendar?date=${yesterdayDate}`),
        fetch(`/api/focus-sessions?block_date=${yesterdayDate}`),
        fetch(`/api/nutrition-entries?log_date=${yesterdayDate}`),
        fetch(`/api/gym-logs?log_date=${yesterdayDate}`),
      ]);

      const [tasks, habits, blocks, nutrition, gym] = await Promise.all([
        tasksRes.json(),
        habitsRes.json(),
        blocksRes.json(),
        nutritionRes.json(),
        gymRes.json(),
      ]);

      const totalMinutes = (blocks.sessions || []).reduce(
        (sum: number, block: any) => sum + (block.duration_minutes || 0),
        0
      );

      setYesterdayStats({
        tasks_completed: (tasks.tasks || []).length,
        habits_completed: (habits.completions || []).filter((h: any) => h.completed).length,
        time_blocks: (blocks.sessions || []).length,
        total_focus_hours: +(totalMinutes / 60).toFixed(1),
        nutrition_entries: (nutrition.entries || []).length,
        gym_sessions: (gym.gym_logs || []).length,
      });
    } catch (error) {
      console.error('Error fetching yesterday stats:', error);
      setYesterdayStats({
        tasks_completed: 0,
        habits_completed: 0,
        time_blocks: 0,
        total_focus_hours: 0,
        nutrition_entries: 0,
        gym_sessions: 0,
      });
    }
  }

  async function handleComplete() {
    setLoading(true);
    setMessage(null);

    try {
      // Calculate sleep hours
      const sleepHours = calculateSleepHours(sleepStart, sleepWake);

      const res = await fetch('/api/daily-logs/morning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: todayDate,
          yesterday_date: yesterdayDate,
          what_went_well: whatWentWell.filter((w) => w.trim()),
          even_better_if: evenBetterIf.filter((e) => e.trim()),
          day_rating: dayRating,
          gratitude: gratitude.trim(),
          sleep_start_time: sleepStart,
          sleep_wake_time: sleepWake,
          sleep_hours: sleepHours,
        }),
      });

      if (!res.ok) throw new Error('Failed to save morning reflection');

      onComplete();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save reflection. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  function calculateSleepHours(start: string, wake: string): number {
    const [startHour, startMin] = start.split(':').map(Number);
    const [wakeHour, wakeMin] = wake.split(':').map(Number);

    let totalMinutes = (wakeHour * 60 + wakeMin) - (startHour * 60 + startMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight

    return +(totalMinutes / 60).toFixed(2);
  }

  const totalSteps = 5;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">Good Morning! 🌅</h2>
          <p className="text-blue-100 mt-1">Let's start your day with intention</p>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 w-12 rounded-full ${
                    i + 1 <= step ? 'bg-white' : 'bg-blue-400'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-blue-100">
              Step {step} of {totalSteps}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Yesterday's Stats */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Yesterday's Accomplishments
              </h3>
              <p className="text-sm text-gray-600">
                {format(yesterday, 'MMMM d, yyyy')}
              </p>

              {yesterdayStats ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard
                    icon="✓"
                    label="Tasks Completed"
                    value={yesterdayStats.tasks_completed}
                    color="green"
                  />
                  <StatCard
                    icon="🎯"
                    label="Habits Done"
                    value={yesterdayStats.habits_completed}
                    color="blue"
                  />
                  <StatCard
                    icon="⏰"
                    label="Time Blocks"
                    value={yesterdayStats.time_blocks}
                    color="purple"
                  />
                  <StatCard
                    icon="🔥"
                    label="Focus Hours"
                    value={yesterdayStats.total_focus_hours}
                    color="orange"
                  />
                  <StatCard
                    icon="🍽️"
                    label="Meals Logged"
                    value={yesterdayStats.nutrition_entries}
                    color="amber"
                  />
                  <StatCard
                    icon="💪"
                    label="Gym Sessions"
                    value={yesterdayStats.gym_sessions}
                    color="red"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              )}

              <p className="text-sm text-gray-600 mt-4">
                Let's reflect on what made yesterday great and how to make today even better.
              </p>
            </div>
          )}

          {/* Step 2: What Went Well */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                What Went Well Yesterday?
              </h3>
              <p className="text-sm text-gray-600">
                List 3 wins, accomplishments, or positive moments
              </p>

              {whatWentWell.map((item, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Win #{index + 1}
                  </label>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...whatWentWell];
                      updated[index] = e.target.value;
                      setWhatWentWell(updated);
                    }}
                    placeholder={`Something that went well...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Even Better If */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Even Better If...
              </h3>
              <p className="text-sm text-gray-600">
                List 3 things that could have been better or improvements for today
              </p>

              {evenBetterIf.map((item, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Improvement #{index + 1}
                  </label>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...evenBetterIf];
                      updated[index] = e.target.value;
                      setEvenBetterIf(updated);
                    }}
                    placeholder={`Something to improve...`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Rating & Gratitude */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How was your day overall?
                </h3>
                <input
                  type="range"
                  value={dayRating}
                  onChange={(e) => setDayRating(parseInt(e.target.value))}
                  min="1"
                  max="10"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Poor</span>
                  <span className="text-lg font-bold text-blue-600">{dayRating}/10</span>
                  <span>Excellent</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  One Thing I'm Grateful For
                </label>
                <textarea
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                  placeholder="What are you grateful for today?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 5: Sleep */}
          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Sleep Tracking</h3>
              <p className="text-sm text-gray-600">
                When did you go to bed and wake up?
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bedtime
                  </label>
                  <input
                    type="time"
                    value={sleepStart}
                    onChange={(e) => setSleepStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wake Time
                  </label>
                  <input
                    type="time"
                    value={sleepWake}
                    onChange={(e) => setSleepWake(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-900">
                  <strong>Sleep Duration:</strong> {calculateSleepHours(sleepStart, sleepWake).toFixed(1)} hours
                </p>
              </div>
            </div>
          )}

          {message && (
            <div
              className={`mt-4 p-3 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-between gap-4">
          {onSkip && step === 1 && (
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Skip for now
            </button>
          )}

          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}

          <div className="flex-1" />

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Saving...' : 'Complete & Plan Day'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'amber' | 'red';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    red: 'bg-red-50 border-red-200 text-red-900',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-75">{label}</div>
    </div>
  );
}
