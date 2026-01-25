import admin from "./config/firebaseAdmin.js";

const db = admin.firestore();

// 2. The data generated based on your requirements
const reviews = [
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 5,
    reviewText: "Excellent product, highly recommended!",
    createdAt: { _seconds: 1769348000, _nanoseconds: 100000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 4,
    reviewText: "Great quality, but shipping took a while.",
    createdAt: { _seconds: 1769348100, _nanoseconds: 200000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 2,
    reviewText: "Not what I expected based on the photos.",
    createdAt: { _seconds: 1769348200, _nanoseconds: 300000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 5,
    reviewText: "The build quality is surprisingly sturdy.",
    createdAt: { _seconds: 1769348300, _nanoseconds: 400000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 3,
    reviewText: "It is okay, does the job but feels a bit cheap.",
    createdAt: { _seconds: 1769348400, _nanoseconds: 500000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 4,
    reviewText: "Perfect fit for my needs.",
    createdAt: { _seconds: 1769348500, _nanoseconds: 600000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 1,
    reviewText: "Arrived broken. Very disappointed.",
    createdAt: { _seconds: 1769348600, _nanoseconds: 700000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 5,
    reviewText: "Fast delivery and amazing customer support.",
    createdAt: { _seconds: 1769348700, _nanoseconds: 800000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 4,
    reviewText: "Good value for the price point.",
    createdAt: { _seconds: 1769348800, _nanoseconds: 900000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 3,
    reviewText: "Average experience overall.",
    createdAt: { _seconds: 1769348900, _nanoseconds: 110000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 5,
    reviewText: "Will definitely buy again!",
    createdAt: { _seconds: 1769349000, _nanoseconds: 210000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 2,
    reviewText: "The color is slightly different than the website.",
    createdAt: { _seconds: 1769349100, _nanoseconds: 310000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 4,
    reviewText: "Works exactly as described.",
    createdAt: { _seconds: 1769349200, _nanoseconds: 410000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 5,
    reviewText: "Best purchase I have made this year.",
    createdAt: { _seconds: 1769349300, _nanoseconds: 510000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 3,
    reviewText: "Decent, but there are better options out there.",
    createdAt: { _seconds: 1769349400, _nanoseconds: 610000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 4,
    reviewText: "A bit pricey, but the quality justifies it.",
    createdAt: { _seconds: 1769349500, _nanoseconds: 710000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 5,
    reviewText: "Super easy to set up and use.",
    createdAt: { _seconds: 1769349600, _nanoseconds: 810000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 1,
    reviewText: "Stop working after two days.",
    createdAt: { _seconds: 1769349700, _nanoseconds: 910000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 4,
    reviewText: "Very satisfied with this version.",
    createdAt: { _seconds: 1769349800, _nanoseconds: 120000000 },
  },
  {
    productId: "J3cIBQIIsWZGJfjyEEaB",
    buyerId: "ClCriXvcK2hqsBOrylHXJQawsjn1",
    buyerName: "christian",
    rating: 5,
    reviewText: "Five stars! Simple and effective.",
    createdAt: { _seconds: 1769349900, _nanoseconds: 220000000 },
  },
];

// 3. Upload Function
async function uploadData() {
  const collectionRef = db.collection("reviews");

  console.log("Starting upload...");

  for (const review of reviews) {
    try {
      await collectionRef.add(review);
      console.log(`Added review with rating: ${review.rating}`);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  }

  console.log("Done! All reviews populated.");
}

uploadData();
