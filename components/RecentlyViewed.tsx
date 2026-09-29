"use client";

import { useState, useEffect, useSyncExternalStore, useMemo } from "react";
import Link from "next/link";
import { Clock, ArrowRight, Sparkles, Trash2, Compass } from "lucide-react";
import SareeCard from "@/components/SareeCard";
import { Saree } from "@/types/saree";
import {
  subscribeRecentlyViewed,
  getRecentlyViewedIdsSnapshot,
  getServerRecentlyViewedSnapshot,
  resolveRecentlyViewedSarees,
  clearRecentlyViewed,
} from "@/lib/recentlyViewed";

interface RecentlyViewedProps {
  currentSareeId?: string;
  title?: string;
  subtitle?: string;
  className?: string;
  limit?: number;
  fallbackSarees?: Saree[];
}

export default function RecentlyViewed({
  currentSareeId,
  title,
  subtitle,
  className = "",
  limit = 6,
  fallbackSarees = [],
}: RecentlyViewedProps) {
  const ids = useSyncExternalStore(
    subscribeRecentlyViewed,
    getRecentlyViewedIdsSnapshot,
    getServerRecentlyViewedSnapshot
  );

  const [sarees, setSarees] = useState<Saree[]>([]);

  useEffect(() => {
    let isMounted = true;
    resolveRecentlyViewedSarees(ids).then((resolved) => {
      if (isMounted) {
        setSarees(resolved);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [ids]);

  // Exclude current saree if provided, and apply limit (up to 6)
  const displaySarees = useMemo(() => {
    let result = sarees;
    if (currentSareeId) {
      result = result.filter(
        (s) => s.id !== currentSareeId && s.sku !== currentSareeId
      );
    }
    return result.slice(0, limit);
  }, [sarees, currentSareeId, limit]);

  const hasPersonalizedHistory = displaySarees.length > 0;

  // If no personalized history exists, use neutral fallback sarees (e.g. from shop catalogue)
  const fallbackDisplay = useMemo(() => {
    if (hasPersonalizedHistory) return [];
    let list = fallbackSarees;
    if (currentSareeId) {
      list = list.filter((s) => s.id !== currentSareeId && s.sku !== currentSareeId);
    }
    return list.slice(0, 4);
  }, [hasPersonalizedHistory, fallbackSarees, currentSareeId]);

  // If both are empty, omit gracefully
  if (!hasPersonalizedHistory && fallbackDisplay.length === 0) {
    return null;
  }

  const activeSarees = hasPersonalizedHistory ? displaySarees : fallbackDisplay;
  const sectionTitle = title || (hasPersonalizedHistory ? "Curated For You" : "Explore More From SaiSrujana");
  const sectionSubtitle =
    subtitle ||
    (hasPersonalizedHistory
      ? "Sarees selected around your browsing"
      : "Handpicked boutique pieces from our Armoor showroom");

  return (
    <section
      aria-label={sectionTitle}
      className={`py-16 sm:py-20 bg-[#FDFBF7] border-t border-[#E8E0D2] ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10 pb-4 border-b border-[#E8E0D2]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] font-semibold text-[#8C7A6B] mb-2">
              {hasPersonalizedHistory ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Your Browsing ({activeSarees.length})</span>
                </>
              ) : (
                <>
                  <Compass className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Boutique Selection</span>
                </>
              )}
            </div>
            <h2 className="font-serif-luxury text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E1715] tracking-tight">
              {sectionTitle}
            </h2>
            {sectionSubtitle && (
              <p className="text-xs sm:text-sm text-[#5A4E46] font-light mt-1 max-w-xl">
                {sectionSubtitle}
              </p>
            )}
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {hasPersonalizedHistory && (
              <button
                type="button"
                onClick={() => clearRecentlyViewed()}
                className="inline-flex items-center gap-1.5 text-xs text-[#8C7A6B] hover:text-red-700 transition cursor-pointer"
                title="Clear recently viewed history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}

            <Link
              href="/sarees"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#6E121E] hover:text-[#821524] transition group"
            >
              <span>View All Sarees</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A059] group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>
        </div>

        {/* Saree Cards Responsive Grid */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            activeSarees.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
          } gap-6 lg:gap-8`}
        >
          {activeSarees.map((saree) => (
            <SareeCard key={saree.id} saree={saree} />
          ))}
        </div>

        {/* Subtext info */}
        <div className="mt-8 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2 text-[11px] text-[#8C7A6B]">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>
            {hasPersonalizedHistory
              ? "Saved automatically to your device • SaiSrujana Boutique"
              : "Authentic Handpicked Sarees • Armoor, Telangana"}
          </span>
        </div>
      </div>
    </section>
  );
}
