import React, { useState, useEffect } from 'react';
import ReloadPrompt from './ReloadPrompt';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAHandler: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Check if user has already dismissed it this session
            const isDismissed = sessionStorage.getItem('pwa-install-dismissed');
            if (!isDismissed) {
                setShowInstallBanner(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        
        // Show the prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowInstallBanner(false);
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
                                        <img src="/Digital Logo.png" alt="App Icon" className="w-8 h-8 object-contain" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-sm font-bold text-white leading-tight">Install LifeBook</h3>
                                        <p className="text-xs text-white/50 leading-relaxed mt-0.5">
                                            Add to your home screen for a better mobile experience.
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

                            <div className="flex items-center gap-3 w-full">
                                <button
                                    onClick={handleInstall}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ccff00] text-black rounded-xl text-xs font-bold hover:bg-[#b8e600] transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Install App
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default PWAHandler;
