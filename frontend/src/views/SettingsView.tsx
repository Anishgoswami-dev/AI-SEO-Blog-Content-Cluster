import React, { useState, useEffect } from 'react';
import { AppSettingsData } from '../types';
import { api } from '../services/api';
import {
  Settings, Key, Sparkles, CheckCircle2, AlertCircle,
  Save, Shield, Database, Moon, Sun, HelpCircle
} from 'lucide-react';

interface SettingsViewProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSettingsUpdated: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onToggleTheme,
  onSettingsUpdated,
}) => {
  const [settings, setSettings] = useState<AppSettingsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [activeProvider, setActiveProvider] = useState('gemini');
  const [activeModel, setActiveModel] = useState('gemini-1.5-flash');
  const [customInstructions, setCustomInstructions] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
      setActiveProvider(data.active_provider || 'gemini');
      setActiveModel(data.active_model || 'gemini-1.5-flash');
      setCustomInstructions(data.custom_instructions || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: any = {
        active_provider: activeProvider,
        active_model: activeModel,
        custom_instructions: customInstructions,
      };
      if (geminiKey.trim()) payload.gemini_api_key = geminiKey.trim();
      if (openaiKey.trim()) payload.openai_api_key = openaiKey.trim();

      const updated = await api.updateSettings(payload);
      setSettings(updated);
      setGeminiKey('');
      setOpenaiKey('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onSettingsUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#E5DED3] dark:border-[#273347] gap-3">
        <div>
          <h2 className="text-2xl font-bold font-editorial text-slate-900 dark:text-white">
            Studio Settings & Integrations
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure official AI providers, API credentials, model selectors, and external search data integrations.
          </p>
        </div>

        {success && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full text-xs font-medium border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Settings saved successfully!
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* AI Provider Configuration Card */}
        <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-display">
              1. AI Provider & API Keys
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              API keys are stored securely on your server instance and are never exposed to browser clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Active Provider
              </label>
              <select
                value={activeProvider}
                onChange={(e) => setActiveProvider(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              >
                <option value="gemini">Google Gemini (Recommended)</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Active Model
              </label>
              <select
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              >
                {activeProvider === 'gemini' ? (
                  <>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast & Cost Efficient)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                  </>
                ) : (
                  <>
                    <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                    <option value="gpt-4o">GPT-4o (High Intelligence)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Gemini API Key */}
          <div className="text-xs space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Google Gemini API Key
              </label>
              {settings?.gemini_api_key_configured && (
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Configured ({settings.gemini_api_key_masked})
                </span>
              )}
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder={settings?.gemini_api_key_configured ? 'Enter new key to update...' : 'AIzaSy...'}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9] font-mono"
            />
          </div>

          {/* OpenAI API Key */}
          <div className="text-xs space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                OpenAI API Key
              </label>
              {settings?.openai_api_key_configured && (
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Configured ({settings.openai_api_key_masked})
                </span>
              )}
            </div>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder={settings?.openai_api_key_configured ? 'Enter new key to update...' : 'sk-...'}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9] font-mono"
            />
          </div>

          <div className="p-3 bg-[#F0EDFF] dark:bg-[#6256D9]/15 rounded-xl border border-[#6256D9]/20 text-[11px] text-slate-600 dark:text-slate-300">
            💡 If no API key is set, RankCraft AI uses its built-in strategic SEO heuristics engine so you can fully explore topics, clusters, and outlines with rich realistic domain models.
          </div>
        </div>

        {/* External Provider Integration Layer (Optional / Disclosures) */}
        <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-display">
              2. Optional External Search Integrations
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Status of approved third-party measurement integrations (Section 20 of requirements).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Google Search Console</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Optional / Auth Required
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live organic query impressions and click metrics. Requires OAuth credentials.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800/60">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Keyword Volume API</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Adapter Layer Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Unconfigured. Labeled as 'Live Volume Requires Search API' to avoid fabricated volume numbers.
              </p>
            </div>
          </div>
        </div>

        {/* Interface Appearance */}
        <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-3xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white font-display">
              Studio Color Theme
            </h4>
            <p className="text-xs text-slate-500">
              Warm editorial off-white (#F7F5F0) or sleek dark mode (#111622).
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span>{theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Warm Editorial'}</span>
          </button>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#6256D9] hover:bg-[#5045BC] text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
