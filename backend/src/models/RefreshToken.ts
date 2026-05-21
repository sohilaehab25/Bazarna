import mongoose, { Document, Schema } from 'mongoose';

export interface RefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  sessionId: string;
  expiresAt: Date;
  revokedAt?: Date;
  lastUsedAt?: Date;
  replacedByTokenHash?: string;
  ip?: string;
  userAgent?: string;
  revokedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  revokedAt: {
    type: Date,
  },
  lastUsedAt: {
    type: Date,
  },
  replacedByTokenHash: {
    type: String,
  },
  ip: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  revokedReason: {
    type: String,
  },
}, {
  timestamps: true,
});

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ userId: 1, sessionId: 1, expiresAt: 1 });

export default mongoose.model<RefreshToken>('RefreshToken', RefreshTokenSchema);
