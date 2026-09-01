import React, { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';
import { LanguageSelector } from '../components/common/LanguageSelector';
import { ThemeSelector } from '../components/common/ThemeSelector';
import { FounderModal } from '../components/common/FounderModal';
import { FOUNDER_INFO } from '../data/founderData';
import {
  Settings,
  Shield,
  RotateCcw,
  Save,
  CheckCircle2,
  Building2,
  Lock,
  Layers,
  Database,
  Languages,
  Calendar,
  DollarSign,
  Globe,
  Palette,
  User,
  GraduationCap,
  Briefcase,
  Mail,
  Phone,
  Github,
  Linkedin,
  ExternalLink,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();
  const { t, language, setLanguage, currentLanguageOption, formatDate, formatCurrency } = useI18n();
  const { theme, setTheme, isDark } = useTheme();

  const isEmployeeRole = currentUser.role === UserRole.EMPLOYEE;

  const [companyName, setCompanyName] = useState('SmartProcure Technologies Inc.');
  const [gstNumber, setGstNumber] = useState('29AAACP9911D1Z1');
  const [tier1Limit, setTier1Limit] = useState(15000);
  const [tier2Limit, setTier2Limit] = useState(100000);
  const [autoPoEnabled, setAutoPoEnabled] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showFounderModal, setShowFounderModal] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', t('settings_savedSuccess'), t('settings_savedSuccessMsg'));
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all data back to the clean initial seed dataset?')) {
      try {
        setIsResetting(true);
        await api.resetSystem();
        showToast('success', 'System Restored', 'All tables reset to clean initial enterprise dataset.');
        setTimeout(() => window.location.reload(), 600);
      } catch (err: any) {
        showToast('error', 'Reset Failed', err.message);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
            {t('settings_title')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('settings_subtitle')}</p>
        </div>
      </div>

      {/* Project Leadership & Developer Team Card - VISIBLE ONLY TO EMPLOYEE ROLE */}
      {isEmployeeRole && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-xl border border-indigo-800/40 p-6 shadow-xl text-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-lg shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-lg font-black text-indigo-400 font-mono">
                  NG
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">{FOUNDER_INFO.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                    <span>CEO & Founder</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-emerald-400" />
                    <span>Lead Developer & Admin</span>
                  </span>
                </div>
                <p className="text-xs text-indigo-300 font-medium mt-0.5">{FOUNDER_INFO.title}</p>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {FOUNDER_INFO.roleDescription}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFounderModal(true)}
              className="self-start sm:self-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <span>View Full Portfolio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-indigo-900/60 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-indigo-900/40 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-400 font-semibold text-[11px]">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Education</span>
              </div>
              <p className="text-white font-medium text-xs">B.Tech in Computer Science</p>
              <p className="text-[10px] text-slate-400">AKTU, Lucknow (2023–2027)</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-indigo-900/40 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Engineering Experience</span>
              </div>
              <p className="text-white font-medium text-xs">Full Stack Developer Intern</p>
              <p className="text-[10px] text-slate-400">Student Inc. (MERN Stack)</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-indigo-900/40 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
                <Mail className="w-3.5 h-3.5" />
                <span>Direct Contact</span>
              </div>
              <p className="text-white font-mono text-xs truncate">{FOUNDER_INFO.email}</p>
              <p className="text-[10px] text-slate-400 font-mono">{FOUNDER_INFO.phone}</p>
            </div>
          </div>
        </div>
      )}


      {/* Theme & Visual Appearance Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Theme & Visual Styling</span>
          </h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            Active: {theme.toUpperCase()}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Customize the application interface appearance. Select your preferred color palette and theme mode.
        </p>

        {/* Theme Selector Cards */}
        <ThemeSelector
          variant="cards"
          onThemeChange={(newTheme) => {
            showToast('info', 'Theme Updated', `Switched theme to ${newTheme.toUpperCase()}`);
          }}
        />
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Language & Localization Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <Languages className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t('settings_languageSection')}</span>
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 flex items-center gap-1.5">
              <span>{currentLanguageOption.flag}</span>
              <span>{currentLanguageOption.nativeName}</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('settings_languageSectionDesc')}
          </p>

          {/* Interactive Language Cards */}
          <LanguageSelector
            variant="cards"
            onLanguageChange={(newLang) => {
              showToast('info', t('toast_langChanged'), t('toast_langChangedMsg', { language: newLang.toUpperCase() }));
            }}
          />

          {/* Regional Format Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">{t('settings_dateFormatLabel')}</span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatDate(new Date())}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">{t('settings_currencyFormatLabel')}</span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(125000)}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">{t('settings_localeLabel')}</span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                {language === 'en' ? 'en-US (International)' : language === 'es' ? 'es-ES (Spain / LATAM)' : 'fr-FR (France)'}
              </p>
            </div>
          </div>
        </div>

        {/* Company Profile Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t('settings_orgConfig')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('settings_companyName')}
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('settings_taxId')}
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Approval Thresholds */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t('settings_approvalPolicy')}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('settings_tier1Limit')}
              </label>
              <input
                type="number"
                value={tier1Limit}
                onChange={(e) => setTier1Limit(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">{t('settings_tier1LimitDesc')}</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('settings_tier2Limit')}
              </label>
              <input
                type="number"
                value={tier2Limit}
                onChange={(e) => setTier2Limit(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">{t('settings_tier2LimitDesc')}</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer text-xs"
            >
              <Save className="w-4 h-4" />
              <span>{t('settings_savePolicy')}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Danger Zone / Database Reset */}
      <div className="bg-rose-50/70 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/50 p-6 space-y-4 text-xs">
        <div>
          <h3 className="text-sm font-bold text-rose-950 dark:text-rose-300 uppercase tracking-tight flex items-center gap-2">
            <Database className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>{t('settings_dangerZone')}</span>
          </h3>
          <p className="text-xs text-rose-800 dark:text-rose-400 mt-1">
            {t('settings_dangerZoneDesc')}
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={isResetting}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-semibold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer text-xs"
        >
          <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{t('settings_resetDatabase')}</span>
        </button>
      </div>

      {/* Founder Modal */}
      <FounderModal isOpen={showFounderModal} onClose={() => setShowFounderModal(false)} />
    </div>
  );
};
