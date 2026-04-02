import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/User';

export class UserService {
  private userRepository = new UserRepository();

  async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    return await this.userRepository.update(id, userData);
  }

  async deleteUser(id: string): Promise<boolean> {
    return await this.userRepository.delete(id);
  }
}