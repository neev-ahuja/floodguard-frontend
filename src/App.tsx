import { useState } from 'react';
import { AuthFlow } from './components/AuthFlow';
import { CitizenPortal } from './components/CitizenPortal';
import { AdminPortal } from './components/AdminPortal';
import {
  initialWeatherData,
  initialCitizens,
  initialAlerts,
  initialCases,
  initialVolunteers,
  initialShelters,
  initialLogs
} from './data/mockData';
import type { Citizen, Alert, Case, Volunteer, Shelter, SystemLog, WeatherData } from './types';
import { Eye, ShieldAlert, Users } from 'lucide-react';

const App = () => {
  // Global States
  const [userRole, setUserRole] = useState<'citizen' | 'admin' | null>(null); // null means Auth screen
  const [citizens, setCitizens] = useState<Citizen[]>(initialCitizens);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [volunteers, setVolunteers] = useState<Volunteer[]>(initialVolunteers);
  const [shelters] = useState<Shelter[]>(initialShelters);
  const [logs, setLogs] = useState<SystemLog[]>(initialLogs);
  const [weather, setWeather] = useState<WeatherData>(initialWeatherData);

  // Sync Neev's profile adjustments from CitizenPortal to the global citizens array
  const neevProfile = citizens.find(c => c.id === 'CIT-001') || initialCitizens[0];

  const handleNeevUpdate = (updatedNeev: Citizen | ((prev: Citizen) => Citizen)) => {
    setCitizens(prev =>
      prev.map(c => {
        if (c.id === 'CIT-001') {
          return typeof updatedNeev === 'function' ? updatedNeev(c) : updatedNeev;
        }
        return c;
      })
    );
  };

  return (
    <div className="min-h-screen font-sans bg-background text-on-surface">
      
      {/* Floating Developer Portal Switcher HUD */}
      {userRole && (
        <div className="fixed bottom-4 left-4 z-[99999] bg-[#ffffff] px-3 py-2 rounded-xl border border-outline-variant shadow-2xl flex items-center gap-3">
          <span className="text-[9px] font-black uppercase text-secondary tracking-wider">
            Portal Switcher
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setUserRole('citizen')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                userRole === 'citizen'
                  ? 'bg-primary text-on-primary shadow'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
              }`}
            >
              <Users className="h-3 w-3" />
              <span>Citizen View</span>
            </button>
            <button
              onClick={() => setUserRole('admin')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                userRole === 'admin'
                  ? 'bg-secondary text-on-secondary shadow'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
              }`}
            >
              <ShieldAlert className="h-3 w-3" />
              <span>Command View</span>
            </button>
          </div>
          <button
            onClick={() => setUserRole(null)}
            className="text-[9px] text-on-surface-variant hover:text-primary font-bold uppercase border-l border-outline-variant pl-2 ml-1"
          >
            Lock Screen
          </button>
        </div>
      )}

      {/* Main Routing Render */}
      {!userRole ? (
        <AuthFlow 
          onLoginSuccess={(role) => setUserRole(role)} 
        />
      ) : userRole === 'citizen' ? (
        <CitizenPortal
          citizen={neevProfile}
          setCitizen={handleNeevUpdate}
          alerts={alerts}
          setAlerts={setAlerts}
          cases={cases}
          setCases={setCases}
          shelters={shelters}
          weather={weather}
          onLogout={() => setUserRole(null)}
        />
      ) : (
        <AdminPortal
          citizens={citizens}
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
          onLogout={() => setUserRole(null)}
        />
      )}
    </div>
  );
};

export default App;