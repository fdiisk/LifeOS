'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface NutritionEntry {
  id: string;
  log_date: string;
  meal_type: string;
  name: string;
  brand?: string;
  serving_size?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
}

export default function NutritionLogsList() {
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [dateFilter, mealTypeFilter]);

  async function fetchEntries() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter) params.append('log_date', dateFilter);
      if (mealTypeFilter) params.append('meal_type', mealTypeFilter);

      const res = await fetch(`/api/nutrition-entries?${params.toString()}`);
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching nutrition entries:', error);
      setMessage({ type: 'error', text: 'Failed to load nutrition entries' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const res = await fetch(`/api/nutrition-entries?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Entry deleted successfully' });
        fetchEntries();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete entry' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete entry' });
    }
  }

  // Group entries by date and meal type
  const groupedEntries = entries.reduce((acc, entry) => {
    const key = `${entry.log_date}_${entry.meal_type}`;
    if (!acc[key]) {
      acc[key] = {
        date: entry.log_date,
        meal_type: entry.meal_type,
        entries: [],
      };
    }
    acc[key].entries.push(entry);
    return acc;
  }, {} as Record<string, { date: string; meal_type: string; entries: NutritionEntry[] }>);

  const groups = Object.values(groupedEntries).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Nutrition Entries</h2>
        <button
          onClick={fetchEntries}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Date
          </label>
          <input
            type="date"
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="mealTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Meal Type
          </label>
          <select
            id="mealTypeFilter"
            value={mealTypeFilter}
            onChange={(e) => setMealTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>
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
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No nutrition entries found.</p>
          <p className="text-sm mt-2">Start logging meals from the Input page!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const totals = group.entries.reduce(
              (acc, entry) => ({
                calories: acc.calories + entry.calories,
                protein_g: acc.protein_g + entry.protein_g,
                carbs_g: acc.carbs_g + entry.carbs_g,
                fat_g: acc.fat_g + entry.fat_g,
              }),
              { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
            );

            return (
              <div key={`${group.date}_${group.meal_type}`} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {format(new Date(group.date), 'MMMM d, yyyy')} - {group.meal_type.charAt(0).toUpperCase() + group.meal_type.slice(1)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {totals.calories.toFixed(0)} cal | {totals.protein_g.toFixed(1)}g protein | {totals.carbs_g.toFixed(1)}g carbs | {totals.fat_g.toFixed(1)}g fat
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.entries.map((entry) => (
                    <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {entry.name}
                          {entry.brand && <span className="text-gray-600 ml-2">({entry.brand})</span>}
                        </p>
                        {entry.serving_size && (
                          <p className="text-sm text-gray-600">Serving: {entry.serving_size}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          {entry.calories} cal | {entry.protein_g}g protein | {entry.carbs_g}g carbs | {entry.fat_g}g fat
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
