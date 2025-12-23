'use client';

import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';

interface EveningFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface TodayStats {
  tasks: {
    completed: number;
    total: number;
  };
  habits: {
    completed: number;
    total: number;
  };
  timeBlocks: {
    count: number;
    totalHours: number;
  };
  nutrition: {
    meals: number;
    totalCalories: number;
  };
  gym: {
    workouts: number;
    exercises: number;
  };
}

export default function EveningFlow({ onComplete, onSkip }: EveningFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);

  // Ratings state
  const [focusRating, setFocusRating] = useState(5);
  const [effortRating, setEffortRating] = useState(5);
  const [moodRating, setMoodRating] = useState(5);
  const [successRating, setSuccessRating] = useState(5);

  // Journal state
  const [journal, setJournal] = useState('');

  const totalSteps = 4;
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchTodayStats();
  }, []);

  async function fetchTodayStats() {
    setIsLoading(true);
    try {
      const [tasksRes, habitsRes, blocksRes, nutritionRes, gymRes] = await Promise.all([
        fetch(`/api/tasks?status=all`),
        fetch(`/api/habits/calendar?date=${today}`),
        fetch(`/api/focus-sessions?block_date=${today}`),
        fetch(`/api/nutrition-entries?date=${today}`),
        fetch(`/api/gym-logs?date=${today}`),
      ]);

      const tasksData = await tasksRes.json();
      const habitsData = await habitsRes.json();
      const blocksData = await blocksRes.json();
      const nutritionData = await nutritionRes.json();
      const gymData = await gymRes.json();

      // Calculate tasks stats
      const allTasks = tasksData.data || [];
      const completedTasks = allTasks.filter((t: any) => t.status === 'completed').length;

      // Calculate habits stats
      const habitsCompleted = habitsData.data?.completions?.length || 0;
      const totalHabits = habitsData.data?.habits?.filter((h: any) => h.is_active).length || 0;

      // Calculate time blocks stats
      const blocks = blocksData.data || [];
      const totalMinutes = blocks.reduce(
        (sum: number, block: any) => sum + (block.duration_minutes || 0),
        0
      );

      // Calculate nutrition stats
      const nutritionEntries = nutritionData.data || [];
      const totalCalories = nutritionEntries.reduce(
        (sum: number, entry: any) => sum + (entry.calories || 0),
        0
      );

      // Calculate gym stats
      const gymLogs = gymData.data || [];
      const totalExercises = gymLogs.reduce(
        (sum: number, log: any) => sum + (log.exercises?.length || 0),
        0
      );

      setTodayStats({
        tasks: {
          completed: completedTasks,
          total: allTasks.length,
        },
        habits: {
          completed: habitsCompleted,
          total: totalHabits,
        },
        timeBlocks: {
          count: blocks.length,
          totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        },
        nutrition: {
          meals: nutritionEntries.length,
          totalCalories: Math.round(totalCalories),
        },
        gym: {
          workouts: gymLogs.length,
          exercises: totalExercises,
        },
      });
    } catch (error) {
      console.error('Error fetching today stats:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleNext() {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  function countLines(text: string): number {
    return text.trim().split('\n').filter((line) => line.trim().length > 0).length;
  }

  function isJournalValid(): boolean {
    return countLines(journal) >= 5;
  }

  async function handleSaveAndLock() {
    setIsSaving(true);
    try {
      const res = await fetch('/api/daily-logs/evening', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          evening_focus_rating: focusRating,
          evening_effort_rating: effortRating,
          evening_mood_rating: moodRating,
          evening_success_rating: successRating,
          evening_journal: journal,
          day_locked: true,
          locked_at: new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        onComplete();
      } else {
        alert(`Failed to save evening reflection: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving evening reflection:', error);
      alert('Failed to save evening reflection');
    } finally {
      setIsSaving(false);
    }
  }

  function renderStep() {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Today&apos;s Summary</h2>
            <p className="text-gray-600">Here&apos;s what you accomplished today:</p>

            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading today&apos;s data...</div>
            ) : todayStats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                  title="Tasks"
                  value={`${todayStats.tasks.completed} / ${todayStats.tasks.total}`}
                  subtitle="Completed"
                  color="blue"
                />
                <StatCard
                  title="Habits"
                  value={`${todayStats.habits.completed} / ${todayStats.habits.total}`}
                  subtitle="Completed"
                  color="green"
                />
                <StatCard
                  title="Time Blocks"
                  value={`${todayStats.timeBlocks.totalHours}h`}
                  subtitle={`${todayStats.timeBlocks.count} blocks`}
                  color="purple"
                />
                <StatCard
                  title="Nutrition"
                  value={`${todayStats.nutrition.totalCalories} cal`}
                  subtitle={`${todayStats.nutrition.meals} entries`}
                  color="orange"
                />
                <StatCard
                  title="Workouts"
                  value={`${todayStats.gym.workouts}`}
                  subtitle={`${todayStats.gym.exercises} exercises`}
                  color="red"
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No data available</div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onSkip}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Rate Your Day</h2>
            <p className="text-gray-600">How did today go across these dimensions?</p>

            <div className="space-y-6">
              <RatingSlider
                label="Focus"
                value={focusRating}
                onChange={setFocusRating}
                description="How focused were you throughout the day?"
              />
              <RatingSlider
                label="Effort"
                value={effortRating}
                onChange={setEffortRating}
                description="How much effort did you put in?"
              />
              <RatingSlider
                label="Mood"
                value={moodRating}
                onChange={setMoodRating}
                description="How was your overall mood?"
              />
              <RatingSlider
                label="Success"
                value={successRating}
                onChange={setSuccessRating}
                description="How successful do you feel about today?"
              />
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Evening Journal</h2>
            <p className="text-gray-600">
              Reflect on your day. Write at least 5 lines about your experiences, learnings, or
              thoughts.
            </p>

            <div className="space-y-2">
              <textarea
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder="Today was..."
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-between text-sm">
                <span className={`${countLines(journal) >= 5 ? 'text-green-600' : 'text-gray-500'}`}>
                  {countLines(journal)} / 5 lines minimum
                </span>
                <span className="text-gray-500">{journal.length} characters</span>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!isJournalValid()}
                className={`px-6 py-2 rounded-lg ${
                  isJournalValid()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Review & Lock Day</h2>
            <p className="text-gray-600">
              Review your evening reflection. Once locked, today&apos;s entries will become
              read-only.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Ratings Summary</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Focus:</span>{' '}
                    <span className="font-medium">{focusRating}/10</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Effort:</span>{' '}
                    <span className="font-medium">{effortRating}/10</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Mood:</span>{' '}
                    <span className="font-medium">{moodRating}/10</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Success:</span>{' '}
                    <span className="font-medium">{successRating}/10</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-gray-900">Journal Entry</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{journal}</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Warning:</strong> Locking the day will make all of today&apos;s
                  entries read-only. You won&apos;t be able to edit tasks, habits, or other logs for{' '}
                  {today}.
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <button
                onClick={handleBack}
                disabled={isSaving}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSaveAndLock}
                disabled={isSaving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save & Lock Day'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-600 text-white p-6">
          <h1 className="text-2xl font-bold">Evening Reflection</h1>
          <p className="text-orange-100 text-sm mt-1">Close your day with intention</p>

          {/* Progress bar */}
          <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <p className="text-xs text-orange-100 mt-2">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{renderStep()}</div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

function StatCard({ title, value, subtitle, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    red: 'bg-red-50 border-red-200 text-red-900',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs opacity-75 mt-1">{subtitle}</p>
    </div>
  );
}

// Rating Slider Component
interface RatingSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description: string;
}

function RatingSlider({ label, value, onChange, description }: RatingSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="font-medium text-gray-900">{label}</label>
        <span className="text-2xl font-bold text-blue-600">{value}</span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>1 - Low</span>
        <span>10 - High</span>
      </div>
    </div>
  );
}
