import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

export const login = (req, res) => {
  const { username, password } = req.body;

  // Dummy login check
  if (username === 'admin' && password === 'password') {
    const token = jwt.sign({ username }, config.jwtSecret, { expiresIn: '1h' });
    return res.json({ message: 'Login successful', token });
  }

  res.status(401).json({ message: 'Invalid credentials' });
};

export const profile = (req, res) => {
  res.json({ message: 'Protected profile route', user: req.user });
};