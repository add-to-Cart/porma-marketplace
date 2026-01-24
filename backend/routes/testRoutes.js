// testRoutes.js
import express from "express";
import { getUsers } from "../controllers/testController.js"; // Import the controller function

const router = express.Router();

// This will respond to GET localhost:3000/users
router.get("/users", getUsers);

export default router;
