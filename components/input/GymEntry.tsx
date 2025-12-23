'use client';

import { useState } from 'react';
import { format } from 'date-fns';

export default function GymEntry() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [workoutType, setWorkoutType] = useState('');
  const [workoutText, setWorkoutText] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleParse() {
    if (!workoutText.trim()) return;

    setParsing(true);
    setMessage(null);
    setParsedResult(null);

    try {
      const res = await fetch('/api/ai/parse/gym', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: workoutText }),
      });

      if (!res.ok) throw new Error('Failed to parse workout');

      const data = await res.json();
      setParsedResult(data.result);

      if (data.result.from_cache) {
        setMessage({ type: 'success', text: '✓ Parsed (from cache)' });
      } else {
        setMessage({ type: 'success', text: '✓ Parsed with AI' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to parse workout. Please try again.' });
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!parsedResult) {
      setMessage({ type: 'error', text: 'Please parse the workout first.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/gym-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_date: date,
          workout_type: workoutType || parsedResult.workout_type || 'General',
          exercises: parsedResult.exercises,
          duration_minutes: duration ? parseInt(duration) : null,
          raw_text: workoutText,
          ai_parsed_data: parsedResult,
        }),
      });

      if (!res.ok) throw new Error('Failed to save workout');

      setMessage({ type: 'success', text: 'Workout saved successfully!' });
      setWorkoutText('');
      setWorkoutType('');
      setDuration('');
      setParsedResult(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save workout. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Gym Entry (AI-Powered)</h2>

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
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="workoutType" className="block text-sm font-medium text-gray-700 mb-1">
            Workout Type (optional)
          </label>
          <input
            type="text"
            id="workoutType"
            value={workoutType}
            onChange={(e) => setWorkoutType(e.target.value)}
            placeholder="e.g., Upper Body, Cardio, Full Body"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="workoutText" className="block text-sm font-medium text-gray-700 mb-1">
            Describe your workout
          </label>
          <textarea
            id="workoutText"
            value={workoutText}
            onChange={(e) => setWorkoutText(e.target.value)}
            placeholder="e.g., Bench press 4x8 at 185lbs, Squats 3x10 at 225lbs, Pull-ups 3x12"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Describe your exercises naturally. AI will extract sets, reps, and weights.
          </p>
        </div>

        <button
          type="button"
          onClick={handleParse}
          disabled={parsing || !workoutText.trim()}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {parsing ? 'Parsing with AI...' : 'Parse Workout'}
        </button>

        {parsedResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-900 mb-2">Parsed Results</h3>
            {parsedResult.exercises && parsedResult.exercises.length > 0 ? (
              <div className="space-y-3">
                {parsedResult.exercises.map((exercise: any, idx: number) => (
                  <div key={idx} className="p-3 bg-white rounded border border-green-200">
                    <p className="font-medium text-gray-900">{exercise.name}</p>
                    <div className="mt-1 text-sm text-gray-700">
                      {exercise.sets && <span>{exercise.sets} sets</span>}
                      {exercise.reps && <span> × {exercise.reps} reps</span>}
                      {exercise.weight && <span> @ {exercise.weight}</span>}
                    </div>
                    {exercise.equipment && (
                      <p className="text-xs text-gray-500 mt-1">Equipment: {exercise.equipment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-700">No exercises parsed</p>
            )}

            {parsedResult.clarification_needed && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> {parsedResult.clarification_needed}
                </p>
              </div>
            )}
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

        {parsedResult && (
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Saving...' : 'Save Workout'}
          </button>
        )}
      </div>
    </div>
  );
}
