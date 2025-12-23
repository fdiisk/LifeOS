'use client';

import { useState, useEffect } from 'react';

interface MacroProfile {
  id: string;
  name: string;
  protein_percent: number;
  carbs_percent: number;
  fat_percent: number;
}

interface Settings {
  height_cm: number | null;
  current_weight_kg: number | null;
  goal_weight_kg: number | null;
  age: number | null;
  goal_calories: number | null;
  target_deficit_calories: number | null;
  macro_profiles: MacroProfile[];
  active_macro_profile_id: string | null;
  caffeine_tracking_enabled: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Macro profile editing
  const [editingProfile, setEditingProfile] = useState<MacroProfile | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileProtein, setNewProfileProtein] = useState(30);
  const [newProfileCarbs, setNewProfileCarbs] = useState(40);
  const [newProfileFat, setNewProfileFat] = useState(30);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();

      if (data.success) {
        setSettings(data.data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load settings' });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setSettings(data.data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key: keyof Settings, value: any) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  function addMacroProfile() {
    if (!settings) return;
    if (!newProfileName.trim()) {
      setMessage({ type: 'error', text: 'Profile name is required' });
      return;
    }

    const total = newProfileProtein + newProfileCarbs + newProfileFat;
    if (Math.abs(total - 100) > 0.1) {
      setMessage({ type: 'error', text: 'Macro percentages must sum to 100%' });
      return;
    }

    const newProfile: MacroProfile = {
      id: `custom_${Date.now()}`,
      name: newProfileName,
      protein_percent: newProfileProtein,
      carbs_percent: newProfileCarbs,
      fat_percent: newProfileFat,
    };

    setSettings({
      ...settings,
      macro_profiles: [...settings.macro_profiles, newProfile],
    });

    // Reset form
    setNewProfileName('');
    setNewProfileProtein(30);
    setNewProfileCarbs(40);
    setNewProfileFat(30);
    setMessage({ type: 'success', text: 'Profile added! Click "Save Settings" to persist.' });
  }

  function deleteMacroProfile(id: string) {
    if (!settings) return;

    setSettings({
      ...settings,
      macro_profiles: settings.macro_profiles.filter((p) => p.id !== id),
      active_macro_profile_id:
        settings.active_macro_profile_id === id ? null : settings.active_macro_profile_id,
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Failed to load settings</p>
      </div>
    );
  }

  const activeProfile = settings.macro_profiles.find(
    (p) => p.id === settings.active_macro_profile_id
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your health metrics and preferences</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Health Metrics */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Metrics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                value={settings.height_cm || ''}
                onChange={(e) =>
                  updateSetting('height_cm', e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="175"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
              <input
                type="number"
                value={settings.age || ''}
                onChange={(e) =>
                  updateSetting('age', e.target.value ? parseInt(e.target.value) : null)
                }
                placeholder="30"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.current_weight_kg || ''}
                onChange={(e) =>
                  updateSetting(
                    'current_weight_kg',
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="70.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={settings.goal_weight_kg || ''}
                onChange={(e) =>
                  updateSetting(
                    'goal_weight_kg',
                    e.target.value ? parseFloat(e.target.value) : null
                  )
                }
                placeholder="65.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Calorie Targets */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Calorie Targets</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Calories (daily)
              </label>
              <input
                type="number"
                value={settings.goal_calories || ''}
                onChange={(e) =>
                  updateSetting('goal_calories', e.target.value ? parseInt(e.target.value) : null)
                }
                placeholder="2000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Deficit (calories/day)
              </label>
              <input
                type="number"
                value={settings.target_deficit_calories || ''}
                onChange={(e) =>
                  updateSetting(
                    'target_deficit_calories',
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">For weight loss goals</p>
            </div>
          </div>
        </div>

        {/* Macro Profiles */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Macro Profiles</h2>

          {/* Active Profile Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Profile
            </label>
            <div className="flex flex-wrap gap-2">
              {settings.macro_profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => updateSetting('active_macro_profile_id', profile.id)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    settings.active_macro_profile_id === profile.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {profile.name}
                </button>
              ))}
            </div>

            {activeProfile && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Active:</strong> {activeProfile.name} - Protein:{' '}
                  {activeProfile.protein_percent}%, Carbs: {activeProfile.carbs_percent}%, Fat:{' '}
                  {activeProfile.fat_percent}%
                </p>
              </div>
            )}
          </div>

          {/* Existing Profiles List */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Manage Profiles</h3>
            <div className="space-y-2">
              {settings.macro_profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{profile.name}</p>
                    <p className="text-sm text-gray-600">
                      P: {profile.protein_percent}% | C: {profile.carbs_percent}% | F:{' '}
                      {profile.fat_percent}%
                    </p>
                  </div>
                  <button
                    onClick={() => deleteMacroProfile(profile.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Profile */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Add New Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="My Profile"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Protein %</label>
                <input
                  type="number"
                  value={newProfileProtein}
                  onChange={(e) => setNewProfileProtein(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Carbs %</label>
                <input
                  type="number"
                  value={newProfileCarbs}
                  onChange={(e) => setNewProfileCarbs(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Fat %</label>
                <input
                  type="number"
                  value={newProfileFat}
                  onChange={(e) => setNewProfileFat(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Total: {newProfileProtein + newProfileCarbs + newProfileFat}% (should be 100%)
            </p>
            <button
              onClick={addMacroProfile}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Profile
            </button>
          </div>
        </div>

        {/* Tracking Preferences */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tracking Preferences</h2>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.caffeine_tracking_enabled}
              onChange={(e) => updateSetting('caffeine_tracking_enabled', e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700">Enable caffeine tracking</span>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
