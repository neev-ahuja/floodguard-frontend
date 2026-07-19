import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, Lock, User, ArrowRight, AlertTriangle, HelpCircle } from 'lucide-react';
import { api } from '../api/client';

interface AuthFlowProps {
  onLoginSuccess: (role: 'citizen' | 'admin') => void;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onLoginSuccess }) => {
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen');
  const [tokenInput, setTokenInput] = useState('');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState<string | null>(null);

  // Automatically check if there is an active session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const session = await api.auth.getSession();
        if (session.role) {
          onLoginSuccess(session.role);
        }
      } catch (err) {
        console.log('[AuthFlow] No active session found.');
      }
    };
    checkActiveSession();
  }, [onLoginSuccess]);

  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError('Please enter your emergency token or responder link.');
      return;
    }

    setLoading(true);
    setError('');

    // Extract token if they pasted the full URL
    let token = tokenInput.trim();
    try {
      const url = new URL(token);
      const urlToken = url.searchParams.get('token');
      if (urlToken) {
        token = urlToken;
      }
    } catch (_) {
      // Not a valid URL, treat as direct token
    }

    try {
      await api.auth.validateCitizen(token);
      onLoginSuccess('citizen');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your token.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername.trim() || !adminPassword) {
      setError('Please fill in both username and password.');
      return;
    }

    setLoading(true);
    setError('');
    setWarning(null);

    try {
      const res = await api.auth.adminLogin(adminUsername.trim(), adminPassword);
      if (res.warning) {
        setWarning(res.warning);
      }
      onLoginSuccess('admin');
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-gutter overflow-hidden bg-background text-on-surface">
      {/* Background Soft Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-secondary/5 blur-[150px]"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-tertiary-container/5 blur-[150px]"></div>

      {/* Main Card */}
      <div className="w-full max-w-[448px] rounded-lg p-8 z-10 bg-surface-container-lowest border border-outline-variant shadow-lg">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 bg-primary text-on-primary rounded-lg shadow-sm mb-3">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-primary">FLOOD GUARD</h1>
          <p className="text-xs mt-1 font-medium text-on-surface-variant">
            Secure Disaster Management & Crisis Response Portal
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="flex gap-2 p-1 bg-surface-container-low rounded-lg border border-outline-variant mb-6">
          <button
            type="button"
            onClick={() => {
              setRole('citizen');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded transition-all ${
              role === 'citizen'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
            }`}
          >
            Citizen Dashboard
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('admin');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded transition-all ${
              role === 'admin'
                ? 'bg-secondary text-on-secondary shadow-sm'
                : 'text-on-surface-variant hover:text-secondary hover:bg-surface-container-high'
            }`}
          >
            Command Center
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container border border-error/30 rounded-lg flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Warning Alert Box */}
        {warning && (
          <div className="mb-4 p-3 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        {/* Form: Citizen Token Entrance */}
        {role === 'citizen' ? (
          <form onSubmit={handleCitizenSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold block mb-1">Emergency Access Link or Token</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4.5 w-4.5 text-on-surface-variant" />
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste response URL or token..."
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded border border-outline-variant bg-surface text-on-surface focus:border-primary focus:outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div className="p-3 bg-surface-container-low rounded border border-outline-variant text-[11px] text-on-surface-variant leading-relaxed flex gap-2">
              <HelpCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-on-surface">Need access?</span> A personalized emergency link is sent via Brevo notification during active alerts.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-slate-800 text-on-primary rounded font-bold text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Verifying Token...' : 'Enter Secure Citizen Portal'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          /* Form: Dispatcher Login */
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold block mb-1">Dispatcher Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4.5 w-4.5 text-on-surface-variant" />
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded border border-outline-variant bg-surface text-on-surface focus:border-primary focus:outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Access Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-on-surface-variant" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 rounded border border-outline-variant bg-surface text-on-surface focus:border-primary focus:outline-none text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-secondary hover:bg-red-700 text-on-secondary rounded font-bold text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Command Center'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
