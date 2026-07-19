import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { normalizeEmail, validateRegistrationInput } from '../utils/authValidation';
import { catchAsync } from '../utils/asyncHandler';

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

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Account is deactivated');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
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
});

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  const validation = validateRegistrationInput(name, email, password);

  if (!validation.valid) {
    res.status(400);
    throw new Error(validation.error);
  }

  const normalizedEmail = validation.normalizedEmail;
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(409);
    throw new Error('An account with that email already exists');
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
});

export const me = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as Request & { user?: { id: string; role: 'USER' | 'ADMIN'; email: string } };
  if (!authReq.user) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const user = await User.findById(authReq.user.id).select('-passwordHash');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  return res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const getAdmins = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as Request & { user?: { id: string; role: 'USER' | 'ADMIN'; email: string } };
  if (!authReq.user) {
    res.status(401);
    throw new Error('Authentication required');
  }

  if (authReq.user.role !== 'ADMIN') {
    res.status(403);
    throw new Error('Admin access required');
  }

  const admins = await User.find({ role: 'ADMIN', isActive: true })
    .select('_id name email')
    .lean();
  return res.status(200).json(admins);
});

export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as Request & { user?: { id: string; role: 'USER' | 'ADMIN'; email: string } };
  if (!authReq.user) {
    res.status(401);
    throw new Error('Authentication required');
  }

  if (authReq.user.role !== 'ADMIN') {
    res.status(403);
    throw new Error('Admin access required');
  }

  const users = await User.find({}).select('-passwordHash').lean();
  return res.status(200).json(users);
});

export const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const authReq = req as Request & { user?: { id: string; role: 'USER' | 'ADMIN'; email: string } };
  if (!authReq.user) {
    res.status(401);
    throw new Error('Authentication required');
  }

  if (authReq.user.role !== 'ADMIN') {
    res.status(403);
    throw new Error('Admin access required');
  }

  const { id } = req.params;
  const { isActive } = req.body;

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isActive = isActive;
  await user.save();

  return res.status(200).json({ message: 'User status updated', user: { _id: user._id, name: user.name, isActive: user.isActive } });
});
