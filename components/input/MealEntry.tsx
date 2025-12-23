'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface NutritionEntry {
  name: string;
  type: 'food' | 'water' | 'caffeine';
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size?: string;
  brand?: string;
}

export default function MealEntry() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch');
  const [mealText, setMealText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedEntries, setParsedEntries] = useState<NutritionEntry[]>([]);
  const [rawInput, setRawInput] = useState('');
  const [aiParsedData, setAiParsedData] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleParse() {
    if (!mealText.trim()) return;

    setParsing(true);
    setMessage(null);
    setParsedEntries([]);

    try {
      const res = await fetch('/api/ai/parse/meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: mealText }),
      });

      if (!res.ok) throw new Error('Failed to parse meal');

      const data = await res.json();
      const result = data.result;

      if (result.error) {
        setMessage({ type: 'error', text: result.error });
        return;
      }

      if (!result.entries || result.entries.length === 0) {
        setMessage({ type: 'error', text: 'No food items found. Please try describing your meal differently.' });
        return;
      }

      setParsedEntries(result.entries);
      setRawInput(result.raw_input || mealText);
      setAiParsedData(result);

      if (result.from_cache) {
        setMessage({ type: 'success', text: `✓ Found ${result.entries.length} items (from cache)` });
      } else {
        setMessage({ type: 'success', text: `✓ Parsed ${result.entries.length} items with AI` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to parse meal. Please try again.' });
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!parsedEntries || parsedEntries.length === 0) {
      setMessage({ type: 'error', text: 'Please parse the meal first.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/nutrition-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_date: date,
          meal_type: mealType,
          entries: parsedEntries,
          raw_text: rawInput,
          ai_parsed_data: aiParsedData,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save meal');
      }

      setMessage({ type: 'success', text: `${parsedEntries.length} ${parsedEntries.length === 1 ? 'entry' : 'entries'} saved successfully!` });
      setMealText('');
      setParsedEntries([]);
      setRawInput('');
      setAiParsedData(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save meal. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  function updateEntry(index: number, field: keyof NutritionEntry, value: any) {
    setParsedEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function removeEntry(index: number) {
    setParsedEntries((prev) => prev.filter((_, i) => i !== index));
  }

  // Calculate totals from current entries
  const totals = parsedEntries.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.calories || 0),
      protein_g: acc.protein_g + (entry.protein_g || 0),
      carbs_g: acc.carbs_g + (entry.carbs_g || 0),
      fat_g: acc.fat_g + (entry.fat_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

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

        {parsedEntries.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-900 mb-3">Parsed Items - Review & Edit</h3>

            <div className="space-y-3">
              {parsedEntries.map((entry, index) => (
                <div key={index} className="bg-white p-3 rounded border border-green-300">
                  <div className="flex justify-between items-start mb-2">
                    <input
                      type="text"
                      value={entry.name}
                      onChange={(e) => updateEntry(index, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-medium"
                      placeholder="Food name"
                    />
                    <button
                      onClick={() => removeEntry(index)}
                      className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>

                  {entry.brand && (
                    <div className="mb-2">
                      <input
                        type="text"
                        value={entry.brand}
                        onChange={(e) => updateEntry(index, 'brand', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        placeholder="Brand (optional)"
                      />
                    </div>
                  )}

                  {entry.serving_size && (
                    <div className="mb-2 text-xs text-gray-600">
                      Serving: {entry.serving_size}
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Calories</label>
                      <input
                        type="number"
                        value={entry.calories}
                        onChange={(e) => updateEntry(index, 'calories', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        step="1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Protein (g)</label>
                      <input
                        type="number"
                        value={entry.protein_g}
                        onChange={(e) => updateEntry(index, 'protein_g', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Carbs (g)</label>
                      <input
                        type="number"
                        value={entry.carbs_g}
                        onChange={(e) => updateEntry(index, 'carbs_g', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Fat (g)</label>
                      <input
                        type="number"
                        value={entry.fat_g}
                        onChange={(e) => updateEntry(index, 'fat_g', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-green-300">
              <h4 className="font-semibold text-green-900 mb-2">Totals</h4>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-700 block">Calories:</span>
                  <span className="font-semibold">{totals.calories.toFixed(0)} kcal</span>
                </div>
                <div>
                  <span className="text-gray-700 block">Protein:</span>
                  <span className="font-semibold">{totals.protein_g.toFixed(1)}g</span>
                </div>
                <div>
                  <span className="text-gray-700 block">Carbs:</span>
                  <span className="font-semibold">{totals.carbs_g.toFixed(1)}g</span>
                </div>
                <div>
                  <span className="text-gray-700 block">Fat:</span>
                  <span className="font-semibold">{totals.fat_g.toFixed(1)}g</span>
                </div>
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

        {parsedEntries.length > 0 && (
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Saving...' : `Save ${parsedEntries.length} ${parsedEntries.length === 1 ? 'Entry' : 'Entries'}`}
          </button>
        )}
      </div>
    </div>
  );
}
