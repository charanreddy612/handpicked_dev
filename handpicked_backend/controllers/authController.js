import jwt from 'jsonwebtoken';
import { supabase } from '../dbhelper/dbclient.js';
import bcrypt from 'bcrypt';

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  // Fetch user by username
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !users) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  // Compare password with hash
  const match = await bcrypt.compare(password, users.password_hash);
  if (!match) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: users.id, username: users.username },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ message: 'Login successful', token });
}


export const profile = (req, res) => {
  res.json({ message: 'Protected profile route', user: req.user });
};