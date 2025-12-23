'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { LIFE_AREAS, LIFE_AREA_LABELS, type LifeArea } from '@/lib/life-areas';

interface TimeBlock {
  id: string;
  block_date: string;
  start_time: string;
  duration_minutes: number;
  life_area: LifeArea | null;
  task_id?: string;
  macro_goal_id?: string;
  focus_rating?: number;
  success_rating?: number;
  notes?: string;
}

export default function TimeBlockEntry() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [lifeArea, setLifeArea] = useState<LifeArea>('personal');
  const [focusRating, setFocusRating] = useState(5);
  const [successRating, setSuccessRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const MAX_DAILY_HOURS = 14;

  useEffect(() => {
    fetchBlocks();
  }, [date]);

  async function fetchBlocks() {
    try {
      const res = await fetch(`/api/focus-sessions?block_date=${date}`);
      const data = await res.json();
      setBlocks(data.sessions || []);

      // Calculate daily total
      const total = (data.sessions || []).reduce(
        (sum: number, block: TimeBlock) => sum + (block.duration_minutes || 0),
        0
      );
      setDailyTotal(total);
    } catch (error) {
      console.error('Error fetching time blocks:', error);
    }
  }

  async function handleCreate() {
    if (durationHours === 0 && durationMinutes === 0) {
      setMessage({ type: 'error', text: 'Duration must be greater than 0' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const totalMinutes = durationHours * 60 + durationMinutes;
      const startDateTime = `${date}T${startTime}:00`;

      const res = await fetch('/api/focus-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_date: date,
          start_time: startDateTime,
          duration_minutes: totalMinutes,
          life_area: lifeArea,
          focus_rating: focusRating,
          success_rating: successRating,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setMessage({ type: 'error', text: data.error || 'Failed to create time block' });
        return;
      }

      setMessage({ type: 'success', text: 'Time block created successfully!' });
      setNotes('');
      fetchBlocks();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create time block. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this time block?')) return;

    try {
      await fetch(`/api/focus-sessions?id=${id}`, { method: 'DELETE' });
      fetchBlocks();
    } catch (error) {
      console.error('Error deleting time block:', error);
    }
  }

  const remainingMinutes = MAX_DAILY_HOURS * 60 - dailyTotal;
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingMins = remainingMinutes % 60;
  const usedPercentage = (dailyTotal / (MAX_DAILY_HOURS * 60)) * 100;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Time Blocking</h2>

      {/* Daily Summary */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-blue-900">
            Daily Total: {Math.floor(dailyTotal / 60)}h {dailyTotal % 60}m / {MAX_DAILY_HOURS}h
          </span>
          <span className="text-sm font-medium text-blue-900">
            Remaining: {remainingHours}h {remainingMins}m
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              usedPercentage > 100 ? 'bg-red-600' : usedPercentage > 80 ? 'bg-yellow-500' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(usedPercentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Date */}
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

        {/* Start Time & Duration */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="durationHours" className="block text-sm font-medium text-gray-700 mb-1">
              Hours
            </label>
            <input
              type="number"
              id="durationHours"
              value={durationHours}
              onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
              min="0"
              max="14"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700 mb-1">
              Minutes
            </label>
            <input
              type="number"
              id="durationMinutes"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
              min="0"
              max="59"
              step="15"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Life Area */}
        <div>
          <label htmlFor="lifeArea" className="block text-sm font-medium text-gray-700 mb-1">
            Life Area / Category
          </label>
          <select
            id="lifeArea"
            value={lifeArea}
            onChange={(e) => setLifeArea(e.target.value as LifeArea)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LIFE_AREAS.map((area) => (
              <option key={area} value={area}>
                {LIFE_AREA_LABELS[area]}
              </option>
            ))}
          </select>
        </div>

        {/* Ratings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="focusRating" className="block text-sm font-medium text-gray-700 mb-1">
              Focus Rating (1-10)
            </label>
            <input
              type="range"
              id="focusRating"
              value={focusRating}
              onChange={(e) => setFocusRating(parseInt(e.target.value))}
              min="1"
              max="10"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>Distracted</span>
              <span className="font-medium">{focusRating}</span>
              <span>Deep Focus</span>
            </div>
          </div>
          <div>
            <label htmlFor="successRating" className="block text-sm font-medium text-gray-700 mb-1">
              Success Rating (1-10)
            </label>
            <input
              type="range"
              id="successRating"
              value={successRating}
              onChange={(e) => setSuccessRating(parseInt(e.target.value))}
              min="1"
              max="10"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>Failed</span>
              <span className="font-medium">{successRating}</span>
              <span>Exceeded</span>
            </div>
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
            placeholder="What did you work on?"
            rows={3}
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

        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Creating...' : 'Create Time Block'}
        </button>
      </div>

      {/* Today's Blocks */}
      {blocks.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Today's Time Blocks</h3>
          <div className="space-y-2">
            {blocks.map((block) => (
              <div key={block.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">
                      {format(new Date(block.start_time), 'HH:mm')}
                    </span>
                    <span className="text-sm text-gray-600">
                      {Math.floor(block.duration_minutes / 60)}h {block.duration_minutes % 60}m
                    </span>
                    {block.life_area && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {LIFE_AREA_LABELS[block.life_area as LifeArea]}
                      </span>
                    )}
                  </div>
                  {block.notes && <p className="text-sm text-gray-600 mt-1">{block.notes}</p>}
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    {block.focus_rating && <span>Focus: {block.focus_rating}/10</span>}
                    {block.success_rating && <span>Success: {block.success_rating}/10</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(block.id)}
                  className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
