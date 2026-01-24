# Trending Algorithm Documentation

## Overview

The Porma Marketplace Trending Algorithm identifies what is truly "hot" in the store using a **four-pillar approach** that reflects organic user behavior. Rather than arbitrarily boosting bundles or relying on single metrics, this algorithm measures what users are actually buying, viewing, rating, and clicking on.

---

## The Four Pillars

### 🚀 **PILLAR 1: VELOCITY FACTOR** (Sales + Views Conversion)

**Problem It Solves:**  
An old product with 500 sales isn't "trending"—it's just a "best seller." A new product with 50 sales that had 100 views IS trending because it has 50% conversion.

**The Logic:**

- **Base Score**: `(Sales × 10) + (Views × 1)`
- **Conversion Multiplier**: `Sales ÷ Views`
- **Final Velocity Score**: `Base Score × Conversion Multiplier`

**Weight Distribution:**

- Sales are weighted **10x higher** than views (intent > interest)
- Conversion rate is applied as a multiplier (0.0 to 1.0)

**Example:**

```
Product A: 50 sales, 100 views
- Base: (50 × 10) + (100 × 1) = 600
- Conversion: 50/100 = 50%
- Velocity Score: 600 × 0.5 = 300 ✅ TRENDING

Product B: 100 sales, 1000 views
- Base: (100 × 10) + (1000 × 1) = 2000
- Conversion: 100/1000 = 10%
- Velocity Score: 2000 × 0.1 = 200 (lower even with more sales)
```

---

### ⭐ **PILLAR 2: CREDIBILITY FACTOR** (Weighted Ratings)

**Problem It Solves:**  
A product with 1 five-star rating shouldn't rank above a product with 100 ratings averaging 4.2. Quality needs confidence.

**The Logic:**
Uses a **Confidence Multiplier** based on rating count:

| Rating Count | Confidence Multiplier | Interpretation        |
| ------------ | --------------------- | --------------------- |
| < 5          | 0.3x                  | Too few to trust      |
| 5-10         | 0.6x                  | Emerging credibility  |
| 10-20        | 0.8x                  | Good credibility      |
| 20+          | 1.2x                  | ✅ Full quality boost |

**Rating Quality Score:**

- Normalized to 0-1 based on 5-star scale
- Formula: `(Average Rating ÷ 5.0)`

**Final Credibility Score:** `Rating Quality × Confidence Multiplier`

**Example:**

```
Product A: 4.5 stars from 1 person
- Quality: 4.5/5 = 0.9
- Confidence: 0.3 (< 5 ratings)
- Credibility: 0.9 × 0.3 = 0.27 ❌

Product B: 4.2 stars from 100 people
- Quality: 4.2/5 = 0.84
- Confidence: 1.2 (20+ ratings)
- Credibility: 0.84 × 1.2 = 1.0+ ✅ TRENDING
```

---

### 🕐 **PILLAR 3: FRESHNESS FACTOR** (Time Decay)

**Problem It Solves:**  
Trends should feel organic and current. A product from 6 months ago needs significantly more sales to stay "trending" than one uploaded 48 hours ago.

**The Logic:**

- **Freshness Window**: First 60 days get full `1.0x` multiplier
- **After 60 Days**: Exponential decay at 1% per day

**Decay Formula:**

```
decayFactor = e^(-0.01 × daysOld)
Floor minimum: 0.1 (prevents disappearing)
```

**Examples:**

```
Product uploaded 30 days ago: 1.0x (full boost)
Product uploaded 90 days ago: 0.74x (1% decay × 30 days)
Product uploaded 180 days ago: 0.18x (rapid decline)
```

---

### 💰 **PILLAR 4: VALUE FACTOR** (Discount Intensity)

**Problem It Solves:**  
Users love a deal. Significant discounts drive clicks, views, and conversions—a natural trend signal.

**The Logic:**

- Only applies if `compareAtPrice > basePrice`
- **Discount Threshold**: 15% required for boost
- **Discount Boost**: 1.1x (10% multiplier)
- **Below Threshold**: Linear scaling (0.5% per 1% discount)

**Example:**

```
Product with no discount: 1.0x (no boost)
Product with 15% discount: 1.1x ✅
Product with 30% discount: 1.1x (capped at 10% boost)
Product with 5% discount: 1.025x (linear 0.5% per 1%)
```

**Note:** Your current data structure doesn't have `compareAtPrice` yet, but the algorithm is ready for this field.

---

## Master Formula

### The Complete Trending Score Calculation:

```
Trending Score =
    Velocity Factor
    × Credibility Factor
    × Freshness Factor
    × Value Factor
```

### Expanded:

```
Score = ((Sales × 10 + Views × 1) × ConversionRate)
        × (RatingAverage/5 × ConfidenceMultiplier)
        × (Time Decay Factor)
        × (Discount Multiplier)
```

### Interpretation:

- **Higher Score** = More "hot" and relevant right now
- **Lower Score** = Either old, poorly reviewed, or low engagement
- **Balanced** = No single factor dominates (prevents gaming)

---

## Implementation Details

### File Locations

**Backend Algorithm:**

- [backend/utils/trendingAlgorithm.js](../backend/utils/trendingAlgorithm.js)

**Backend Endpoint:**

- [backend/controllers/productController.js](../backend/controllers/productController.js) - `getTrendingProducts()` function

**Frontend Consumer:**

- [client/src/pages/TrendingProduct.jsx](../client/src/pages/TrendingProduct.jsx)
- [client/src/api/products.js](../client/src/api/products.js) - `/trending` endpoint

### API Endpoint

**GET** `/api/products/trending`

**Response:**

```json
[
  {
    "id": "product_id",
    "name": "Product Name",
    "basePrice": 1500,
    "ratingAverage": 4.2,
    "soldCount": 50,
    "viewCount": 100,
    "ratingsCount": 25,
    "createdAt": { "_seconds": 1700000000 },
    "trendingData": {
      "score": 245.63,
      "breakdown": {
        "velocity": 300,
        "credibility": 1.008,
        "freshness": 0.95,
        "value": 1.0
      },
      "factors": {
        "conversionRate": "50.00%",
        "ratingsCount": 25,
        "ratingAverage": 4.2,
        "daysOld": 30,
        "hasDiscount": false
      }
    }
  }
]
```

---

## Testing the Algorithm

### How to Test with Your Data

Your **response.json** data includes three excellent test cases:

#### **Test Case 1: Wasalak (Bundle)**

- **Target**: Should rank high if it has high views + medium-to-high sales
- **Setup**: Give it `viewCount: 1000, soldCount: 200`
- **Expected Result**: High velocity score due to 20% conversion rate

#### **Test Case 2: ACSUZ Turn Signal**

- **Target**: Should rank high due to credibility despite lower sales
- **Setup**: Ensure `ratingsCount: 20+, ratingAverage: 3.5+`
- **Expected Result**: Quality multiplier pushes it to top 5

#### **Test Case 3: Newer Items**

- **Target**: Should break into top 10 with freshness boost alone
- **Setup**: Create items with `createdAt: 2 days ago, soldCount: 30, viewCount: 200`
- **Expected Result**: Freshness boost (1.0x) helps despite lower metrics

### Running the Algorithm Locally

```javascript
const { getTrendingProducts, calculateTrendingScore } = require('./backend/utils/trendingAlgorithm');

// Test with one product
const testProduct = {
  soldCount: 50,
  viewCount: 100,
  ratingAverage: 4.2,
  ratingsCount: 25,
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days old
};

const score = calculateTrendingScore(testProduct);
console.log(score);
// Output: { score: 245.63, breakdown: {...}, factors: {...} }

// Test with array of products
const allProducts = [...]; // your products
const trending = getTrendingProducts(allProducts, 20);
console.log(trending.slice(0, 5)); // Top 5 trending
```

---

## Why This Algorithm Works

1. **Organic**: Measures actual user behavior (sales, views, ratings)
2. **Balanced**: No single factor dominates (prevents gaming)
3. **Dynamic**: Incorporates time decay (keeps trending fresh)
4. **Inclusive**: Works for bundles, single items, new launches, and deals
5. **Debuggable**: Breakdown shows exactly why something is/isn't trending

---

## Future Enhancements

### Phase 2: Add Discount Data

- Implement `compareAtPrice` field in product schema
- Enable full discount factor boost

### Phase 3: Category-Specific Trending

- Calculate trending separately per category
- Return top 5 trending in each category

### Phase 4: Seller Trending

- Show trending products per seller
- Help new sellers understand what's working

### Phase 5: Real-Time Updates

- Update trending scores every hour
- Trigger notifications when product breaks into top 10

---

## Configuration

All algorithm constants are defined in `ALGORITHM_CONFIG`:

```javascript
const ALGORITHM_CONFIG = {
  SALES_MULTIPLIER: 10, // How much more we weight sales vs views
  VIEW_MULTIPLIER: 1, // Base view weight
  MIN_RATINGS_FOR_QUALITY_BOOST: 20, // Threshold for 1.2x credibility
  MIN_RATINGS_FOR_CONSIDERATION: 5, // Minimum ratings to not penalize
  FRESHNESS_WINDOW_DAYS: 60, // Days for full freshness boost
  DECAY_RATE: 0.01, // 1% decay per day after window
  DISCOUNT_THRESHOLD: 0.15, // 15% discount for boost
  DISCOUNT_MULTIPLIER: 1.1, // 10% score boost for qualifying discounts
};
```

**To tune the algorithm**, adjust these values in `backend/utils/trendingAlgorithm.js`.

---

## FAQ

**Q: Why are bundles not automatically boosted?**  
A: Because you want trends to be organic. If a bundle is truly hot (people are buying it at a high conversion rate), it will rank naturally. If it's not, it shouldn't artificially inflate.

**Q: What if a product has 0 views?**  
A: It gets a velocity score of 0 and won't appear in trending. New products with no traffic won't dominate.

**Q: How often should trending refresh?**  
A: Scores are calculated on-demand per API call. In production, you might cache for 1 hour to save database reads.

**Q: Can I see why a specific product ranked where it did?**  
A: Yes! Check the `trendingData.breakdown` in the API response. Each factor is shown individually.

---

## Summary

This four-pillar trending algorithm ensures your marketplace surfaces what's **actually hot** right now, not what you want to be hot. It rewards quality, velocity, freshness, and value—the exact metrics that drive real marketplace success.

🚀 **Let your data tell you what's trending.**
