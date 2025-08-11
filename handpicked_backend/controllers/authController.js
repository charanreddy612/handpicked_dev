import jwt from "jsonwebtoken";
import { supabase } from "../dbhelper/dbclient.js";
import bcrypt from "bcrypt";

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }
console.log('Login request:', req.body);
  try {
    // Fetch user by user_id
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, password_hash, role_id")
      .eq("email", email)
      .limit(1);

    console.log('Supabase response:', data, error);

    if (error) throw error;

    const user = users?.[0];
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if password hash exists
    if (!user.password_hash) {
      return res.status(500).json({ message: "Password not set for user" });
    }

    // Compare password with hash
    const isMatch = await bcrypt.compare(password, users.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role_id: user.role_id, // 🔹 Important
      },
      config.jwtSecret,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export const profile = (req, res) => {
  res.json({ message: "Protected profile route", user: req.user });
};
