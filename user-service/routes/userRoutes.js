import express from "express";
import { createUser, getUsers, deleteUser } from "../controllers/userController.js";

const router = express.Router();

router.post("/signUp", createUser);        // POST /api/users → create new user
router.get("/getAll", getUsers);           // GET  /api/users → list users
router.delete("/:id", deleteUser);   // DELETE /api/users/:id → delete user

export default router;
