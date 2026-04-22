import UserModel, { User } from '../models/User';

export class UserRepository {
  async create(userData: Partial<User>): Promise<User> {
    const user = new UserModel(userData);
    return await user.save();
  }

  async findById(id: string): Promise<User | null> {
    return await UserModel.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await UserModel.findOne({ email });
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return await UserModel.findOne({ emailVerificationToken: token });
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    return await UserModel.findByIdAndUpdate(id, userData, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }
}