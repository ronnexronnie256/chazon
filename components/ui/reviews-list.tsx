"use client";

import { useState, useEffect } from "react";
import { ReviewCard } from "./review-card";
import { LoadingSpinner } from "./loading-spinner";

interface ReviewsListProps {
  userId: string;
  showStats?: boolean;
}

export function ReviewsList({ userId, showStats = true }: ReviewsListProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<{
    averageRating: number | null;
    totalReviews: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(`/api/reviews?userId=${userId}`);
        const data = await response.json();
        if (data.success) {
          setReviews(data.data || []);
          if (data.stats) {
            setStats(data.stats);
          }
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchReviews();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No reviews yet.</p>
      </div>
    );
  }

  return (
    <div>
      {showStats && stats && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.averageRating?.toFixed(1) || "0.0"}
              </div>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={
                      star <= Math.round(stats.averageRating || 0)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium">{stats.totalReviews} reviews</p>
              <p>Based on {stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={{
              reviewer: {
                name: review.reviewer.name,
                image: review.reviewer.image,
              },
              rating: review.rating,
              comment: review.comment,
              createdAt: review.createdAt,
            }}
          />
        ))}
      </div>
    </div>
  );
}

