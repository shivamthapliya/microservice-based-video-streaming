import { db } from "../db.js";

// Create a new user (sign-up)
 const createUser = async (req, res) => {
  try {
    const { id, email, name } = req.body;

    if (!id || !email) {
      return res.status(400).json({ message: "id and email are required" });
    }

    // Check if user already exists
    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    await db.query(
      "INSERT INTO users (id, email, name) VALUES (?, ?, ?)",
      [id, email, name || null]
    );

    return res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error("Error creating user:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all users
 const getUsers = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM users");
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a user by id or email
 const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      "DELETE FROM users WHERE id = ? OR email = ?",
      [id, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export { createUser, getUsers, deleteUser };
