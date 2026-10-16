import React, { useState, useEffect } from 'react';
import { Project, BusinessProfile } from '../types';
import { api } from '../services/api';
import { Building2, Save, CheckCircle2, Globe, Sparkles, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface BusinessProfilesViewProps {
  activeProject: Project | null;
  onProfileUpdated?: () => void;
}

export const BusinessProfilesView: React.FC<BusinessProfilesViewProps> = ({
  activeProject,
  onProfileUpdated,
}) => {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [productsServices, setProductsServices] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [targetCountry, setTargetCountry] = useState('United States');
  const [targetCity, setTargetCity] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('English');
  const [brandVoice, setBrandVoice] = useState('Authoritative & Helpful');
  const [contentGoals, setContentGoals] = useState('');
  const [competitorUrls, setCompetitorUrls] = useState('');
  const [brandGuidelines, setBrandGuidelines] = useState('');
  const [preferredTerms, setPreferredTerms] = useState('');
  const [phrasesToAvoid, setPhrasesToAvoid] = useState('');

  // Existing pages list for internal linking verification
  const [existingPages, setExistingPages] = useState<Array<{ title: string; url: string }>>([]);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageUrl, setNewPageUrl] = useState('');

  useEffect(() => {
    if (!activeProject) return;
    setLoading(true);
    setError(null);
    api
      .getProfile(activeProject.id)
      .then((data) => {
        setProfile(data);
        setBusinessName(data.business_name || '');
        setWebsiteUrl(data.website_url || '');
        setIndustry(data.industry || '');
        setProductsServices(data.products_services || '');
        setTargetAudience(data.target_audience || '');
        setTargetCountry(data.target_country || 'United States');
        setTargetCity(data.target_city || '');
        setPrimaryLanguage(data.primary_language || 'English');
        setBrandVoice(data.brand_voice || 'Authoritative & Helpful');
        setContentGoals(data.content_goals || '');
        setCompetitorUrls(data.competitor_urls || '');
        setBrandGuidelines(data.brand_guidelines || '');
        setPreferredTerms(data.preferred_terms || '');
        setPhrasesToAvoid(data.phrases_to_avoid || '');
        setExistingPages(data.existing_pages || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [activeProject?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    if (!businessName.trim() || !industry.trim() || !productsServices.trim() || !targetAudience.trim()) {
      setError('Please fill in all required fields (Business Name, Industry, Products/Services, Target Audience).');
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const updated = await api.updateProfile(activeProject.id, {
        business_name: businessName,
        website_url: websiteUrl,
        industry,
        products_services: productsServices,
        target_audience: targetAudience,
        target_country: targetCountry,
        target_city: targetCity,
        primary_language: primaryLanguage,
        brand_voice: brandVoice,
        content_goals: contentGoals,
        competitor_urls: competitorUrls,
        brand_guidelines: brandGuidelines,
        preferred_terms: preferredTerms,
        phrases_to_avoid: phrasesToAvoid,
        existing_pages: existingPages,
      });
      setProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onProfileUpdated) onProfileUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPage = () => {
    if (!newPageTitle.trim() || !newPageUrl.trim()) return;
    setExistingPages([...existingPages, { title: newPageTitle.trim(), url: newPageUrl.trim() }]);
    setNewPageTitle('');
    setNewPageUrl('');
  };

  const handleRemovePage = (index: number) => {
    setExistingPages(existingPages.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-400 text-xs font-mono">
        Loading business profile...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#E5DED3] dark:border-[#273347] gap-3">
        <div>
          <h2 className="text-2xl font-bold font-editorial text-slate-900 dark:text-white">
            Business Website Profile
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure accurate business context, services, audience, and guidelines. All AI strategy and blog generation grounds directly on these verified inputs.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full text-xs font-medium border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Profile saved successfully!
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2 border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Business Information */}
        <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-display border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Required Business Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Business or Brand Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Apex Web Studio"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://apexwebstudio.com"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Industry or Niche *
              </label>
              <input
                type="text"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Web Development & Technical SEO"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Target Country
              </label>
              <input
                type="text"
                value={targetCountry}
                onChange={(e) => setTargetCountry(e.target.value)}
                placeholder="e.g. United States"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Target City or Service Area (Optional for Local SEO)
              </label>
              <input
                type="text"
                value={targetCity}
                onChange={(e) => setTargetCity(e.target.value)}
                placeholder="e.g. Austin, TX"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Brand Editorial Voice
              </label>
              <select
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
              >
                <option value="Authoritative & Helpful">Authoritative & Helpful (Recommended)</option>
                <option value="Technical & Analytical">Technical & Analytical</option>
                <option value="Conversational & Engaging">Conversational & Engaging</option>
                <option value="Executive & Strategic">Executive & Strategic</option>
                <option value="Empathetic & Practical">Empathetic & Practical</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Core Products & Services *
            </label>
            <textarea
              rows={2}
              required
              value={productsServices}
              onChange={(e) => setProductsServices(e.target.value)}
              placeholder="e.g. Custom Next.js website engineering, technical SEO site architecture audits, high-performance web applications..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9] resize-none"
            />
          </div>

          <div className="text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Target Audience Persona *
            </label>
            <textarea
              rows={2}
              required
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Founders, VP of Marketing, Technical Leads looking to redesign enterprise websites with high speed and conversion rate focus..."
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9] resize-none"
            />
          </div>
        </div>

        {/* Brand Guidelines & Strategy Objectives */}
        <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-display border-b border-slate-100 dark:border-slate-800 pb-2">
            2. Brand Guidelines & Vocabulary Rules
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Preferred Terminology
              </label>
              <textarea
                rows={2}
                value={preferredTerms}
                onChange={(e) => setPreferredTerms(e.target.value)}
                placeholder="e.g. Modern web architecture, conversion rate optimization, technical SEO foundation"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9] resize-none"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Phrases or Claims to Avoid
              </label>
              <textarea
                rows={2}
                value={phrasesToAvoid}
                onChange={(e) => setPhrasesToAvoid(e.target.value)}
                placeholder="e.g. Cheap websites, guaranteed #1 ranking overnight, disruptive synergy..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9] resize-none"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Primary Content & Business Goals
            </label>
            <input
              type="text"
              value={contentGoals}
              onChange={(e) => setContentGoals(e.target.value)}
              placeholder="e.g. Build topical authority in modern web development to drive high-LTV inbound leads"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6256D9]"
            />
          </div>
        </div>

        {/* Existing Website Pages Inventory (for Internal Linking) */}
        <div className="bg-white dark:bg-[#151D2A] border border-[#E5DED3] dark:border-[#273347] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-display">
              3. Existing Verified Pages Inventory
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              RankCraft AI only suggests internal links to known or verified URLs. Add your core service or landing pages here.
            </p>
          </div>

          {/* Add Page Row */}
          <div className="flex flex-col sm:flex-row gap-2 text-xs">
            <input
              type="text"
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              placeholder="Page Title (e.g. Custom Web Development)"
              className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#6256D9]"
            />
            <input
              type="text"
              value={newPageUrl}
              onChange={(e) => setNewPageUrl(e.target.value)}
              placeholder="URL (e.g. https://apexwebstudio.com/services/web-development)"
              className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#FAF9F7] dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#6256D9]"
            />
            <button
              type="button"
              onClick={handleAddPage}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl flex items-center justify-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Page
            </button>
          </div>

          {/* Existing Pages List */}
          {existingPages.length > 0 && (
            <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {existingPages.map((page, idx) => (
                <div key={idx} className="pt-2 flex items-center justify-between">
                  <div className="truncate pr-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                      {page.title}
                    </span>
                    <span className="text-[11px] text-[#6256D9] font-mono truncate block">
                      {page.url}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePage(idx)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                    title="Remove page"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#6256D9] hover:bg-[#5045BC] text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Profile...' : 'Save Business Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};
