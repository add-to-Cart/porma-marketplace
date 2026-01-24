# Trending Algorithm: Quick Start Guide

## 🚀 TL;DR - Get Trending Working

### 1. **Code is Already Updated**

- ✅ Algorithm utility created: `backend/utils/trendingAlgorithm.js`
- ✅ Backend controller updated: `backend/controllers/productController.js`
- ✅ Frontend is already consuming: `/api/products/trending`

### 2. **Start Your Server**

```bash
cd backend
npm install  # if you haven't already
node server.js
```

### 3. **Test the Endpoint**

```bash
# Option A: Browser
http://localhost:5000/api/products/trending

# Option B: cURL
curl http://localhost:5000/api/products/trending

# Option C: Postman
GET http://localhost:5000/api/products/trending
```

### 4. **See Results**

You'll get back your top 20 trending products with detailed breakdown:

```json
[
  {
    "id": "product_id",
    "name": "Product Name",
    "trendingData": {
      "score": 95.2,
      "breakdown": {
        "velocity": 450,
        "credibility": 0.84,
        "freshness": 0.95,
        "value": 1.0
      }
    }
  }
]
```

---

## 📚 Documentation Files

### **For Complete Understanding:**

1. **[TRENDING_ALGORITHM.md](TRENDING_ALGORITHM.md)** ← Read this first
   - Complete formula explanation
   - The four pillars in detail
   - Why each pillar matters

2. **[TRENDING_ANALYSIS.md](TRENDING_ANALYSIS.md)** ← Then read this
   - Test cases using your actual data
   - Expected results
   - How to validate

3. **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** ← Reference
   - What changed in your codebase
   - Before/after comparison
   - How to customize

---

## 🧪 Testing Scenarios

### **Test 1: Verify Bundle Ranking**

**Goal:** Confirm Wasalak (bundle) shows in top 5 based on high conversion rate

**Current Data:**

- Tuteng: 175 sales, 814 views = 21.5% conversion ✅

**Expected:** Should rank top 5 (possibly top 3)

**How to Check:**

1. Call `/api/products/trending`
2. Find "Tuteng" in results
3. Check `trendingData.breakdown.velocity` should be high (~500+)
4. Check `trendingData.factors.conversionRate` should show ~21.5%

---

### **Test 2: Verify Credibility Boost**

**Goal:** Confirm ACSUZ Turn Signal gets credibility multiplier at 22 ratings

**Current Data:**

- ACSUZ: 60 sales, 254 views, 22 ratings, 3.3 average ✅

**Expected:** Should rank in top 5 despite lower sales

**How to Check:**

1. Call `/api/products/trending`
2. Find "ACSUZ 2Pcs Chrome..." in results
3. Check `trendingData.factors.ratingsCount` = 22
4. Check `trendingData.breakdown.credibility` should be ~0.79+ (multiplier kick-in)

---

### **Test 3: New Product Freshness**

**Goal:** Confirm new products get freshness boost

**Create a Test Product:**

```javascript
// In your database, add a new product OR modify an existing one:
{
  name: "TEST - Hot New Helmet",
  soldCount: 25,
  viewCount: 150,
  ratingsCount: 2,
  ratingAverage: 4.5,
  createdAt: /* TODAY's date in Unix seconds */,
  basePrice: 2500
}
```

**Expected:** Should appear in trending despite low sales (freshness boost)

**How to Check:**

1. Call `/api/products/trending`
2. Find your test product
3. Check `trendingData.factors.daysOld` should be 0-2 days
4. Check `trendingData.breakdown.freshness` should be ~0.98-1.0
5. Verify it ranks higher than expected for its sales

---

## 🔧 Customization Quick Menu

### **Want Bundles to Rank Even Higher?**

Edit `backend/utils/trendingAlgorithm.js`:

```javascript
const ALGORITHM_CONFIG = {
  SALES_MULTIPLIER: 15, // was 10 (50% boost)
  // ... rest stays same
};
```

### **Want Quality (Ratings) to Matter Less?**

Edit `backend/utils/trendingAlgorithm.js`:

```javascript
const ALGORITHM_CONFIG = {
  MIN_RATINGS_FOR_QUALITY_BOOST: 10, // was 20 (easier to achieve)
  MIN_RATINGS_FOR_CONSIDERATION: 2, // was 5 (softer penalty)
  // ... rest stays same
};
```

### **Want New Products to Stay Visible Longer?**

Edit `backend/utils/trendingAlgorithm.js`:

```javascript
const ALGORITHM_CONFIG = {
  FRESHNESS_WINDOW_DAYS: 90, // was 60 (extend boost period)
  DECAY_RATE: 0.005, // was 0.01 (slower decay)
  // ... rest stays same
};
```

### **Want Discounts to Get Bigger Boost?**

Edit `backend/utils/trendingAlgorithm.js`:

```javascript
const ALGORITHM_CONFIG = {
  DISCOUNT_MULTIPLIER: 1.2, // was 1.1 (20% boost instead of 10%)
  DISCOUNT_THRESHOLD: 0.1, // was 0.15 (10% discount instead of 15%)
  // ... rest stays same
};
```

---

## 🐛 Debugging

### **Why Isn't Product X Trending?**

1. Check the `trendingData.breakdown`:

   ```json
   {
     "velocity": 10, // ← Is this low?
     "credibility": 0.3, // ← Is this a penalty?
     "freshness": 0.1, // ← Is it very old?
     "value": 1.0 // ← No discount?
   }
   ```

2. Fix based on the weak factor:
   - **Velocity low?** → Needs more sales or better conversion rate
   - **Credibility low?** → Needs more ratings (5+, 20+ for full boost)
   - **Freshness low?** → Product is old, needs better other metrics
   - **Value low?** → Could benefit from discount

### **Algorithm Seems Off?**

Check the `factors` field:

```json
{
  "conversionRate": "15.2%", // Is this reasonable?
  "ratingsCount": 8, // Does this match credibility?
  "ratingAverage": 3.5, // Good quality?
  "daysOld": 120, // Is it old?
  "hasDiscount": false // Does it need discount?
}
```

---

## 📊 Real Examples from Your Data

### **Expected Top 5:**

```
1. Hydraulic Disc Brake (176 sales, 776 views)
   - Score: ~95
   - Why: High velocity + 39 ratings credibility

2. Motorcycle Windshield (251 sales, 838 views)
   - Score: ~92
   - Why: Highest sales + 45 ratings

3. Tuteng/Wasalak (175 sales, 814 views)
   - Score: ~87
   - Why: 21.5% conversion rate (best %)

4. ACSUZ Turn Signal (60 sales, 254 views, 22 ratings)
   - Score: ~86
   - Why: High conversion + credibility boost

5. Helmet Intercom (189 sales, 711 views)
   - Score: ~84
   - Why: Good velocity + ratings
```

---

## ✅ Validation Checklist

- [ ] Backend server starts without errors
- [ ] `/api/products/trending` returns 200 status
- [ ] Response includes `trendingData` field
- [ ] `trendingData.score` is a number
- [ ] `trendingData.breakdown` shows 4 factors
- [ ] Products are sorted by score (highest first)
- [ ] Top products make sense (high sales/views/ratings)
- [ ] `factors` field provides transparency
- [ ] Frontend TrendingProduct page loads without errors
- [ ] Trending products display with rankings

---

## 🎯 Next Steps

### **Immediate (Day 1)**

1. ✅ Verify algorithm works: `GET /api/products/trending`
2. ✅ Check frontend displays trending correctly
3. ✅ Validate top products make sense

### **Short Term (Week 1)**

1. Monitor actual user behavior
2. Collect feedback on trending accuracy
3. Decide if any tuning needed

### **Medium Term (Week 2-4)**

1. Add `compareAtPrice` field to products (for discount factor)
2. Consider category-specific trending
3. Plan trending notifications

---

## 📞 Troubleshooting

### **Error: "getTrendingProducts is not a function"**

- Check `backend/controllers/productController.js` line 4
- Should have: `import { getTrendingProducts as calculateTrendingProducts } from "../utils/trendingAlgorithm.js"`
- Make sure `backend/utils/trendingAlgorithm.js` exists

### **Products Not Returning**

- Check if database has products with `viewCount` and `soldCount`
- If missing these fields, products get score 0
- Update old products: `viewCount: 0, soldCount: 0`

### **All Products Score Same**

- Probably means `viewCount` is missing
- Algorithm returns 0 when `viewCount = 0`
- Add view counts to products

### **New Products Never Show**

- Check if `createdAt` field exists
- Should be Unix timestamp in seconds (Firestore format)
- Verify time calculation: `(Now - createdAt) / (1000*60*60*24) = days`

---

## 🎓 Learning Path

### **If You Want to Understand the Algorithm:**

1. Read "Why This Algorithm Works" in [TRENDING_ALGORITHM.md](TRENDING_ALGORITHM.md)
2. Look at the test cases in [TRENDING_ANALYSIS.md](TRENDING_ANALYSIS.md)
3. Check individual factor functions in `backend/utils/trendingAlgorithm.js`

### **If You Want to Just Use It:**

1. Run `/api/products/trending`
2. Trust the sorting
3. Let data guide you

### **If You Want to Customize It:**

1. Change `ALGORITHM_CONFIG` values
2. Test with `/api/products/trending`
3. Adjust until it feels right

---

## 🚀 You're All Set!

Your marketplace now has data-driven trending. Go test it out!

**Questions? Check:**

- 📖 [TRENDING_ALGORITHM.md](TRENDING_ALGORITHM.md) - Complete reference
- 🧪 [TRENDING_ANALYSIS.md](TRENDING_ANALYSIS.md) - Test cases
- 📝 [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - What changed
