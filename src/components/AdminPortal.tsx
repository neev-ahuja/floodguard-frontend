import React, { useState, useEffect } from 'react';
import {
  Users, AlertCircle, ShieldAlert, Heart, Settings,
  Map, Activity, BellRing, Database, ChevronRight, Search,
  X, Shield, Plus, FileText, Download, Clock, Truck,
  CheckCircle2, AlertTriangle, Layers, Info
} from 'lucide-react';
import type { Citizen, Alert, Case, Volunteer, Shelter, SystemLog, WeatherData } from '../types';
import LeafletMap from './LeafletMap';

interface AdminPortalProps {
  citizens: Citizen[];
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  cases: Case[];
  setCases: React.Dispatch<React.SetStateAction<Case[]>>;
  volunteers: Volunteer[];
  setVolunteers: React.Dispatch<React.SetStateAction<Volunteer[]>>;
  shelters: Shelter[];
  logs: SystemLog[];
  setLogs: React.Dispatch<React.SetStateAction<SystemLog[]>>;
  weather: WeatherData;
  setWeather: React.Dispatch<React.SetStateAction<WeatherData>>;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  citizens,
  alerts,
  setAlerts,
  cases,
  setCases,
  volunteers,
  setVolunteers,
  shelters,
  logs,
  setLogs,
  weather,
  setWeather,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cases' | 'gis' | 'citizens' | 'alerts' | 'ai' | 'volunteers' | 'analytics' | 'settings'>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  // Search & Filter States
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [citizenSearch, setCitizenSearch] = useState('');
  const [citizenRiskFilter, setCitizenRiskFilter] = useState('all');
  const [citizenSortKey, setCitizenSortKey] = useState<'riskScore' | 'elevation' | 'distanceToRiver'>('riskScore');

  // Broadcast Alert Form States
  const [newAlertSeverity, setNewAlertSeverity] = useState<'info' | 'warning' | 'critical'>('warning');
  const [newAlertCategory, setNewAlertCategory] = useState<'weather' | 'emergency' | 'volunteer' | 'ai'>('weather');
  const [newAlertMessage, setNewAlertMessage] = useState('');
  const [newAlertRadius, setNewAlertRadius] = useState('500');
  const [newAlertMinRisk, setNewAlertMinRisk] = useState('50');

  // Case details panel temporary states
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // GIS Map Filter State
  const [gisFilter, setGisFilter] = useState<'all' | 'shelter' | 'hospital' | 'volunteer' | 'case'>('all');
  const [gisWeatherOverlay, setGisWeatherOverlay] = useState(true);

  // Clock state
  const [utcTime, setUtcTime] = useState('00:00:00 UTC');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${h}:${m}:${s} UTC`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (message: string, type: 'success' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Case Status Mutation
  const updateCaseStatus = (caseId: string, newStatus: Case['status']) => {
    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        const newEvent = {
          status: newStatus,
          time: new Date().toISOString().substring(11, 19) + ' UTC',
          description: `Case status changed to ${newStatus.toUpperCase()}`
        };
        return {
          ...c,
          status: newStatus,
          timeline: [...c.timeline, newEvent]
        };
      }
      return c;
    }));
    triggerToast(`Case #${caseId} updated: ${newStatus}`);
  };

  // Case Volunteer Assignment
  const assignVolunteerToCase = (caseId: string, volId: string) => {
    const vol = volunteers.find(v => v.id === volId);
    if (!vol) return;

    setCases(prev => prev.map(c => {
      if (c.id === caseId) {
        const newEvent = {
          status: 'assigned' as const,
          time: new Date().toISOString().substring(11, 19) + ' UTC',
          description: `Assigned unit: ${vol.name}`
        };
        return {
          ...c,
          volunteerId: vol.id,
          volunteerName: vol.name,
          status: 'assigned' as const,
          timeline: [...c.timeline, newEvent]
        };
      }
      return c;
    }));

    setVolunteers(prev => prev.map(v => v.id === volId ? { ...v, currentCasesCount: v.currentCasesCount + 1 } : v));

    const newLog: SystemLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      workflowName: 'Emergency Volunteer Dispatcher',
      status: 'success',
      duration: 110,
      started: new Date().toLocaleTimeString(),
      ended: new Date().toLocaleTimeString(),
      message: `Assigned unit ${vol.name} to rescue Case #${caseId}.`
    };
    setLogs(prev => [newLog, ...prev]);
    triggerToast(`Assigned ${vol.name} to Case #${caseId}`);
  };

  const appendCaseNote = (caseId: string) => {
    if (!adminNoteInput.trim()) return;
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, notes: [...c.notes, `Dispatcher: ${adminNoteInput}`] } : c));
    setAdminNoteInput('');
    triggerToast('Note appended to case log.');
  };

  const escalateCasePriority = (caseId: string) => {
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, priority: 'critical' } : c));
    triggerToast(`Case #${caseId} escalated to CRITICAL priority!`, 'warning');
  };

  const handleBroadcastAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertMessage.trim()) {
      triggerToast('Alert message is blank.', 'warning');
      return;
    }

    const alertId = `ALT-${Math.floor(100 + Math.random() * 900)}`;
    const newAlert: Alert = {
      id: alertId,
      severity: newAlertSeverity,
      category: newAlertCategory,
      message: `ADVISORY (${newAlertRadius}m | Risk > ${newAlertMinRisk}%): ${newAlertMessage}`,
      timestamp: new Date().toLocaleTimeString() + ' UTC',
      status: 'unread'
    };

    setAlerts(prev => [newAlert, ...prev]);

    const newLog: SystemLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      workflowName: 'Alert System Broadcast',
      status: 'success',
      duration: 150,
      started: 'Just Now',
      ended: 'Just Now',
      message: `Cell broadcast ${alertId} transmitted to Sector 7G targets.`
    };
    setLogs(prev => [newLog, ...prev]);

    setNewAlertMessage('');
    triggerToast(`Alert ${alertId} broadcasted successfully.`);
  };

  const handleExport = (name: string) => {
    triggerToast(`Compiling data... Exported ${name}.csv to server downloads.`);
  };

  // KPIs calculations
  const totalActiveCases = cases.filter(c => c.status !== 'closed' && c.status !== 'resolved').length;
  const criticalCasesCount = cases.filter(c => c.priority === 'critical' && c.status !== 'closed' && c.status !== 'resolved').length;
  const onlineVolunteersCount = volunteers.filter(v => v.availability === 'online').length;
  const busyVolunteersCount = volunteers.filter(v => v.availability === 'online' && v.currentCasesCount > 0).length;
  const utilizationRate = onlineVolunteersCount > 0 ? Math.round((busyVolunteersCount / onlineVolunteersCount) * 100) : 0;

  // Filter cases by search query
  const searchedCases = cases.filter(c =>
    c.id.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
    c.citizenName.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(caseSearchQuery.toLowerCase())
  );

  const filteredCitizens = citizens.filter(cit => {
    const matchesSearch = cit.name.toLowerCase().includes(citizenSearch.toLowerCase()) ||
      cit.address.toLowerCase().includes(citizenSearch.toLowerCase());
    const matchesRisk = citizenRiskFilter === 'all' || cit.status.toLowerCase() === citizenRiskFilter.toLowerCase();
    return matchesSearch && matchesRisk;
  }).sort((a, b) => {
    if (citizenSortKey === 'riskScore') return b.riskScore - a.riskScore;
    if (citizenSortKey === 'elevation') return a.elevation - b.elevation;
    if (citizenSortKey === 'distanceToRiver') return a.distanceToRiver - b.distanceToRiver;
    return 0;
  });

  const selectedCase = cases.find(c => c.id === selectedCaseId) || null;

  return (
    <div className="flex overflow-hidden h-screen font-sans bg-background text-on-surface">

      {/* SideNavBar */}
      <aside className="flex flex-col h-full py-md w-64 border-r shrink-0 transition-colors bg-surface-container-low border-outline-variant">
        <div className="px-gutter mb-xl">
          <h2 className="font-title-md text-title-md font-bold text-primary flex items-center gap-2">
            <Shield className="h-5 w-5 text-secondary shrink-0" />
            <span>Disaster Response</span>
          </h2>
          <p className="text-on-surface-variant font-label-caps text-[10px] uppercase tracking-wider mt-1">Sector 7G - Active</p>
        </div>

        <nav className="flex-1 space-y-1 px-sm">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-md px-md py-sm transition-all font-label-caps text-label-caps ${activeTab === 'dashboard'
              ? 'bg-secondary-container text-on-secondary-container font-bold border-r-4 border-secondary'
              : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
          >
            <Activity className="h-4 w-4" />
            <span>Live Command</span>
          </button>

          <button
            onClick={() => setActiveTab('cases')}
            className={`w-full flex items-center gap-md px-md py-sm transition-all font-label-caps text-label-caps relative ${activeTab === 'cases'
              ? 'bg-secondary-container text-on-secondary-container font-bold border-r-4 border-secondary'
              : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Cases</span>
            {cases.filter(c => c.status === 'new').length > 0 && (
              <span className="absolute right-3 px-1.5 py-0.5 rounded bg-secondary text-[8px] font-bold text-on-secondary leading-none">
                {cases.filter(c => c.status === 'new').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('gis')}
            className={`w-full flex items-center gap-md px-md py-sm transition-all font-label-caps text-label-caps ${activeTab === 'gis'
              ? 'bg-secondary-container text-on-secondary-container font-bold border-r-4 border-secondary'
              : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
          >
            <Map className="h-4 w-4" />
            <span>GIS Vector Map</span>
          </button>

          <button
            onClick={() => setActiveTab('citizens')}
            className={`w-full flex items-center gap-md px-md py-sm transition-all font-label-caps text-label-caps ${activeTab === 'citizens'
              ? 'bg-secondary-container text-on-secondary-container font-bold border-r-4 border-secondary'
              : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
          >
            <Users className="h-4 w-4" />
            <span>Citizen Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`w-full flex items-center gap-md px-md py-sm transition-all font-label-caps text-label-caps ${activeTab === 'alerts'
              ? 'bg-secondary-container text-on-secondary-container font-bold border-r-4 border-secondary'
              : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
          >
            <BellRing className="h-4 w-4" />
            <span>Broadcaster</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`w-full flex items-center gap-md px-md py-sm transition-all font-label-caps text-label-caps ${activeTab === 'ai'
              ? 'bg-secondary-container text-on-secondary-container font-bold border-r-4 border-secondary'
              : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
          >
            <Database className="h-4 w-4" />
            <span>AI Monitoring</span>
          </button>

          <button
            onClick={() => setActiveTab('volunteers')}
            className={`w-full flex items-center gap-md px-md py-sm transition-all font-label-caps text-label-caps ${activeTab === 'volunteers'
              ? 'bg-secondary-container text-on-secondary-container font-bold border-r-4 border-secondary'
              : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
          >
            <Truck className="h-4 w-4" />
            <span>Responder Units</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-md px-md py-sm transition-all font-label-caps text-label-caps ${activeTab === 'analytics'
              ? 'bg-secondary-container text-on-secondary-container font-bold border-r-4 border-secondary'
              : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
          >
            <Activity className="h-4 w-4" />
            <span>Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-md px-md py-sm transition-all font-label-caps text-label-caps ${activeTab === 'settings'
              ? 'bg-secondary-container text-on-secondary-container font-bold border-r-4 border-secondary'
              : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer Profile */}
        <div className="mt-auto px-sm pt-md border-t border-outline-variant space-y-3">
          <div className="flex items-center gap-md px-md py-sm rounded bg-surface-container-high">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden shrink-0">
              <img
                className="object-cover w-full h-full"
                alt="Dispatcher"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBk_Spc3EPWOEIqpXpXqqRMMAZyBZTYXHTHWe72Vrh_o_vU97esy3x3_rG-qp90FLAAW-Xd70uO_P7K0VZovb9Yv1TehOUNUBeRcMx4o9VUfemvncBnNwjaYIptmFl2GnjpPxO6Do34ZJaEXMXpbeMx84JPKJoqCZUuNSDaT2p7OPQZ53VaCB70r5Q_tDu1oDVLxunXCvsURSs5LtqKA_PCw_9Z2WXY15_PKEY1CPpvk2zJXKK4QII"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-xs truncate">C. Dispatcher</span>
              <span className="text-[10px] text-on-surface-variant">Auth Level 4</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full text-center text-xs text-secondary font-bold hover:underline py-1"
          >
            Logout Operator
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-gutter h-16 border-b shrink-0 z-10 bg-surface border-outline-variant">
          <div className="flex items-center gap-xl">
            <h1 className="font-headline-lg text-headline-lg font-black text-primary uppercase tracking-widest">
              Flood Guard
            </h1>
            <nav className="hidden md:flex items-center gap-lg">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`font-label-caps text-label-caps pb-1 ${activeTab === 'dashboard' ? 'text-primary border-b-2 border-secondary' : 'text-on-surface-variant'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('cases')}
                className={`font-label-caps text-label-caps pb-1 ${activeTab === 'cases' ? 'text-primary border-b-2 border-secondary' : 'text-on-surface-variant'}`}
              >
                Active Incidents
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-md">
            {/* Live Search Case ID Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-on-surface-variant pointer-events-none" />
              <input
                value={caseSearchQuery}
                onChange={e => setCaseSearchQuery(e.target.value)}
                className="rounded-lg pl-10 pr-4 py-1.5 text-sm w-64 border focus:outline-none focus:ring-0 bg-surface-container-low border-outline-variant focus:border-primary text-on-surface"
                placeholder="Search case ID..."
                type="text"
              />
              {caseSearchQuery && (
                <button onClick={() => setCaseSearchQuery('')} className="absolute right-3 text-on-surface-variant hover:text-primary">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-sm">
              <span className="px-3 py-1 bg-secondary-container text-on-secondary-container border border-secondary/20 rounded text-[10px] font-bold uppercase tracking-wider animate-pulse">
                Threat Alarm Active
              </span>
            </div>
          </div>
        </header>

        {/* Workspace Canvas Area */}
        <div className="flex-1 overflow-y-auto p-gutter bg-[#f8fafc]">

          {/* Toast Alert popup */}
          {toast && (
            <div className="fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-xl border flex items-center gap-3 animate-bounce bg-white border-outline-variant text-primary">
              <CheckCircle2 className={`h-5 w-5 shrink-0 ${toast.type === 'success' ? 'text-emerald-600' : 'text-secondary'}`} />
              <span className="text-xs font-bold">{toast.message}</span>
            </div>
          )}

          {/* TAB: LIVE COMMAND DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-lg">

              {/* Dashboard Stats (4 columns) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-md">

                <div className="border p-md rounded-lg flex flex-col gap-xs shadow-sm bg-surface-container-lowest border-outline-variant">
                  <span className="text-on-surface-variant font-label-caps text-[10px] uppercase">Total Active Cases</span>
                  <span className="font-display-lg text-display-lg leading-none">{totalActiveCases}</span>
                  <div className="flex items-center gap-1 text-[#0c9488] text-[11px] font-bold">
                    <span>+12% vs last shift</span>
                  </div>
                </div>

                <div className="border p-md rounded-lg flex flex-col gap-xs shadow-sm bg-surface-container-lowest border-outline-variant">
                  <span className="text-on-surface-variant font-label-caps text-[10px] uppercase">Critical Priority</span>
                  <span className="font-display-lg text-display-lg text-secondary leading-none">
                    {String(criticalCasesCount).padStart(2, '0')}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Immediate response required</span>
                </div>

                <div className="border p-md rounded-lg flex flex-col gap-xs shadow-sm bg-surface-container-lowest border-outline-variant">
                  <span className="text-on-surface-variant font-label-caps text-[10px] uppercase">Response Time (Avg)</span>
                  <span className="font-display-lg text-display-lg leading-none">04:22</span>
                  <span className="text-[11px] text-on-surface-variant">Target: &lt; 05:00</span>
                </div>

                <div className="border p-md rounded-lg flex flex-col gap-xs shadow-sm bg-surface-container-lowest border-outline-variant">
                  <span className="text-on-surface-variant font-label-caps text-[10px] uppercase">Unit Utilization</span>
                  <div className="flex items-end gap-md mt-1">
                    <span className="font-display-lg text-display-lg leading-none">{utilizationRate}%</span>
                    <div className="flex-1 h-2 bg-surface-container-highest rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-primary" style={{ width: `${utilizationRate}%` }}></div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bento Layout for Case Management Overview */}
              <div className="grid grid-cols-12 gap-lg items-start">

                {/* Main Table Section (8 Columns) */}
                <section className="col-span-12 lg:col-span-8 border rounded-lg overflow-hidden shadow-sm bg-surface-container-lowest border-outline-variant">
                  <div className="px-md py-sm border-b flex justify-between items-center bg-surface border-outline-variant">
                    <h3 className="font-title-md text-title-md text-primary">Case Management Matrix</h3>

                    <div className="flex items-center gap-sm">
                      <button
                        onClick={() => {
                          const mockCitizen = citizens[Math.floor(Math.random() * citizens.length)];
                          const newCaseId = `CASE-${Math.floor(1000 + Math.random() * 9000)}`;
                          const newCase: Case = {
                            id: newCaseId,
                            citizenId: mockCitizen.id,
                            citizenName: mockCitizen.name,
                            status: 'new',
                            priority: 'critical',
                            location: mockCitizen.address,
                            lat: mockCitizen.lat,
                            lng: mockCitizen.lng,
                            createdTime: '13:00 UTC',
                            latestResponse: 'Simulated dispatch request.',
                            timeline: [{ status: 'new', time: 'Just Now', description: 'Log created.' }],
                            notes: [],
                            riskFactors: [],
                            weatherSnapshot: { temp: 23, rainfall: 42, riverLevel: 6.85 }
                          };
                          setCases(prev => [newCase, ...prev]);
                          triggerToast(`Case #${newCaseId} created.`);
                        }}
                        className="bg-primary text-on-primary px-md py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>NEW CASE</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b text-on-surface-variant font-label-caps text-[11px] bg-surface-container-low border-outline-variant">
                          <th className="px-md py-3">CASE ID / TIMESTAMP</th>
                          <th className="px-md py-3">INCIDENT TYPE</th>
                          <th className="px-md py-3">LOCATION</th>
                          <th className="px-md py-3">STATUS</th>
                          <th className="px-md py-3">PRIORITY</th>
                          <th className="px-md py-3 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="text-body-sm font-mono-data">
                        {searchedCases.filter(c => c.status !== 'closed').map(c => {
                          const isCritical = c.priority === 'critical';
                          return (
                            <tr key={c.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group">
                              <td className="px-md py-4">
                                <div className="font-bold text-primary">#{c.id}</div>
                                <div className="text-[10px] text-on-surface-variant uppercase mt-0.5">{c.createdTime}</div>
                              </td>
                              <td className="px-md py-4">Flood Evacuation</td>
                              <td className="px-md py-4 text-on-surface-variant truncate max-w-[200px]">{c.location}</td>
                              <td className="px-md py-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.status === 'new'
                                  ? 'bg-[#ffdad6] text-[#93000b] neon-glow-red'
                                  : c.status === 'assigned'
                                    ? 'bg-blue-100 text-blue-800 neon-glow-blue'
                                    : 'bg-[#e0f2f1] text-[#0c9488] neon-glow-green'
                                  }`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="px-md py-4">
                                <div className={`flex items-center gap-1 font-bold ${isCritical ? 'text-secondary' : 'text-on-surface-variant'}`}>
                                  {isCritical ? 'CRITICAL' : 'MONITOR'}
                                </div>
                              </td>
                              <td className="px-md py-4 text-right">
                                <button
                                  onClick={() => setSelectedCaseId(c.id)}
                                  className="text-on-surface-variant group-hover:text-primary transition-colors hover:underline"
                                >
                                  Open
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {searchedCases.filter(c => c.status !== 'closed').length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-on-surface-variant text-xs">
                              No active incidents match search filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Sidebar Canvas Content (4 Columns) */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-lg">

                  {/* Tactical Map Preview */}
                  <section className="border rounded-lg overflow-hidden flex flex-col h-64 bg-surface-container-lowest border-outline-variant">
                    <div className="px-md py-sm border-b flex justify-between items-center shrink-0 bg-surface border-outline-variant">
                      <h3 className="font-label-caps text-label-caps text-primary">Tactical Vector Map</h3>
                      <span className="px-2 py-0.5 bg-secondary text-[10px] rounded font-bold text-white uppercase tracking-widest animate-pulse">Live Feed</span>
                    </div>

                    <div className="flex-1 relative">
                      <LeafletMap
                        center={[40.7328, -74.0150]}
                        zoom={13}
                        shelters={shelters}
                        volunteers={volunteers}
                        cases={cases}
                        citizens={citizens}
                        selectedCase={null}
                        filterType="all"
                        showWeatherOverlay={true}
                      // darkMode={false}
                      />
                    </div>
                  </section>

                  {/* Available Units Dispatcher */}
                  <section className="border rounded-lg overflow-hidden flex flex-col bg-surface-container-lowest border-outline-variant">
                    <div className="px-md py-sm border-b bg-surface border-outline-variant">
                      <h3 className="font-label-caps text-label-caps text-primary">Available Units</h3>
                    </div>

                    <div className="p-md space-y-sm">
                      {volunteers.map(vol => {
                        const isEnRoute = vol.currentCasesCount > 0;
                        const isOnline = vol.availability === 'online';
                        return (
                          <div
                            key={vol.id}
                            onClick={() => {
                              if (vol.availability === 'online') {
                                triggerToast(`Unit ${vol.name} selected for dispatch console.`);
                              }
                            }}
                            className="flex items-center gap-md p-sm border rounded hover:bg-surface-container-low transition-colors cursor-pointer border-outline-variant"
                          >
                            <div className={`w-2 h-10 rounded-full ${isEnRoute ? 'bg-secondary' : isOnline ? 'bg-[#0c9488]' : 'bg-slate-400'
                              }`}></div>

                            <div className="flex-1">
                              <div className="font-bold text-xs uppercase tracking-tight">{vol.name}</div>
                              <div className="text-[10px] text-on-surface-variant">{vol.skill} Team</div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className={`text-[10px] font-bold ${isEnRoute ? 'text-secondary' : isOnline ? 'text-[#0c9488]' : 'text-slate-500'
                                }`}>
                                {isEnRoute ? 'EN ROUTE' : isOnline ? 'READY' : 'STATION'}
                              </div>
                              <span className="text-[9px] text-on-surface-variant font-mono-data">load: {vol.currentCasesCount}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-md bg-surface-container-low border-t border-outline-variant">
                      <button
                        onClick={() => setActiveTab('volunteers')}
                        className="w-full py-2 bg-primary text-on-primary font-bold text-xs uppercase rounded hover:bg-on-primary-container transition-colors"
                      >
                        Open Unit Deployment Matrix
                      </button>
                    </div>
                  </section>

                </div>

              </div>

            </div>
          )}

          {/* TAB: KANBAN CASES BOARD */}
          {activeTab === 'cases' && (
            <div className="space-y-lg h-full flex flex-col">
              <div className="flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-title-md text-title-md text-primary uppercase">Rescue Cases Board</h3>
                  <p className="text-xs text-on-surface-variant">Modify statuses and assign units.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-md items-start overflow-x-auto pb-4 flex-1">
                {(['new', 'pending', 'assigned', 'enroute', 'reached', 'resolved', 'closed'] as const).map(colStatus => {
                  const casesInCol = searchedCases.filter(c => c.status === colStatus);
                  return (
                    <div
                      key={colStatus}
                      className="p-sm rounded-lg border min-h-[400px] flex flex-col gap-sm shrink-0 w-60 bg-surface-container-lowest border-outline-variant"
                    >
                      <div className="flex justify-between items-center border-b border-outline-variant/40 pb-sm">
                        <span className="font-label-caps text-label-caps text-on-surface-variant">
                          {colStatus.toUpperCase()}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-primary text-[9px] font-bold text-on-primary">
                          {casesInCol.length}
                        </span>
                      </div>

                      <div className="space-y-sm flex-1 overflow-y-auto max-h-[500px]">
                        {casesInCol.map(c => {
                          const isCritical = c.priority === 'critical';
                          return (
                            <div
                              key={c.id}
                              onClick={() => setSelectedCaseId(c.id)}
                              className={`p-sm rounded border cursor-pointer hover:scale-[1.02] transition-all relative ${isCritical
                                ? 'bg-[#ffdad6]/20 border-secondary hover:border-secondary'
                                : 'bg-surface border-outline-variant hover:border-primary'
                                }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${isCritical ? 'bg-secondary/20 text-secondary' : 'bg-surface-container-high text-on-surface-variant'
                                  }`}>{c.priority.toUpperCase()}</span>
                                <span className="text-[9px] font-mono-data text-on-surface-variant">#{c.id}</span>
                              </div>

                              <h4 className="font-bold text-xs truncate text-primary">{c.citizenName}</h4>
                              <p className="text-[10px] text-on-surface-variant truncate mt-1">"{c.latestResponse}"</p>

                              <div className="mt-xs pt-xs border-t border-outline-variant flex justify-between items-center">
                                <select
                                  onClick={e => e.stopPropagation()}
                                  value={c.status}
                                  onChange={e => updateCaseStatus(c.id, e.target.value as any)}
                                  className="w-full bg-surface border border-outline-variant rounded px-1 py-0.5 text-[9px] text-on-surface font-bold focus:outline-none"
                                >
                                  <option value="new">New</option>
                                  <option value="pending">Pending</option>
                                  <option value="assigned">Assigned</option>
                                  <option value="enroute">Enroute</option>
                                  <option value="reached">Reached</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="closed">Closed</option>
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: GIS MAP PANEL */}
          {activeTab === 'gis' && (
            <div className="space-y-lg h-full flex flex-col">
              <div className="p-md rounded-lg border grid grid-cols-1 md:grid-cols-3 gap-md items-center shrink-0 bg-surface-container-lowest border-outline-variant">
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Filter Layers</label>
                  <select
                    value={gisFilter}
                    onChange={e => setGisFilter(e.target.value as any)}
                    className="w-full px-2 py-1 text-xs rounded border border-outline-variant bg-surface text-on-surface focus:outline-none"
                  >
                    <option value="all">Show All</option>
                    <option value="shelter">Safe Shelters</option>
                    <option value="hospital">Hospitals</option>
                    <option value="volunteer">Responders</option>
                    <option value="case">Cases</option>
                  </select>
                </div>

                <div className="flex items-center gap-sm">
                  <input
                    id="gisRainToggle"
                    type="checkbox"
                    checked={gisWeatherOverlay}
                    onChange={e => setGisWeatherOverlay(e.target.checked)}
                    className="rounded text-secondary focus:ring-0 bg-surface border-outline-variant"
                  />
                  <label htmlFor="gisRainToggle" className="text-xs font-bold cursor-pointer">
                    Show Rainfall Heat Overlay
                  </label>
                </div>

                <div className="text-right text-[10px] text-on-surface-variant font-mono-data">
                  Live GIS Node Sync Active
                </div>
              </div>

              <div className="flex-1 h-[550px] rounded-lg overflow-hidden border border-outline-variant">
                <LeafletMap
                  center={[40.7328, -74.0150]}
                  zoom={14}
                  shelters={shelters}
                  volunteers={volunteers}
                  cases={cases}
                  citizens={citizens}
                  selectedCase={null}
                  filterType={gisFilter}
                  showWeatherOverlay={gisWeatherOverlay}
                // darkMode={false}
                />
              </div>
            </div>
          )}

          {/* TAB: CITIZEN RISK TABLE */}
          {activeTab === 'citizens' && (
            <div className="space-y-lg">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
                <div>
                  <h3 className="font-title-md text-title-md text-primary uppercase">Citizen Risk Matrix</h3>
                  <p className="text-xs text-on-surface-variant">Scan risk scores and elevations.</p>
                </div>

                <div className="flex flex-wrap gap-sm">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-on-surface-variant" />
                    <input
                      type="text"
                      placeholder="Search citizen..."
                      value={citizenSearch}
                      onChange={e => setCitizenSearch(e.target.value)}
                      className="pl-9 pr-4 py-1.5 text-xs rounded border border-outline-variant bg-surface focus:outline-none w-48"
                    />
                  </div>

                  <select
                    value={citizenRiskFilter}
                    onChange={e => setCitizenRiskFilter(e.target.value)}
                    className="px-2 py-1 text-xs rounded border border-outline-variant bg-surface focus:outline-none"
                  >
                    <option value="all">All Risks</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="moderate">Moderate</option>
                    <option value="safe">Safe</option>
                  </select>

                  <select
                    value={citizenSortKey}
                    onChange={e => setCitizenSortKey(e.target.value as any)}
                    className="px-2 py-1 text-xs rounded border border-outline-variant bg-surface focus:outline-none"
                  >
                    <option value="riskScore">Risk Score</option>
                    <option value="elevation">Elevation</option>
                    <option value="distanceToRiver">River Distance</option>
                  </select>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden bg-surface-container-lowest border-outline-variant">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b text-on-surface-variant font-label-caps text-[11px] bg-surface-container-low border-outline-variant">
                        <th className="p-3">Citizen Name</th>
                        <th className="p-3">Risk Level</th>
                        <th className="p-3">River Distance</th>
                        <th className="p-3">Elevation</th>
                        <th className="p-3">Local Rainfall</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3 text-right">Dispatch Trigger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40 font-mono-data text-on-surface">
                      {filteredCitizens.map(cit => {
                        const isCritical = cit.status === 'Critical' || cit.status === 'High';
                        return (
                          <tr key={cit.id} className="hover:bg-surface-container-low transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-primary">{cit.name}</div>
                              <span className="text-[10px] text-on-surface-variant font-sans">{cit.id} | {cit.address}</span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cit.status === 'Critical'
                                ? 'bg-[#ffdad6] text-[#93000b] neon-glow-red'
                                : cit.status === 'High'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-[#e0f2f1] text-[#0c9488]'
                                }`}>{cit.status} ({cit.riskScore}%)</span>
                            </td>
                            <td className="p-3">{cit.distanceToRiver}m</td>
                            <td className="p-3">{cit.elevation}m</td>
                            <td className="p-3 text-secondary font-bold">{cit.rainfall}mm</td>
                            <td className="p-3 text-on-surface-variant font-sans">{cit.phone}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  const caseId = `CASE-${Math.floor(1000 + Math.random() * 9000)}`;
                                  const newCase: Case = {
                                    id: caseId,
                                    citizenId: cit.id,
                                    citizenName: cit.name,
                                    status: 'new',
                                    priority: isCritical ? 'critical' : 'monitor',
                                    location: cit.address,
                                    lat: cit.lat,
                                    lng: cit.lng,
                                    createdTime: 'Just Now',
                                    latestResponse: 'Manual Command override dispatch.',
                                    timeline: [{ status: 'new', time: 'Just Now', description: 'Manual alert logged.' }],
                                    notes: [],
                                    riskFactors: [],
                                    weatherSnapshot: { temp: 23, rainfall: cit.rainfall, riverLevel: 6.85 }
                                  };
                                  setCases(prev => [newCase, ...prev]);
                                  triggerToast(`Emergency Dispatch created for ${cit.name}`);
                                }}
                                className="px-3 py-1 bg-primary hover:bg-slate-800 text-on-primary rounded text-[10px] font-bold uppercase transition-colors"
                              >
                                Dispatch
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ALERT BROADCASTER */}
          {activeTab === 'alerts' && (
            <div className="space-y-lg">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                <div className="p-6 rounded-lg border space-y-md bg-surface-container-lowest border-outline-variant">
                  <h3 className="font-label-caps text-label-caps text-secondary uppercase">
                    Draft Broadcast Signal
                  </h3>

                  <form onSubmit={handleBroadcastAlert} className="space-y-md">
                    <div className="grid grid-cols-2 gap-md">
                      <div>
                        <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Severity</label>
                        <select
                          value={newAlertSeverity}
                          onChange={e => setNewAlertSeverity(e.target.value as any)}
                          className="w-full px-2 py-1 text-xs rounded border border-outline-variant bg-surface text-on-surface focus:outline-none"
                        >
                          <option value="critical">Critical</option>
                          <option value="warning">Warning</option>
                          <option value="info">Info</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Category</label>
                        <select
                          value={newAlertCategory}
                          onChange={e => setNewAlertCategory(e.target.value as any)}
                          className="w-full px-2 py-1 text-xs rounded border border-outline-variant bg-surface text-on-surface focus:outline-none"
                        >
                          <option value="weather">Weather</option>
                          <option value="emergency">Evacuation</option>
                          <option value="volunteer">Responders</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Broadcast Message Body</label>
                      <textarea
                        rows={4}
                        value={newAlertMessage}
                        onChange={e => setNewAlertMessage(e.target.value)}
                        placeholder="Type alert advisory..."
                        className="w-full px-3 py-2 text-xs rounded border border-outline-variant bg-surface text-on-surface focus:outline-none focus:border-primary"
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-xs rounded uppercase tracking-wider transition-colors shadow-sm"
                    >
                      Transmit Signal
                    </button>
                  </form>
                </div>

                <div className="p-6 rounded-lg border flex flex-col justify-between bg-surface-container-lowest border-outline-variant">
                  <div>
                    <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-4">
                      Transmission Logs
                    </h3>

                    <div className="space-y-sm">
                      {alerts.map(a => (
                        <div key={a.id} className="p-sm border border-outline-variant bg-surface-container-low rounded text-xs font-mono-data">
                          <div className="flex justify-between text-[10px] text-on-surface-variant mb-1">
                            <span className="font-bold text-secondary">{a.id}</span>
                            <span>{a.timestamp}</span>
                          </div>
                          <p className="text-on-surface">{a.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI MONITORING LOGS */}
          {activeTab === 'ai' && (
            <div className="space-y-lg">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                <div className="p-6 rounded-lg border flex flex-col justify-between bg-surface-container-lowest border-outline-variant">
                  <div>
                    <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-4">Autonomous AI Status</h3>

                    <div className="space-y-sm text-xs">
                      <div className="flex justify-between">
                        <span>Weather API Link</span>
                        <span className="text-[#0c9488] font-bold">Connected</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discharge Sensors</span>
                        <span className="text-[#0c9488] font-bold">Connected</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Analysis Scan Interval</span>
                        <span className="text-on-surface-variant">Every 60s</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const newLog: SystemLog = {
                        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
                        workflowName: 'AI Radar Sweep',
                        status: 'success',
                        duration: 320,
                        started: 'Just Now',
                        ended: 'Just Now',
                        message: 'Scanned watershed contours. Outflow rates within limits.'
                      };
                      setLogs(prev => [newLog, ...prev]);
                      triggerToast('AI diagnostic sweep complete.');
                    }}
                    className="w-full py-2 bg-primary text-on-primary hover:bg-slate-800 font-bold text-xs rounded uppercase tracking-wider transition-colors mt-6"
                  >
                    Force AI Sweep Scan
                  </button>
                </div>

                <div className="lg:col-span-2 p-6 rounded-lg border bg-surface-container-lowest border-outline-variant">
                  <h3 className="font-label-caps text-label-caps text-primary uppercase mb-4">AI Analysis Logs Stream</h3>

                  <div className="space-y-xs max-h-[350px] overflow-y-auto pr-sm font-mono-data text-xs text-on-surface">
                    {logs.map(log => (
                      <div key={log.id} className="p-sm border border-outline-variant bg-surface-container-low rounded">
                        <div className="flex justify-between text-[10px] text-on-surface-variant mb-1">
                          <span className="font-bold text-primary">{log.workflowName}</span>
                          <span>{log.started}</span>
                        </div>
                        <p className="leading-normal">{log.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VOLUNTEER DIRECTORY */}
          {activeTab === 'volunteers' && (
            <div className="space-y-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-title-md text-title-md text-primary uppercase">Responder Force Units</h3>
                  <p className="text-xs text-on-surface-variant">View and adjust team statuses.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                {volunteers.map(vol => (
                  <div
                    key={vol.id}
                    className="p-5 rounded-lg border flex flex-col justify-between gap-md bg-surface-container-lowest border-outline-variant"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${vol.availability === 'online' ? 'bg-[#e0f2f1] text-[#0c9488]' : 'bg-surface-container-high text-on-surface-variant'
                            }`}>{vol.availability}</span>
                          <h4 className="font-bold text-sm mt-1.5 text-primary">{vol.name}</h4>
                          <span className="text-[10px] text-on-surface-variant">{vol.skill} Specialization</span>
                        </div>
                        <span className="text-xs font-bold text-amber-500">⭐ {vol.rating}</span>
                      </div>

                      <div className="mt-md text-xs space-y-1 text-on-surface">
                        <div><b>Active Cases:</b> {vol.currentCasesCount} Incidents</div>
                        <div><b>Phone:</b> {vol.phone}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-md border-t border-outline-variant">
                      <button
                        onClick={() => {
                          setVolunteers(prev => prev.map(v => v.id === vol.id ? { ...v, availability: v.availability === 'online' ? 'offline' : 'online' } : v));
                          triggerToast(`Toggled responder status for ${vol.name}`);
                        }}
                        className={`px-3 py-1 rounded text-[10px] font-bold uppercase ${vol.availability === 'online' ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-on-primary hover:bg-slate-800'
                          }`}
                      >
                        Set {vol.availability === 'online' ? 'Offline' : 'Online'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ANALYTICS & REPORTS */}
          {activeTab === 'analytics' && (
            <div className="space-y-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div className="p-6 rounded-lg border bg-surface-container-lowest border-outline-variant">
                  <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-3">Risk Distribution Matrix</h4>

                  <div className="space-y-md">
                    <div>
                      <div className="flex justify-between text-xs mb-1 text-secondary font-bold">
                        <span>Critical Risk (Score &gt; 90)</span>
                        <span>1 Citizen (20%)</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary" style={{ width: '20%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 text-orange-500 font-bold">
                        <span>High Risk (Score 70-90)</span>
                        <span>2 Citizens (40%)</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: '40%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 text-on-surface-variant font-bold">
                        <span>Moderate Risk (Score 30-70)</span>
                        <span>1 Citizen (20%)</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0c9488]" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-lg border flex flex-col justify-between bg-surface-container-lowest border-outline-variant">
                  <div>
                    <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-4">Response Performance KPIs</h4>

                    <div className="grid grid-cols-2 gap-md">
                      <div className="p-md bg-surface-container-low border border-outline-variant rounded text-on-surface">
                        <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Average Dispatch</span>
                        <span className="text-2xl font-black text-primary">04:22</span>
                        <span className="text-[9px] text-on-surface-variant block">Target: &lt; 05:00</span>
                      </div>

                      <div className="p-md bg-surface-container-low border border-outline-variant rounded text-on-surface">
                        <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Volunteer ETA</span>
                        <span className="text-2xl font-black text-secondary">11:15</span>
                        <span className="text-[9px] text-on-surface-variant block">Target: &lt; 15:00</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExport('Response KPIs')}
                    className="w-full py-2 bg-primary text-on-primary hover:bg-slate-800 font-bold text-xs rounded uppercase tracking-wider mt-6"
                  >
                    Generate Report Dossier
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-lg">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                <div className="p-6 rounded-lg border space-y-md bg-surface-container-lowest border-outline-variant">
                  <h3 className="font-label-caps text-label-caps text-secondary uppercase">
                    AI Risk Trigger Weights
                  </h3>

                  <div className="space-y-sm text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>River Gauge Weight Percentage</span>
                        <span>40%</span>
                      </div>
                      <input type="range" className="w-full accent-secondary" defaultValue="40" />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Rainfall Gauge Weight</span>
                        <span>30%</span>
                      </div>
                      <input type="range" className="w-full accent-secondary" defaultValue="30" />
                    </div>
                  </div>

                  <button
                    onClick={() => triggerToast('AI Trigger settings saved.')}
                    className="bg-primary hover:bg-slate-800 px-md py-sm rounded text-xs font-bold text-white shadow-sm transition-all"
                  >
                    Update Weights
                  </button>
                </div>

                <div className="p-6 rounded-lg border space-y-md bg-surface-container-lowest border-outline-variant">
                  <h3 className="font-label-caps text-label-caps text-primary uppercase">
                    Third-Party Gateway Settings
                  </h3>

                  <div className="space-y-sm">
                    <div>
                      <label className="text-[10px] font-bold block mb-1">Meteorology Webhook Endpoint</label>
                      <input
                        type="text"
                        defaultValue="https://api.weatherlink.gov/v2/grid/sector-7g"
                        className="w-full px-3 py-2 text-xs rounded border border-outline-variant bg-surface text-on-surface focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => triggerToast('Gateway webhook saved.')}
                    className="bg-primary hover:bg-slate-800 px-md py-sm rounded text-xs font-bold text-white shadow-sm transition-all"
                  >
                    Save API Links
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Selected Case Side Drawer Overlay */}
        {selectedCase && (
          <div className="fixed inset-0 z-[9999] bg-black/40 flex justify-end">
            <div className="w-full max-w-[576px] bg-surface border-l border-outline-variant h-full p-6 overflow-y-auto space-y-md flex flex-col justify-between text-xs">

              <div className="space-y-md">
                <div className="flex justify-between items-center border-b border-outline-variant pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#ffdad6] text-[#93000b] text-[9px] font-bold rounded">
                        {selectedCase.priority.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-mono-data">#{selectedCase.id}</span>
                    </div>
                    <h3 className="text-base font-black text-primary mt-1">Citizen: {selectedCase.citizenName}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedCaseId(null)}
                    className="p-1 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-primary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-md">
                  <div className="p-3 bg-surface-container-low border border-outline-variant rounded">
                    <span className="text-[9px] text-on-surface-variant uppercase block font-bold">Contact Address</span>
                    <span className="text-on-surface mt-1 block">{selectedCase.location}</span>
                  </div>

                  <div className="p-3 bg-surface-container-low border border-outline-variant rounded">
                    <span className="text-[9px] text-on-surface-variant uppercase block font-bold">Latest Response</span>
                    <span className="text-on-surface mt-1 block italic">"{selectedCase.latestResponse}"</span>
                  </div>
                </div>

                {/* mini Map view */}
                <div className="h-44 w-full rounded border border-outline-variant overflow-hidden">
                  <LeafletMap
                    center={[selectedCase.lat, selectedCase.lng]}
                    zoom={15}
                    shelters={[]}
                    volunteers={[]}
                    cases={[selectedCase]}
                    citizens={[]}
                    selectedCase={selectedCase}
                    filterType="case"
                    showWeatherOverlay={false}
                  // darkMode={false}
                  />
                </div>

                {/* Dispatch dropdowns */}
                <div className="p-4 bg-surface-container-low border border-outline-variant rounded space-y-3">
                  <h4 className="font-bold text-secondary uppercase tracking-widest text-[9px]">Incident Operations Console</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                    <div>
                      <label className="text-[9px] text-on-surface-variant font-bold block mb-1">Assign Rescue Unit</label>
                      <select
                        value={selectedCase.volunteerId || ''}
                        onChange={e => assignVolunteerToCase(selectedCase.id, e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-outline-variant bg-surface text-on-surface focus:outline-none"
                      >
                        <option value="">Awaiting Allocation</option>
                        {volunteers.filter(v => v.availability === 'online').map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.skill})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end gap-2">
                      <button
                        onClick={() => escalateCasePriority(selectedCase.id)}
                        className="flex-1 py-1.5 border border-secondary/30 hover:border-secondary bg-secondary/10 text-secondary hover:text-white rounded text-[10px] font-bold uppercase transition-all"
                      >
                        Escalate
                      </button>
                      <button
                        onClick={() => updateCaseStatus(selectedCase.id, 'closed')}
                        className="flex-1 py-1.5 border border-[#0d9488]/30 hover:border-[#0d9488] bg-[#0d9488]/10 text-[#0d9488] hover:text-white rounded text-[10px] font-bold uppercase transition-all"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-on-surface-variant uppercase tracking-widest text-[9px]">Timeline activity</h4>
                  <div className="relative pl-6 space-y-2 border-l border-outline-variant">
                    {selectedCase.timeline.map((event, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[29px] top-1 w-2 h-2 rounded-full bg-secondary border border-surface"></span>
                        <div className="font-bold text-on-surface">{event.description}</div>
                        <span className="text-[8px] text-on-surface-variant font-mono-data">{event.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-on-surface-variant uppercase tracking-widest text-[9px]">Case Notes Journal</h4>
                  <div className="space-y-2">
                    {selectedCase.notes.map((note, idx) => (
                      <div key={idx} className="p-2 border border-outline-variant bg-surface-container-low rounded text-on-surface">
                        {note}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add dispatcher note..."
                      value={adminNoteInput}
                      onChange={e => setAdminNoteInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded border border-outline-variant bg-surface text-on-surface focus:outline-none"
                    />
                    <button
                      onClick={() => appendCaseNote(selectedCase.id)}
                      className="bg-primary text-on-primary hover:bg-slate-800 px-3 py-1 rounded font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-outline-variant text-right">
                <button
                  onClick={() => setSelectedCaseId(null)}
                  className="px-4 py-1.5 bg-primary text-on-primary hover:bg-slate-800 rounded font-bold uppercase tracking-wider"
                >
                  Close Dossier
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Footer / System Bar */}
        <footer className="h-8 border-t flex items-center justify-between px-gutter shrink-0 text-[10px] font-mono-data bg-surface-container-lowest border-outline-variant text-on-surface-variant">
          <div className="flex items-center gap-lg">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0d9488] animate-pulse"></span>
              <span className="uppercase">Link Established: Sector 7G Node</span>
            </div>
            <span className="uppercase">Latency: 14ms</span>
          </div>

          <div className="flex items-center gap-md">
            <span className="font-bold uppercase" id="digital-clock">{utcTime}</span>
          </div>
        </footer>

      </main>

    </div>
  );
};

export default AdminPortal;
