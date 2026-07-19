import React, { useState } from 'react';
import { Shield, Mail, Lock, User, ArrowRight, Phone, RefreshCw, KeyRound, AlertTriangle } from 'lucide-react';

interface AuthFlowProps {
  onLoginSuccess: (role: 'citizen' | 'admin') => void;
}

type AuthScreen = 'login' | 'signup' | 'forgot' | 'otp';

export const AuthFlow: React.FC<AuthFlowProps> = ({ onLoginSuccess }) => {
  const [screen, setScreen] = useState<AuthScreen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [roleSelection, setRoleSelection] = useState<'citizen' | 'admin'>('citizen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(roleSelection);
    }, 1200);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      setScreen('otp');
    }, 1000);
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      setScreen('otp');
    }, 1000);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.some(v => !v)) {
      setError('Please complete the 4-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(roleSelection);
    }, 1200);
  };

  const handleOtpChange = (val: string, index: number) => {
    if (isNaN(Number(val))) return;
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const triggerQuickLogin = (role: 'citizen' | 'admin') => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(role);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-gutter overflow-hidden bg-background text-on-surface">
      {/* Background Soft Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-secondary/5 blur-[150px]"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-tertiary-container/5 blur-[150px]"></div>

      {/* Main Container Wrapper */}
      <div className="w-full max-w-[448px] rounded-lg p-8 z-10 bg-surface-container-lowest border border-outline-variant shadow-lg">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 bg-primary text-on-primary rounded-lg shadow-sm mb-3">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="font-headline-lg text-headline-lg font-black tracking-tight text-primary">FLOOD GUARD</h1>
          <p className="text-xs mt-1 font-medium text-on-surface-variant">
            AI-Powered Risk Monitor & Emergency Dispatch
          </p>
        </div>

        {/* Quick Demo Credentials Presets */}
        {screen === 'login' && (
          <div className="p-md rounded-lg border border-outline-variant bg-surface-container-low mb-6 text-xs">
            <span className="font-label-caps text-label-caps block text-secondary mb-2">
              Quick Portal Simulator
            </span>
            <div className="grid grid-cols-2 gap-sm">
              <button
                onClick={() => triggerQuickLogin('citizen')}
                className="py-2 px-3 rounded bg-primary hover:bg-slate-800 text-on-primary font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Citizen Portal</span>
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                onClick={() => triggerQuickLogin('admin')}
                className="py-2 px-3 rounded bg-secondary hover:bg-red-700 text-on-secondary font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Command Center</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="text-[10px] text-center text-on-surface-variant mt-2 font-mono-data">
              One-click simulation bypasses form verification.
            </div>
          </div>
        )}

        {/* Error Alert box */}
        {error && (
          <div className="mb-4 p-3 bg-error-container text-on-error-container border border-error/30 rounded-lg flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Screen: Login */}
        {screen === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex gap-2 p-1 bg-surface-container-low rounded border border-outline-variant">
              <button
                type="button"
                onClick={() => setRoleSelection('citizen')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                  roleSelection === 'citizen'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => setRoleSelection('admin')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                  roleSelection === 'admin'
                    ? 'bg-secondary text-on-secondary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                Dispatcher / Responder
              </button>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-on-surface-variant" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@agency.gov"
                  className="w-full pl-10 pr-4 py-2.5 rounded border border-outline-variant bg-surface text-on-surface focus:border-primary focus:outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold block">Password</label>
                <button
                  type="button"
                  onClick={() => setScreen('forgot')}
                  className="text-xs text-secondary hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-on-surface-variant" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded border border-outline-variant bg-surface text-on-surface focus:border-primary focus:outline-none text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded text-on-primary font-bold text-sm shadow transition-all flex items-center justify-center gap-2 ${
                roleSelection === 'admin'
                  ? 'bg-secondary hover:bg-red-700'
                  : 'bg-primary hover:bg-slate-800'
              } disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center text-xs mt-4">
              <span className="text-on-surface-variant">Don't have an account? </span>
              <button
                type="button"
                onClick={() => setScreen('signup')}
                className="text-secondary hover:underline font-semibold"
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* Screen: Signup */}
        {screen === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-xs font-bold block mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4.5 w-4.5 text-on-surface-variant" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Neev Sharma"
                  className="w-full pl-10 pr-4 py-2.5 rounded border border-outline-variant bg-surface text-on-surface focus:border-primary focus:outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-on-surface-variant" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="neev.sharma@floodguard.gov"
                  className="w-full pl-10 pr-4 py-2.5 rounded border border-outline-variant bg-surface text-on-surface focus:border-primary focus:outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Phone Number (For Alerts)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4.5 w-4.5 text-on-surface-variant" />
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full pl-10 pr-4 py-2.5 rounded border border-outline-variant bg-surface text-on-surface focus:border-primary focus:outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-on-surface-variant" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded border border-outline-variant bg-surface text-on-surface focus:border-primary focus:outline-none text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-slate-800 text-on-primary rounded font-bold text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Generating Verification...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center text-xs mt-4">
              <span className="text-on-surface-variant">Already have an account? </span>
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="text-secondary hover:underline font-semibold"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* Screen: Forgot Password */}
        {screen === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="text-center mb-2">
              <KeyRound className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-xs text-on-surface-variant">
                Enter your email address and we'll send a 4-digit code to verify your phone/email.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-on-surface-variant" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@agency.gov"
                  className="w-full pl-10 pr-4 py-2.5 rounded border border-outline-variant bg-surface text-on-surface focus:border-primary focus:outline-none text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-slate-800 text-on-primary rounded font-bold text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Requesting Token...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center text-xs mt-4">
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="text-secondary hover:underline font-semibold"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Screen: OTP Verification */}
        {screen === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="text-center">
              <p className="text-xs text-on-surface-variant">
                A 4-digit verification code has been dispatched. Enter the security token to complete sign-in.
              </p>
            </div>

            <div className="flex justify-center gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(e.target.value, i)}
                  className="w-12 h-12 text-center text-xl font-bold rounded border border-outline-variant bg-surface text-on-surface focus:outline-none focus:border-primary transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-slate-800 text-on-primary rounded font-bold text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Authenticating Session...</span>
                </>
              ) : (
                <>
                  <span>Verify and Proceed</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center text-xs">
              <span className="text-on-surface-variant">Didn't receive code? </span>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setOtp(['', '', '', '']);
                }}
                className="text-secondary hover:underline font-semibold"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default AuthFlow;
