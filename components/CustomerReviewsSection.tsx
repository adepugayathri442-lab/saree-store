"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Star,
  Sparkles,
  MessageSquareQuote,
  PenSquare,
  CheckCircle2,
  ThumbsUp,
  Award,
} from "lucide-react";
import { Saree } from "@/types/saree";
import { Review, ReviewStats } from "@/types/review";
import { fetchApprovedReviewsBySareeId } from "@/lib/supabase/reviews";
import AddReviewModal from "./AddReviewModal";

interface CustomerReviewsSectionProps {
  saree: Saree;
}

export default function CustomerReviewsSection({ saree }: CustomerReviewsSectionProps) {
  const sareeId = saree?.id;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterRating, setFilterRating] = useState<number | "all">("all");

  const loadReviews = useCallback(async () => {
    if (!sareeId) return;
    setLoading(true);
    try {
      const data = await fetchApprovedReviewsBySareeId(sareeId);
      setReviews(data);
    } catch (err) {
      console.error("Error loading reviews in CustomerReviewsSection:", err);
    } finally {
      setLoading(false);
    }
  }, [sareeId]);

  useEffect(() => {
    let ignore = false;
    async function initReviews() {
      if (!sareeId) return;
      setLoading(true);
      try {
        const data = await fetchApprovedReviewsBySareeId(sareeId);
        if (!ignore) {
          setReviews(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading reviews in CustomerReviewsSection:", err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    initReviews();

    return () => {
      ignore = true;
    };
  }, [sareeId]);

  // Statistics calculation
  const stats: ReviewStats = useMemo(() => {
    const initialBreakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0, ratingBreakdown: initialBreakdown };
    }

    let totalScore = 0;
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      initialBreakdown[star] = (initialBreakdown[star] || 0) + 1;
      totalScore += r.rating;
    });

    const averageRating = Number((totalScore / reviews.length).toFixed(1));
    return { averageRating, totalReviews: reviews.length, ratingBreakdown: initialBreakdown };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (filterRating === "all") return reviews;
    return reviews.filter((r) => Math.round(r.rating) === filterRating);
  }, [reviews, filterRating]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    } catch {
      return "Recent";
    }
  };

  return (
    <section className="mt-12 sm:mt-16 pt-10 sm:pt-14 border-t border-[#E8E0D2]/80">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#6E121E]">
              Customer Experiences
            </span>
          </div>
          <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#1E1715]">
            Ratings & Customer Reviews
          </h2>
          <p className="text-xs sm:text-sm text-[#8C7A6B] font-light mt-1">
            Real feedback from patrons who have purchased and draped this saree.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <PenSquare className="w-4 h-4 text-[#C5A059]" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Ratings Overview Card */}
      <div className="bg-[#FAF7F2] rounded-3xl border border-[#C5A059]/30 p-6 sm:p-8 mb-8 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Overall Rating Score */}
          <div className="text-center md:border-r md:border-[#E8E0D2] md:pr-8">
            <div className="text-5xl sm:text-6xl font-bold font-serif-luxury text-[#6E121E] leading-none mb-2">
              {stats.totalReviews > 0 ? stats.averageRating : "—"}
            </div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(stats.averageRating)
                      ? "fill-[#C5A059] text-[#C5A059]"
                      : "text-[#D8CFC4]"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-[#8C7A6B] font-medium">
              Based on {stats.totalReviews} {stats.totalReviews === 1 ? "customer review" : "customer reviews"}
            </p>
          </div>

          {/* Breakdown Bars */}
          <div className="space-y-2 md:col-span-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.ratingBreakdown[star] || 0;
              const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              const isSelected = filterRating === star;

              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFilterRating((prev) => (prev === star ? "all" : star))}
                  className={`w-full flex items-center gap-3 text-xs text-left p-1 rounded-lg transition-colors cursor-pointer ${
                    isSelected ? "bg-[#FAF0DC] font-semibold" : "hover:bg-white/60"
                  }`}
                  title={`Filter by ${star} star reviews (${count})`}
                >
                  <span className="w-12 text-[#5A4E46] flex items-center gap-1 shrink-0 font-medium">
                    <span>{star}</span>
                    <Star className="w-3 h-3 fill-[#C5A059] text-[#C5A059]" />
                  </span>

                  {/* Bar Background */}
                  <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#C5A059] to-[#6E121E] rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <span className="w-10 text-right text-[#8C7A6B] font-mono text-[11px] shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality Assurance Highlight */}
        <div className="mt-6 pt-6 border-t border-[#E8E0D2] flex flex-wrap items-center justify-between gap-4 text-xs text-[#5A4E46]">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#C5A059]" />
            <span className="font-medium">100% Genuine Handcrafted Pure Fabrics Guaranteed</span>
          </div>
          {filterRating !== "all" && (
            <button
              type="button"
              onClick={() => setFilterRating("all")}
              className="text-xs font-semibold text-[#6E121E] hover:underline cursor-pointer"
            >
              Clear rating filter ({filterRating} ★)
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-7 h-7 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#8C7A6B]">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-dashed border-[#E8E0D2]">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF6EE] text-[#6E121E] border border-[#C5A059]/40 flex items-center justify-center mx-auto mb-3">
            <MessageSquareQuote className="w-6 h-6 text-[#C5A059]" />
          </div>
          <h3 className="font-serif-luxury text-lg font-bold text-[#1E1715] mb-1">
            Be the First to Review This Saree
          </h3>
          <p className="text-xs text-[#8C7A6B] font-light max-w-sm mx-auto mb-4">
            Have you ordered or draped this saree? Share your thoughts on its texture, border zari, and feel to help fellow boutique shoppers.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FAF0DC] hover:bg-[#F3E5CE] text-[#6E121E] border border-[#C5A059] text-xs font-semibold transition cursor-pointer"
          >
            <PenSquare className="w-3.5 h-3.5" />
            <span>Write the First Review</span>
          </button>
        </div>
      ) : filteredReviews.length === 0 ? (
        /* Empty Filtered State */
        <div className="p-8 text-center bg-white rounded-2xl border border-[#E8E0D2]">
          <p className="text-xs text-[#8C7A6B] mb-2">
            No {filterRating} star reviews found for this saree.
          </p>
          <button
            type="button"
            onClick={() => setFilterRating("all")}
            className="text-xs font-semibold text-[#6E121E] hover:underline cursor-pointer"
          >
            Show all reviews ({reviews.length})
          </button>
        </div>
      ) : (
        /* Reviews Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-[#E8E0D2] p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4 hover:border-[#C5A059]/50 transition-colors"
            >
              <div>
                {/* Reviewer Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#6E121E] text-[#E5D2A4] font-serif-luxury font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                      {review.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-serif-luxury text-sm font-bold text-[#1E1715]">
                        {review.customerName}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-[#1E3F34] font-medium">
                        <CheckCircle2 className="w-3 h-3 text-[#1E3F34]" />
                        <span>Verified Buyer</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] text-[#8C7A6B] font-light">
                    {formatDate(review.createdAt)}
                  </span>
                </div>

                {/* Stars Rating */}
                <div className="flex items-center gap-1 mb-2.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= Math.round(review.rating)
                          ? "fill-[#C5A059] text-[#C5A059]"
                          : "text-[#D8CFC4]"
                      }`}
                    />
                  ))}
                  <span className="text-xs font-bold text-[#6E121E] ml-1.5">
                    {review.rating}.0
                  </span>
                </div>

                {/* Comment Text */}
                <p className="text-xs sm:text-sm text-[#3E3530] font-light leading-relaxed whitespace-pre-line">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>

              {/* Helpful Footer */}
              <div className="pt-3 border-t border-[#F0EBE0] flex items-center justify-between text-[11px] text-[#8C7A6B]">
                <span className="italic font-light">SaiSrujana Boutique Collection</span>
                <span className="inline-flex items-center gap-1 text-[#1E3F34]">
                  <ThumbsUp className="w-3 h-3" />
                  <span>Verified Experience</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write a Review Modal */}
      <AddReviewModal
        saree={saree}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReviewSubmitted={loadReviews}
      />
    </section>
  );
}
