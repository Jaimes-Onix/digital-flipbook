import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { resolveShareLink } from '../src/lib/bookStorage';
import VantaFogBackground from './VantaFogBackground';
import SharedCategoryView from './SharedCategoryView';
import SharedBookView from './SharedBookView';

export default function SharedLinkResolver() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [resolvedLink, setResolvedLink] = useState<{ linkType: string; target: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolve() {
      if (!token) {
        setError("Invalid link format.");
        setLoading(false);
        return;
      }

      try {
        const result = await resolveShareLink(token);
        if (result) {
          setResolvedLink(result);
        } else {
          setError("This link has expired or is invalid.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to resolve link.");
      } finally {
        setLoading(false);
      }
    }

    resolve();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <VantaFogBackground darkMode={true} />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
          <p className="text-zinc-400 font-medium">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error || !resolvedLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <VantaFogBackground darkMode={true} />
        <div className="relative z-10 text-center px-6 max-w-md w-full">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <AlertCircle size={36} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Link Unavailable</h1>
          <p className="text-zinc-400 leading-relaxed mb-8">{error || "This link has expired or is no longer valid."}</p>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <p className="text-sm text-zinc-500">Please request a new link from the person who shared this with you.</p>
          </div>
        </div>
      </div>
    );
  }

  if (resolvedLink.linkType === 'category') {
    return <SharedCategoryView categorySlug={resolvedLink.target} />;
  }

  if (resolvedLink.linkType === 'book') {
    return <SharedBookView bookIdOverride={resolvedLink.target} />;
  }

  return null;
}
