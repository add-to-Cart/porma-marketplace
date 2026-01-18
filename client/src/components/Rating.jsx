import { useState } from "react";
import { Star } from "lucide-react";

export default function Rating({
  productId,
  averageRating,
  numRatings,
  onRate,
}) {
  const [userRating, setUserRating] = useState(0);
  const [hover, setHover] = useState(0);

  const handleRate = (rating) => {
    setUserRating(rating);
    // Call API to submit rating
    // For now, mock
    if (onRate) onRate(rating);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={20}
            className={`cursor-pointer ${
              star <= (hover || userRating || averageRating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => handleRate(star)}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600">
        {averageRating.toFixed(1)} ({numRatings} reviews)
      </span>
    </div>
  );
}
