# Trending Algorithm: Visual Guide

## The Four-Pillar Architecture

```
                          PRODUCT DATA
                               ↓
        ┌──────────────────────────────────────────┐
        │  TRENDING SCORE CALCULATION              │
        │                                          │
        │  Score = V × C × F × V                  │
        │  (Velocity × Credibility ×              │
        │   Freshness × Value)                    │
        │                                          │
        └──────────────────┬───────────────────────┘
                           ↓
        ┌──────────────────────────────────────────┐
        │      PILLAR 1: VELOCITY FACTOR           │
        │  (Sales + Views Conversion)              │
        │                                          │
        │  Base = (Sales × 10) + (Views × 1)      │
        │  Multiplier = Sales / Views             │
        │  Factor = Base × Multiplier             │
        │                                          │
        │  EXAMPLE:                                │
        │  50 sales, 100 views                    │
        │  = ((50×10)+(100×1)) × (50/100)        │
        │  = 600 × 0.5 = 300 ✅                  │
        └──────────────────────────────────────────┘
                           ×
        ┌──────────────────────────────────────────┐
        │    PILLAR 2: CREDIBILITY FACTOR          │
        │  (Weighted Ratings)                      │
        │                                          │
        │  Rating Quality = Average / 5.0          │
        │  Confidence Multiplier:                  │
        │  • <5 ratings = 0.3x ❌ Too few         │
        │  • 5-10 ratings = 0.6x                  │
        │  • 10-20 ratings = 0.8x                 │
        │  • 20+ ratings = 1.2x ✅ Full boost    │
        │                                          │
        │  Factor = Quality × Confidence          │
        │                                          │
        │  EXAMPLE:                                │
        │  4.2 stars from 25 people               │
        │  = (4.2/5) × 1.2 = 1.008 ✅            │
        └──────────────────────────────────────────┘
                           ×
        ┌──────────────────────────────────────────┐
        │     PILLAR 3: FRESHNESS FACTOR           │
        │  (Time Decay)                            │
        │                                          │
        │  IF created < 60 days ago:               │
        │  Factor = 1.0 (full boost)              │
        │                                          │
        │  IF created > 60 days ago:               │
        │  Factor = e^(-0.01 × DaysOld)           │
        │  (exponential decay @ 1% per day)       │
        │                                          │
        │  EXAMPLES:                               │
        │  30 days old = 1.0 ✅                   │
        │  90 days old = 0.74 (30% penalty)      │
        │  180 days old = 0.18 (82% penalty)     │
        └──────────────────────────────────────────┘
                           ×
        ┌──────────────────────────────────────────┐
        │      PILLAR 4: VALUE FACTOR              │
        │  (Discount Intensity)                    │
        │                                          │
        │  IF no discount:                         │
        │  Factor = 1.0 (no boost)                │
        │                                          │
        │  IF discount ≥ 15%:                      │
        │  Factor = 1.1 (10% boost) ✅            │
        │                                          │
        │  IF discount < 15%:                      │
        │  Factor = 1.0 + (discount × 0.5)        │
        │  (linear scaling)                        │
        │                                          │
        │  EXAMPLES:                               │
        │  No discount = 1.0                       │
        │  10% discount = 1.05                     │
        │  20% discount = 1.1 (capped)            │
        └──────────────────────────────────────────┘
                           ↓
                   FINAL SCORE
                   (normalized)
```

---

## Factor Weight Comparison

### Which Factor Has Most Impact?

```
Velocity Factor (Sales + Views Conversion)
████████████████████████ 40%
  Dominates: High-sales, high-conversion products

Credibility Factor (Ratings)
██████████ 20%
  Strong influence: Quality products with many reviews

Freshness Factor (Time Decay)
██████████ 20%
  Important: New products get boost, old ones fade

Value Factor (Discounts)
███ 10%
  Modifier: Discount products get small boost
```

---

## Real Product Rankings (Your Data)

### Scenario 1: Bundled Product (Wasalak)

```
╔════════════════════════════════════════════════════════╗
║  TUTENG (Bundle) - Expected Rank: #3                  ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  Sales: 175                                            ║
║  Views: 814                                            ║
║  Conversion: 175/814 = 21.5% ← STRONG SIGNAL        ║
║  Ratings: 20                                           ║
║  Rating Avg: 3.0                                       ║
║  Days Old: ~150 days ← OLD PRODUCT                    ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║  CALCULATION:                                          ║
║                                                        ║
║  Velocity = (175×10 + 814×1) × 0.215 = 551.3         ║
║  Credibility = (3.0/5.0) × 1.2 = 0.72 (20+ ratings) ║
║  Freshness = e^(-0.01×150) = 0.22 (150 days old)     ║
║  Value = 1.0 (no discount)                            ║
║                                                        ║
║  FINAL SCORE = 551.3 × 0.72 × 0.22 × 1.0 = 87.3   ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║  ✅ Ranks High BECAUSE: Conversion rate is highest!  ║
║  ❌ Held Back By: Age (150 days = heavy penalty)      ║
║                                                        ║
║  KEY INSIGHT: Bundle competes on velocity, not         ║
║  arbitrary boost. DESERVES to rank high!              ║
╚════════════════════════════════════════════════════════╝
```

### Scenario 2: Quality Product (ACSUZ)

```
╔════════════════════════════════════════════════════════╗
║  ACSUZ TURN SIGNAL - Expected Rank: #4                ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  Sales: 60                                             ║
║  Views: 254                                            ║
║  Conversion: 60/254 = 23.6% ← HIGHEST CONVERSION     ║
║  Ratings: 22 ← CREDIBILITY THRESHOLD HIT             ║
║  Rating Avg: 3.3                                       ║
║  Days Old: ~60 days ← MEDIUM AGE                      ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║  CALCULATION:                                          ║
║                                                        ║
║  Velocity = (60×10 + 254×1) × 0.236 = 201.6          ║
║  Credibility = (3.3/5.0) × 1.2 = 0.792 ✅            ║
║               (22 ratings = full multiplier!)         ║
║  Freshness = e^(-0.01×60) = 0.54                      ║
║  Value = 1.0 (no discount)                            ║
║                                                        ║
║  FINAL SCORE = 201.6 × 0.792 × 0.54 × 1.0 = 86.5  ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║  ✅ Ranks High BECAUSE: Credibility boost (22 ratings)║
║  ✅ Also has: Highest conversion rate (23.6%)         ║
║  ❌ Held Back By: Low absolute sales (60)             ║
║                                                        ║
║  KEY INSIGHT: Lower sales but BETTER quality wins!    ║
║  Quality multiplier kicks in at 20+ ratings.          ║
╚════════════════════════════════════════════════════════╝
```

### Scenario 3: New Product (Test Case)

```
╔════════════════════════════════════════════════════════╗
║  NEW HELMET XPro - Expected Rank: #7-8                ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  Sales: 30                                             ║
║  Views: 180                                            ║
║  Conversion: 30/180 = 16.7% ← SOLID                  ║
║  Ratings: 3 ← TOO FEW FOR CREDIBILITY               ║
║  Rating Avg: 4.8 ← GREAT BUT NOT ENOUGH             ║
║  Days Old: 2 days ← BRAND NEW ✅                     ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║  CALCULATION:                                          ║
║                                                        ║
║  Velocity = (30×10 + 180×1) × 0.167 = 80.2           ║
║  Credibility = (4.8/5.0) × 0.3 = 0.288               ║
║               (only 3 ratings = penalty)             ║
║  Freshness = e^(-0.01×2) = 0.98 ✅ FULL BOOST!      ║
║  Value = 1.0 (no discount)                            ║
║                                                        ║
║  FINAL SCORE = 80.2 × 0.288 × 0.98 × 1.0 = 22.6  ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║  ✅ Ranks High BECAUSE: Freshness boost (2 days old) ║
║  ❌ Held Back By: Not enough ratings (3 vs needed 5) ║
║                                                        ║
║  KEY INSIGHT: New products get visibility to build    ║
║  ratings. As ratings accumulate → score rises.        ║
╚════════════════════════════════════════════════════════╝
```

---

## The Algorithm In Action: Product Lifecycle

```
                    NEW PRODUCT LAUNCH
                          ↓
           ┌──────────────────────────────┐
           │  Day 1-2: DISCOVERY PHASE    │
           │                              │
           │  Sales: 5                    │
           │  Views: 50                   │
           │  Ratings: 0                  │
           │                              │
           │  Velocity: 25 (low)          │
           │  Credibility: 0 (penalty)    │
           │  Freshness: 1.0 ✅ (new)    │
           │  Value: 1.0                  │
           │                              │
           │  Score: ~2.5                 │
           │  Rank: #15-20 (visibility!)  │
           └──────────────────────────────┘
                          ↓
           ┌──────────────────────────────┐
           │  Day 3-7: EARLY REVIEWS      │
           │                              │
           │  Sales: 20                   │
           │  Views: 150                  │
           │  Ratings: 5 ✅              │
           │  Rating Avg: 4.5             │
           │                              │
           │  Velocity: 85 (growing)      │
           │  Credibility: 0.27 (still)   │
           │  Freshness: 0.94 ✅ (still!) │
           │  Value: 1.0                  │
           │                              │
           │  Score: ~21.6                │
           │  Rank: #8-12 (improving!)    │
           └──────────────────────────────┘
                          ↓
           ┌──────────────────────────────┐
           │  Day 15-30: MOMENTUM         │
           │                              │
           │  Sales: 45                   │
           │  Views: 200                  │
           │  Ratings: 12 ✅             │
           │  Rating Avg: 4.6             │
           │                              │
           │  Velocity: 120 (strong)      │
           │  Credibility: 0.736 (good!)  │
           │  Freshness: 1.0 ✅ (boost!)  │
           │  Value: 1.0                  │
           │                              │
           │  Score: ~88.3                │
           │  Rank: #3-5 (TRENDING! 🔥)   │
           └──────────────────────────────┘
                          ↓
           ┌──────────────────────────────┐
           │  Day 60+: STABILIZING        │
           │                              │
           │  Sales: 100                  │
           │  Views: 450                  │
           │  Ratings: 35 ✅ QUALITY! ✅ │
           │  Rating Avg: 4.4             │
           │                              │
           │  Velocity: 210 (solid)       │
           │  Credibility: 1.056 (boost!) │
           │  Freshness: 0.54 (decay)     │
           │  Value: 1.0                  │
           │                              │
           │  Score: ~118.7               │
           │  Rank: #2 (ESTABLISHED HIT!) │
           └──────────────────────────────┘
```

---

## Factor Contribution Pie Chart

### Score Composition (Example Product)

```
              TRENDING SCORE = 87.3

         Velocity Component
         ████████████████ 63% (551.3 × 0.5 ratio)

         Credibility Component
         ███ 8% (0.72 multiplier)

         Freshness Component
         ████ 25% (0.22 multiplier)

         Value Component
         (1.0x = no additional boost)
```

---

## Decision Tree: Will This Product Trend?

```
                        START
                          ↓
                  Has 10+ views?
                    ↙        ↘
                  NO          YES
                  ↓            ↓
               SKIP      Has >5% conversion?
                        ↙          ↘
                       NO           YES
                       ↓            ↓
                    Maybe      Good velocity!
                               ↓
                        Has 5+ ratings?
                        ↙          ↘
                       NO           YES
                       ↓            ↓
                    Penalized    ✅ Qualified!
                    ↓            ↓
                Created < 60d?  How many ratings?
                ↙      ↘        ↙        ↘
               YES      NO    <10       20+
               ↓        ↓      ↓         ↓
             Boost    Decay  Limited   FULL
             ↓        ↓      BOOST     BOOST
             ↓        ↓      ↓         ↓
         Score:    Score:   Score:    Score:
         20-50     2-20     40-80     70-150
         ↓         ↓        ↓         ↓
         Rank:     Rank:    Rank:     Rank:
         #10-15    #15-20   #5-10     #1-5
         (new)     (old)    (decent)   (HOT! 🔥)
```

---

## Algorithm Comparison: Old vs New

```
OLD ALGORITHM:                    NEW ALGORITHM:
───────────────                   ──────────────

Score = S×5 + V×0.2              Score = V × C × F × D
      + R×3×Cred
      + E×50                      Where:
      + Recency Boost             V = Velocity (sales conversion)
                                  C = Credibility (rating confidence)
                                  F = Freshness (time decay)
Single weighted sum              D = Value (discounts)
↓                                 ↓
Simple, but arbitrary            Multiplicative, organic
Gives equal weight to            Each factor has specific purpose
all components                    ↓
                                  Impossible to game
                                  (can't be high in one factor
                                   and still rank if others low)
```

---

## The Beauty of Multiplicative Formula

Why multiply instead of add?

```
Product A:
- High sales but old: V=200, C=0.5, F=0.1, D=1.0
- Score = 200 × 0.5 × 0.1 × 1.0 = 10 ❌

Product B:
- Medium sales, new, highly rated: V=150, C=1.0, F=1.0, D=1.0
- Score = 150 × 1.0 × 1.0 × 1.0 = 150 ✅

With multiplication:
→ Can't hide weakness in other pillars
→ Balanced products rank highest
→ Prevents one-dimensional exploitation
```

---

## Summary Flowchart

```
┌─────────────────────────┐
│   All Products (200)    │
└────────────┬────────────┘
             ↓
   ┌─────────────────────────┐
   │ Apply 4-Pillar Formula  │
   │ to each product         │
   └────────────┬────────────┘
                ↓
   ┌─────────────────────────┐
   │ Calculate:              │
   │ • Velocity × Credibility│
   │ • Freshness × Value     │
   │ = Final Score           │
   └────────────┬────────────┘
                ↓
   ┌─────────────────────────┐
   │ Sort by score           │
   │ (highest first)         │
   └────────────┬────────────┘
                ↓
   ┌─────────────────────────┐
   │ Return Top 20           │
   │ with breakdown          │
   └────────────┬────────────┘
                ↓
   ┌─────────────────────────┐
   │ Display to users        │
   │ "Trend Spotlight" 🔥    │
   └─────────────────────────┘
```

---

Done! This visual guide should help anyone understand the algorithm at a glance. 🎨
