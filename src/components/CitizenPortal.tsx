import React, { useState } from 'react';
import { 
  User, Home, MapPin, Bell, Phone, Heart, History, LogOut, Sun, Moon, 
  AlertTriangle, Thermometer, Droplet, Wind, Waves, TrendingUp, ShieldCheck, 
  Send, Compass, HelpCircle, PhoneCall, Plus, Trash2, CheckCircle2, Clock, 
  UserCheck, AlertCircle, MessageSquare, Mail, MessageCircle, Info
} from 'lucide-react';
import type { Citizen, Alert, Case, Shelter, WeatherData } from '../types';
import LeafletMap from './LeafletMap';

interface CitizenPortalProps {
  citizen: Citizen;
  setCitizen: React.Dispatch<React.SetStateAction<Citizen>>;
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  cases: Case[];
  setCases: React.Dispatch<React.SetStateAction<Case[]>>;
  shelters: Shelter[];
  weather: WeatherData;
  onLogout: () => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  citizen,
  setCitizen,
  alerts,
  setAlerts,
  cases,
  setCases,
  shelters,
  weather,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'shelters' | 'cases' | 'history' | 'profile'>('dashboard');
  const [safetyResponse, setSafetyResponse] = useState<'safe' | 'assist' | 'family' | 'evac' | 'no-resp' | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // Shelter search and filter states
  const [shelterTypeFilter, setShelterTypeFilter] = useState<'all' | 'shelter' | 'hospital' | 'camp' | 'police'>('all');
  const [shelterDistFilter, setShelterDistFilter] = useState<number>(3);
  const [shelterOpenOnly, setShelterOpenOnly] = useState(false);

  // Profile temporary lists
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyRelation, setNewFamilyRelation] = useState('');
  const [newFamilyAge, setNewFamilyAge] = useState('');

  const triggerToast = (message: string, type: 'success' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Mark alerts
  const handleAlertStatus = (id: string, newStatus: 'read' | 'dismissed') => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    triggerToast(`Alert marked as ${newStatus}`);
  };

  // Submit Safety Response (Triggers case creation if assistance needed)
  const handleResponseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!safetyResponse) {
      triggerToast('Please select a response status.', 'warning');
      return;
    }

    const needsRescue = safetyResponse === 'assist' || safetyResponse === 'family' || safetyResponse === 'evac';
    const statusText = {
      safe: "I'm Safe: No assistance needed.",
      assist: "Need Assistance: Requiring ground rescue.",
      family: "Family Needs Help: Children/Elderly require transport.",
      evac: "Evacuating: In progress but road conditions are poor.",
      'no-resp': "Cannot Respond: High stress."
    }[safetyResponse];

    // Update safety response in citizen profile
    triggerToast('Safety response logged in command center database.');

    if (needsRescue) {
      // Check if case already exists for this citizen
      const existingCase = cases.find(c => c.citizenId === citizen.id && c.status !== 'closed');
      
      if (existingCase) {
        // Append note to existing case
        setCases(prev => prev.map(c => {
          if (c.id === existingCase.id) {
            return {
              ...c,
              notes: [...c.notes, `User updated response: ${statusText}. Note: ${responseNotes || 'None'}`],
              latestResponse: statusText,
              priority: safetyResponse === 'family' || safetyResponse === 'assist' ? 'critical' : 'monitor'
            };
          }
          return c;
        }));
        triggerToast('Active case updated with your latest response details.');
      } else {
        // Create a new Case
        const newCaseId = `CASE-${Math.floor(1000 + Math.random() * 9000)}`;
        const newCase: Case = {
          id: newCaseId,
          citizenId: citizen.id,
          citizenName: citizen.name,
          status: 'new',
          priority: safetyResponse === 'family' || safetyResponse === 'assist' ? 'critical' : 'monitor',
          location: citizen.address,
          lat: citizen.lat,
          lng: citizen.lng,
          createdTime: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
          latestResponse: statusText + (responseNotes ? ` - "${responseNotes}"` : ''),
          timeline: [
            { status: 'new', time: 'Just Now', description: 'Emergency case triggered by user safety response form.' }
          ],
          notes: [
            `Initial user response notes: ${responseNotes || 'No notes added.'}`,
            `Elevation: ${citizen.elevation}m, Distance to river: ${citizen.distanceToRiver}m`
          ],
          riskFactors: [
            `Distance to River: ${citizen.distanceToRiver}m`,
            `Elevation: ${citizen.elevation}m`,
            `Risk Score: ${citizen.riskScore}%`
          ],
          weatherSnapshot: {
            temp: weather.temp,
            rainfall: weather.rainfall,
            riverLevel: weather.riverLevel
          }
        };
        setCases(prev => [newCase, ...prev]);
        triggerToast(`Emergency Dispatch triggered! Case ${newCaseId} created.`, 'warning');
      }
    }

    // Reset safety form selection
    setSafetyResponse(null);
    setResponseNotes('');
  };

  // Add Family Member
  const addFamilyMember = () => {
    if (!newFamilyName || !newFamilyRelation || !newFamilyAge) {
      triggerToast('Please fill family name, relation, and age.', 'warning');
      return;
    }
    const member = {
      name: newFamilyName,
      relation: newFamilyRelation,
      age: parseInt(newFamilyAge) || 18
    };
    setCitizen(prev => ({
      ...prev,
      familyMembers: [...prev.familyMembers, member]
    }));
    setNewFamilyName('');
    setNewFamilyRelation('');
    setNewFamilyAge('');
    triggerToast('Family member added.');
  };

  // Remove Family Member
  const removeFamilyMember = (index: number) => {
    setCitizen(prev => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, idx) => idx !== index)
    }));
    triggerToast('Family member removed.');
  };

  // Trigger quick call/whatsapp simulations
  const handleDial = (name: string, number: string) => {
    triggerToast(`Calling ${name} at ${number}... (Simulated Dial)`);
  };

  const handleWhatsApp = (name: string, number: string) => {
    triggerToast(`Opening WhatsApp chat with ${name} (${number})... (Simulated API)`);
  };

  // Get active case for Neev
  const neevCase = cases.find(c => c.citizenId === citizen.id && c.status !== 'closed');

  // Filter shelters
  const filteredShelters = shelters.filter(s => {
    if (shelterTypeFilter !== 'all' && s.type !== shelterTypeFilter) return false;
    if (s.distance > shelterDistFilter) return false;
    if (shelterOpenOnly && s.status !== 'open') return false;
    return true;
  });

  return (
    <div className="min-h-screen flex bg-background text-on-surface">
      
      {/* Side Navigation */}
      <aside className="w-64 shrink-0 border-r flex flex-col p-6 bg-surface-container-low border-outline-variant">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="p-2 bg-primary text-on-primary rounded-lg">
            <Waves className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-black text-sm tracking-wide leading-none">FLOOD GUARD</h2>
            <span className="text-[10px] text-secondary font-bold tracking-widest uppercase">CITIZEN PORTAL</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 rounded-xl border mb-6 flex items-center gap-3 bg-surface-container-lowest border-outline-variant">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            NS
          </div>
          <div>
            <h3 className="font-bold text-xs leading-tight">{citizen.name}</h3>
            <span className="text-[10px] text-on-surface-variant font-mono">124 Riverview Road</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
              <span className="text-[9px] font-bold text-secondary uppercase">Alert Active</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
              activeTab === 'dashboard'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Crisis Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('shelters')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
              activeTab === 'shelters'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Shelter Locator</span>
          </button>

          <button
            onClick={() => setActiveTab('cases')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all relative ${
              activeTab === 'cases'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>My Safety Cases</span>
            {neevCase && (
              <span className="absolute right-3 top-2.5 w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
              activeTab === 'history'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Risk History & Trends</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
              activeTab === 'profile'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Family Profile</span>
          </button>
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="border-t border-outline-variant pt-4 space-y-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-secondary hover:bg-secondary/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 shrink-0 border-b flex justify-between items-center px-8 bg-surface-container-lowest border-outline-variant">
          <div>
            <h1 className="text-lg font-black tracking-tight text-primary">Good Morning, Neev 👋</h1>
            <p className="text-[10px] text-on-surface-variant uppercase font-mono tracking-wider">
              AI Guardian System: Monitoring Active
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 bg-tertiary-container/10 border-tertiary/20 text-[#0c9488]">
              <ShieldCheck className="h-4 w-4" />
              <span>Hydrologic Shield Engaged</span>
            </div>
            
            <div className="relative">
              <button className="p-2 rounded-full border relative hover:bg-surface-container-low border-outline-variant">
                <Bell className="h-4.5 w-4.5" />
                {alerts.filter(a => a.status === 'unread').length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-surface animate-ping"></span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Panel */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {/* Toast Notification HUD */}
          {toast && (
            <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-bounce ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-400'
                : 'bg-orange-950/90 border-orange-500/30 text-orange-400'
            }`}>
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="text-xs font-bold">{toast.message}</span>
            </div>
          )}

          {/* TAB: CRISIS DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Top Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Large Risk Card */}
                <div className={`p-6 rounded-xl border relative overflow-hidden transition-all duration-300 ${
                  citizen.status === 'Critical'
                    ? 'bg-[#ffdad6]/20 border-secondary neon-glow-red'
                    : citizen.status === 'High'
                    ? 'bg-orange-100/30 border-orange-500 neon-glow-orange'
                    : 'bg-emerald-100/30 border-emerald-500 neon-glow-green'
                }`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/10 to-transparent blur-xl"></div>
                  
                  <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                    Your Safety Risk Profile
                  </span>
                  
                  <div className="flex items-baseline gap-2 mt-2">
                    <h2 className={`text-3xl font-black ${
                      citizen.status === 'Critical' ? 'text-secondary' : citizen.status === 'High' ? 'text-orange-600' : 'text-[#0d9488]'
                    }`}>
                      {citizen.status} Risk
                    </h2>
                  </div>

                  <p className="text-xs mt-3 leading-relaxed text-on-surface-variant">
                    {citizen.status === 'Critical' || citizen.status === 'High' 
                      ? 'AI Advisory: Localized inundation expected at your elevation. Move valuable items upstairs and prepare evacuation kit.' 
                      : 'AI Advisory: No immediate threat, but downstream river levels are fluctuating. Stay tuned to updates.'}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface">
                      Elev: {citizen.elevation}m
                    </span>
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface">
                      Dist: {citizen.distanceToRiver}m from river
                    </span>
                  </div>
                </div>

                {/* 2. AI Risk Score Circular Gauge */}
                <div className="p-6 rounded-xl border border-outline-variant bg-surface-container-lowest flex flex-col items-center text-center justify-between">
                  <div className="w-full text-left">
                    <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                      AI Risk Gauge
                    </span>
                  </div>

                  <div className="relative w-28 h-28 my-3 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="48" strokeWidth="6" stroke="#e2e8f0" fill="transparent" />
                      <circle 
                        cx="56" 
                        cy="56" 
                        r="48" 
                        strokeWidth="7" 
                        stroke={citizen.riskScore > 75 ? "#dc2626" : "#d97706"} 
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - citizen.riskScore / 100)}
                        strokeLinecap="round"
                        fill="transparent" 
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-black tracking-tight text-primary">{citizen.riskScore}</span>
                      <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Index</span>
                    </div>
                  </div>

                  <div className="w-full">
                    <div className="flex justify-between text-[9px] text-on-surface-variant font-bold uppercase">
                      <span>Low Risk</span>
                      <span>High Risk</span>
                    </div>
                  </div>
                </div>

                {/* 3. Live Weather Station */}
                <div className="p-6 rounded-xl border border-outline-variant bg-surface-container-lowest flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                        Live Weather Station
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-primary/10 border border-outline-variant text-primary font-mono uppercase">
                        Active Feed
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-5 w-5 text-orange-500" />
                        <div>
                          <div className="text-xs text-on-surface-variant leading-none">Temp</div>
                          <span className="text-sm font-bold">{weather.temp}°C</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplet className="h-5 w-5 text-blue-500" />
                        <div>
                          <div className="text-xs text-on-surface-variant leading-none">Humidity</div>
                          <span className="text-sm font-bold">{weather.humidity}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wind className="h-5 w-5 text-on-surface-variant" />
                        <div>
                          <div className="text-xs text-on-surface-variant leading-none">Wind</div>
                          <span className="text-sm font-bold">{weather.windSpeed} mph</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Waves className="h-5 w-5 text-indigo-500" />
                        <div>
                          <div className="text-xs text-on-surface-variant leading-none font-bold text-secondary">River Level</div>
                          <span className="text-sm font-black text-secondary">{weather.riverLevel}m</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-outline-variant flex justify-between items-center text-[10px] text-on-surface-variant font-mono">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-secondary animate-bounce" />
                      Trend: Water Level Rising (+0.12m/hr)
                    </span>
                    <span>Ref: {weather.lastUpdated}</span>
                  </div>
                </div>

              </div>

              {/* Bento Grid Row 2: Responses & Alert Timeline */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Safety Dispatch Form & Active Case Status (7 Columns) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* If user has an active case, show a large live tracker banner */}
                  {neevCase && (
                    <div className="p-6 rounded-xl border border-secondary bg-[#ffdad6]/20 relative overflow-hidden">
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded bg-secondary text-[9px] font-bold text-white uppercase tracking-wider animate-pulse">
                        <Clock className="h-3 w-3" /> Live Incident Dispatch
                      </div>
                      <h3 className="text-base font-black text-secondary mb-1 flex items-center gap-2">
                        <span>Active Emergency Case: #{neevCase.id}</span>
                      </h3>
                      <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                        <b>Current Status:</b> Rescue personnel are tracking your location. Stay calm.
                      </p>

                      {/* Timeline Steps */}
                      <div className="relative pl-6 space-y-4 border-l border-outline-variant">
                        {/* 1. New */}
                        <div className="relative">
                          <span className={`absolute -left-[30px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                            neevCase.status === 'new' ? 'bg-secondary border-red-400 text-white' : 'bg-surface border-outline-variant text-on-surface-variant'
                          }`}>1</span>
                          <div className="text-xs font-bold">Case Logged (AI Agent Risk Priority)</div>
                          <span className="text-[9px] text-on-surface-variant">{neevCase.createdTime}</span>
                        </div>

                        {/* 2. Assigned */}
                        <div className="relative">
                          <span className={`absolute -left-[30px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                            neevCase.status === 'assigned' ? 'bg-secondary border-red-400 text-white' : 'bg-surface border-outline-variant text-on-surface-variant'
                          }`}>2</span>
                          <div className="text-xs font-bold">Volunteer Team Dispatched</div>
                          <p className="text-[10px] text-on-surface-variant">
                            {neevCase.volunteerName ? `Assigned to: ${neevCase.volunteerName}` : 'Awaiting dispatch confirmation...'}
                          </p>
                        </div>

                        {/* 3. Reached/Resolved */}
                        <div className="relative">
                          <span className={`absolute -left-[30px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                            neevCase.status === 'resolved' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-surface border-outline-variant text-on-surface-variant'
                          }`}>3</span>
                          <div className="text-xs font-bold">Rescue In Progress / Safe-Haven Arrival</div>
                          <span className="text-[9px] text-on-surface-variant">Target ETA: Under 12 minutes</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Safety Dispatch Input Card */}
                  <div className="p-6 rounded-xl border border-outline-variant bg-surface-container-lowest">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-primary">
                      Emergency Alert Response Desk
                    </h3>
                    <p className="text-xs mb-4 leading-relaxed text-on-surface-variant">
                      Select your current safety status to notify the Emergency Command Center. This auto-prioritizes emergency rescue units if assistance is flagged.
                    </p>

                    <form onSubmit={handleResponseSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSafetyResponse('safe')}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                            safetyResponse === 'safe'
                              ? 'bg-emerald-600/20 border-emerald-500 text-[#0d9488] neon-glow-green font-black scale-[1.02]'
                              : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary'
                          }`}
                        >
                          <ShieldCheck className="h-5 w-5" />
                          <span>I'm Safe / Secure</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSafetyResponse('assist')}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                            safetyResponse === 'assist'
                              ? 'bg-[#ffdad6]/25 border-secondary text-secondary neon-glow-red font-black scale-[1.02]'
                              : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary'
                          }`}
                        >
                          <AlertTriangle className="h-5 w-5" />
                          <span>Need Assistance</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSafetyResponse('family')}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                            safetyResponse === 'family'
                              ? 'bg-orange-100/35 border-orange-500 text-orange-600 neon-glow-orange font-black scale-[1.02]'
                              : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary'
                          }`}
                        >
                          <Heart className="h-5 w-5" />
                          <span>Family Needs Help</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSafetyResponse('evac')}
                          className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                            safetyResponse === 'evac'
                              ? 'bg-blue-600/20 border-blue-500 text-primary neon-glow-blue font-black scale-[1.02]'
                              : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary'
                          }`}
                        >
                          <Compass className="h-5 w-5" />
                          <span>Evacuating Zone</span>
                        </button>
                      </div>

                      <div>
                        <label className="text-xs font-bold block mb-1">Status Notes & Special Instructions</label>
                        <textarea
                          rows={3}
                          value={responseNotes}
                          onChange={e => setResponseNotes(e.target.value)}
                          placeholder="Provide details (e.g., 'Power is down, water level is rising. Spoused requires insulin. Leaving on foot soon.')"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface focus:border-primary focus:outline-none transition-all"
                        ></textarea>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-primary hover:bg-slate-800 text-on-primary font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Submit Live Safety Response</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Personalized Alert Timeline & Emergency Speed-Dial (5 Columns) */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Alert Feed */}
                  <div className="p-6 rounded-xl border border-outline-variant bg-surface-container-lowest">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-secondary flex items-center gap-2">
                      <Bell className="h-4.5 w-4.5" />
                      <span>Advisory Alerts Feed</span>
                    </h3>

                    <div className="space-y-3">
                      {alerts.map(a => (
                        <div 
                          key={a.id} 
                          className={`p-3 rounded-lg border flex flex-col gap-2 transition-all ${
                            a.status === 'unread'
                              ? a.severity === 'critical'
                                ? 'bg-[#ffdad6]/20 border-secondary text-secondary font-bold'
                                : 'bg-orange-100/20 border-orange-500/40 text-orange-600'
                              : 'bg-surface border-outline-variant text-on-surface-variant'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                              a.severity === 'critical' ? 'bg-secondary/15 text-secondary' : 'bg-orange-500/15 text-orange-600'
                            }`}>{a.category}</span>
                            <span className="text-[8px] font-mono text-on-surface-variant">{a.timestamp}</span>
                          </div>
                          
                          <p className="text-xs leading-normal">{a.message}</p>
                          
                          <div className="flex justify-end gap-2 text-[10px]">
                            {a.status === 'unread' ? (
                              <button 
                                onClick={() => handleAlertStatus(a.id, 'read')}
                                className="text-primary hover:underline font-bold"
                              >
                                Mark Read
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleAlertStatus(a.id, 'dismissed')}
                                className="text-on-surface-variant hover:text-primary font-bold"
                              >
                                Dismiss
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Emergency Contacts Speed Dial */}
                  <div className="p-6 rounded-xl border border-outline-variant bg-surface-container-lowest">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-on-surface">
                      Emergency Speed Dial
                    </h3>
                    <div className="space-y-2">
                      <div className="p-2 border border-outline-variant rounded-lg flex items-center justify-between bg-surface-container-low">
                        <div>
                          <div className="text-xs font-bold text-primary">Disaster Response HQ</div>
                          <span className="text-[10px] text-on-surface-variant">Sector Helpline (24/7)</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleDial('Disaster Response HQ', '+1 (800) 555-0199')}
                            className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            <PhoneCall className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleWhatsApp('Disaster Response HQ', '+1 (800) 555-0199')}
                            className="p-1.5 rounded-full bg-emerald-600/10 text-[#0d9488] hover:bg-emerald-600/20"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2 border border-outline-variant rounded-lg flex items-center justify-between bg-surface-container-low">
                        <div>
                          <div className="text-xs font-bold text-primary">Waterfront Medical Clinic</div>
                          <span className="text-[10px] text-on-surface-variant">Nearest Sector Hospital</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleDial('Waterfront Medical Clinic', '+1 (555) 019-7002')}
                            className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            <PhoneCall className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2 border border-outline-variant rounded-lg flex items-center justify-between bg-surface-container-low">
                        <div>
                          <div className="text-xs font-bold text-primary">Volunteer Rescue Dispatch</div>
                          <span className="text-[10px] text-on-surface-variant">Local Area Responders</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleDial('Volunteer Rescue', '+1 (555) 019-9001')}
                            className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            <PhoneCall className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB: SHELTER LOCATOR */}
          {activeTab === 'shelters' && (
            <div className="space-y-6 h-full flex flex-col">
              
              {/* Map Controls Filter Header */}
              <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest grid grid-cols-1 md:grid-cols-4 gap-4 items-center shrink-0">
                <div>
                  <label className="text-xs font-bold block mb-1">Filter Shelter Type</label>
                  <select 
                    value={shelterTypeFilter}
                    onChange={e => setShelterTypeFilter(e.target.value as any)}
                    className="w-full px-2 py-1 text-xs rounded border border-outline-variant bg-surface text-on-surface focus:outline-none"
                  >
                    <option value="all">All Safe-Havens</option>
                    <option value="shelter">Community Gyms</option>
                    <option value="hospital">Hospitals / Clinics</option>
                    <option value="camp">Rescue Camps</option>
                    <option value="police">Police Stations</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">Maximum Distance: {shelterDistFilter} miles</label>
                  <input 
                    type="range"
                    min={0.5}
                    max={5.0}
                    step={0.5}
                    value={shelterDistFilter}
                    onChange={e => setShelterDistFilter(parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                <div className="flex items-center gap-2 mt-4 md:mt-0">
                  <input 
                    id="openOnly"
                    type="checkbox"
                    checked={shelterOpenOnly}
                    onChange={e => setShelterOpenOnly(e.target.checked)}
                    className="rounded text-primary focus:ring-0 bg-surface border-outline-variant"
                  />
                  <label htmlFor="openOnly" className="text-xs font-bold cursor-pointer">
                    Show Open Only
                  </label>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    Showing {filteredShelters.length} of {shelters.length} Facilities
                  </span>
                </div>
              </div>

              {/* Map & Shelters List Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 flex-1">
                
                {/* Interactive Map (8 Columns) */}
                <div className="lg:col-span-8 h-[500px]">
                  <LeafletMap 
                    shelters={filteredShelters}
                    volunteers={[]}
                    cases={cases}
                    citizens={[citizen]}
                    selectedCase={null}
                    filterType="shelter"
                    showWeatherOverlay={true}
                    darkMode={false}
                  />
                </div>

                {/* Shelters Sidebar List (4 Columns) */}
                <div className="lg:col-span-4 overflow-y-auto space-y-3 max-h-[500px]">
                  {filteredShelters.map(s => {
                    const pct = Math.round((s.occupied / s.capacity) * 100);
                    return (
                      <div 
                        key={s.id}
                        className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest hover:border-primary transition-all flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                              s.type === 'hospital' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                            }`}>{s.type}</span>
                            <h4 className="font-bold text-xs mt-1">{s.name}</h4>
                            <p className="text-[10px] text-on-surface-variant">{s.address}</p>
                          </div>
                          <span className="text-xs font-mono font-bold text-primary shrink-0">{s.distance} mi</span>
                        </div>

                        <div className="mt-1">
                          <div className="flex justify-between text-[10px] text-on-surface-variant font-bold mb-1">
                            <span>Capacity: {s.occupied}/{s.capacity}</span>
                            <span>{pct}% Full</span>
                          </div>
                          <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${pct > 85 ? 'bg-secondary' : pct > 60 ? 'bg-orange-500' : 'bg-primary'}`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-outline-variant">
                          <span className="text-[9px] font-mono text-on-surface-variant">PH: {s.phone}</span>
                          <button
                            onClick={() => triggerToast(`Routing directions to ${s.name}... (Simulated GPS)`)}
                            className="bg-primary hover:bg-slate-800 px-3 py-1 rounded text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1"
                          >
                            <MapPin className="h-3 w-3" /> Get Route
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {filteredShelters.length === 0 && (
                    <div className="p-8 text-center text-on-surface-variant text-xs border border-dashed border-outline-variant rounded-xl">
                      No safe-havens found matching your filters.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB: CASES TIMELINE LIST */}
          {activeTab === 'cases' && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-black uppercase text-primary">Your Active Incidents</h3>
                  <p className="text-xs text-on-surface-variant">Monitor dispatch and volunteer tracking logs.</p>
                </div>
                <span className="px-3 py-1 bg-surface-container-high border border-outline-variant text-primary font-bold rounded-lg text-xs">
                  {cases.filter(c => c.citizenId === citizen.id && c.status !== 'closed').length} active cases
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {cases.filter(c => c.citizenId === citizen.id).map(c => (
                  <div 
                    key={c.id}
                    className="p-6 rounded-xl border border-outline-variant bg-surface-container-lowest"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-outline-variant pb-4 mb-4 gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm">Incident ID: #{c.id}</h4>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            c.priority === 'critical' ? 'bg-[#ffdad6] text-[#93000b]' : 'bg-surface-container-high text-on-surface-variant'
                          }`}>{c.priority} Priority</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant">Reported: {c.createdTime}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-on-surface-variant">Status:</span>
                        <span className="px-3 py-1 rounded bg-primary text-white font-bold text-xs uppercase tracking-wider">
                          {c.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: Detail Info */}
                      <div>
                        <h5 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Details</h5>
                        <p className="text-xs italic text-on-surface bg-surface-container-low p-3 rounded-lg border border-outline-variant">
                          "{c.latestResponse}"
                        </p>

                        <div className="mt-4 space-y-2 text-xs">
                          <div><b>Assigned Responder:</b> {c.volunteerName || 'Awaiting Team allocation'}</div>
                          {c.volunteerId && (
                            <div className="flex gap-2 items-center mt-2">
                              <button 
                                onClick={() => handleDial(c.volunteerName || 'Volunteer', '+1 (555) 019-9001')}
                                className="bg-primary hover:bg-slate-800 text-on-primary px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1.5"
                              >
                                <Phone className="h-3 w-3" /> Call Volunteer
                              </button>
                              <button 
                                onClick={() => handleWhatsApp(c.volunteerName || 'Volunteer', '+1 (555) 019-9001')}
                                className="bg-emerald-600/10 hover:bg-emerald-600/20 text-[#0d9488] px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-1.5 border border-emerald-500/25"
                              >
                                <MessageSquare className="h-3 w-3" /> WhatsApp
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Timeline Tracking */}
                      <div>
                        <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Live Progress Tracker</h5>
                        <div className="relative pl-6 space-y-4 border-l border-outline-variant">
                          {c.timeline.map((event, idx) => (
                            <div key={idx} className="relative">
                              <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-primary border border-surface"></span>
                              <div className="text-xs font-bold text-primary">{event.description}</div>
                              <span className="text-[9px] text-on-surface-variant font-mono">{event.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>
                ))}

                {cases.filter(c => c.citizenId === citizen.id).length === 0 && (
                  <div className="p-8 text-center text-on-surface-variant text-xs border border-dashed border-outline-variant rounded-xl">
                    No active emergency safety incidents logged in system.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: HISTORY & RISK TRENDS */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              
              <div className="p-6 rounded-xl border border-outline-variant bg-surface-container-lowest">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2 text-primary">
                  Historical Flood Risk Analytics
                </h3>
                <p className="text-xs text-on-surface-variant mb-6">
                  Calculated using river volume sensors, local rainfall gauges, and elevation models.
                </p>

                {/* Custom SVG Line Chart */}
                <div className="w-full h-64 relative bg-surface-container-low rounded-lg border border-outline-variant p-4">
                  
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between py-8 px-12 pointer-events-none opacity-20">
                    <div className="border-b border-outline w-full"></div>
                    <div className="border-b border-outline w-full"></div>
                    <div className="border-b border-outline w-full"></div>
                    <div className="border-b border-outline w-full"></div>
                  </div>

                  {/* Draw Chart lines using SVG */}
                  <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    {/* Gradient Fill under riskScore */}
                    <defs>
                      <linearGradient id="gradient-risk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#dc2626" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="gradient-river" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Risk Score Path: Points 10:00 (35), 11:00 (48), 12:00 (65), 13:00 (78), 14:00 (88), 15:00 (92) */}
                    <path
                      d="M 50,130 L 130,104 L 210,70 L 290,44 L 370,24 L 450,16"
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    
                    <path
                      d="M 50,130 L 130,104 L 210,70 L 290,44 L 370,24 L 450,16 L 450,190 L 50,190 Z"
                      fill="url(#gradient-risk)"
                    />

                    {/* River Level Path: 10:00 (4.8m), 11:00 (5.2m), 12:00 (6.1m), 13:00 (6.85m), 14:00 (7.2m), 15:00 (7.5m) */}
                    <path
                      d="M 50,110 L 130,102 L 210,84 L 290,69 L 370,62 L 450,56"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="4, 4"
                    />

                    {/* Dots for Risk Score */}
                    <circle cx="50" cy="130" r="4" fill="#dc2626" />
                    <circle cx="130" cy="104" r="4" fill="#dc2626" />
                    <circle cx="210" cy="70" r="4" fill="#dc2626" />
                    <circle cx="290" cy="44" r="4" fill="#dc2626" />
                    <circle cx="370" cy="24" r="4" fill="#dc2626" />
                    <circle cx="450" cy="16" r="4" fill="#dc2626" />
                  </svg>

                  {/* Chart Legend HUD Overlay */}
                  <div className="absolute top-2 right-4 flex gap-4 text-[9px] font-mono text-on-surface-variant">
                    <div className="flex items-center gap-1.5 text-secondary">
                      <span className="w-2.5 h-0.5 bg-secondary inline-block"></span>
                      <span>AI Safety Risk Score (%)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-500">
                      <span className="w-2.5 h-0.5 border-t border-dashed border-blue-500 inline-block"></span>
                      <span>Hudson River Level (m)</span>
                    </div>
                  </div>

                  {/* X Axis Labels */}
                  <div className="absolute bottom-1.5 inset-x-0 flex justify-between px-10 text-[9px] text-on-surface-variant font-mono">
                    <span>10:00 UTC</span>
                    <span>11:00 UTC</span>
                    <span>12:00 UTC</span>
                    <span>13:00 (Now)</span>
                    <span>14:00 (FC)</span>
                    <span>15:00 (FC)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                    <span className="text-[10px] text-on-surface-variant block uppercase">Peak Forecasted Risk</span>
                    <span className="text-xl font-black text-secondary">92%</span>
                    <span className="text-[9px] text-on-surface-variant block">Expected: 15:00 UTC</span>
                  </div>

                  <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
                    <span className="text-[10px] text-on-surface-variant block uppercase">Expected River Peak</span>
                    <span className="text-xl font-black text-blue-500">7.5m</span>
                    <span className="text-[9px] text-on-surface-variant block">Threat Threshold: 6.5m</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB: PROFILE & FAMILY NOTES */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Personal Information Form */}
                <div className="p-6 rounded-xl border border-outline-variant bg-surface-container-lowest space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                    Personal Guardian Profile
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold block mb-1">Full Name</label>
                      <input 
                        type="text"
                        value={citizen.name}
                        onChange={e => setCitizen({ ...citizen, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold block mb-1">Phone Number</label>
                      <input 
                        type="text"
                        value={citizen.phone}
                        onChange={e => setCitizen({ ...citizen, phone: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Primary Home Address</label>
                    <input 
                      type="text"
                      value={citizen.address}
                      onChange={e => setCitizen({ ...citizen, address: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold block mb-1">Elevation (m)</label>
                      <input 
                        type="number"
                        value={citizen.elevation}
                        onChange={e => setCitizen({ ...citizen, elevation: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold block mb-1">Latitude</label>
                      <input 
                        type="number"
                        step={0.0001}
                        value={citizen.lat}
                        onChange={e => setCitizen({ ...citizen, lat: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold block mb-1">Longitude</label>
                      <input 
                        type="number"
                        step={0.0001}
                        value={citizen.lng}
                        onChange={e => setCitizen({ ...citizen, lng: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Medical & Special Needs Notes</label>
                    <textarea 
                      rows={2}
                      value={citizen.medicalNotes}
                      onChange={e => setCitizen({ ...citizen, medicalNotes: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant bg-surface text-on-surface focus:outline-none"
                    ></textarea>
                  </div>

                  <button
                    onClick={() => triggerToast('Profile details saved.')}
                    className="bg-primary hover:bg-slate-800 px-4 py-2 rounded text-xs font-bold text-white shadow transition-all"
                  >
                    Save Changes
                  </button>
                </div>

                {/* Family Members list */}
                <div className="p-6 rounded-xl border border-outline-variant bg-surface-container-lowest flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">
                      Registered Family Members
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      {citizen.familyMembers.map((fam, idx) => (
                        <div key={idx} className="p-2 border border-outline-variant rounded-lg flex justify-between items-center bg-surface-container-low">
                          <div>
                            <div className="text-xs font-bold text-primary">{fam.name}</div>
                            <span className="text-[10px] text-on-surface-variant">{fam.relation} | Age: {fam.age}</span>
                          </div>
                          <button 
                            onClick={() => removeFamilyMember(idx)}
                            className="p-1 rounded text-secondary hover:bg-secondary/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      {citizen.familyMembers.length === 0 && (
                        <div className="text-center text-on-surface-variant text-xs py-4">No family members registered.</div>
                      )}
                    </div>

                    <div className="p-3 border border-outline-variant rounded-lg bg-surface space-y-2">
                      <span className="text-[10px] font-bold text-on-surface-variant block uppercase">Add Family Member</span>
                      <div className="grid grid-cols-3 gap-2">
                        <input 
                          type="text"
                          placeholder="Name"
                          value={newFamilyName}
                          onChange={e => setNewFamilyName(e.target.value)}
                          className="px-2 py-1 text-xs rounded border border-outline-variant bg-surface text-on-surface"
                        />
                        <input 
                          type="text"
                          placeholder="Relation"
                          value={newFamilyRelation}
                          onChange={e => setNewFamilyRelation(e.target.value)}
                          className="px-2 py-1 text-xs rounded border border-outline-variant bg-surface text-on-surface"
                        />
                        <input 
                          type="number"
                          placeholder="Age"
                          value={newFamilyAge}
                          onChange={e => setNewFamilyAge(e.target.value)}
                          className="px-2 py-1 text-xs rounded border border-outline-variant bg-surface text-on-surface"
                        />
                      </div>
                      <button
                        onClick={addFamilyMember}
                        className="w-full bg-primary hover:bg-slate-800 py-1.5 rounded text-[10px] font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Member
                      </button>
                    </div>
                  </div>

                  {/* Channel Preferences */}
                  <div className="border-t border-outline-variant pt-4 mt-4">
                    <span className="text-xs font-bold block mb-2 text-on-surface-variant">Emergency Alert Delivery Channels</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="pref-sms" 
                          checked={citizen.notificationPrefs.weather}
                          onChange={e => setCitizen({
                            ...citizen,
                            notificationPrefs: { ...citizen.notificationPrefs, weather: e.target.checked }
                          })}
                          className="rounded text-primary bg-surface border-outline-variant focus:ring-0"
                        />
                        <label htmlFor="pref-sms" className="cursor-pointer">SMS Warning</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="pref-wa" 
                          checked={citizen.notificationPrefs.emergency}
                          onChange={e => setCitizen({
                            ...citizen,
                            notificationPrefs: { ...citizen.notificationPrefs, emergency: e.target.checked }
                          })}
                          className="rounded text-primary bg-surface border-outline-variant focus:ring-0"
                        />
                        <label htmlFor="pref-wa" className="cursor-pointer">WhatsApp Dispatch</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="pref-email" 
                          checked={citizen.notificationPrefs.volunteer}
                          onChange={e => setCitizen({
                            ...citizen,
                            notificationPrefs: { ...citizen.notificationPrefs, volunteer: e.target.checked }
                          })}
                          className="rounded text-primary bg-surface border-outline-variant focus:ring-0"
                        />
                        <label htmlFor="pref-email" className="cursor-pointer">Email Summary</label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="pref-push" 
                          checked={citizen.notificationPrefs.ai}
                          onChange={e => setCitizen({
                            ...citizen,
                            notificationPrefs: { ...citizen.notificationPrefs, ai: e.target.checked }
                          })}
                          className="rounded text-primary bg-surface border-outline-variant focus:ring-0"
                        />
                        <label htmlFor="pref-push" className="cursor-pointer">System Push</label>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

        </div>

        {/* System Footer Bar */}
        <footer className="h-8 shrink-0 border-t border-outline-variant flex items-center justify-between px-8 text-[9px] font-mono text-on-surface-variant bg-surface-container-lowest uppercase">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Secured Node Link: Sector 7G
            </span>
            <span>Latency: 14ms</span>
          </div>
          <div>
            <span>13:05:59 UTC</span>
          </div>
        </footer>

      </main>

    </div>
  );
};
export default CitizenPortal;
