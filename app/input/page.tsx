'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MorningPlanning from '@/components/input/MorningPlanning';
import EveningReflection from '@/components/input/EveningReflection';
import TaskCompletion from '@/components/input/TaskCompletion';
import HabitCheckin from '@/components/input/HabitCheckin';
import MealEntry from '@/components/input/MealEntry';
import GymEntry from '@/components/input/GymEntry';
import CardioEntry from '@/components/input/CardioEntry';
import RatingsInput from '@/components/input/RatingsInput';
import TimeBlockEntry from '@/components/input/TimeBlockEntry';

type Tab =
  | 'morning'
  | 'evening'
  | 'tasks'
  | 'habits'
  | 'timeblock'
  | 'meal'
  | 'gym'
  | 'cardio'
  | 'ratings';

interface TabConfig {
  id: Tab;
  label: string;
  icon: string;
}

const tabs: TabConfig[] = [
  { id: 'morning', label: 'Morning', icon: '🌅' },
  { id: 'tasks', label: 'Tasks', icon: '✓' },
  { id: 'habits', label: 'Habits', icon: '🎯' },
  { id: 'timeblock', label: 'Time Block', icon: '⏰' },
  { id: 'meal', label: 'Meal', icon: '🍽️' },
  { id: 'gym', label: 'Gym', icon: '💪' },
  { id: 'cardio', label: 'Cardio', icon: '🏃' },
  { id: 'ratings', label: 'Ratings', icon: '⭐' },
  { id: 'evening', label: 'Evening', icon: '🌙' },
];

function InputPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');

  useEffect(() => {
    // Check for tab query parameter
    const tabParam = searchParams.get('tab') as Tab;
    if (tabParam && tabs.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Daily Input</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track your day, log activities, and reflect on your progress
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[100px] px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === 'morning' && <MorningPlanning />}
          {activeTab === 'evening' && <EveningReflection />}
          {activeTab === 'tasks' && <TaskCompletion />}
          {activeTab === 'habits' && <HabitCheckin />}
          {activeTab === 'timeblock' && <TimeBlockEntry />}
          {activeTab === 'meal' && <MealEntry />}
          {activeTab === 'gym' && <GymEntry />}
          {activeTab === 'cardio' && <CardioEntry />}
          {activeTab === 'ratings' && <RatingsInput />}
        </div>

        {/* Quick Tips */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Morning Routine</h3>
            <p className="text-sm text-blue-800">
              Start your day with morning planning, then check off tasks and habits as you go.
            </p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">🤖 AI-Powered</h3>
            <p className="text-sm text-purple-800">
              Meal and gym entries use AI to automatically extract calories, macros, and exercise details.
            </p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">📊 Track Everything</h3>
            <p className="text-sm text-green-800">
              Your ratings help compare perceived effort vs actual performance over time.
            </p>
          </div>
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="font-semibold text-orange-900 mb-2">🌙 Evening Reflection</h3>
            <p className="text-sm text-orange-800">
              End your day with reflection and ratings to close the loop on your progress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InputPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <InputPageContent />
    </Suspense>
  );
}
