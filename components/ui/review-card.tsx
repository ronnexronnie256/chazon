'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/user-avatar'
interface Reviewer {
  name?: string | null
  image?: string | null
}

interface ReviewCardReview {
  reviewer: Reviewer
  rating: number
  comment?: string | null
  createdAt: string | Date
}

interface ReviewCardProps {
  review: ReviewCardReview
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card className="bg-gray-50/50 border-gray-200">
      <CardHeader className="flex-row items-center gap-4">
        <UserAvatar
          name={review.reviewer.name}
          image={review.reviewer.image}
          size="md"
        />
        <div>
          <CardTitle className="text-lg font-semibold text-gray-900">
            {review.reviewer.name}
          </CardTitle>
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {review.comment && (
          <p className="text-gray-800 italic">{`"${review.comment}"`}</p>
        )}
        <p className="text-sm text-gray-500 mt-2 text-right">
          {new Date(review.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </CardContent>
    </Card>
  )
}
