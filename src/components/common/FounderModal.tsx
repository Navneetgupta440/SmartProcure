/**
 * Founder, CEO, Lead Developer & Chief Admin Profile Component & Modal
 * Highlights Navneet Gupta - CEO & Founder, Lead Full Stack Architect & System Admin
 */

import React, { useState } from 'react';
import { FOUNDER_INFO } from '../../data/founderData';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  GraduationCap,
  Briefcase,
  Award,
  Code2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Copy,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight,
  X,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

interface FounderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FounderModal: React.FC<FounderModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useNotifications();
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'experience' | 'projects' | 'certifications'>('overview');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast('success', 'Copied to Clipboard', `${label} copied: ${text}`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white border-b border-indigo-900/50">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-700/80 transition cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-1 shadow-xl">
                <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center text-2xl font-black text-indigo-400 font-mono">
                  NG
                </div>
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 bg-emerald-500 text-[10px] font-bold uppercase rounded-full text-slate-950 border-2 border-slate-900 shadow-xs">
                CEO & Admin
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">{FOUNDER_INFO.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>CEO & Founder</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lead Developer & Admin</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {FOUNDER_INFO.roleDescription}
              </p>

              {/* Fast Contact Chips */}
              <div className="flex flex-wrap items-center gap-2.5 mt-3 pt-2 border-t border-slate-800 text-xs">
                <button
                  onClick={() => copyToClipboard(FOUNDER_INFO.email, 'Email')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-[11px]"
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{FOUNDER_INFO.email}</span>
                  <Copy className="w-3 h-3 ml-1 text-slate-500" />
                </button>

                <button
                  onClick={() => copyToClipboard(FOUNDER_INFO.phone, 'Phone')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-[11px]"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{FOUNDER_INFO.phone}</span>
                  <Copy className="w-3 h-3 ml-1 text-slate-500" />
                </button>

                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{FOUNDER_INFO.location}</span>
                </span>

                <div className="flex items-center gap-2 ml-auto">
                  <a
                    href={FOUNDER_INFO.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-indigo-600 text-white transition flex items-center gap-1 text-[11px]"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                  <a
                    href={FOUNDER_INFO.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-blue-600 text-white transition flex items-center gap-1 text-[11px]"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs overflow-x-auto">
          {[
            { id: 'overview', label: 'Executive Overview', icon: User },
            { id: 'skills', label: 'Technical Stack', icon: Code2 },
            { id: 'experience', label: 'Experience & Internships', icon: Briefcase },
            { id: 'projects', label: 'Key Projects', icon: Layers },
            { id: 'certifications', label: 'Education & Certs', icon: GraduationCap },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-3 px-3.5 font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Canvas */}
        <div className="p-6 overflow-y-auto max-h-[55vh] text-xs space-y-6">
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Highlights Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {FOUNDER_INFO.stats.map((st, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center"
                  >
                    <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{st.value}</div>
                    <div className="text-[11px] font-bold text-slate-900 dark:text-slate-200 uppercase tracking-tight mt-0.5">
                      {st.label}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{st.detail}</div>
                  </div>
                ))}
              </div>

              {/* Education Card */}
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-indigo-600 text-white shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Formal Academic Credentials
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {FOUNDER_INFO.education.degree}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {FOUNDER_INFO.education.institution} • {FOUNDER_INFO.education.location}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      Batch: {FOUNDER_INFO.education.duration}
                    </p>
                  </div>
                </div>
              </div>

              {/* Core Philosophy & Role */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Leadership & System Governance</span>
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Navneet Gupta spearheads the architectural blueprint and operational roadmap of the ProcureFlow platform. Balancing executive strategic leadership with hands-on full-stack engineering, Navneet designed the system's distributed state synchronization, atomic inventory reservation engines, 7-tier role-based access control, and seamless RESTful APIs.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICAL STACK */}
          {activeTab === 'skills' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FOUNDER_INFO.skills.map((group, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>{group.category}</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PROFESSIONAL EXPERIENCE */}
          {activeTab === 'experience' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {FOUNDER_INFO.experience.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{exp.role}</h4>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {exp.company} • {exp.location}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px] self-start">
                      {exp.duration}
                    </span>
                  </div>

                  <ul className="space-y-2 text-slate-600 dark:text-slate-300 text-xs">
                    {exp.highlights.map((h, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: KEY PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {FOUNDER_INFO.projects.map((proj, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{proj.title}</span>
                      </h4>
                      <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                        {proj.techStack}
                      </span>
                    </div>
                    <a
                      href={proj.githubRepo}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-indigo-600 text-white text-[11px] font-semibold transition self-start cursor-pointer"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>View Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                    {proj.description.map((d, dIdx) => (
                      <p key={dIdx} className="leading-relaxed">
                        • {d}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: CERTIFICATIONS & CREDENTIALS */}
          {activeTab === 'certifications' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {FOUNDER_INFO.certifications.map((cert, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 w-fit mb-2">
                        <Award className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{cert.title}</h4>
                      <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {cert.issuer}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">{cert.description}</p>
                  </div>
                ))}
              </div>

              {/* Verified Badge info */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                    Admin & Developer Verification: Active • Full Administrative Authorization Granted
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                  ID: NG-DEV-2026
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <span>ProcureFlow System Architect & Administrator</span>
            <span>•</span>
            <span className="font-mono">navneetgupta440</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`mailto:${FOUNDER_INFO.email}`}
              className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Navneet</span>
            </a>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
