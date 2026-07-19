import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { normalizeEmail, validateRegistrationInput } from '../utils/authValidation';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

const signToken = (user: { _id: string; role: 'USER' | 'ADMIN'; email: string }) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    getJwtSecret() as jwt.Secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' } as jwt.SignOptions
  );
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    // Write debug info to a file so we can see what the user is typing
    const fs = require('fs');
    fs.appendFileSync('login_debug.log', `Login attempt for ${normalizedEmail}: password matched? ${isMatch}, password length: ${password.length}, body: ${JSON.stringify(req.body)}\n`);
    console.log(`Login attempt for ${normalizedEmail}: password matched? ${isMatch}, password length: ${password.length}, body:`, req.body);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ _id: String(user._id), role: user.role, email: user.email });

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server Error', details: (error as Error).message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const validation = validateRegistrationInput(name, email, password);

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const normalizedEmail = validation.normalizedEmail;
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = new User({
      name: validation.normalizedName,
      email: normalizedEmail,
      passwordHash,
      role: 'USER',
    });

    await newUser.save();

    const token = signToken({ _id: String(newUser._id), role: newUser.role, email: newUser.email });

    return res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Registration failed', details: (error as Error).message });
  }
};

export const me = async (req: Request, res: Response) => {
  const authReq = req as Request & { user?: { id: string; role: 'USER' | 'ADMIN'; email: string } };
  if (!authReq.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = await User.findById(authReq.user.id).select('-passwordHash');
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

export const getAdmins = async (req: Request, res: Response) => {
  try {
    const authReq = req as Request & { user?: { id: string; role: 'USER' | 'ADMIN'; email: string } };
    if (!authReq.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (authReq.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const admins = await User.find({ role: 'ADMIN', isActive: true })
      .select('_id name email')
      .lean();
    return res.status(200).json(admins);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch admins' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const authReq = req as Request & { user?: { id: string; role: 'USER' | 'ADMIN'; email: string } };
    if (!authReq.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (authReq.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await User.find({}).select('-passwordHash').lean();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const authReq = req as Request & { user?: { id: string; role: 'USER' | 'ADMIN'; email: string } };
    if (!authReq.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (authReq.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = isActive;
    await user.save();

    return res.status(200).json({ message: 'User status updated', user: { _id: user._id, name: user.name, isActive: user.isActive } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user status' });
  }
};
