"use client";

import { useState } from "react";
import { Star, X, CheckCircle2, AlertCircle, Sparkles, Send, Loader2 } from "lucide-react";
import { Saree } from "@/types/saree";
import { submitCustomerReview } from "@/lib/supabase/reviews";

interface AddReviewModalProps {
  saree: Saree;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor - Disappointed with quality",
  2: "Fair - Needs improvement",
  3: "Good - As expected",
  4: "Very Good - Impressed with drape & craft",
  5: "Excellent - Stunning luxury saree!",
};

export default function AddReviewModal({
  saree,
  isOpen,
  onClose,
  onReviewSubmitted,
}: AddReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!comment.trim()) {
      setErrorMessage("Please share a brief comment about your experience with this saree.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await submitCustomerReview({
        sareeId: saree.id,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || null,
        rating,
        comment: comment.trim(),
      });

      if (error) {
        setErrorMessage(error.message || "Could not submit review. Please try again.");
        return;
      }

      setIsSuccess(true);
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err) {
      console.error("Submit review failed:", err);
      setErrorMessage("An unexpected error occurred while submitting your review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsSuccess(false);
    setErrorMessage(null);
    onClose();
  };

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-review-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        className="bg-[#FAF7F2] w-full max-w-lg rounded-3xl border border-[#C5A059]/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#590D18] via-[#6E121E] to-[#590D18] p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close review dialog"
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#E5D2A4]">
              Customer Feedback
            </span>
          </div>

          <h2 id="add-review-title" className="font-serif-luxury text-xl sm:text-2xl font-bold">
            Write a Review
          </h2>
          <p className="text-xs text-[#F4EFE6]/90 font-light mt-0.5 line-clamp-1">
            {saree.name} ({saree.sku})
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {isSuccess ? (
            <div className="text-center py-6 sm:py-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#E8F3EE] text-[#1E3F34] border border-[#A7F3D0] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-serif-luxury text-xl font-bold text-[#1E1715]">
                  Thank You for Your Review!
                </h3>
                <p className="text-xs text-[#8C7A6B] font-light max-w-sm mx-auto mt-2 leading-relaxed">
                  Your review has been submitted successfully. To maintain the authenticity of our boutique feedback, reviews appear on the product page after moderation.
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Saree Mini Summary */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#E8E0D2] shadow-2xs">
                <div className="w-12 h-14 rounded-lg overflow-hidden bg-stone-100 border border-[#E8E0D2] shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={saree.image}
                    alt={saree.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono font-bold text-[#6E121E] bg-[#FAF6EE] px-1.5 py-0.2 rounded border border-[#C5A059]/30">
                    {saree.sku}
                  </span>
                  <h4 className="font-serif-luxury text-xs font-bold text-[#1E1715] truncate mt-0.5">
                    {saree.name}
                  </h4>
                  <p className="text-[11px] text-[#8C7A6B] truncate font-light">
                    {saree.categoryLabel}
                  </p>
                </div>
              </div>

              {/* Star Rating Selector */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8E0D2] shadow-2xs">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-2 text-center">
                  Your Overall Rating <span className="text-[#6E121E]">*</span>
                </label>

                <div className="flex items-center justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= activeRating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 text-[#C5A059] hover:scale-115 transition-transform cursor-pointer focus:outline-none"
                        title={`${star} Star${star > 1 ? "s" : ""}`}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            isFilled
                              ? "fill-[#C5A059] text-[#C5A059]"
                              : "text-[#D8CFC4] hover:text-[#C5A059]"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <p className="text-center text-xs font-medium text-[#6E121E] transition-opacity">
                  {RATING_LABELS[activeRating] || `${rating} Stars`}
                </p>
              </div>

              {/* Customer Name */}
              <div>
                <label
                  htmlFor="customerName"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1"
                >
                  Your Name <span className="text-[#6E121E]">*</span>
                </label>
                <input
                  id="customerName"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Gayathri Rao"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E0D2] text-xs sm:text-sm text-[#1E1715] placeholder:text-[#B5A89D] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                />
              </div>

              {/* Customer Email (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="customerEmail"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46]"
                  >
                    Email Address
                  </label>
                  <span className="text-[10px] text-[#8C7A6B]">Optional / Confidential</span>
                </div>
                <input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. customer@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E0D2] text-xs sm:text-sm text-[#1E1715] placeholder:text-[#B5A89D] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                />
              </div>

              {/* Review Comment */}
              <div>
                <label
                  htmlFor="reviewComment"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5A4E46] mb-1"
                >
                  Review Comments <span className="text-[#6E121E]">*</span>
                </label>
                <textarea
                  id="reviewComment"
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about the saree's fabric quality, zari shine, color accuracy, and overall drape..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E0D2] text-xs sm:text-sm text-[#1E1715] placeholder:text-[#B5A89D] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition resize-none"
                />
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-[#E8E0D2] bg-white hover:bg-stone-100 text-[#5A4E46] text-xs font-semibold tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6E121E] hover:bg-[#590D18] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Submit Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
