import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ServiceRequest } from '../models/ServiceRequest';
import { Types } from 'mongoose';
import { buildRequestFingerprint } from '../utils/requestFingerprint';
import { canTransitionStatus, getAllowedNextStatuses, RequestStatus } from '../utils/requestWorkflow';
import { catchAsync } from '../utils/asyncHandler';

export const createRequest = catchAsync(async (req: AuthRequest, res: Response) => {
  const { title, description, category, priority } = req.body;

  if (!title || !description) {
    res.status(400);
    throw new Error('Title and description are required');
  }

  const requesterId = req.user?.id;
  if (!requesterId) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const trimmedTitle = String(title).trim();
  const trimmedDescription = String(description).trim();
  const normalizedCategory = String(category || 'OTHER').toUpperCase();
  const normalizedPriority = String(priority || 'MEDIUM').toUpperCase();
  const allowedCategories = ['SOFTWARE', 'HARDWARE', 'NETWORK', 'ACCESS', 'OTHER'];
  const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  if (trimmedTitle.length < 5 || trimmedTitle.length > 120) {
    res.status(400);
    throw new Error('Title must be between 5 and 120 characters');
  }

  if (trimmedDescription.length < 15 || trimmedDescription.length > 4000) {
    res.status(400);
    throw new Error('Description must be between 15 and 4000 characters');
  }

  if (!allowedCategories.includes(normalizedCategory)) {
    res.status(400);
    throw new Error('Invalid category selected');
  }

  if (!allowedPriorities.includes(normalizedPriority)) {
    res.status(400);
    throw new Error('Invalid priority selected');
  }

  const fingerprint = buildRequestFingerprint(trimmedTitle, trimmedDescription);
  const existingRequest = await ServiceRequest.findOne({
    createdBy: new Types.ObjectId(requesterId),
    fingerprint,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    status: { $ne: 'CANCELLED' },
  });

  if (existingRequest) {
    res.status(409);
    throw new Error('A similar request was submitted recently. Please review your existing tickets.');
  }

  const newRequest = new ServiceRequest({
    title: trimmedTitle,
    description: trimmedDescription,
    fingerprint,
    category: normalizedCategory as 'SOFTWARE' | 'HARDWARE' | 'NETWORK' | 'ACCESS' | 'OTHER',
    priority: normalizedPriority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    status: 'OPEN',
    createdBy: new Types.ObjectId(requesterId),
    statusHistory: [
      {
        status: 'OPEN',
        changedBy: new Types.ObjectId(requesterId),
        note: 'Request created',
      },
    ],
  });

  const savedRequest = await newRequest.save();
  return res.status(201).json(savedRequest);
});

export const getRequests = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const isAdmin = req.user.role === 'ADMIN';
  const query = isAdmin ? {} : { createdBy: new Types.ObjectId(req.user.id) };

  const requests = await ServiceRequest.find(query)
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(requests);
});

export const getRequestById = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user?.id) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const request = await ServiceRequest.findById(id)
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .populate('statusHistory.changedBy', 'name email')
    .lean();

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  const isAdmin = req.user.role === 'ADMIN';
  const isOwner = request.createdBy?._id?.toString() === req.user.id;
  if (!isAdmin && !isOwner) {
    res.status(403);
    throw new Error('You do not have access to this request');
  }

  return res.status(200).json(request);
});

export const updateRequestStatus = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!req.user?.id) {
    res.status(401);
    throw new Error('Authentication required');
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403);
    throw new Error('Admin access required');
  }

  const request = await ServiceRequest.findById(id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  const normalizedStatus = String(status || '').toUpperCase() as RequestStatus;
  const allowedStatuses = ['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];
  if (!allowedStatuses.includes(normalizedStatus)) {
    res.status(400);
    throw new Error('Invalid status value');
  }

  if (!canTransitionStatus(request.status as RequestStatus, normalizedStatus)) {
    res.status(409);
    throw new Error('Invalid status transition. Follow OPEN -> IN_REVIEW -> IN_PROGRESS -> RESOLVED.');
  }

  request.status = normalizedStatus;
  request.statusHistory.push({
    status: normalizedStatus,
    changedBy: new Types.ObjectId(req.user.id),
    note: 'Status updated by admin',
    changedAt: new Date(),
  });
  await request.save();
  return res.status(200).json(request);
});

export const assignRequest = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  if (!req.user?.id) {
    res.status(401);
    throw new Error('Authentication required');
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403);
    throw new Error('Admin access required');
  }

  const request = await ServiceRequest.findById(id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (assignedTo) {
    request.assignedTo = new Types.ObjectId(assignedTo);
    request.statusHistory.push({
      status: request.status,
      changedBy: new Types.ObjectId(req.user.id),
      note: 'Assigned to support agent',
      changedAt: new Date(),
    });
  }

  await request.save();
  return res.status(200).json({ message: 'Request assignment updated', request });
});

export const updateRequestPriority = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { priority } = req.body;

  if (!req.user?.id) {
    res.status(401);
    throw new Error('Authentication required');
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403);
    throw new Error('Admin access required');
  }

  const request = await ServiceRequest.findById(id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  const normalizedPriority = String(priority || '').toUpperCase();
  const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  if (!allowedPriorities.includes(normalizedPriority)) {
    res.status(400);
    throw new Error('Invalid priority value');
  }

  request.priority = normalizedPriority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  request.statusHistory.push({
    status: request.status,
    changedBy: new Types.ObjectId(req.user.id),
    note: 'Priority updated by admin',
    changedAt: new Date(),
  });

  await request.save();
  return res.status(200).json(request);
});

export const cancelRequest = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (!req.user?.id) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const request = await ServiceRequest.findById(id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  const isAdmin = req.user.role === 'ADMIN';
  const isOwner = request.createdBy?.toString() === req.user.id;
  if (!isAdmin && !isOwner) {
    res.status(403);
    throw new Error('You do not have access to this request');
  }

  if (['RESOLVED', 'CANCELLED'].includes(request.status)) {
    res.status(409);
    throw new Error('This request cannot be cancelled');
  }

  request.status = 'CANCELLED';
  request.statusHistory.push({
    status: 'CANCELLED',
    changedBy: new Types.ObjectId(req.user.id),
    note: 'Cancelled by user',
    changedAt: new Date(),
  });

  await request.save();
  return res.status(200).json(request);
});
