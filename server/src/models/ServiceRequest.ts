import { Schema, model, Document, Types } from 'mongoose';

export interface IStatusHistory {
  status: 'OPEN' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  changedAt: Date;
  changedBy: Types.ObjectId;
  comment?: string;
}

export interface IServiceRequest extends Document {
  requestNumber: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
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
  comment: {
    type: String,
  },
});

const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    requestNumber: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
      default: 'OPEN',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    statusHistory: [StatusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate request number
ServiceRequestSchema.pre('save', function (next) {
  if (!this.requestNumber) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    this.requestNumber = `SR-${dateStr}-${randomDigits}`;
  }
  next();
});

export const ServiceRequest = model<IServiceRequest>('ServiceRequest', ServiceRequestSchema);
