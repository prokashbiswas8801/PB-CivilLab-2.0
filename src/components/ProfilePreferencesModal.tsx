import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  BookmarkCheck,
  Award,
  HardHat,
  Building,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  Sliders,
  DollarSign,
  Layers,
  MapPin,
  Scale,
  Sparkles,
  Download,
  Upload,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Search,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Hash,
  Eye,
  Info,
} from 'lucide-react';
import {
  UserProfile,
  UserCustomPreferences,
  EngineeringPreset,
  UserRole,
  PresetCategory,
  CurrencyCode,
  BuildingCode,
  CivilWorkspace,
  SUPPORTED_CURRENCIES,
  EngineeringModuleId,
} from '../types/civil';
import { useTheme } from '../context/ThemeContext';
import { exportPresetsPackage, parseAndValidatePresetsPackage, generateUUID } from '../utils/storage';

export interface ProfilePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  userPreferences: UserCustomPreferences;
  presets: EngineeringPreset[];
  activeWorkspace: CivilWorkspace;
  onSaveProfile: (profile: UserProfile) => void;
  onSavePreferences: (prefs: UserCustomPreferences) => void;
  onSavePreset: (preset: EngineeringPreset) => void;
  onDeletePreset: (presetId: string) => void;
  onApplyPreset: (preset: EngineeringPreset) => void;
  onImportPresets: (imported: EngineeringPreset[]) => void;
  onResetFactoryPresets: () => void;
  onApplyPreferencesToWorkspace: () => void;
  initialTab?: 'profile' | 'preferences' | 'presets';
}

const ROLE_OPTIONS: { role: UserRole; label: string; icon: string; desc: string }[] = [
  { role: 'structural-engineer', label: 'Structural Design Engineer', icon: '🏢', desc: 'RCC & steel design, detailing, code compliance' },
  { role: 'civil-site-engineer', label: 'Civil Site Engineer', icon: '👷', desc: 'Execution, quality control, site inspection' },
  { role: 'geotechnical-engineer', label: 'Geotechnical / Foundation Lead', icon: '⛏️', desc: 'Soil mechanics, bearing capacity, slope stability' },
  { role: 'estimator-qs', label: 'Quantity Surveyor / Estimator', icon: '📊', desc: 'BOQ, rate analysis, material takeoffs' },
  { role: 'project-manager', label: 'Project Engineer / PM', icon: '📋', desc: 'Project oversight, scheduling, milestones' },
  { role: 'consultant', label: 'Principal Engineering Consultant', icon: '🎖️', desc: 'Independent engineering audits & peer reviews' },
  { role: 'engineering-student', label: 'Civil Engineering Student', icon: '🎓', desc: 'Academic coursework, thesis, laboratory calculations' },
  { role: 'researcher-academic', label: 'Academic Researcher / Faculty', icon: '🔬', desc: 'Materials science, numerical modeling' },
  { role: 'contractor', label: 'General Contractor / Builder', icon: '🛠️', desc: 'Cost estimation, procurement, site management' },
];

const PRESET_CATEGORIES: { id: PresetCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All Categories', icon: '📁' },
  { id: 'concrete-mix', label: 'Concrete Mix & Materials', icon: '🧪' },
  { id: 'material-rates', label: 'Material Unit Rates', icon: '💰' },
  { id: 'structural-beam', label: 'Structural Beams', icon: '📐' },
  { id: 'bearing-soil', label: 'Soil Bearing & Footings', icon: '⛏️' },
  { id: 'earthwork-hydraulics', label: 'Earthwork & Channels', icon: '🌊' },
];

export const ProfilePreferencesModal: React.FC<ProfilePreferencesModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  userPreferences,
  presets,
  activeWorkspace,
  onSaveProfile,
  onSavePreferences,
  onSavePreset,
  onDeletePreset,
  onApplyPreset,
  onImportPresets,
  onResetFactoryPresets,
  onApplyPreferencesToWorkspace,
  initialTab = 'profile',
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'presets'>(initialTab);
  const { theme: activeEngineeringTheme, setTheme: setEngineeringTheme, availableThemes } = useTheme();

  // Profile Form State
  const [profileForm, setProfileForm] = useState<UserProfile>(userProfile);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // Preferences Form State
  const [prefsForm, setPrefsForm] = useState<UserCustomPreferences>(userPreferences);
  const [prefsSavedToast, setPrefsSavedToast] = useState(false);

  // Presets State
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<PresetCategory | 'all'>('all');
  const [presetSearch, setPresetSearch] = useState('');
  const [appliedPresetToast, setAppliedPresetToast] = useState<string | null>(null);
  const [inspectPreset, setInspectPreset] = useState<EngineeringPreset | null>(null);

  // New Preset Modal State
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [newPresetCategory, setNewPresetCategory] = useState<PresetCategory>('concrete-mix');
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [newPresetTags, setNewPresetTags] = useState('');

  // Sync state when props change
  React.useEffect(() => {
    setProfileForm(userProfile);
  }, [userProfile]);

  React.useEffect(() => {
    setPrefsForm(userPreferences);
  }, [userPreferences]);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Filtered Presets
  const filteredPresets = presets.filter((p) => {
    const matchesCat = presetCategoryFilter === 'all' || p.category === presetCategoryFilter;
    const matchesQuery =
      presetSearch.trim() === '' ||
      p.name.toLowerCase().includes(presetSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(presetSearch.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(presetSearch.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const handleSaveProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(profileForm);
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3000);
  };

  const handleSavePrefsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePreferences(prefsForm);
    setPrefsSavedToast(true);
    setTimeout(() => setPrefsSavedToast(false), 3000);
  };

  const handleApplyPresetClick = (preset: EngineeringPreset) => {
    onApplyPreset(preset);
    setAppliedPresetToast(preset.name);
    setTimeout(() => setAppliedPresetToast(null), 3000);
  };

  const handleExportPresets = () => {
    const json = exportPresetsPackage(presets);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pb-civillab-presets-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportPresetsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseAndValidatePresetsPackage(text);
      if (parsed && parsed.length > 0) {
        onImportPresets(parsed);
      } else {
        alert('Could not parse valid PB CivilLab engineering presets from file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveCurrentModuleAsPreset = () => {
    // Generate snapshot from active workspace
    const now = new Date().toISOString();
    let cat: PresetCategory = 'concrete-mix';
    let targetMod: EngineeringModuleId = activeWorkspace.activeModule;
    let payload: EngineeringPreset['payload'] = { targetModule: targetMod };

    if (activeWorkspace.activeModule === 'concrete-materials' || activeWorkspace.activeModule === 'concrete-mix') {
      cat = 'concrete-mix';
      payload = {
        targetModule: activeWorkspace.activeModule,
        concreteMaterials: { ...activeWorkspace.concreteMaterials },
        concreteMix: { ...activeWorkspace.concrete },
      };
    } else if (activeWorkspace.activeModule === 'rate-analysis' || activeWorkspace.activeModule === 'boq-estimator') {
      cat = 'material-rates';
      payload = {
        targetModule: 'rate-analysis',
        rateAnalysis: { ...activeWorkspace.rateAnalysis },
      };
    } else if (activeWorkspace.activeModule === 'beam-analysis') {
      cat = 'structural-beam';
      payload = {
        targetModule: 'beam-analysis',
        beam: { ...activeWorkspace.beam },
      };
    } else if (activeWorkspace.activeModule === 'bearing-capacity') {
      cat = 'bearing-soil';
      payload = {
        targetModule: 'bearing-capacity',
        bearing: { ...activeWorkspace.bearing },
      };
    } else if (activeWorkspace.activeModule === 'open-channel' || activeWorkspace.activeModule === 'earthwork-alignment') {
      cat = 'earthwork-hydraulics';
      payload = {
        targetModule: activeWorkspace.activeModule,
        channel: { ...activeWorkspace.channel },
        earthwork: { ...activeWorkspace.earthwork },
      };
    } else {
      cat = 'complete-workspace';
      payload = {
        targetModule: activeWorkspace.activeModule,
        boq: { ...activeWorkspace.boq },
      };
    }

    setNewPresetCategory(cat);
    setNewPresetName(`${activeWorkspace.name} - ${activeWorkspace.activeModule} Preset`);
    setNewPresetDesc(`Custom snapshot captured from ${activeWorkspace.name} (${activeWorkspace.projectCode})`);
    setNewPresetTags([activeWorkspace.governingCode, activeWorkspace.activeModule].join(', '));
    setIsCreatingPreset(true);
  };

  const handleCreatePresetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    let payload: EngineeringPreset['payload'] = {
      targetModule: activeWorkspace.activeModule,
    };

    if (newPresetCategory === 'concrete-mix') {
      payload.concreteMaterials = { ...activeWorkspace.concreteMaterials };
      payload.concreteMix = { ...activeWorkspace.concrete };
    } else if (newPresetCategory === 'material-rates') {
      payload.rateAnalysis = { ...activeWorkspace.rateAnalysis };
    } else if (newPresetCategory === 'structural-beam') {
      payload.beam = { ...activeWorkspace.beam };
    } else if (newPresetCategory === 'bearing-soil') {
      payload.bearing = { ...activeWorkspace.bearing };
    } else if (newPresetCategory === 'earthwork-hydraulics') {
      payload.channel = { ...activeWorkspace.channel };
      payload.earthwork = { ...activeWorkspace.earthwork };
    }

    const newPreset: EngineeringPreset = {
      id: `preset-custom-${generateUUID().slice(0, 8)}`,
      name: newPresetName.trim(),
      description: newPresetDesc.trim(),
      category: newPresetCategory,
      tags: newPresetTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: profileForm.fullName || 'Engineer',
      payload,
    };

    onSavePreset(newPreset);
    setIsCreatingPreset(false);
    setAppliedPresetToast(`Created preset "${newPreset.name}"`);
    setTimeout(() => setAppliedPresetToast(null), 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350, mass: 0.8 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] shadow-2xl overflow-hidden"
          >
        {/* Modal Top Bar */}
        <div className="shrink-0 px-6 py-4 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center font-bold text-base shadow-xs">
              {profileForm.initials || profileForm.fullName.slice(0, 2).toUpperCase() || 'PB'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[var(--md-sys-color-on-surface)] tracking-tight">
                  User Profile & Preferences
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]">
                  PB CivilLab
                </span>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Engineer Credentials · Calculation Defaults · Global Presets Library
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="shrink-0 px-6 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)]'
                : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Engineer Profile</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container)] font-mono">
              Report Metadata
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)]'
                : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Custom Preferences</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container)] font-mono">
              Units & Rules
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'presets'
                ? 'border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-primary)]'
                : 'border-transparent text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <BookmarkCheck className="w-4 h-4 shrink-0" />
            <span>Engineering Presets</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] font-mono font-bold">
              {presets.length}
            </span>
          </button>
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 custom-scrollbar bg-[var(--md-sys-color-surface)]">
          {/* TAB 1: USER PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfileSubmit} className="space-y-6">
              {profileSavedToast && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Profile credentials saved! Automatically updated across all generated reports and print headers.</span>
                </div>
              )}

              <div className="bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[var(--md-sys-color-outline-variant)]">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                      <Award className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                      Engineering Professional Credentials
                    </h3>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      These details appear automatically on calculation schedules, certification stamps, and PDF headers.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-mono font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified EOR Header</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Full Name & Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      placeholder="e.g. Project Engineer, PE"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)] font-medium"
                    />
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Professional Designation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={profileForm.designation}
                      onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                      placeholder="e.g. Senior Structural Engineer / Consultant"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)] font-medium"
                    />
                  </div>

                  {/* Organization */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Organization / Institution <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--md-sys-color-on-surface-variant)]" />
                      <input
                        type="text"
                        required
                        value={profileForm.organization}
                        onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })}
                        placeholder="e.g. PB CivilLab Consultancy Ltd. / BUET"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)] font-medium"
                      />
                    </div>
                  </div>

                  {/* Professional Role */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Specialized Engineering Role
                    </label>
                    <select
                      value={profileForm.role}
                      onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value as UserRole })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)] font-medium cursor-pointer"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.role} value={opt.role}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* License / Registration */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Professional License / Registration ID
                    </label>
                    <div className="relative">
                      <Hash className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--md-sys-color-on-surface-variant)]" />
                      <input
                        type="text"
                        value={profileForm.licenseNumber || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })}
                        placeholder="e.g. IEB M-41892 / PE-90214"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)] font-mono"
                      />
                    </div>
                  </div>

                  {/* Signature Initials */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Initials / Certification Stamp Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={profileForm.initials || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, initials: e.target.value.toUpperCase() })}
                      placeholder="e.g. PB"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)] font-mono font-bold uppercase tracking-wider"
                    />
                  </div>

                  {/* Professional Email */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Contact Email
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--md-sys-color-on-surface-variant)]" />
                      <input
                        type="email"
                        value={profileForm.email || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="engineer@consultingfirm.com"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)] font-mono"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Direct Phone / Office
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--md-sys-color-on-surface-variant)]" />
                      <input
                        type="tel"
                        value={profileForm.phone || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="+1 (555) 019-2834 / +880 1700-000000"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)] font-mono"
                      />
                    </div>
                  </div>

                  {/* Bio / Scope */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Engineering Scope & Expertise Summary
                    </label>
                    <textarea
                      rows={2}
                      value={profileForm.bio || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      placeholder="Brief statement of qualifications, specializations (e.g. Reinforced Concrete, Shallow & Deep Foundations, Infrastructure BOQ)..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden focus:border-[var(--md-sys-color-primary)] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)]">
                <div className="text-xs font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Official Calculation Sheet Header Preview</span>
                </div>
                <div className="p-4 rounded-lg bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-[var(--md-sys-color-on-surface)] font-sans">
                      {profileForm.fullName || 'Project Engineer, PE'}
                    </div>
                    <div className="text-[var(--md-sys-color-primary)] font-semibold">
                      {profileForm.designation || 'Project Engineer, PE'} · {profileForm.organization || 'Consulting Firm'}
                    </div>
                    <div className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                      Reg ID: {profileForm.licenseNumber || 'PE-00000'} · {profileForm.email || 'engineer@consultingfirm.com'}
                    </div>
                  </div>
                  <div className="text-right sm:border-l sm:pl-4 border-[var(--md-sys-color-outline-variant)] shrink-0">
                    <div className="inline-block px-3 py-1.5 rounded border border-dashed border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]/20 text-center">
                      <div className="text-[9px] text-[var(--md-sys-color-on-surface-variant)]">CERTIFICATION STAMP</div>
                      <div className="font-bold text-xs text-[var(--md-sys-color-primary)]">
                        {profileForm.initials || (profileForm.fullName ? profileForm.fullName.slice(0, 2).toUpperCase() : 'PE')} SEAL
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs transition-opacity"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Profile Credentials</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CUSTOM PREFERENCES & SETTINGS */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSavePrefsSubmit} className="space-y-6">
              {prefsSavedToast && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Preferences saved! Global defaults updated.</span>
                </div>
              )}

              {/* Section A: Units & Precision */}
              <div className="bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                      Calculation Defaults & Precision
                    </h3>
                    <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                      Control decimal rounding, unit systems, and standard packaging rates.
                    </p>
                  </div>
                </div>

                {/* Technical Engineering Themes (4 Bespoke CAD Modes) */}
                <div className="p-3.5 rounded border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-container-low)] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                        Workbench Engineering Themes (4 CAD/CAE Presets)
                      </span>
                      <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                        Instant switch between CAD Charcoal, Blueprint Navy, CalcPad Paper, and Site Daylight modes.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {availableThemes.map((t) => {
                      const isSel = t.id === activeEngineeringTheme;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setEngineeringTheme(t.id)}
                          className={`p-2.5 rounded text-left border transition-all cursor-pointer ${
                            isSel
                              ? 'border-[var(--md-sys-color-primary)] ring-1 ring-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)] shadow-xs'
                              : 'border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex -space-x-1">
                              <span
                                className="w-4 h-4 rounded-full border border-black/30"
                                style={{ backgroundColor: t.colors.bg }}
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-black/30"
                                style={{ backgroundColor: t.colors.accent }}
                              />
                            </div>
                            {isSel && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                            )}
                          </div>
                          <div className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                            {t.name}
                          </div>
                          <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                            {t.subtitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Preferred Unit System */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Preferred Unit System
                    </label>
                    <select
                      value={prefsForm.preferredUnitSystem}
                      onChange={(e) =>
                        setPrefsForm({
                          ...prefsForm,
                          preferredUnitSystem: e.target.value as UserCustomPreferences['preferredUnitSystem'],
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden font-medium cursor-pointer"
                    >
                      <option value="metric">Metric SI (m, mm, kN, MPa, kg)</option>
                      <option value="imperial">Imperial / US (ft, in, kips, psi, lbs)</option>
                      <option value="mixed">Mixed Engineering (m length + cft / bags)</option>
                      <option value="regional">Regional Customary (Katha, Bigha, Decimals)</option>
                    </select>
                  </div>

                  {/* Decimal Precision */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Default Decimal Precision (0-4)
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={prefsForm.decimalPrecision}
                        onChange={(e) =>
                          setPrefsForm({
                            ...prefsForm,
                            decimalPrecision: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden font-mono font-bold cursor-pointer"
                      >
                        <option value={0}>0 Digits (e.g. 1,245)</option>
                        <option value={1}>1 Digit (e.g. 1,245.3)</option>
                        <option value={2}>2 Digits (e.g. 1,245.35) — Standard</option>
                        <option value={3}>3 Digits (e.g. 1,245.352)</option>
                        <option value={4}>4 Digits (e.g. 1,245.3524) — High Precision</option>
                      </select>
                    </div>
                  </div>

                  {/* Cement Bag Weight */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Default Cement Bag Weight (kg)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="20"
                        max="100"
                        value={prefsForm.defaultCementBagWeightKg}
                        onChange={(e) =>
                          setPrefsForm({
                            ...prefsForm,
                            defaultCementBagWeightKg: Number(e.target.value) || 50,
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden font-mono font-bold"
                      />
                      <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-mono">kg</span>
                    </div>
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
                      Standard: 50 kg (BNBC/IS), 42.6 kg (94 lb US)
                    </span>
                  </div>

                  {/* Default Currency */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Default Currency
                    </label>
                    <select
                      value={prefsForm.defaultCurrency}
                      onChange={(e) =>
                        setPrefsForm({
                          ...prefsForm,
                          defaultCurrency: e.target.value as CurrencyCode,
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden font-medium cursor-pointer"
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.symbol} · {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Governing Code */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Default Governing Code
                    </label>
                    <select
                      value={prefsForm.defaultBuildingCode}
                      onChange={(e) =>
                        setPrefsForm({
                          ...prefsForm,
                          defaultBuildingCode: e.target.value as BuildingCode,
                        })
                      }
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden font-mono font-bold cursor-pointer"
                    >
                      <option value="BNBC-2020">BNBC-2020 (Bangladesh)</option>
                      <option value="ACI-318">ACI-318 (American Concrete Inst.)</option>
                      <option value="IS-456">IS-456 (Indian Standards)</option>
                    </select>
                  </div>

                  {/* Auto-log on Print */}
                  <div className="flex items-center gap-2 pt-6">
                    <label className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface)] font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prefsForm.autoLogSnapshotsOnPrint}
                        onChange={(e) =>
                          setPrefsForm({
                            ...prefsForm,
                            autoLogSnapshotsOnPrint: e.target.checked,
                          })
                        }
                        className="rounded border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] cursor-pointer"
                      />
                      <span>Auto-Log snapshot on Print / Export</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Section B: Default Wastage Percentages */}
              <div className="bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    Standard Material Wastage & Allowance Defaults
                  </h3>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    Default allowances automatically applied when initializing BOQ items, concrete batches, and bar bending schedules.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Concrete Wastage
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="25"
                        value={prefsForm.wastage.concretePercent}
                        onChange={(e) =>
                          setPrefsForm({
                            ...prefsForm,
                            wastage: { ...prefsForm.wastage, concretePercent: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] font-mono font-bold"
                      />
                      <span className="text-xs font-mono">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Rebar Cutting Lap
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="25"
                        value={prefsForm.wastage.rebarPercent}
                        onChange={(e) =>
                          setPrefsForm({
                            ...prefsForm,
                            wastage: { ...prefsForm.wastage, rebarPercent: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] font-mono font-bold"
                      />
                      <span className="text-xs font-mono">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Brick & Mortar
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="25"
                        value={prefsForm.wastage.brickMortarPercent}
                        onChange={(e) =>
                          setPrefsForm({
                            ...prefsForm,
                            wastage: { ...prefsForm.wastage, brickMortarPercent: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] font-mono font-bold"
                      />
                      <span className="text-xs font-mono">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      Earth Shrinkage
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="35"
                        value={prefsForm.wastage.earthworkShrinkagePercent}
                        onChange={(e) =>
                          setPrefsForm({
                            ...prefsForm,
                            wastage: { ...prefsForm.wastage, earthworkShrinkagePercent: Number(e.target.value) || 0 },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] font-mono font-bold"
                      />
                      <span className="text-xs font-mono">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section C: Regional Land-Unit Calculation Rules */}
              <div className="bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    Regional Land-Unit Calculation Rules
                  </h3>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    Customary land units vary by region. Configure exact conversion formulas for Katha, Decimal, and Bigha.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      1 Katha in Square Feet
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="1"
                        min="100"
                        max="5000"
                        value={prefsForm.regionalLand.kathaSquareFeet}
                        onChange={(e) =>
                          setPrefsForm({
                            ...prefsForm,
                            regionalLand: { ...prefsForm.regionalLand, kathaSquareFeet: Number(e.target.value) || 720 },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] font-mono font-bold"
                      />
                      <span className="text-xs font-mono">sqft</span>
                    </div>
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
                      Standard: 720 sq ft (Bangladesh / West Bengal), 1,361.25 sq ft (Bihar)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      1 Decimal / Satak in Square Feet
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.1"
                        min="100"
                        max="2000"
                        value={prefsForm.regionalLand.decimalSquareFeet}
                        onChange={(e) =>
                          setPrefsForm({
                            ...prefsForm,
                            regionalLand: { ...prefsForm.regionalLand, decimalSquareFeet: Number(e.target.value) || 435.6 },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] font-mono font-bold"
                      />
                      <span className="text-xs font-mono">sqft</span>
                    </div>
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
                      Standard: 435.6 sq ft (1/100 acre = 40.468 m²)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                      1 Bigha in Decimals / Kathas
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="1"
                        min="10"
                        max="100"
                        value={prefsForm.regionalLand.bighaDecimals}
                        onChange={(e) =>
                          setPrefsForm({
                            ...prefsForm,
                            regionalLand: { ...prefsForm.regionalLand, bighaDecimals: Number(e.target.value) || 33 },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] font-mono font-bold"
                      />
                      <span className="text-xs font-mono">decimals</span>
                    </div>
                    <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] mt-1 block">
                      Standard: 33 decimals (20 Kathas = 14,400 sq ft)
                    </span>
                  </div>
                </div>
              </div>

              {/* Section D: Report & Export Settings */}
              <div className="bg-[var(--md-sys-color-surface-container-low)] p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    Report Header Note & Signature Line
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Standard Verification Note / Report Disclaimer
                  </label>
                  <input
                    type="text"
                    value={prefsForm.reportHeaderNote || ''}
                    onChange={(e) => setPrefsForm({ ...prefsForm, reportHeaderNote: e.target.value })}
                    placeholder="e.g. Verified for preliminary structural & estimation design under BNBC-2020 / ACI-318 standards."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface)] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefsForm.showEngineeringSignatureLine}
                      onChange={(e) =>
                        setPrefsForm({
                          ...prefsForm,
                          showEngineeringSignatureLine: e.target.checked,
                        })
                      }
                      className="rounded border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] cursor-pointer"
                    />
                    <span>Render certified engineering signature line and stamp placeholder on printed sheets</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onApplyPreferencesToWorkspace();
                    setPrefsSavedToast(true);
                    setTimeout(() => setPrefsSavedToast(false), 3000);
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container)] text-xs font-semibold text-[var(--md-sys-color-on-surface)] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                  <span>Apply Defaults to Active Workspace</span>
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-opacity"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Preferences</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CUSTOM PRESETS SYSTEM */}
          {activeTab === 'presets' && (
            <div className="space-y-6">
              {appliedPresetToast && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Preset applied to active workspace: {appliedPresetToast}</span>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
                <div>
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                    <BookmarkCheck className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                    Engineering Presets Management
                  </h3>
                  <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    Save, load, and transfer standard mix ratios, unit rate schedules, and structural parameters.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSaveCurrentModuleAsPreset}
                    className="px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Capture current module values into a new preset"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Current as Preset</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPresets}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container)] text-xs font-medium text-[var(--md-sys-color-on-surface)] inline-flex items-center gap-1.5 cursor-pointer"
                    title="Export presets to JSON file"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                    <span>Export</span>
                  </button>

                  <label className="px-2.5 py-1.5 rounded-lg border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container)] text-xs font-medium text-[var(--md-sys-color-on-surface)] inline-flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                    <span>Import</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportPresetsFile}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Reset to factory engineering standards? Custom presets will be replaced.')) {
                        onResetFactoryPresets();
                      }
                    }}
                    className="p-1.5 rounded-lg border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                    title="Reset to factory presets"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--md-sys-color-on-surface-variant)]" />
                  <input
                    type="text"
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    placeholder="Search presets by title, grade, or tags..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {PRESET_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setPresetCategoryFilter(cat.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                        presetCategoryFilter === cat.id
                          ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-bold'
                          : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
                      }`}
                    >
                      <span>{cat.icon}</span> <span className="ml-1">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 rounded-xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] hover:border-[var(--md-sys-color-primary)] transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="font-bold text-xs sm:text-sm text-[var(--md-sys-color-on-surface)] line-clamp-1">
                          {preset.name}
                        </div>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                            preset.isBuiltIn
                              ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {preset.isBuiltIn ? 'Built-In Standard' : 'Custom Preset'}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-clamp-2 mb-3">
                        {preset.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {preset.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
                      <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-mono">
                        Author: {preset.author || 'Standards'}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInspectPreset(preset)}
                          className="px-2 py-1 text-xs rounded border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)] cursor-pointer"
                          title="Inspect Preset Payload"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>

                        {!preset.isBuiltIn && (
                          <button
                            type="button"
                            onClick={() => onDeletePreset(preset.id)}
                            className="p-1 text-xs rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            title="Delete Preset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleApplyPresetClick(preset)}
                          className="px-3 py-1 text-xs font-semibold rounded bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Apply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredPresets.length === 0 && (
                  <div className="col-span-full py-12 text-center text-[var(--md-sys-color-on-surface-variant)] text-xs">
                    No presets found matching "{presetSearch}". Try another category or save a new preset.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-6 py-3 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)] flex items-center justify-between">
          <div className="text-[11px] font-mono text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
            <span>PB CivilLab v2.0 · EOR: {profileForm.fullName}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-highest)] cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>

      {/* SUB-MODAL: Save Current as Preset */}
      {isCreatingPreset && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
              <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                Save New Engineering Preset
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingPreset(false)}
                className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePresetSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Preset Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g. Dhaka High-Rise M30 Mix (1:1:2)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Category
                </label>
                <select
                  value={newPresetCategory}
                  onChange={(e) => setNewPresetCategory(e.target.value as PresetCategory)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden font-medium cursor-pointer"
                >
                  <option value="concrete-mix">Concrete Mix & Materials</option>
                  <option value="material-rates">Material Unit Rates</option>
                  <option value="structural-beam">Structural Beam</option>
                  <option value="bearing-soil">Soil Bearing & Footing</option>
                  <option value="earthwork-hydraulics">Earthwork & Hydraulics</option>
                  <option value="complete-workspace">Complete Workspace State</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Description / Engineering Notes
                </label>
                <textarea
                  rows={2}
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  placeholder="e.g. Target strength 30 MPa with w/c 0.40, designed for coastal zone..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newPresetTags}
                  onChange={(e) => setNewPresetTags(e.target.value)}
                  placeholder="BNBC-2020, M30, High-Strength, Coastal"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
                <button
                  type="button"
                  onClick={() => setIsCreatingPreset(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--md-sys-color-outline)] hover:bg-[var(--md-sys-color-surface-container)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 cursor-pointer"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Inspect Preset Payload */}
      {inspectPreset && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--md-sys-color-outline-variant)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                  {inspectPreset.name}
                </h3>
                <span className="text-[10px] font-mono text-[var(--md-sys-color-primary)]">
                  Category: {inspectPreset.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectPreset(null)}
                className="text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              {inspectPreset.description}
            </p>

            <div className="max-h-60 overflow-y-auto p-3 rounded-lg bg-[var(--md-sys-color-surface-container-high)] text-[11px] font-mono custom-scrollbar">
              <pre className="text-[var(--md-sys-color-on-surface)] whitespace-pre-wrap">
                {JSON.stringify(inspectPreset.payload, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleApplyPresetClick(inspectPreset);
                  setInspectPreset(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-95 cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
