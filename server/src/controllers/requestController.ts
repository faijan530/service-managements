import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ServiceRequest } from '../models/ServiceRequest';
import mongoose, { Types } from 'mongoose';

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

    const newRequest = new ServiceRequest({
      title: String(title).trim(),
      description: String(description).trim(),
      category: category || 'OTHER',
      priority: priority || 'MEDIUM',
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
    const filter = isAdmin ? {} : { createdBy: new Types.ObjectId(req.user.id) };

    const requests = await ServiceRequest.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

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
      .populate('statusHistory.changedBy', 'name email');

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

    const allowedStatuses = ['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status transition' });
    }

    request.status = status;
    request.statusHistory.push({
      status,
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
