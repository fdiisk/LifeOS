import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Life OS
        </h2>
        <p className="text-gray-600 mb-6">
          Your personal life operating system. Track goals, habits, health metrics, and performance
          with powerful analytics and insights.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <FeatureCard
            title="Goal Tracking"
            description="6-month macro goals broken down into micro goals and actionable tasks"
          />
          <FeatureCard
            title="Habit Building"
            description="Track daily habits with streak calculation and consistency scoring"
          />
          <FeatureCard
            title="Health Metrics"
            description="Body metrics, nutrition, workouts, and calorie tracking"
          />
          <FeatureCard
            title="Performance Ratings"
            description="Compare perceived effort vs actual results with AI-powered insights"
          />
        </div>

        <Link
          href="/dashboard"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          View Dashboard →
        </Link>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
