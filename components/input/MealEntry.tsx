'use client';

import { useState } from 'react';
import { format } from 'date-fns';

export default function MealEntry() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [mealText, setMealText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleParse() {
    if (!mealText.trim()) return;

    setParsing(true);
    setMessage(null);
    setParsedResult(null);

    try {
      const res = await fetch('/api/ai/parse/meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: mealText }),
      });

      if (!res.ok) throw new Error('Failed to parse meal');

      const data = await res.json();
      setParsedResult(data.result);

      if (data.result.from_cache) {
        setMessage({ type: 'success', text: '✓ Parsed (from cache)' });
      } else {
        setMessage({ type: 'success', text: '✓ Parsed with AI' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to parse meal. Please try again.' });
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!parsedResult) {
      setMessage({ type: 'error', text: 'Please parse the meal first.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/nutrition-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_date: date,
          meal_type: mealType,
          food_items: parsedResult.items,
          total_calories: parsedResult.total_calories,
          protein_grams: parsedResult.macros.protein,
          carbs_grams: parsedResult.macros.carbs,
          fats_grams: parsedResult.macros.fats,
          ai_parsed_data: parsedResult,
        }),
      });

      if (!res.ok) throw new Error('Failed to save meal');

      setMessage({ type: 'success', text: 'Meal saved successfully!' });
      setMealText('');
      setParsedResult(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save meal. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Meal Entry (AI-Powered)</h2>

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
            <label htmlFor="mealType" className="block text-sm font-medium text-gray-700 mb-1">
              Meal Type
            </label>
            <select
              id="mealType"
              value={mealType}
              onChange={(e) => setMealType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="mealText" className="block text-sm font-medium text-gray-700 mb-1">
            What did you eat?
          </label>
          <textarea
            id="mealText"
            value={mealText}
            onChange={(e) => setMealText(e.target.value)}
            placeholder="e.g., Grilled chicken breast with brown rice and steamed broccoli. Side of avocado."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Describe your meal naturally. AI will extract calories and macros.
          </p>
        </div>

        <button
          type="button"
          onClick={handleParse}
          disabled={parsing || !mealText.trim()}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {parsing ? 'Parsing with AI...' : 'Parse Meal'}
        </button>

        {parsedResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-900 mb-2">Parsed Results</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Total Calories:</span>
                <span className="font-semibold">{parsedResult.total_calories} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Protein:</span>
                <span className="font-semibold">{parsedResult.macros.protein}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Carbs:</span>
                <span className="font-semibold">{parsedResult.macros.carbs}g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Fats:</span>
                <span className="font-semibold">{parsedResult.macros.fats}g</span>
              </div>
            </div>
            {parsedResult.items && parsedResult.items.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-600 font-medium mb-1">Items:</p>
                <ul className="text-xs text-gray-700 list-disc list-inside">
                  {parsedResult.items.map((item: any, idx: number) => (
                    <li key={idx}>{item.name || item}</li>
                  ))}
                </ul>
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
            {loading ? 'Saving...' : 'Save Meal'}
          </button>
        )}
      </div>
    </div>
  );
}
