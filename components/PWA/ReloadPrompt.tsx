import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReloadPrompt: React.FC = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    return (
        <AnimatePresence>
            {(offlineReady || needRefresh) && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md">
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="glass-card p-4 shadow-2xl flex items-center justify-between gap-4 border border-white/10"
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-white">
                                {offlineReady ? 'App is ready to work offline' : 'New version available!'}
                            </span>
                            {needRefresh && (
                                <span className="text-xs text-white/60">
                                    Click reload to update the app to the latest version.
                                </span>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {needRefresh && (
                                <button
                                    onClick={() => updateServiceWorker(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-[#ccff00] text-black rounded-lg text-xs font-bold hover:bg-[#b8e600] transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Reload
                                </button>
                            )}
                            <button
                                onClick={close}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReloadPrompt;
