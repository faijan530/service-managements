import { Schema, model, Document, Types } from 'mongoose';
import crypto from 'crypto';

export interface IStatusHistory {
  status: 'OPEN' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  changedAt: Date;
  changedBy: Types.ObjectId;
  note?: string;
}

export interface IServiceRequest extends Document {
  requestNumber: string;
  fingerprint: string;
  title: string;
  description: string;
  aiSummary?: string;
  category: 'SOFTWARE' | 'HARDWARE' | 'NETWORK' | 'ACCESS' | 'OTHER';
  aiSuggestedCategory?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  aiSuggestedPriority?: string;
  status: 'OPEN' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  createdBy: Types.ObjectId;
  assignedTo: Types.ObjectId | null;
  statusHistory: IStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const StatusHistorySchema = new Schema<IStatusHistory>({
  status: {
    type: String,
    enum: ['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  changedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  note: {
    type: String,
  },
});

const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    requestNumber: {
      type: String,
      unique: true,
    },
    fingerprint: {
      type: String,
      required: false,
      index: true,
      default: '',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 15,
      maxlength: 4000,
    },
    aiSummary: {
      type: String,
    },
    category: {
      type: String,
      enum: ['SOFTWARE', 'HARDWARE', 'NETWORK', 'ACCESS', 'OTHER'],
      required: true,
      default: 'OTHER',
    },
    aiSuggestedCategory: {
      type: String,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      required: true,
      default: 'MEDIUM',
      index: true,
    },
    aiSuggestedPriority: {
      type: String,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
      default: 'OPEN',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    statusHistory: [StatusHistorySchema],
  },
  {
    timestamps: true,
  }
);

ServiceRequestSchema.pre('save', function (next) {
  if (!this.requestNumber) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    this.requestNumber = `SR-${dateStr}-${randomHex}`;
  }
  next();
});

export const ServiceRequest = model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);
