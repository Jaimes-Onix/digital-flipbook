import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../src/lib/supabase';
import { Loader2, AlertCircle, BookOpen, Layers, Sparkles, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import FullScreenLoader from './FullScreenLoader';
import BookLoader from './BookLoader';

const SignInBackground: React.FC<{ dark: boolean }> = React.memo(({ dark }) => (
  <div
    id="signin-background"
    style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 0,
      backgroundColor: dark ? '#000000' : '#e8f0ed',
    }}
  >
    <video
      autoPlay
      loop
      muted
      playsInline
      src="https://www.pexels.com/download/video/10922866/"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: dark ? 0.3 : 1,
        pointerEvents: 'none',
      }}
    />
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
  const [showPassword, setShowPassword] = useState(false);
  const [categoryCount, setCategoryCount] = useState(0);

  useEffect(() => {
    supabase.from('book_categories').select('*', { count: 'exact', head: true }).then(({ count, error }) => {
      if (!error && count !== null) setCategoryCount(count);
    });
  }, []);

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
        <div className={`relative w-full max-w-[1400px] h-full max-h-[820px] rounded-[24px] overflow-hidden flex transition-all duration-300 ${dark
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
              @keyframes hoverBook {
                0%, 100% { transform: scale(1.4) perspective(1200px) rotateX(25deg) rotateY(-8deg) rotateZ(-2deg) translateY(-80px); }
                50% { transform: scale(1.45) perspective(1200px) rotateX(30deg) rotateY(-5deg) rotateZ(0deg) translateY(-100px); }
              }
              @keyframes pageFlip {
                0% { transform: rotateY(10deg) translateZ(2px); opacity: 0; filter: brightness(1) drop-shadow(-5px 0 10px rgba(0,0,0,0)); }
                8% { transform: rotateY(10deg) translateZ(2px); opacity: 1; filter: brightness(1) drop-shadow(-5px 0 10px rgba(0,0,0,0.1)); }
                32% { transform: rotateY(10deg) translateZ(2px); opacity: 1; filter: brightness(1) drop-shadow(-5px 0 10px rgba(0,0,0,0.1)); }
                42% { opacity: 1; filter: brightness(1.2) drop-shadow(10px 0 20px rgba(0,0,0,0.2)); }
                56%, 100% { transform: rotateY(-190deg) translateZ(3px); opacity: 0; filter: brightness(1) drop-shadow(0 0 0 rgba(0,0,0,0)); }
              }
              @keyframes spineGlow {
                0%, 100% { opacity: 0.6; filter: blur(6px); transform: scaleY(0.9) translateZ(1px); box-shadow: 0 0 10px rgba(52,211,153,0.3); }
                50% { opacity: 1; filter: blur(10px); transform: scaleY(1.05) translateZ(1px); box-shadow: 0 0 30px rgba(52,211,153,0.8); }
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
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="relative"
                style={{
                  width: '420px', height: '300px',
                  transformStyle: 'preserve-3d',
                  animation: 'hoverBook 8s ease-in-out infinite'
                }}
              >
                {/* Book Shadow / Glow Underneath */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[320px] rounded-[30px]"
                  style={{
                    background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.2) 0%, transparent 70%)',
                    filter: 'blur(30px)',
                    transform: 'translateZ(-20px) rotateX(20deg)',
                  }} />

                {/* Left Cover (Base) */}
                <div className="absolute right-1/2 top-0 bottom-0 w-[200px] rounded-l-2xl rounded-r-md overflow-hidden bg-[#021f15]"
                  style={{
                    transformOrigin: 'right center',
                    transform: 'rotateY(-12deg) translateZ(-1px)',
                    border: '1.5px solid rgba(16,185,129,0.3)',
                    borderRight: 'none',
                    boxShadow: '-20px 20px 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(16,185,129,0.1)'
                  }}>
                  {/* Subtle texture */}
                  <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA0Ii8+PHBhdGggZD0iTTAgMGg0djRIMG00IDRoNHY0SDRaIiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9Ii4wNCIvPjwvc3ZnPg==')]" />
                </div>

                {/* Right Cover (Base) */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[200px] rounded-r-2xl rounded-l-md overflow-hidden bg-[#021f15]"
                  style={{
                    transformOrigin: 'left center',
                    transform: 'rotateY(12deg) translateZ(-1px)',
                    border: '1.5px solid rgba(16,185,129,0.3)',
                    borderLeft: 'none',
                    boxShadow: '20px 20px 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(16,185,129,0.1)'
                  }}>
                  <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA0Ii8+PHBhdGggZD0iTTAgMGg0djRIMG00IDRoNHY0SDRaIiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9Ii4wNCIvPjwvc3ZnPg==')]" />
                </div>

                {/* Spine */}
                <div className="absolute left-1/2 top-0 bottom-0 w-6 -ml-3 rounded-full"
                  style={{
                    transform: 'translateZ(-2px)',
                    background: 'linear-gradient(to right, rgba(2,31,21,1) 0%, rgba(16,185,129,0.2) 50%, rgba(2,31,21,1) 100%)',
                    borderLeft: '1px solid rgba(16,185,129,0.1)',
                    borderRight: '1px solid rgba(16,185,129,0.1)',
                  }} />

                {/* Center Spine Glow */}
                <div className="absolute left-1/2 top-4 bottom-4 w-1 -ml-[2px] rounded-full"
                  style={{
                    animation: 'spineGlow 4s ease-in-out infinite',
                    background: 'linear-gradient(to bottom, transparent, rgba(52,211,153,0.8), transparent)'
                  }} />

                {/* Static Left Pages Block */}
                <div className="absolute right-1/2 top-2 bottom-2 w-[190px] rounded-l-xl rounded-r-sm overflow-hidden"
                  style={{
                    transformOrigin: 'right center',
                    transform: 'rotateY(-10deg) translateZ(1px)',
                    background: 'linear-gradient(135deg, rgba(6,78,59,0.3) 0%, rgba(2,44,34,0.4) 100%)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: 'inset 0 0 30px rgba(52,211,153,0.05)'
                  }}>
                  {/* Left Content */}
                  <div className="absolute left-6 right-8 top-10 bottom-10 flex flex-col justify-between opacity-30">
                    <div className="space-y-4">
                      <div className="flex gap-2 mb-8 items-center">
                        <div className="w-10 h-10 rounded shadow bg-lime-400/20" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-3 w-5/6 rounded-full bg-emerald-500/60" />
                          <div className="h-2 w-1/2 rounded-full bg-emerald-500/40" />
                        </div>
                      </div>
                      {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-2">
                          <div className="h-2 w-full rounded-full bg-lime-500/30" />
                          <div className="h-2 w-[85%] rounded-full bg-lime-500/30" />
                        </div>
                      ))}
                    </div>
                    <div className="self-end text-[8px] font-mono text-lime-400/50 uppercase tracking-widest px-2">Page 1</div>
                  </div>
                </div>

                {/* Static Right Pages Block */}
                <div className="absolute left-1/2 top-2 bottom-2 w-[190px] rounded-r-xl rounded-l-sm overflow-hidden"
                  style={{
                    transformOrigin: 'left center',
                    transform: 'rotateY(10deg) translateZ(1px)',
                    background: 'linear-gradient(225deg, rgba(6,78,59,0.2) 0%, rgba(2,44,34,0.3) 100%)',
                    border: '1px solid rgba(16,185,129,0.1)',
                    backdropFilter: 'blur(8px)',
                    boxShadow: 'inset 0 0 30px rgba(52,211,153,0.02)'
                  }}>
                  {/* Subtle right pages depth / stacked appearance */}
                  <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />
                  <div className="absolute right-1 top-0 bottom-0 w-[1px] bg-white/5 pointer-events-none" />
                  <div className="absolute right-2 top-0 bottom-0 w-[1px] bg-white/5 pointer-events-none" />

                  {/* Blurred ghost text to show there are underlying pages */}
                  <div className="absolute left-8 right-6 top-10 bottom-10 flex flex-col justify-between opacity-10">
                    <div className="h-4 w-3/4 rounded-full bg-lime-400/80 mb-8" />
                    <div className="space-y-3 flex-1 pt-2">
                      <div className="h-2 w-full rounded-full bg-emerald-400/60" />
                      <div className="h-2 w-full rounded-full bg-emerald-400/60" />
                      <div className="h-2 w-5/6 rounded-full bg-emerald-400/60" />
                    </div>
                  </div>
                </div>

                {/* Flipping Pages */}
                {[0, 1, 2, 3].map(i => (
                  <div key={`flip-${i}`} className="absolute left-1/2 top-2 bottom-2 w-[190px] rounded-r-xl rounded-l-sm overflow-hidden"
                    style={{
                      transformOrigin: 'left center',
                      background: 'rgba(4,60,40,0.5)',
                      backgroundImage: 'linear-gradient(225deg, rgba(52,211,153,0.15) 0%, rgba(6,78,59,0.3) 100%)',
                      border: '1px solid rgba(16,185,129,0.4)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '-10px 5px 20px rgba(0,0,0,0.4), inset 5px 0 15px rgba(255,255,255,0.05)',
                      transformStyle: 'preserve-3d',
                      animation: `pageFlip 14s infinite ease-in-out`,
                      animationDelay: `${i * 3.5}s`,
                      zIndex: 10 - i,
                      // Hide initially so they don't pop brightly on load
                      opacity: 0,
                      transform: 'rotateY(10deg) translateZ(2px)'
                    }}>

                    {/* Front content of flipping page */}
                    <div className="absolute left-8 right-6 top-10 bottom-10 flex flex-col justify-between">
                      <div className="space-y-5 opacity-40">
                        <div className="h-4 w-3/4 rounded-full bg-lime-400/80 mb-8" />
                        <div className="space-y-3">
                          <div className="h-2 w-full rounded-full bg-emerald-400/60" />
                          <div className="h-2 w-full rounded-full bg-emerald-400/60" />
                          <div className="h-2 w-5/6 rounded-full bg-emerald-400/60" />
                          <div className="h-2 w-4/6 rounded-full bg-emerald-400/60" />
                        </div>

                        <div className="flex gap-3 pt-6">
                          <div className="w-1/2 h-[72px] rounded-lg shadow bg-lime-400/10 border border-lime-400/20" />
                          <div className="w-1/2 h-[72px] rounded-lg shadow bg-lime-400/10 border border-lime-400/20" />
                        </div>
                        <div className="flex justify-center mt-4">
                          <div className="h-2 w-1/3 rounded-full bg-emerald-400/30" />
                        </div>
                      </div>
                    </div>

                    {/* Edge highlight on the fly page */}
                    <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-lime-300 to-transparent opacity-60" />
                  </div>
                ))}
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
              { radius: 240, dur: 12, s: 3, delay: 0, pop: 0.5 },
              { radius: 280, dur: 15, s: 2.5, delay: 3, pop: 0.4 },
              { radius: 210, dur: 10, s: 4, delay: 6, pop: 0.35 },
              { radius: 310, dur: 18, s: 2, delay: 1.5, pop: 0.45 },
              { radius: 190, dur: 14, s: 3.5, delay: 8, pop: 0.3 },
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
                  { icon: Layers, label: `${categoryCount} Categories` },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-lime-500/[0.08] border-lime-500/[0.12]">
                    <Icon size={12} className="text-lime-400" />
                    <span className="text-[10px] font-medium tracking-wide text-lime-300/80">{label}</span>
                  </div>
                ))}
              </div>

              <h1 className="text-3xl xl:text-4xl font-extrabold leading-[1.15] tracking-tight mb-3 text-white">
                Lifewood Philippines<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-lime-400 to-teal-400">
                  Digital Flipbook
                </span>
              </h1>
              <p className="text-sm max-w-xs leading-relaxed text-white/30">
                Your immersive library experience. Read, share, and explore beautifully crafted flipbooks.
              </p>
            </div>
          </div>

          {/* ---- Right: Sign-in Form ---- */}
          <div className={`w-full lg:w-[46%] flex flex-col justify-center items-center px-8 sm:px-12 py-10 relative transition-colors duration-300 ${dark ? 'bg-[#0c0c10]' : 'bg-white'
            }`}>

            {/* Dark/Light mode toggle — top right */}
            <button
              onClick={() => setDark(!dark)}
              className={`absolute top-5 right-5 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${dark
                ? 'bg-white/[0.06] hover:bg-white/[0.1] text-zinc-400 hover:text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                }`}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Brand mark — mobile only */}
            <div className="lg:hidden flex items-center gap-3 mb-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-emerald-500/10 border border-lime-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                <BookOpen size={20} className={dark ? 'text-lime-400' : 'text-emerald-600'} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Lifewood Philippines</p>
                <p className={`text-[10px] uppercase tracking-[0.15em] ${dark ? 'text-lime-500/60' : 'text-emerald-600/60'}`}>Digital Flipbook</p>
              </div>
            </div>

            {/* Form */}
            <div className="w-full max-w-[340px] space-y-8">
              <div className="flex justify-center -mb-4">
                <img src="/Digital Logo.png" alt="Digital Logo" className="h-[80px] w-auto drop-shadow-xl" />
              </div>
              <div className={`w-fit py-2.5 px-8 rounded-full flex items-center justify-center mx-auto ${dark ? 'bg-white' : 'bg-white border border-gray-100 shadow-sm'}`}>
                <img src="/Lifewood_Transparent_LOGO.png" alt="Lifewood Logo" className="h-[28px] w-auto" />
              </div>
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
                      className={`block w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-lime-500/30 focus:border-lime-500/30 ${dark
                        ? 'bg-white/[0.04] border border-white/[0.06] text-gray-200 placeholder-zinc-600'
                        : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                        }`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-semibold uppercase tracking-[0.12em] mb-2 ${dark ? 'text-zinc-500' : 'text-gray-500'}`}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className={`block w-full px-4 py-3 pr-11 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-lime-500/30 focus:border-lime-500/30 ${dark
                          ? 'bg-white/[0.04] border border-white/[0.06] text-gray-200 placeholder-zinc-600'
                          : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                          }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${dark ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'}`}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className={`flex items-center gap-2 text-sm p-3 rounded-xl border ${dark ? 'text-red-400 bg-red-400/10 border-red-400/20' : 'text-red-600 bg-red-50 border-red-200'
                    }`}>
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all duration-200 hover:shadow-lime-500/30 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* ========== FULL SCREEN LOADER ========== */}
      {loginStatus !== 'idle' && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center transition-colors duration-300 animate-in fade-in duration-500 gap-6"
          style={{ background: dark ? '#000000' : '#e8f0ed' }}
        >
          {/* Top text-based loader */}
          <FullScreenLoader dark={dark} />

          {/* Bottom book animation loader */}
          <div className="scale-75 -mt-6">
            <BookLoader dark={dark} />
          </div>

          <div className="mt-2 text-center animate-pulse opacity-50">
            {loginStatus === 'loading' ? (
              <p className={`text-xs ${dark ? 'text-lime-200' : 'text-emerald-400'} font-medium tracking-[0.2em] uppercase`}>Authenticating...</p>
            ) : (
              <p className={`text-xs ${dark ? 'text-lime-200' : 'text-emerald-400'} font-medium tracking-[0.2em] uppercase`}>Login Successful</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
