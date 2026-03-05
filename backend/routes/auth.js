import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'dev_secret_key_123';

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) return res.status(400).json({ error: 'Username already taken' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ username, password_hash: hashedPassword });

        res.status(201).json({ message: 'User created successfully', userId: newUser.id });
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Me (Verify Token)
router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        res.json({ user: decoded });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Verify Password (for Wallet Lock)
router.post('/verify-password', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'No token' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, SECRET_KEY);

        const { password } = req.body;
        if (!password) return res.status(400).json({ error: 'Password required' });

        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.wallet_password_hash) {
            // User has set a custom wallet password
            const isMatch = await bcrypt.compare(password, user.wallet_password_hash);
            if (!isMatch) return res.status(401).json({ error: 'Invalid password' });
        } else {
            // User falls back to the default wallet password
            if (password !== 'Cortana117') {
                return res.status(401).json({ error: 'Invalid password' });
            }
        }

        res.json({ verified: true });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update Profile
router.post('/update-profile', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'No token' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, SECRET_KEY);

        const { username, password, walletPassword } = req.body;
        const user = await User.findByPk(decoded.id);

        if (!user) return res.status(404).json({ error: 'User not found' });

        if (username) user.username = username;
        if (password) {
            user.password_hash = await bcrypt.hash(password, 10);
        }
        if (walletPassword) {
            user.wallet_password_hash = await bcrypt.hash(walletPassword, 10);
        }

        await user.save();

        // Generate new token if username changed (optional but good practice)
        const newToken = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '7d' });

        res.json({ success: true, token: newToken, user: { id: user.id, username: user.username } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
