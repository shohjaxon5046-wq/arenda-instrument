import React, { useState, useEffect } from 'react';
import { Wrench, Lock, User, Eye, EyeOff, ShieldAlert, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Rate limiting / brute-force protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;

    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = login(username, password);
      if (!result.success) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= 5) {
          setLockoutRemaining(30);
          setErrorMessage('Xavfsizlik: 5 marta xato kiritildi! Tizim 30 soniyaga bloklandi.');
        } else {
          setErrorMessage(result.error || 'Login yoki parol xato! Faqat ruxsatli shaxs kira oladi.');
        }
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber-500 selection:text-black">
      
      {/* Background accents */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 text-stone-950 shadow-xl shadow-amber-500/20 mb-4 ring-4 ring-amber-500/20">
            <Wrench className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
            Arenda <span className="text-amber-400">Instrument</span>
          </h1>
          <p className="text-xs text-stone-400 mt-1.5 font-medium">
            Ishxona asboblari ijarasi va kassa boshqaruv tizimi
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="flex items-center justify-between border-b border-stone-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Maxfiy Tizimga Kirish</span>
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Faqat shaxsiy administrator kirishi mumkin
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Yopiq
            </span>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-stone-950/80 border border-stone-800 rounded-2xl text-[11px] text-stone-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Ushbu tizim shaxsiy ishxona hisob-kitoblari va asboblarni yuritish uchun mo‘ljallangan. 
              Begona shaxslar ma’lumotlarni ko‘ra olmaydi.
            </span>
          </div>

          {/* Error / Lockout Message */}
          {errorMessage && (
            <div className="p-3 bg-red-950/70 border border-red-800/90 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{errorMessage}</p>
                {lockoutRemaining > 0 && (
                  <p className="text-[11px] text-red-300 mt-1">
                    Qayta urinish: <b>{lockoutRemaining}</b> soniya qoldi
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Username field */}
            <div>
              <label className="block text-stone-300 font-bold mb-1.5" htmlFor="admin-login-username">
                Login
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-login-username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Shaxsiy loginingizni kiriting"
                  disabled={lockoutRemaining > 0}
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-950/90 border border-stone-700 rounded-xl text-white font-semibold text-sm placeholder-stone-600 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-stone-300 font-bold mb-1.5" htmlFor="admin-login-password">
                Parol
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Maxfiy parolingizni kiriting"
                  disabled={lockoutRemaining > 0}
                  className="w-full pl-10 pr-11 py-2.5 bg-stone-950/90 border border-stone-700 rounded-xl text-white font-semibold text-sm placeholder-stone-600 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition disabled:opacity-50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-200 transition cursor-pointer"
                  title={showPassword ? 'Yashirish' : 'Ko‘rsatish'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="admin-login-submit"
              type="submit"
              disabled={isLoading || lockoutRemaining > 0}
              className="w-full mt-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span>Tekshirilmoqda...</span>
              ) : lockoutRemaining > 0 ? (
                <span>Bloklangan ({lockoutRemaining}s)</span>
              ) : (
                <>
                  <span>Kirish</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>

          </form>

        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-stone-600 mt-6">
          © {new Date().getFullYear()} Instrument Arenda • Xavfsiz Shaxsiy Tizim
        </p>

      </div>

    </div>
  );
};
