"use client";

import { useState } from "react";
import {
  useReviews,
  useCreateReview,
  useDeleteReview,
} from "@/hooks/useReviews";
import { StarRating } from "@/components/ui/StarRating";
import { useAuthStore } from "@/store/auth.store";
import { formatRelative } from "@/lib/date";

interface Props {
  productId: string;
}

export function ReviewSection({ productId }: Props) {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useReviews(productId);
  const createReview = useCreateReview(productId);
  const deleteReview = useDeleteReview(productId);

  const reviews = data?.data ?? [];
  const meta = data?.meta;
  const userReviewId = reviews.find((r) => r.userId === user?.id)?.id;

  // Form state
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a star rating");
      return;
    }

    try {
      await createReview.mutateAsync({
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
      });
      setRating(0);
      setTitle("");
      setBody("");
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    }
  }

  async function handleDelete(reviewId: string) {
    if (!confirm("Delete your review?")) return;
    try {
      await deleteReview.mutateAsync(reviewId);
    } catch {
      /* errors surfaced via API / toasts */
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Aggregate stats ──────────────────────────────────────────── */}
      {meta && meta.total > 0 && (
        <div className="flex gap-8 items-start">
          {/* Average */}
          <div className="text-center shrink-0">
            <p className="text-5xl font-bold text-gray-900">{meta.avgRating}</p>
            <StarRating
              value={Math.round(meta.avgRating ?? 0)}
              readonly
              size="sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              {meta.total} review{meta.total !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = meta.distribution[star] ?? 0;
              const pct =
                meta.total > 0 ? Math.round((count / meta.total) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-4 text-right">{star}</span>
                  <svg
                    className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-gray-400 w-6">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Write review CTA ─────────────────────────────────────────── */}
      {!!user && !userReviewId && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          + Write a review
        </button>
      )}

      {!user && (
        <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
          <a href="/login" className="text-black font-medium underline">
            Sign in
          </a>{" "}
          to leave a review
        </div>
      )}

      {/* ── Review form ──────────────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4"
        >
          <h3 className="font-semibold text-gray-900">Your Review</h3>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Star picker */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Rating</label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Title{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Summarise your experience"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Body */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Review{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="What did you like or dislike?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
            <p className="text-xs text-gray-400 text-right">
              {body.length}/2000
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createReview.isPending}
              className="flex-1 bg-black text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {createReview.isPending ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      )}

      {/* ── Reviews list ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-100 rounded w-1/4" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => {
            const isOwner = user?.id === review.userId;
            return (
              <div
                key={review.id}
                className="border-b border-gray-100 pb-6 last:border-0"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {(review.user as any)?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={(review.user as any).image}
                          alt={(review.user as any).name ?? ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-500">
                          {((review.user as any)?.name ?? "A")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {(review.user as any)?.name ?? "Anonymous"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatRelative(review.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StarRating value={review.rating} readonly size="sm" />
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                {review.title && (
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {review.title}
                  </p>
                )}
                {review.body && (
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                    {review.body}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
