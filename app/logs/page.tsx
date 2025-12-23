'use client';

import { useState } from 'react';
import NutritionLogsList from '@/components/logs/NutritionLogsList';
import GymLogsList from '@/components/logs/GymLogsList';
import HabitsLogsList from '@/components/logs/HabitsLogsList';
import RatingsLogsList from '@/components/logs/RatingsLogsList';
import TasksLogsList from '@/components/logs/TasksLogsList';

type Tab = 'nutrition' | 'gym' | 'habits' | 'ratings' | 'tasks';

interface TabConfig {
  id: Tab;
  label: string;
  icon: string;
}

const tabs: TabConfig[] = [
  { id: 'nutrition', label: 'Nutrition', icon: '🍽️' },
  { id: 'gym', label: 'Workouts', icon: '💪' },
  { id: 'habits', label: 'Habits', icon: '🎯' },
  { id: 'tasks', label: 'Tasks', icon: '✓' },
  { id: 'ratings', label: 'Ratings', icon: '⭐' },
];

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('nutrition');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
          <p className="mt-2 text-sm text-gray-600">
            View, edit, and manage your logged data
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] px-4 py-3 text-sm font-medium transition-colors ${
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
          {activeTab === 'nutrition' && <NutritionLogsList />}
          {activeTab === 'gym' && <GymLogsList />}
          {activeTab === 'habits' && <HabitsLogsList />}
          {activeTab === 'tasks' && <TasksLogsList />}
          {activeTab === 'ratings' && <RatingsLogsList />}
        </div>
      </div>
    </div>
  );
}
