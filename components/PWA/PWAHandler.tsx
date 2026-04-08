import React, { useState, useEffect } from 'react';
import ReloadPrompt from './ReloadPrompt';
import { Download, X, Share, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAHandler: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        // Device detection
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        const android = /android/.test(userAgent);
        setIsIOS(ios);
        setIsAndroid(android);

        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            
            // Show the banner if not dismissed
            const isDismissed = sessionStorage.getItem('pwa-install-dismissed');
            if (!isDismissed) {
                setShowInstallBanner(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Fallback for iOS or mobile devices where beforeinstallprompt doesn't fire
        // Show after 3 seconds if on mobile and not dismissed
        const timer = setTimeout(() => {
            const isDismissed = sessionStorage.getItem('pwa-install-dismissed');
            if (!isDismissed && (ios || android) && !deferredPrompt) {
                setShowInstallBanner(true);
            }
        }, 3000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            clearTimeout(timer);
        };
    }, [deferredPrompt]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            // Show the native prompt
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);
            setDeferredPrompt(null);
            setShowInstallBanner(false);
        } else if (isIOS) {
            // iOS manual instructions are shown in the UI
        } else {
            // Android manual instructions fallback
            alert("To install: Tap the three dots (⋮) in Chrome and select 'Install app' or 'Add to Home screen'.");
        }
    };

    const handleDismiss = () => {
        setShowInstallBanner(false);
        sessionStorage.setItem('pwa-install-dismissed', 'true');
    };

    return (
        <>
            <ReloadPrompt />
            
            <AnimatePresence>
                {showInstallBanner && (
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md">
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="glass-card p-5 shadow-2xl flex flex-col gap-4 border border-white/10 overflow-hidden relative"
                        >
                            {/* Decorative background glow */}
                            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#ccff00]/10 blur-[40px] rounded-full" />
                            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#ccff00]/10 blur-[40px] rounded-full" />

                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                                        <img src="/digital-logo.png" alt="App Icon" className="w-8 h-8 object-contain" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-bold text-white leading-tight">Install LifeBook</h3>
                                        <p className="text-xs text-white/50 leading-relaxed mt-0.5">
                                            {isIOS 
                                                ? "Run LifeBook as a standalone app." 
                                                : "Get the best experience by installing our app."}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleDismiss}
                                    className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {isIOS ? (
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-2">
                                    <p className="text-[11px] text-white/70 flex items-center gap-2">
                                        1. Tap the <Share size={14} className="text-blue-400" /> Share button below
                                    </p>
                                    <p className="text-[11px] text-white/70">
                                        2. Scroll down and tap "Add to Home Screen"
                                    </p>
                                </div>
                            ) : deferredPrompt ? (
                                <button
                                    onClick={handleInstall}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ccff00] text-black rounded-xl text-xs font-bold hover:bg-[#b8e600] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Install App Now
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                        <p className="text-[11px] text-white/70 flex items-center flex-wrap gap-x-1.5 leading-relaxed">
                                            Tap the <MoreVertical size={14} className="inline" /> menu in Chrome and select <span className="text-[#ccff00] font-bold">"Install app"</span> or <span className="text-[#ccff00] font-bold">"Add to Home screen"</span>
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-white/30 text-center italic">
                                        Note: Requires HTTPS connection for automatic prompt.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default PWAHandler;
