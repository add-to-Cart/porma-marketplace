// testRoutes.js
import express from "express";
import { getSellers, getUsers } from "../controllers/testController.js";

const router = express.Router();

// This will respond to GET localhost:3000/users
router.get("/users", getUsers);
router.get("/sellers", getSellers); // You can create a separate controller if needed

export default router;
