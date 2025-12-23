'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface CardioEntry {
  id: string;
  log_date: string;
  entry_type: string;
  duration_minutes: number | null;
  distance_km: number | null;
  steps: number | null;
  calories_burned: number | null;
  avg_heart_rate: number | null;
  raw_text: string | null;
  notes: string | null;
}

export default function CardioEntry() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [entryType, setEntryType] = useState('steps');
  const [rawText, setRawText] = useState('');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [steps, setSteps] = useState('');
  const [calories, setCalories] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<CardioEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchEntries();
  }, [date]);

  async function fetchEntries() {
    try {
      const res = await fetch(`/api/cardio-entries?log_date=${date}`);
      const data = await res.json();
      setEntries(data.cardio_entries || []);
    } catch (error) {
      console.error('Error fetching cardio entries:', error);
    }
  }

  async function handleSave() {
    setLoading(true);
    setMessage(null);

    try {
      const body = {
        log_date: date,
        entry_type: entryType,
        duration_minutes: duration ? parseInt(duration) : null,
        distance_km: distance ? parseFloat(distance) : null,
        steps: steps ? parseInt(steps) : null,
        calories_burned: calories ? parseInt(calories) : null,
        avg_heart_rate: heartRate ? parseInt(heartRate) : null,
        raw_text: rawText || null,
        notes: notes || null,
      };

      const url = editingEntry
        ? `/api/cardio-entries?id=${editingEntry}`
        : '/api/cardio-entries';
      const method = editingEntry ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to save cardio entry');

      setMessage({
        type: 'success',
        text: editingEntry ? 'Entry updated successfully!' : 'Entry saved successfully!'
      });

      // Reset form
      setRawText('');
      setDuration('');
      setDistance('');
      setSteps('');
      setCalories('');
      setHeartRate('');
      setNotes('');
      setEditingEntry(null);

      // Refresh entries
      await fetchEntries();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save entry. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const res = await fetch(`/api/cardio-entries?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete entry');

      setMessage({ type: 'success', text: 'Entry deleted successfully!' });
      await fetchEntries();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete entry.' });
    }
  }

  function handleEdit(entry: CardioEntry) {
    setEditingEntry(entry.id);
    setEntryType(entry.entry_type);
    setRawText(entry.raw_text || '');
    setDuration(entry.duration_minutes?.toString() || '');
    setDistance(entry.distance_km?.toString() || '');
    setSteps(entry.steps?.toString() || '');
    setCalories(entry.calories_burned?.toString() || '');
    setHeartRate(entry.avg_heart_rate?.toString() || '');
    setNotes(entry.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingEntry(null);
    setRawText('');
    setDuration('');
    setDistance('');
    setSteps('');
    setCalories('');
    setHeartRate('');
    setNotes('');
  }

  return (
    <div className="space-y-6">
      {/* Entry Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {editingEntry ? 'Edit Cardio Entry' : 'Cardio & Steps Entry'}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              />
            </div>

            <div>
              <label htmlFor="entryType" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="entryType"
                value={entryType}
                onChange={(e) => setEntryType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="steps">Steps</option>
                <option value="run">Run</option>
                <option value="bike">Bike</option>
                <option value="swim">Swim</option>
                <option value="walk">Walk</option>
                <option value="cardio">Cardio</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="rawText" className="block text-sm font-medium text-gray-700 mb-1">
              Quick Entry (optional)
            </label>
            <textarea
              id="rawText"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g., 30 min run, 5km, 250 calories"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Describe your activity in natural language (saved as-is)
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-1">
                Distance (km)
              </label>
              <input
                type="number"
                step="0.1"
                id="distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="5.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="steps" className="block text-sm font-medium text-gray-700 mb-1">
                Steps
              </label>
              <input
                type="number"
                id="steps"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="10000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="calories" className="block text-sm font-medium text-gray-700 mb-1">
                Calories
              </label>
              <input
                type="number"
                id="calories"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="250"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="heartRate" className="block text-sm font-medium text-gray-700 mb-1">
                Avg HR (bpm)
              </label>
              <input
                type="number"
                id="heartRate"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                placeholder="140"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
            </button>

            {editingEntry && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Existing Entries */}
      {entries.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Entries for {format(new Date(date), 'MMM dd, yyyy')}
          </h3>
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {entry.entry_type}
                      </span>
                      {entry.raw_text && (
                        <span className="text-sm text-gray-600 italic">
                          "{entry.raw_text}"
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700">
                      {entry.duration_minutes && (
                        <div>
                          <span className="font-medium">Duration:</span> {entry.duration_minutes} min
                        </div>
                      )}
                      {entry.distance_km && (
                        <div>
                          <span className="font-medium">Distance:</span> {entry.distance_km} km
                        </div>
                      )}
                      {entry.steps && (
                        <div>
                          <span className="font-medium">Steps:</span> {entry.steps.toLocaleString()}
                        </div>
                      )}
                      {entry.calories_burned && (
                        <div>
                          <span className="font-medium">Calories:</span> {entry.calories_burned} cal
                        </div>
                      )}
                      {entry.avg_heart_rate && (
                        <div>
                          <span className="font-medium">Avg HR:</span> {entry.avg_heart_rate} bpm
                        </div>
                      )}
                    </div>

                    {entry.notes && (
                      <p className="mt-2 text-sm text-gray-600">{entry.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
