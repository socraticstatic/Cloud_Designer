import { useState, useEffect, useRef, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
const attGlobe = import.meta.env.BASE_URL + 'brands/att-globe.svg';

export default function MagicLinkLogin() {
  const { authMode, requestCode, verifyCode, signIn } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [shakeError, setShakeError] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => {
      clearTimeout(t);
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(60);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1 && cooldownTimer.current) clearInterval(cooldownTimer.current);
        return Math.max(0, c - 1);
      });
    }, 1000);
  };

  const shake = (message: string) => {
    setError(message);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 600);
  };

  const validate = (value: string): string | null => {
    if (!value.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
    if (!value.toLowerCase().trim().endsWith('@att.com')) return 'Only @att.com email addresses are allowed';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validate(email);
    if (validationError) {
      shake(validationError);
      return;
    }
    if (authMode === 'gate') {
      signIn(email);
      return;
    }
    setBusy(true);
    const result = await requestCode(email);
    setBusy(false);
    if (result.error) {
      shake(result.error);
      return;
    }
    setError('');
    setStep('code');
    startCooldown();
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 6) {
      shake('Enter the 6-digit code from your email');
      return;
    }
    setBusy(true);
    const result = await verifyCode(email, code);
    setBusy(false);
    if (result.error) shake(result.error);
    // Success needs no navigation: the auth listener flips `user` and the
    // root Gate swaps this screen for the app.
  };

  const handleResend = async () => {
    if (cooldown > 0 || busy) return;
    setBusy(true);
    const result = await requestCode(email);
    setBusy(false);
    if (result.error) {
      shake(result.error);
      return;
    }
    setError('');
    startCooldown();
  };

  const inputClasses = `w-full pl-10 h-11 bg-white text-[#1d2329] placeholder:text-[#878c94] rounded-lg border
    transition-all duration-200 outline-none text-sm
    focus:ring-2 focus:ring-[#0057b8] focus:border-[#0057b8] focus:shadow-[0_0_0_3px_rgba(0,87,184,0.1)]
    ${error ? 'border-[#c70032] focus:ring-[#c70032] focus:shadow-[0_0_0_3px_rgba(199,0,50,0.1)]' : 'border-[#686e74]'}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0057b8] via-[#003d82] to-[#001a4d] px-4 overflow-hidden">
      {/* Animated dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
          animation: 'patternDrift 20s linear infinite',
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
        style={{
          background: 'radial-gradient(circle, #009fdb 0%, transparent 70%)',
          animation: 'ambientPulse 6s ease-in-out infinite',
        }}
      />

      <div
        className={`relative w-full max-w-md transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#009fdb] to-transparent opacity-60" />

          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="relative inline-block">
              <img
                src={attGlobe}
                alt="AT&T"
                className="h-16 w-16 mx-auto transition-transform duration-500 hover:scale-110"
                style={{ animation: 'logoFloat 4s ease-in-out infinite' }}
              />
              <div
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: '0 0 20px 4px rgba(0, 159, 219, 0.15)', animation: 'glowPulse 3s ease-in-out infinite' }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1d2329] tracking-[-0.03em]">
                AT&T Cloud Designer
              </h1>
              <p className="text-sm text-[#686e74] mt-1">
                {step === 'email' ? 'Sign in with your AT&T email' : 'Check your email'}
              </p>
            </div>
          </div>

          {step === 'email' ? (
            /* Email form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-medium text-[#686e74] uppercase tracking-wide">
                  Email address
                </label>
                <div className={`relative group ${shakeError ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#878c94] transition-colors duration-200 group-focus-within:text-[#0057b8]"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    placeholder="yourname@att.com"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    className={inputClasses}
                  />
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${error ? 'max-h-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-xs text-[#c70032] mt-1">{error}</p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group/check">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="sr-only peer" />
                  <div className={`w-[18px] h-[18px] rounded border-2 transition-all duration-200 flex items-center justify-center
                    ${agreed ? 'bg-[#0057b8] border-[#0057b8]' : 'border-[#878c94] group-hover/check:border-[#0057b8]'}`}
                  >
                    <svg className={`w-3 h-3 text-white transition-all duration-200 ${agreed ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                      viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2 6 5 9 10 3" />
                    </svg>
                  </div>
                </div>
                <span className="text-xs text-[#686e74] leading-relaxed select-none">
                  I understand that this is a prototype, and that it changes daily, reflecting A/B testing, feature analysis, and customer heuristics. Some features will be broken, incomplete, or not approved for final product releases.
                </span>
              </label>

              <button
                type="submit"
                disabled={!agreed || busy}
                className="w-full h-11 bg-[#0057b8] hover:bg-[#003d82] active:scale-[0.98] text-white font-medium rounded-lg
                  transition-all duration-200 hover:shadow-lg hover:shadow-[#0057b8]/20 group disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 text-sm"
              >
                {busy ? 'Sending…' : 'Enter'}
                <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>
          ) : (
            /* Code form */
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="otp-code" className="block text-xs font-medium text-[#686e74] uppercase tracking-wide">
                  6-digit code
                </label>
                <p className="text-xs text-[#686e74]">
                  We sent a 6-digit code to <span className="font-medium text-[#1d2329]">{email.toLowerCase().trim()}</span>.
                  No email after a minute? Check your junk folder.
                </p>
                <div className={`relative group ${shakeError ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#878c94] transition-colors duration-200 group-focus-within:text-[#0057b8]"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="otp-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    autoFocus
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                    className={`${inputClasses} tracking-[0.5em] font-medium`}
                  />
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${error ? 'max-h-8 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-xs text-[#c70032] mt-1">{error}</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full h-11 bg-[#0057b8] hover:bg-[#003d82] active:scale-[0.98] text-white font-medium rounded-lg
                  transition-all duration-200 hover:shadow-lg hover:shadow-[#0057b8]/20 group disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 text-sm"
              >
                {busy ? 'Verifying…' : 'Verify'}
                <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setCode(''); setError(''); }}
                  className="text-[#0057b8] hover:text-[#003d82] transition-colors duration-200"
                >
                  Use a different email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || busy}
                  className="text-[#0057b8] hover:text-[#003d82] transition-colors duration-200 disabled:text-[#878c94] disabled:cursor-not-allowed"
                >
                  {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className={`text-center text-xs text-white/40 mt-6 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          AT&T Internal Tool · Authorized use only
        </p>
      </div>

      <style>{`
        @keyframes patternDrift { 0% { background-position: 0 0; } 100% { background-position: 40px 40px; } }
        @keyframes ambientPulse { 0%, 100% { transform: scale(1); opacity: 0.15; } 50% { transform: scale(1.1); opacity: 0.25; } }
        @keyframes logoFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes glowPulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-6px); }
          30% { transform: translateX(5px); }
          45% { transform: translateX(-4px); }
          60% { transform: translateX(3px); }
          75% { transform: translateX(-2px); }
        }
      `}</style>
    </div>
  );
}
