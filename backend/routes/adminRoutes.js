import express from "express";
import { verifyAuth } from "../middleware/auth.js";
import {
  getAllUsers,
  getAllSellers,
  getTopSellers,
} from "../controllers/adminController.js";

const router = express.Router();

// Protected admin endpoints
router.get("/users", verifyAuth, getAllUsers);
router.get("/sellers", verifyAuth, getAllSellers);
router.get("/analytics/top-sellers", verifyAuth, getTopSellers);

export default router;
