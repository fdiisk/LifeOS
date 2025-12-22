'use client';

import { useState } from 'react';
import { format } from 'date-fns';

export default function EveningReflection() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [journal, setJournal] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/daily-logs/evening', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          evening_journal: journal,
        }),
      });

      if (!res.ok) throw new Error('Failed to save evening reflection');

      setMessage({ type: 'success', text: 'Evening reflection saved!' });
      setJournal('');
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Evening Reflection</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <label htmlFor="journal" className="block text-sm font-medium text-gray-700 mb-1">
            Evening Journal
          </label>
          <textarea
            id="journal"
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="What did you accomplish today? What did you learn? What are you grateful for?"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Reflect on your day, celebrate wins, and identify areas for improvement.
          </p>
        </div>

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
          {loading ? 'Saving...' : 'Save Evening Reflection'}
        </button>
      </form>
    </div>
  );
}
