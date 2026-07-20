import { useState, useEffect } from 'react';
import { AuthFlow } from './components/AuthFlow';
import { CitizenPortal } from './components/CitizenPortal';
import { AdminPortal } from './components/AdminPortal';
import { useCitizenData } from './hooks/useCitizenData';
import { useAdminData } from './hooks/useAdminData';
import { api } from './api/client';
import {
  initialWeatherData,
  initialAlerts,
  initialCases,
  initialVolunteers,
  initialShelters,
  initialLogs
} from './data/mockData';
import type { Citizen, Alert, Case, Volunteer, Shelter, SystemLog, WeatherData } from './types';

const CitizenPortalWrapper = ({ onLogout, alerts, setAlerts, cases, setCases, shelters, weather, setWeather }: {
  onLogout: () => void;
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  cases: Case[];
  setCases: React.Dispatch<React.SetStateAction<Case[]>>;
  shelters: Shelter[];
  weather: WeatherData;
  setWeather: React.Dispatch<React.SetStateAction<WeatherData>>;
}) => {
  const { citizen, messages, connectionStatus, sendMessage, updateStatus, loading, error } = useCitizenData();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-on-surface">
        <div className="p-8 border border-outline-variant bg-surface-container-lowest rounded-lg flex flex-col items-center gap-4 shadow-lg">
          <span className="w-12 h-12 rounded-full border-4 border-t-primary border-outline-variant animate-spin"></span>
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest animate-pulse">Syncing Citizen Telemetry...</span>
        </div>
      </div>
    );
  }

  if (error || !citizen) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-on-surface p-6">
        <div className="p-8 border border-error/30 bg-surface-container-lowest rounded-lg flex flex-col items-center gap-4 text-center max-w-[384px] shadow-lg">
          <span className="text-error font-bold text-lg">⚠️ Connection Error</span>
          <p className="text-xs text-on-surface-variant">{error || 'Session expired or profile not found.'}</p>
          <button 
            onClick={onLogout} 
            className="w-full py-2.5 bg-primary hover:bg-slate-800 text-on-primary font-bold text-xs rounded transition-all"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Map to legacy citizen
  let statusStr: 'Safe' | 'Moderate' | 'High' | 'Critical' = 'Safe';
  if (citizen.status === 'URGENT') statusStr = 'Critical';
  else if (citizen.status === 'ALERTED') statusStr = 'High';

  const mappedCitizen: Citizen = {
    id: String(citizen.id),
    name: citizen.name,
    riskScore: citizen.risk_score || 0,
    distanceToRiver: citizen.distance_to_river || 0,
    elevation: citizen.elevation || 0,
    rainfall: weather.rainfall,
    predictedFloodLevel: weather.riverLevel - 5.0,
    status: statusStr,
    address: citizen.address || '',
    phone: citizen.phone || '',
    email: '',
    lat: citizen.latitude || 40.7328,
    lng: citizen.longitude || -74.0150,
    medicalNotes: '',
    familyMembers: [],
    preferredComm: 'SMS',
    notificationPrefs: {
      weather: true,
      emergency: true,
      volunteer: true,
      ai: true
    }
  };

  return (
    <CitizenPortal
      citizen={mappedCitizen}
      setCitizen={() => {}}
      alerts={alerts}
      setAlerts={setAlerts}
      cases={cases}
      setCases={setCases}
      shelters={shelters}
      weather={weather}
      setWeather={setWeather}
      onLogout={onLogout}
      chatMessages={messages}
      onSendMessage={sendMessage}
      onUpdateStatus={updateStatus}
      connectionStatus={connectionStatus}
    />
  );
};

const AdminPortalWrapper = ({ onLogout, alerts, setAlerts, cases, setCases, volunteers, setVolunteers, shelters, logs, setLogs, weather, setWeather }: {
  onLogout: () => void;
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
}) => {
  const { 
    citizens, 
    selectedCitizenId, 
    setSelectedCitizenId, 
    messages, 
    messagesLoading, 
    dashboardStats, 
    auditLogs, 
    loading, 
    error, 
    connectionStatus, 
    sendReply, 
    updateCitizenStatus 
  } = useAdminData();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-on-surface">
        <div className="p-8 border border-outline-variant bg-surface-container-lowest rounded-lg flex flex-col items-center gap-4 shadow-lg">
          <span className="w-12 h-12 rounded-full border-4 border-t-secondary border-outline-variant animate-spin"></span>
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest animate-pulse">Syncing Command Center Telemetry...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-on-surface p-6">
        <div className="p-8 border border-error/30 bg-surface-container-lowest rounded-lg flex flex-col items-center gap-4 text-center max-w-[384px] shadow-lg">
          <span className="text-error font-bold text-lg">⚠️ Connection Error</span>
          <p className="text-xs text-on-surface-variant">{error || 'Session expired.'}</p>
          <button 
            onClick={onLogout} 
            className="w-full py-2.5 bg-secondary hover:bg-red-700 text-on-secondary font-bold text-xs rounded transition-all"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Map SupabaseCitizen[] to legacy Citizen[]
  const mappedCitizens: Citizen[] = citizens.map(c => {
    let statusStr: 'Safe' | 'Moderate' | 'High' | 'Critical' = 'Safe';
    if (c.status === 'URGENT') statusStr = 'Critical';
    else if (c.status === 'ALERTED') statusStr = 'High';

    return {
      id: String(c.id),
      name: c.name,
      riskScore: c.risk_score || 0,
      distanceToRiver: c.distance_to_river || 0,
      elevation: c.elevation || 0,
      rainfall: weather.rainfall,
      predictedFloodLevel: weather.riverLevel - 5.0,
      status: statusStr,
      address: c.address || '',
      phone: c.phone || '',
      email: '',
      lat: c.latitude || 40.7328,
      lng: c.longitude || -74.0150,
      medicalNotes: '',
      familyMembers: [],
      preferredComm: 'SMS',
      notificationPrefs: {
        weather: true,
        emergency: true,
        volunteer: true,
        ai: true
      }
    };
  });

  return (
    <AdminPortal
      citizens={mappedCitizens}
      alerts={alerts}
      setAlerts={setAlerts}
      cases={cases}
      setCases={setCases}
      volunteers={volunteers}
      setVolunteers={setVolunteers}
      shelters={shelters}
      logs={logs}
      setLogs={setLogs}
      weather={weather}
      setWeather={setWeather}
      onLogout={onLogout}
      supabaseCitizens={citizens}
      selectedCitizenId={selectedCitizenId}
      setSelectedCitizenId={setSelectedCitizenId}
      chatMessages={messages}
      messagesLoading={messagesLoading}
      dashboardStats={dashboardStats}
      auditLogs={auditLogs}
      connectionStatus={connectionStatus}
      onSendReply={sendReply}
      onUpdateCitizenStatus={updateCitizenStatus}
    />
  );
};

const App = () => {
  // Global States
  const [userRole, setUserRole] = useState<'citizen' | 'admin' | null>(null); // null means Auth screen
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [volunteers, setVolunteers] = useState<Volunteer[]>(initialVolunteers);
  const [shelters] = useState<Shelter[]>(initialShelters);
  const [logs, setLogs] = useState<SystemLog[]>(initialLogs);
  const [weather, setWeather] = useState<WeatherData>(initialWeatherData);

  // Sync Live Weather Station Telemetry from backend webhook endpoint
  useEffect(() => {
    const syncWeather = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://floodguard-backend-2cri.onrender.com';
        const res = await fetch(`${baseUrl}/api/webhook/weather`);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.temp === 'number') {
            setWeather(data);
          }
        }
      } catch (_err) {
        // Silently handle polling fallbacks
      }
    };

    syncWeather();
    const interval = setInterval(syncWeather, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      if (userRole === 'admin') {
        await api.auth.adminLogout();
      } else if (userRole === 'citizen') {
        await api.auth.citizenLogout();
      }
    } catch (err) {
      console.warn('Logout request failed:', err);
    }
    setUserRole(null);
  };

  return (
    <div className="min-h-screen font-sans bg-background text-on-surface">
      
      {/* Main Routing Render */}
      {!userRole ? (
        <AuthFlow 
          onLoginSuccess={(role) => setUserRole(role)} 
        />
      ) : userRole === 'citizen' ? (
        <CitizenPortalWrapper
          onLogout={handleLogout}
          alerts={alerts}
          setAlerts={setAlerts}
          cases={cases}
          setCases={setCases}
          shelters={shelters}
          weather={weather}
          setWeather={setWeather}
        />
      ) : (
        <AdminPortalWrapper
          onLogout={handleLogout}
          alerts={alerts}
          setAlerts={setAlerts}
          cases={cases}
          setCases={setCases}
          volunteers={volunteers}
          setVolunteers={setVolunteers}
          shelters={shelters}
          logs={logs}
          setLogs={setLogs}
          weather={weather}
          setWeather={setWeather}
        />
      )}
    </div>
  );
};

export default App;