'use client';

import { useState } from 'react';

export default function MigratePage() {
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handlePreview() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/migrate/life-areas');
      const data = await res.json();
      setPreview(data);
      setMessage({
        type: 'success',
        text: `Preview loaded: ${data.needs_migration || 0} goals need migration`,
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load preview' });
    } finally {
      setLoading(false);
    }
  }

  async function handleMigrate() {
    if (!confirm('Are you sure you want to migrate life area categories? This will update existing macro goals.')) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/migrate/life-areas', {
        method: 'POST',
      });
      const data = await res.json();
      setResult(data);
      setPreview(null);

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Migration completed! Updated ${data.updated} goals.`,
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Migration failed',
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to run migration' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Data Migration</h1>
          <p className="mt-2 text-sm text-gray-600">
            Migrate life area categories to new standardized format
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Life Area Category Migration</h2>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-semibold text-blue-900 mb-2">Migration Details</h3>
            <p className="text-sm text-blue-800 mb-2">
              This migration updates life area categories from the old format to the new standardized format:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4">
              <li>• Financial → financial</li>
              <li>• Health → health</li>
              <li>• Personal → personal</li>
              <li>• Professional → career</li>
              <li>• Relationships → relationships</li>
              <li>• New categories: recreation, hobbies</li>
            </ul>
            <p className="text-sm text-blue-800 mt-2">
              <strong>Safe:</strong> This migration is non-destructive and only updates category names.
            </p>
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

          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={handlePreview}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Preview Changes'}
              </button>

              {preview && preview.needs_migration > 0 && (
                <button
                  onClick={handleMigrate}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Migrating...' : `Migrate ${preview.needs_migration} Goals`}
                </button>
              )}
            </div>

            {preview && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Preview</h3>
                <p className="text-sm text-gray-600 mb-3">{preview.message}</p>

                {preview.preview && preview.preview.length > 0 && (
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Goal Title
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Current
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            New
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {preview.preview.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.title}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{item.current_life_area}</td>
                            <td className="px-4 py-3 text-sm text-green-600 font-medium">
                              {item.new_life_area}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {preview.needs_migration === 0 && (
                  <p className="text-sm text-gray-500 italic">All goals are already using the new format!</p>
                )}
              </div>
            )}

            {result && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Migration Result</h3>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-sm text-gray-900 mb-2">{result.message}</p>
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-red-600 mb-1">Errors:</p>
                      <ul className="text-sm text-red-600 space-y-1">
                        {result.errors.map((error: string, idx: number) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This page is for one-time data migration. After running the migration successfully,
            you can safely navigate away. The migration is idempotent - running it multiple times is safe.
          </p>
        </div>
      </div>
    </div>
  );
}
