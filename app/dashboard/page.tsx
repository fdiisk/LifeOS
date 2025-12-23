'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import GoalProgressChart from '@/components/dashboard/GoalProgressChart';
import LifeAreasChart from '@/components/dashboard/LifeAreasChart';
import WeightTrendChart from '@/components/dashboard/WeightTrendChart';
import TimeScaleSelector from '@/components/dashboard/TimeScaleSelector';
import FocusHeatmap from '@/components/dashboard/FocusHeatmap';
import RatingsComparisonChart from '@/components/dashboard/RatingsComparisonChart';
import MorningFlow from '@/components/input/MorningFlow';
import EveningFlow from '@/components/input/EveningFlow';
import { TimeScale } from '@/lib/dashboard-utils';

export default function DashboardPage() {
  const router = useRouter();
  const [timeScale, setTimeScale] = useState<TimeScale>('quarter');
  const [showMorningFlow, setShowMorningFlow] = useState(false);
  const [showEveningFlow, setShowEveningFlow] = useState(false);
  const [checkingFlows, setCheckingFlows] = useState(true);

  useEffect(() => {
    checkFlowStatus();
  }, []);

  async function checkFlowStatus() {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const res = await fetch(`/api/daily-logs?date=${today}`);
      const data = await res.json();

      // Check if day is locked
      if (data.data?.day_locked) {
        // Don't show any flows if day is locked
        setCheckingFlows(false);
        return;
      }

      // Check if morning reflection has been completed
      const hasCompletedMorning =
        data.data?.what_went_well ||
        data.data?.day_rating ||
        data.data?.gratitude ||
        data.data?.sleep_hours;

      // Check if evening reflection has been completed
      const hasCompletedEvening =
        data.data?.evening_focus_rating ||
        data.data?.evening_journal;

      // Determine which flow to show based on time of day
      const currentHour = new Date().getHours();
      const isEvening = currentHour >= 18; // 6 PM or later

      if (!hasCompletedMorning && !isEvening) {
        setShowMorningFlow(true);
      } else if (!hasCompletedEvening && isEvening) {
        setShowEveningFlow(true);
      }
    } catch (error) {
      console.error('Error checking flow status:', error);
      // Don't show modal if there's an error
    } finally {
      setCheckingFlows(false);
    }
  }

  function handleMorningFlowComplete() {
    setShowMorningFlow(false);
    // Navigate to time blocking tab in input page
    router.push('/input?tab=timeblock');
  }

  function handleMorningFlowSkip() {
    setShowMorningFlow(false);
  }

  function handleEveningFlowComplete() {
    setShowEveningFlow(false);
    // Reload to show locked state
    window.location.reload();
  }

  function handleEveningFlowSkip() {
    setShowEveningFlow(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Life OS Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track your progress, habits, and performance across all life areas
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Scale Selector */}
        <TimeScaleSelector selected={timeScale} onChange={setTimeScale} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Goal Progress Chart - Takes full width on mobile, half on desktop */}
          <div className="lg:col-span-2">
            <GoalProgressChart />
          </div>

          {/* Life Areas Chart - Takes full width on mobile, half on desktop */}
          <div className="lg:col-span-2">
            <LifeAreasChart />
          </div>

          {/* Weight Trend Chart - Full width */}
          <div className="lg:col-span-2">
            <WeightTrendChart />
          </div>

          {/* Ratings Comparison Chart */}
          <div className="lg:col-span-2">
            <RatingsComparisonChart timeScale={timeScale} />
          </div>

          {/* Focus Heatmap */}
          <div className="lg:col-span-2">
            <FocusHeatmap />
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <QuickStatCard
            title="Active Goals"
            value="5"
            subtitle="In progress"
            color="blue"
          />
          <QuickStatCard
            title="Completion Rate"
            value="78%"
            subtitle="This week"
            color="green"
          />
          <QuickStatCard
            title="Focus Hours"
            value="32"
            subtitle="This week"
            color="purple"
          />
          <QuickStatCard
            title="Streak"
            value="12"
            subtitle="Days active"
            color="orange"
          />
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">💡 Tip:</span> Use the time scale selector above to
            zoom between weekly and yearly views. Charts update automatically to show the most
            relevant data for your selected timeframe.
          </p>
        </div>
      </div>

      {/* Morning Flow Modal */}
      {showMorningFlow && (
        <MorningFlow onComplete={handleMorningFlowComplete} onSkip={handleMorningFlowSkip} />
      )}

      {/* Evening Flow Modal */}
      {showEveningFlow && (
        <EveningFlow onComplete={handleEveningFlowComplete} onSkip={handleEveningFlowSkip} />
      )}
    </div>
  );
}

// Quick Stat Card Component
interface QuickStatCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function QuickStatCard({ title, value, subtitle, color }: QuickStatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs opacity-75 mt-1">{subtitle}</p>
    </div>
  );
}
