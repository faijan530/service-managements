import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ServiceRequest } from '../models/ServiceRequest';
import { Types } from 'mongoose';
import { buildRequestFingerprint } from '../utils/requestFingerprint';
import { canTransitionStatus, getAllowedNextStatuses, RequestStatus } from '../utils/requestWorkflow';

export const createRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const requesterId = req.user?.id;
    if (!requesterId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const trimmedTitle = String(title).trim();
    const trimmedDescription = String(description).trim();
    const normalizedCategory = String(category || 'OTHER').toUpperCase();
    const normalizedPriority = String(priority || 'MEDIUM').toUpperCase();
    const allowedCategories = ['SOFTWARE', 'HARDWARE', 'NETWORK', 'ACCESS', 'OTHER'];
    const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    if (trimmedTitle.length < 5 || trimmedTitle.length > 120) {
      return res.status(400).json({ error: 'Title must be between 5 and 120 characters' });
    }

    if (trimmedDescription.length < 15 || trimmedDescription.length > 4000) {
      return res.status(400).json({ error: 'Description must be between 15 and 4000 characters' });
    }

    if (!allowedCategories.includes(normalizedCategory)) {
      return res.status(400).json({ error: 'Invalid category selected' });
    }

    if (!allowedPriorities.includes(normalizedPriority)) {
      return res.status(400).json({ error: 'Invalid priority selected' });
    }

    const fingerprint = buildRequestFingerprint(trimmedTitle, trimmedDescription);
    const existingRequest = await ServiceRequest.findOne({
      createdBy: new Types.ObjectId(requesterId),
      fingerprint,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      status: { $ne: 'CANCELLED' },
    });

    if (existingRequest) {
      return res.status(409).json({ error: 'A similar request was submitted recently. Please review your existing tickets.' });
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
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create request' });
  }
};

export const getRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const query = isAdmin ? {} : { createdBy: new Types.ObjectId(req.user.id) };

    const requests = await ServiceRequest.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(requests);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

export const getRequestById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const request = await ServiceRequest.findById(id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('statusHistory.changedBy', 'name email')
      .lean();

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = request.createdBy?._id?.toString() === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'You do not have access to this request' });
    }

    return res.status(200).json(request);
  } catch (error) {
    return res.status(500).json({ error: 'Error fetching request details' });
  }
};

export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const normalizedStatus = String(status || '').toUpperCase() as RequestStatus;
    const allowedStatuses = ['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];
    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    if (!canTransitionStatus(request.status as RequestStatus, normalizedStatus)) {
      return res.status(409).json({ error: 'Invalid status transition. Follow OPEN -> IN_REVIEW -> IN_PROGRESS -> RESOLVED.' });
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
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update status' });
  }
};

export const assignRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
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
  } catch (error) {
    return res.status(500).json({ error: 'Failed to assign request' });
  }
};

export const updateRequestPriority = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const normalizedPriority = String(priority || '').toUpperCase();
    const allowedPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    if (!allowedPriorities.includes(normalizedPriority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
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
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update priority' });
  }
};

export const cancelRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = request.createdBy?.toString() === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'You do not have access to this request' });
    }

    if (['RESOLVED', 'CANCELLED'].includes(request.status)) {
      return res.status(409).json({ error: 'This request cannot be cancelled' });
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
  } catch (error) {
    return res.status(500).json({ error: 'Failed to cancel request' });
  }
};
