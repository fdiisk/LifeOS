'use client';

import { useState } from 'react';
import { format } from 'date-fns';

export default function RatingsInput() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [focusRating, setFocusRating] = useState(50);
  const [effortRating, setEffortRating] = useState(50);
  const [moodRating, setMoodRating] = useState(50);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [objectiveData, setObjectiveData] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          focus_rating: focusRating,
          effort_rating: effortRating,
          mood_rating: moodRating,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        // Try PATCH if already exists
        const patchRes = await fetch('/api/ratings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            focus_rating: focusRating,
            effort_rating: effortRating,
            mood_rating: moodRating,
            notes: notes || null,
          }),
        });

        if (!patchRes.ok) throw new Error('Failed to save ratings');
        const patchData = await patchRes.json();
        setObjectiveData(patchData.objective);
      } else {
        const data = await res.json();
        setObjectiveData(data.objective);
      }

      setMessage({ type: 'success', text: 'Ratings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save ratings. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  const getRatingColor = (value: number) => {
    if (value >= 75) return 'bg-green-500';
    if (value >= 50) return 'bg-yellow-500';
    if (value >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Ratings</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Focus Rating */}
        <div>
          <label htmlFor="focus" className="block text-sm font-medium text-gray-700 mb-2">
            Focus Rating: <span className="font-bold text-blue-600">{focusRating}</span>
          </label>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">Low</span>
            <input
              type="range"
              id="focus"
              min="0"
              max="100"
              value={focusRating}
              onChange={(e) => setFocusRating(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-xs text-gray-500">High</span>
          </div>
          <div className="mt-2 h-2 rounded-full overflow-hidden bg-gray-200">
            <div
              className={`h-full ${getRatingColor(focusRating)} transition-all`}
              style={{ width: `${focusRating}%` }}
            />
          </div>
        </div>

        {/* Effort Rating */}
        <div>
          <label htmlFor="effort" className="block text-sm font-medium text-gray-700 mb-2">
            Effort Rating: <span className="font-bold text-blue-600">{effortRating}</span>
          </label>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">Low</span>
            <input
              type="range"
              id="effort"
              min="0"
              max="100"
              value={effortRating}
              onChange={(e) => setEffortRating(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-xs text-gray-500">High</span>
          </div>
          <div className="mt-2 h-2 rounded-full overflow-hidden bg-gray-200">
            <div
              className={`h-full ${getRatingColor(effortRating)} transition-all`}
              style={{ width: `${effortRating}%` }}
            />
          </div>
        </div>

        {/* Mood Rating */}
        <div>
          <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-2">
            Mood Rating: <span className="font-bold text-blue-600">{moodRating}</span>
          </label>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">Low</span>
            <input
              type="range"
              id="mood"
              min="0"
              max="100"
              value={moodRating}
              onChange={(e) => setMoodRating(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-xs text-gray-500">High</span>
          </div>
          <div className="mt-2 h-2 rounded-full overflow-hidden bg-gray-200">
            <div
              className={`h-full ${getRatingColor(moodRating)} transition-all`}
              style={{ width: `${moodRating}%` }}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional thoughts about your day?"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Objective Data Display */}
        {objectiveData && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-semibold text-blue-900 mb-2">Objective Performance</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Overall Score:</span>
                <span className="font-semibold">{objectiveData.overall_score}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Tasks:</span>
                <span className="font-semibold">{objectiveData.task_completion_score}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Habits:</span>
                <span className="font-semibold">{objectiveData.habit_completion_score}%</span>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div
            className={`p-3 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Saving...' : 'Save Ratings'}
        </button>
      </form>
    </div>
  );
}
