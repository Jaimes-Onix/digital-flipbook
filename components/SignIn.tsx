import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../src/lib/supabase';
import { Loader2, AlertCircle, BookOpen, Layers, Sparkles, Moon, Sun, CheckCircle2 } from 'lucide-react';
import Galaxy from './Galaxy';

const DarkGalaxy = React.memo(() => (
  <Galaxy
    mouseRepulsion
    mouseInteraction
    density={1}
    glowIntensity={0.3}
    saturation={0}
    hueShift={140}
    twinkleIntensity={0.3}
    rotationSpeed={0.1}
    repulsionStrength={2}
    autoCenterRepulsion={0}
    starSpeed={0.5}
    speed={1}
    transparent={false}
  />
));

const LightGalaxy = React.memo(() => (
  <Galaxy
    mouseRepulsion
    mouseInteraction
    density={0.8}
    glowIntensity={0.15}
    saturation={0.3}
    hueShift={140}
    twinkleIntensity={0.2}
    rotationSpeed={0.05}
    repulsionStrength={2}
    autoCenterRepulsion={0}
    starSpeed={0.3}
    speed={0.7}
    transparent={true}
  />
));

const SignInBackground: React.FC<{ dark: boolean }> = React.memo(({ dark }) => (
  <div
    id="signin-background"
    style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      background: dark ? '#000000' : '#e8f0ed',
    }}
  >
    {dark ? <DarkGalaxy /> : <LightGalaxy />}
  </div>
));

/* ─────────────────────────────────────────────
   LAYER 2 — FLOATING CARD
   The sign-in card. Completely independent from the background.
   ───────────────────────────────────────────── */
const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dark, setDark] = useState(true);
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setLoginStatus('loading');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setLoginStatus('success');
      setTimeout(() => {
        navigate('/library');
      }, 1500);
    } catch (err: any) {
      setLoginStatus('idle');
      if (err.message === 'Invalid login credentials') {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden">

      {/* ========== BACKGROUND — edit SignInBackground above ========== */}
      <SignInBackground dark={dark} />

      {/* ========== FLOATING CARD — sits on top of background ========== */}
      <div className="relative z-10 h-full w-full flex items-center justify-center p-3 sm:p-5 lg:p-8">
        <div className={`relative w-full max-w-[1400px] h-full max-h-[820px] rounded-[24px] overflow-hidden flex transition-all duration-300 ${
          dark
            ? 'shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8),0_0_40px_rgba(16,185,129,0.05)] border border-white/[0.06]'
            : 'shadow-[0_30px_100px_-20px_rgba(0,0,0,0.12)] border border-gray-200/80'
        }`}>

          {/* ---- Left: Illustration Panel ---- */}
          <div className="hidden lg:flex lg:w-[54%] relative flex-col justify-between overflow-hidden bg-[#0c1a15]">

            {/* Glow orbs */}
            <div className="absolute top-[-8%] left-[-5%] w-[55%] h-[55%] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(6,95,70,0.5) 0%, transparent 65%)', filter: 'blur(50px)' }} />
            <div className="absolute bottom-[-5%] right-[-10%] w-[50%] h-[50%] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.3) 0%, transparent 65%)', filter: 'blur(55px)' }} />
            <div className="absolute top-[30%] right-[10%] w-[35%] h-[35%] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.2) 0%, transparent 65%)', filter: 'blur(40px)' }} />

            {/* Bright core glow */}
            <div className="absolute top-[22%] left-[28%] w-12 h-12 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(52,211,153,0.4) 30%, transparent 70%)',
                filter: 'blur(12px)', opacity: 0.7,
              }} />

            {/* Diagonal light streaks */}
            {[35, 50, 60].map((left, i) => (
              <div key={i} className="absolute top-0 h-[130%] origin-top-left"
                style={{
                  left: `${left}%`, width: `${2 + i}px`,
                  opacity: 0.06 + i * 0.01,
                  transform: `rotate(${22 + i * 4}deg)`,
                  background: `linear-gradient(to bottom, transparent 10%, #6ee7b7 40%, transparent 75%)`,
                }} />
            ))}

            {/* Keyframe animations */}
            <style>{`
              @keyframes bookOpenClose {
                0%, 100% { transform: perspective(600px) rotateY(18deg); }
                50% { transform: perspective(600px) rotateY(35deg); }
              }
              @keyframes bookOpenCloseRight {
                0%, 100% { transform: perspective(600px) rotateY(-18deg); }
                50% { transform: perspective(600px) rotateY(-35deg); }
              }
              @keyframes spineGlow {
                0%, 100% { opacity: 0.6; filter: blur(2px); }
                50% { opacity: 1; filter: blur(4px); }
              }
              @keyframes floatPage {
                0%, 100% { transform: perspective(400px) rotateY(var(--ry)) rotate(var(--rot)) translateY(0px); }
                50% { transform: perspective(400px) rotateY(var(--ry)) rotate(var(--rot)) translateY(-12px); }
              }
              @keyframes particleFloat {
                0% { transform: translate(0, 0) scale(1); opacity: 0; }
                10% { opacity: var(--pop); }
                90% { opacity: var(--pop); }
                100% { transform: translate(var(--dx), var(--dy)) scale(0.3); opacity: 0; }
              }
              @keyframes particleOrbit {
                0% { transform: rotate(0deg) translateX(var(--radius)) rotate(0deg) scale(1); opacity: 0; }
                10% { opacity: var(--pop); }
                90% { opacity: var(--pop); }
                100% { transform: rotate(360deg) translateX(var(--radius)) rotate(-360deg) scale(0.5); opacity: 0; }
              }
            `}</style>

            {/* Animated open book illustration */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative" style={{ width: '420px', height: '340px' }}>
                {/* Left page — breathing open/close */}
                <div className="absolute rounded-l-2xl rounded-r-sm"
                  style={{
                    width: '200px', height: '280px', right: '50%', top: '50%', marginTop: '-140px',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,78,59,0.22) 100%)',
                    border: '1.5px solid rgba(52,211,153,0.15)',
                    boxShadow: '-12px 8px 50px rgba(0,0,0,0.4)',
                    transformOrigin: 'right center',
                    animation: 'bookOpenClose 4s ease-in-out infinite',
                  }} />
                {/* Right page — breathing open/close */}
                <div className="absolute rounded-r-2xl rounded-l-sm"
                  style={{
                    width: '200px', height: '280px', left: '50%', top: '50%', marginTop: '-140px',
                    background: 'linear-gradient(225deg, rgba(16,185,129,0.08) 0%, rgba(6,78,59,0.18) 100%)',
                    border: '1.5px solid rgba(52,211,153,0.1)',
                    boxShadow: '12px 8px 50px rgba(0,0,0,0.4)',
                    transformOrigin: 'left center',
                    animation: 'bookOpenCloseRight 4s ease-in-out infinite',
                  }} />
                {/* Spine glow — pulses with the open/close */}
                <div className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    width: '3px', height: '280px', top: '50%', marginTop: '-140px',
                    background: 'linear-gradient(to bottom, transparent, rgba(52,211,153,0.5), transparent)',
                    animation: 'spineGlow 4s ease-in-out infinite',
                  }} />
                {/* Text lines on left page */}
                <div className="absolute space-y-3" style={{ left: 'calc(50% - 160px)', top: 'calc(50% - 80px)', width: '120px', opacity: 0.25 }}>
                  {[100, 75, 90, 65, 85, 70].map((w, i) => (
                    <div key={i} className="h-[2px] rounded-full bg-emerald-400" style={{ width: `${w}%`, opacity: 0.4 + (i % 3) * 0.15 }} />
                  ))}
                </div>
                {/* Floating flipped pages — gentle bobbing */}
                {[
                  { w: 170, h: 240, l: 30, t: -160, ry: -28, rot: 10, op: 0.35, dur: 5 },
                  { w: 150, h: 210, l: 60, t: -180, ry: -40, rot: 16, op: 0.18, dur: 6.5 },
                  { w: 130, h: 180, l: 85, t: -195, ry: -50, rot: 22, op: 0.1, dur: 8 },
                ].map(({ w, h, l, t, ry, rot, op, dur }, i) => (
                  <div key={i} className="absolute rounded-lg"
                    style={{
                      width: `${w}px`, height: `${h}px`,
                      left: `calc(50% + ${l}px)`, top: `calc(50% + ${t}px)`,
                      opacity: op,
                      background: `linear-gradient(135deg, rgba(16,185,129,${0.06 - i * 0.015}) 0%, rgba(6,78,59,${0.1 - i * 0.03}) 100%)`,
                      border: `1px solid rgba(52,211,153,${0.07 - i * 0.015})`,
                      '--ry': `${ry}deg`, '--rot': `${rot}deg`,
                      animation: `floatPage ${dur}s ease-in-out infinite`,
                      animationDelay: `${i * 0.8}s`,
                    } as React.CSSProperties} />
                ))}
                {/* Center dot glow */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(52,211,153,0.3) 50%, transparent 100%)',
                    filter: 'blur(3px)',
                  }} />
              </div>
            </div>

            {/* Green floating particles */}
            {[
              { t: 15, l: 20, s: 3, dx: '40px', dy: '-80px', dur: 7, delay: 0, pop: 0.6 },
              { t: 25, l: 70, s: 4, dx: '-30px', dy: '-60px', dur: 8, delay: 1.2, pop: 0.5 },
              { t: 45, l: 15, s: 2.5, dx: '60px', dy: '-50px', dur: 6, delay: 0.5, pop: 0.45 },
              { t: 55, l: 75, s: 3.5, dx: '-50px', dy: '-70px', dur: 9, delay: 2, pop: 0.4 },
              { t: 70, l: 30, s: 2, dx: '30px', dy: '-90px', dur: 7.5, delay: 3, pop: 0.5 },
              { t: 35, l: 50, s: 5, dx: '-20px', dy: '-40px', dur: 10, delay: 0.8, pop: 0.35 },
              { t: 60, l: 55, s: 2.5, dx: '45px', dy: '-65px', dur: 6.5, delay: 1.5, pop: 0.55 },
              { t: 80, l: 40, s: 3, dx: '-40px', dy: '-55px', dur: 8.5, delay: 4, pop: 0.4 },
              { t: 20, l: 85, s: 2, dx: '-25px', dy: '-75px', dur: 7, delay: 2.5, pop: 0.5 },
              { t: 50, l: 25, s: 4, dx: '35px', dy: '-45px', dur: 9.5, delay: 0.3, pop: 0.3 },
              { t: 40, l: 60, s: 3, dx: '20px', dy: '-85px', dur: 8, delay: 3.5, pop: 0.45 },
              { t: 75, l: 65, s: 2.5, dx: '-55px', dy: '-60px', dur: 7, delay: 1.8, pop: 0.5 },
            ].map(({ t, l, s, dx, dy, dur, delay, pop }, i) => (
              <div key={`p-${i}`} className="absolute rounded-full"
                style={{
                  top: `${t}%`, left: `${l}%`,
                  width: `${s}px`, height: `${s}px`,
                  background: `radial-gradient(circle, ${i % 3 === 0 ? '#6ee7b7' : i % 3 === 1 ? '#34d399' : '#a7f3d0'} 0%, transparent 70%)`,
                  boxShadow: `0 0 ${s * 2}px ${i % 3 === 0 ? 'rgba(110,231,183,0.4)' : 'rgba(52,211,153,0.3)'}`,
                  '--dx': dx, '--dy': dy, '--pop': pop,
                  animation: `particleFloat ${dur}s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                } as React.CSSProperties}
              />
            ))}

            {/* Orbiting particles around the book */}
            {[
              { radius: 160, dur: 12, s: 3, delay: 0, pop: 0.5 },
              { radius: 180, dur: 15, s: 2.5, delay: 3, pop: 0.4 },
              { radius: 140, dur: 10, s: 4, delay: 6, pop: 0.35 },
              { radius: 200, dur: 18, s: 2, delay: 1.5, pop: 0.45 },
              { radius: 120, dur: 14, s: 3.5, delay: 8, pop: 0.3 },
            ].map(({ radius, dur, s, delay, pop }, i) => (
              <div key={`o-${i}`} className="absolute rounded-full"
                style={{
                  top: '42%', left: '27%',
                  width: `${s}px`, height: `${s}px`,
                  background: i % 2 === 0 ? '#6ee7b7' : '#34d399',
                  boxShadow: `0 0 ${s * 3}px rgba(52,211,153,0.5)`,
                  '--radius': `${radius}px`, '--pop': pop,
                  animation: `particleOrbit ${dur}s linear infinite`,
                  animationDelay: `${delay}s`,
                } as React.CSSProperties}
              />
            ))}

            {/* Bottom content */}
            <div className="relative z-10 p-9 pb-10 mt-auto">
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { icon: BookOpen, label: '3D Flipbook' },
                  { icon: Layers, label: '6 Categories' },
                  { icon: Sparkles, label: 'AI Summaries' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-emerald-500/[0.08] border-emerald-500/[0.12]">
                    <Icon size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-medium tracking-wide text-emerald-300/80">{label}</span>
                  </div>
                ))}
              </div>

              <h1 className="text-3xl xl:text-4xl font-extrabold leading-[1.15] tracking-tight mb-3 text-white">
                Lifewood<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-400">
                  Digital Flipbook
                </span>
              </h1>
              <p className="text-sm max-w-xs leading-relaxed text-white/30">
                Your immersive library experience. Read, share, and explore beautifully crafted flipbooks.
              </p>
            </div>
          </div>

          {/* ---- Right: Sign-in Form ---- */}
          <div className={`w-full lg:w-[46%] flex flex-col justify-center items-center px-8 sm:px-12 py-10 relative transition-colors duration-300 ${
            dark ? 'bg-[#0c0c10]' : 'bg-white'
          }`}>

            {/* Dark/Light mode toggle — top right */}
            <button
              onClick={() => setDark(!dark)}
              className={`absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                dark
                  ? 'bg-white/[0.06] hover:bg-white/[0.1] text-zinc-400 hover:text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700'
              }`}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Brand mark — mobile only */}
            <div className="lg:hidden flex items-center gap-3 mb-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                <BookOpen size={20} className={dark ? 'text-emerald-400' : 'text-emerald-600'} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Lifewood Philippines</p>
                <p className={`text-[10px] uppercase tracking-[0.15em] ${dark ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>Digital Flipbook</p>
              </div>
            </div>

            {/* Form */}
            <div className="w-full max-w-[340px] space-y-7">
              <div>
                <h2 className={`text-[28px] font-extrabold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>Sign In</h2>
                <p className={`text-[13px] mt-1.5 ${dark ? 'text-zinc-500' : 'text-gray-500'}`}>Enter your credentials to continue</p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-4">
                  <div>
                    <label className={`block text-[10px] font-semibold uppercase tracking-[0.12em] mb-2 ${dark ? 'text-zinc-500' : 'text-gray-500'}`}>Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@lifewood.com"
                      className={`block w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 ${
                        dark
                          ? 'bg-white/[0.04] border border-white/[0.06] text-gray-200 placeholder-zinc-600'
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-semibold uppercase tracking-[0.12em] mb-2 ${dark ? 'text-zinc-500' : 'text-gray-500'}`}>Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={`block w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 ${
                        dark
                          ? 'bg-white/[0.04] border border-white/[0.06] text-gray-200 placeholder-zinc-600'
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                      }`}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className={`flex items-center gap-2 text-sm p-3 rounded-xl border ${
                    dark ? 'text-red-400 bg-red-400/10 border-red-400/20' : 'text-red-600 bg-red-50 border-red-200'
                  }`}>
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all duration-200 hover:shadow-emerald-500/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)' }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      Signing in...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>

                <p className={`text-center text-[11px] pt-3 ${dark ? 'text-zinc-600' : 'text-gray-400'}`}>
                  Contact your administrator for access.
                </p>
              </form>
            </div>

            {/* Copyright */}
            <div className={`absolute bottom-5 inset-x-0 text-center text-[9px] uppercase tracking-[0.15em] ${dark ? 'text-zinc-700' : 'text-gray-400'}`}>
              &copy; 2026 Lifewood Philippines
            </div>
          </div>
        </div>
      </div>

      {/* ========== LOGIN STATUS MODAL ========== */}
      {loginStatus !== 'idle' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 backdrop-blur-md bg-black/50" />
          <div className="relative bg-[#111418]/95 backdrop-blur-3xl rounded-[28px] shadow-2xl border border-white/[0.06] shadow-black/60 w-full max-w-xs p-8 animate-in zoom-in-95 fade-in duration-200">
            <div className="flex flex-col items-center text-center">
              {loginStatus === 'loading' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-5">
                    <Loader2 size={30} className="animate-spin text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1.5">Signing you in...</h3>
                  <p className="text-sm text-zinc-500">Please wait a moment</p>
                </>
              ) : (
                <>
                  <div className="relative mb-5">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <CheckCircle2 size={32} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1.5">Login Successful!</h3>
                  <p className="text-sm text-zinc-500">Redirecting to your library...</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
