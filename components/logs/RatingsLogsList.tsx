'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface DailyRating {
  id: string;
  rating_date: string;
  energy_level?: number;
  mood?: number;
  productivity?: number;
  stress_level?: number;
  sleep_quality?: number;
  overall_satisfaction?: number;
  notes?: string;
  created_at: string;
}

export default function RatingsLogsList() {
  const [ratings, setRatings] = useState<DailyRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchRatings();
  }, [dateFilter]);

  async function fetchRatings() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.append('date', dateFilter);

      const res = await fetch(`/api/ratings?${params.toString()}`);
      const data = await res.json();
      setRatings(data.ratings || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
      setMessage({ type: 'error', text: 'Failed to load ratings' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this rating?')) return;

    try {
      const res = await fetch(`/api/ratings?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success !== false) {
        setMessage({ type: 'success', text: 'Rating deleted successfully' });
        fetchRatings();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete rating' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete rating' });
    }
  }

  function getRatingColor(value?: number): string {
    if (!value) return 'text-gray-500';
    if (value >= 8) return 'text-green-600';
    if (value >= 5) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getRatingLabel(value?: number): string {
    if (!value) return 'N/A';
    return `${value}/10`;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Daily Ratings</h2>
        <button
          onClick={fetchRatings}
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
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Clear filter
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
      ) : ratings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No ratings found.</p>
          <p className="text-sm mt-2">Start rating your days from the Input page!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div key={rating.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-gray-900">
                  {format(new Date(rating.rating_date), 'MMMM d, yyyy')}
                </h3>
                <button
                  onClick={() => handleDelete(rating.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Energy Level</p>
                  <p className={`font-semibold ${getRatingColor(rating.energy_level)}`}>
                    {getRatingLabel(rating.energy_level)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mood</p>
                  <p className={`font-semibold ${getRatingColor(rating.mood)}`}>
                    {getRatingLabel(rating.mood)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Productivity</p>
                  <p className={`font-semibold ${getRatingColor(rating.productivity)}`}>
                    {getRatingLabel(rating.productivity)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Stress Level</p>
                  <p className={`font-semibold ${getRatingColor(rating.stress_level ? 11 - rating.stress_level : undefined)}`}>
                    {getRatingLabel(rating.stress_level)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sleep Quality</p>
                  <p className={`font-semibold ${getRatingColor(rating.sleep_quality)}`}>
                    {getRatingLabel(rating.sleep_quality)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Overall Satisfaction</p>
                  <p className={`font-semibold ${getRatingColor(rating.overall_satisfaction)}`}>
                    {getRatingLabel(rating.overall_satisfaction)}
                  </p>
                </div>
              </div>

              {rating.notes && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Notes:</span> {rating.notes}
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
