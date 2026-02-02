import express from "express";
import { getTopSellers } from "../controllers/adminController.js";

const router = express.Router();

// Public analytics endpoints (read-only)
router.get("/top-sellers", getTopSellers);

export default router;
