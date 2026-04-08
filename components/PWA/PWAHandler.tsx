import React, { useState, useEffect, useRef } from 'react';
import ReloadPrompt from './ReloadPrompt';

const STORAGE_KEY = 'pwa-install-dismissed-v3';

const PWAHandler: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [show, setShow] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [installing, setInstalling] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const ua = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(ua);
        const android = /android/.test(ua);
        const isMobile = ios || android;

        // Already running as installed PWA — skip
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isStandalone || !isMobile) return;

        const dismissed = sessionStorage.getItem(STORAGE_KEY);
        if (dismissed) return;

        setIsIOS(ios);

        // Catch native Android install prompt (only fires on HTTPS)
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler as any);

        // Always show banner after 2s on any mobile device (HTTP or HTTPS)
        timerRef.current = setTimeout(() => {
            setShow(true);
        }, 2000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler as any);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        setInstalling(true);
        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShow(false);
            }
        } finally {
            setInstalling(false);
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShow(false);
        sessionStorage.setItem(STORAGE_KEY, 'true');
    };

    if (!show) return <ReloadPrompt />;

    return (
        <>
            <ReloadPrompt />

            {/* Backdrop */}
            <div
                onClick={handleDismiss}
                style={{
                    position: 'fixed', inset: 0, zIndex: 9998,
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(3px)',
                    WebkitBackdropFilter: 'blur(3px)',
                }}
            />

            {/* Banner slides up from bottom */}
            <div
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    zIndex: 9999, padding: '0 16px 24px',
                    animation: 'pwaBannerUp 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
                }}
            >
                <style>{`
                    @keyframes pwaBannerUp {
                        from { transform: translateY(110%); opacity: 0; }
                        to   { transform: translateY(0);    opacity: 1; }
                    }
                    @keyframes iconPop {
                        0%   { transform: scale(0.7); opacity: 0; }
                        70%  { transform: scale(1.12); }
                        100% { transform: scale(1);   opacity: 1; }
                    }
                    .pwa-install-btn:active { transform: scale(0.96); }
                `}</style>

                <div style={{
                    background: 'rgba(12, 12, 16, 0.96)',
                    backdropFilter: 'blur(32px)',
                    WebkitBackdropFilter: 'blur(32px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 24,
                    padding: '20px 18px',
                    boxShadow: '0 -12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
                }}>

                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                        <img
                            src="/digital-logo.png"
                            alt="LifeBook"
                            style={{
                                width: 52, height: 52, borderRadius: 14,
                                border: '1.5px solid rgba(255,255,255,0.12)',
                                objectFit: 'contain',
                                background: 'rgba(255,255,255,0.05)',
                                animation: 'iconPop 0.5s 0.3s cubic-bezier(0.16,1,0.3,1) both',
                                flexShrink: 0,
                            }}
                        />
                        <div style={{ flex: 1 }}>
                            <p style={{ color: '#f4f4f5', fontWeight: 700, fontSize: 16, margin: 0 }}>
                                Install LifeBook
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0', lineHeight: 1.4 }}>
                                Add to your Home Screen for the best experience
                            </p>
                        </div>
                        <button
                            onClick={handleDismiss}
                            style={{
                                width: 30, height: 30, borderRadius: 10,
                                background: 'rgba(255,255,255,0.07)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: 18, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, padding: 0,
                            }}
                        >×</button>
                    </div>

                    {/* iOS — manual instructions */}
                    {isIOS ? (
                        <div style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 16, padding: '14px 16px',
                            display: 'flex', flexDirection: 'column', gap: 10,
                        }}>
                            {[
                                { step: '1', icon: '⬆️', text: <>Tap the <span style={{ color: '#60a5fa', fontWeight: 700 }}>Share</span> button in Safari's toolbar</> },
                                { step: '2', icon: '📋', text: <>Scroll and tap <span style={{ color: '#ccff00', fontWeight: 700 }}>"Add to Home Screen"</span></> },
                                { step: '3', icon: '✅', text: <>Tap <span style={{ color: '#ccff00', fontWeight: 700 }}>"Add"</span> to install</> },
                            ].map(({ step, icon, text }) => (
                                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: 8,
                                        background: 'rgba(204,255,0,0.1)',
                                        border: '1px solid rgba(204,255,0,0.2)',
                                        color: '#ccff00', fontWeight: 800, fontSize: 12,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>{step}</div>
                                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{icon} {text}</span>
                                </div>
                            ))}
                        </div>
                    ) : deferredPrompt ? (
                        /* Android — native install available */
                        <button
                            className="pwa-install-btn"
                            onClick={handleInstall}
                            disabled={installing}
                            style={{
                                width: '100%', padding: '14px',
                                borderRadius: 16, border: 'none',
                                background: installing ? 'rgba(204,255,0,0.5)' : '#ccff00',
                                color: '#0a0a0a', fontWeight: 800, fontSize: 15,
                                cursor: installing ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                transition: 'transform 0.15s, background 0.2s',
                                boxShadow: '0 4px 24px rgba(204,255,0,0.25)',
                            }}
                        >
                            {!installing && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                            )}
                            {installing ? 'Installing…' : 'Add to Home Screen'}
                        </button>
                    ) : (
                        /* Android on HTTP — manual instructions */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 16, padding: '14px 16px',
                                display: 'flex', flexDirection: 'column', gap: 10,
                            }}>
                                {[
                                    { step: '1', icon: '⋮', text: <>Tap the <span style={{ color: '#60a5fa', fontWeight: 700 }}>3-dot menu</span> (⋮) in Chrome's top-right corner</> },
                                    { step: '2', icon: '📲', text: <>Tap <span style={{ color: '#ccff00', fontWeight: 700 }}>"Add to Home screen"</span> or <span style={{ color: '#ccff00', fontWeight: 700 }}>"Install app"</span></> },
                                    { step: '3', icon: '✅', text: <>Tap <span style={{ color: '#ccff00', fontWeight: 700 }}>"Add"</span> to install</> },
                                ].map(({ step, icon, text }) => (
                                    <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: 8,
                                            background: 'rgba(204,255,0,0.1)',
                                            border: '1px solid rgba(204,255,0,0.2)',
                                            color: '#ccff00', fontWeight: 800, fontSize: 12,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>{step}</div>
                                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{icon} {text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dismiss button */}
                    <button
                        onClick={handleDismiss}
                        style={{
                            width: '100%', marginTop: 10, padding: '11px',
                            borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                            background: 'transparent',
                            color: 'rgba(255,255,255,0.3)', fontSize: 13,
                            fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </>
    );
};

export default PWAHandler;
