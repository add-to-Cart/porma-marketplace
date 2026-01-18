import express from "express";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

// mount routes
app.use("/products", productRoutes);
app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
