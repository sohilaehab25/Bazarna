import { UserRepository } from '../repositories/UserRepository';
import { User, UpdateUserDTO, UserRole } from '../models/User';

export class UserService {
  private userRepository = new UserRepository();

  async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  async updateUser(id: string, userData: UpdateUserDTO, requestingUserId: string, requestingUserRole: UserRole): Promise<User | null> {
    // Users can update their own profile, admins can update anyone
    if (requestingUserId !== id && requestingUserRole !== UserRole.ADMIN) {
      throw new Error('Unauthorized to update this user');
    }

    return await this.userRepository.update(id, userData);
  }

  async deleteUser(id: string, requestingUserRole: UserRole): Promise<boolean> {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new Error('Only admins can delete users');
    }

    return await this.userRepository.delete(id);
  }

  async getAllUsers(requestingUserRole: UserRole): Promise<User[]> {
    if (requestingUserRole !== UserRole.ADMIN) {
      throw new Error('Only admins can view all users');
    }

    // This would need a method in repository to get all users
    // For now, return empty array
    return [];
  }
}