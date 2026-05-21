import RefreshTokenModel, { RefreshToken } from '../models/RefreshToken';

export class RefreshTokenRepository {
  async create(tokenData: Partial<RefreshToken>): Promise<RefreshToken> {
    const token = new RefreshTokenModel(tokenData);
    return await token.save();
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return await RefreshTokenModel.findOne({ tokenHash });
  }

  async updateLastUsed(tokenHash: string, lastUsedAt: Date): Promise<void> {
    await RefreshTokenModel.updateOne({ tokenHash }, { $set: { lastUsedAt } });
  }

  async revokeToken(tokenHash: string, data: { replacedByTokenHash?: string; revokedReason?: string }): Promise<void> {
    await RefreshTokenModel.updateOne(
      { tokenHash },
      {
        $set: {
          revokedAt: new Date(),
          replacedByTokenHash: data.replacedByTokenHash,
          revokedReason: data.revokedReason,
        },
      }
    );
  }

  async revokeAllForUser(userId: string, reason: string): Promise<void> {
    await RefreshTokenModel.updateMany(
      { userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date(), revokedReason: reason } }
    );
  }
}
