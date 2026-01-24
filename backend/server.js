import express from "express";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
  }),
);

// Set Cross-Origin-Opener-Policy to allow popups for Firebase Auth
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Routes
app.use("/products", productRoutes);
app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/cart", cartRoutes);
app.use("/test", testRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
