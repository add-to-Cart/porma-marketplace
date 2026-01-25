// client/src/utils/trendingAlgorithm.js
export const ALGORITHM_CONFIG = {
  SALES_MULTIPLIER: 10,
  VIEW_MULTIPLIER: 1,
  MIN_RATINGS_FOR_QUALITY_BOOST: 20,
  MIN_RATINGS_FOR_CONSIDERATION: 5,
  FRESHNESS_WINDOW_DAYS: 60,
  DECAY_RATE: 0.01,
  DISCOUNT_THRESHOLD: 0.15,
  DISCOUNT_MULTIPLIER: 1.1,
};

export function calculateVelocityFactor(product) {
  const { soldCount = 0, viewCount = 0 } = product;
  if (viewCount === 0) return 0;

  const conversionRate = soldCount / viewCount;
  const velocityScore =
    soldCount * ALGORITHM_CONFIG.SALES_MULTIPLIER +
    viewCount * ALGORITHM_CONFIG.VIEW_MULTIPLIER;
  const conversionMultiplier = Math.min(conversionRate * 2.5, 1.0);

  return velocityScore * conversionMultiplier;
}

export function calculateCredibilityFactor(product) {
  const { ratingsCount = 0, ratingAverage = 0 } = product;
  let confidenceMultiplier = 1.0;

  if (ratingsCount < ALGORITHM_CONFIG.MIN_RATINGS_FOR_CONSIDERATION) {
    confidenceMultiplier = 0.3;
  } else if (ratingsCount < 10) {
    confidenceMultiplier = 0.6;
  } else if (ratingsCount < ALGORITHM_CONFIG.MIN_RATINGS_FOR_QUALITY_BOOST) {
    confidenceMultiplier = 0.8;
  } else {
    confidenceMultiplier = 1.2;
  }

  const ratingQualityScore = Math.max(0, ratingAverage / 5.0);
  return ratingQualityScore * confidenceMultiplier;
}

export function calculateFreshnessFactor(product) {
  const { createdAt } = product;
  if (!createdAt) return 1.0;

  // Handle different timestamp formats (seconds or milliseconds)
  const createdDate =
    typeof createdAt === "number"
      ? new Date(createdAt * 1000)
      : new Date(createdAt.seconds ? createdAt.seconds * 1000 : createdAt);
  const now = new Date();
  const daysOld = (now - createdDate) / (1000 * 60 * 60 * 24);

  if (daysOld <= ALGORITHM_CONFIG.FRESHNESS_WINDOW_DAYS) return 1.0;

  const daysPastWindow = daysOld - ALGORITHM_CONFIG.FRESHNESS_WINDOW_DAYS;
  const decayFactor = Math.exp(-ALGORITHM_CONFIG.DECAY_RATE * daysPastWindow);

  return Math.max(0.1, decayFactor);
}

export function calculateValueFactor(product) {
  const { price, basePrice, compareAtPrice } = product;
  const effectivePrice = price || basePrice;
  if (!compareAtPrice || compareAtPrice <= effectivePrice) return 1.0;

  const discountPercentage = (compareAtPrice - effectivePrice) / compareAtPrice;
  if (discountPercentage >= ALGORITHM_CONFIG.DISCOUNT_THRESHOLD)
    return ALGORITHM_CONFIG.DISCOUNT_MULTIPLIER;

  return 1.0 + discountPercentage * 0.5;
}

export function calculateTrendingScore(product) {
  try {
    const velocityFactor = calculateVelocityFactor(product);
    const credibilityFactor = calculateCredibilityFactor(product);
    const freshnessFactor = calculateFreshnessFactor(product);
    const valueFactor = calculateValueFactor(product);

    const trendingScore =
      velocityFactor * credibilityFactor * freshnessFactor * valueFactor;

    return trendingScore;
  } catch (error) {
    console.error(
      `Error calculating trending score for product ${product.id}:`,
      error,
    );
    return 0;
  }
}
