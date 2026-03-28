import { Repository } from 'typeorm';
import { AppDataSource } from '../config/dataSource';
import { UserEntity, UserRole } from '../models/UserEntity';
import { User, CreateUserDTO, UpdateUserDTO } from '../models/User';

export class UserRepository {
  private repository: Repository<UserEntity> = AppDataSource.getRepository(UserEntity);

  async create(userData: CreateUserDTO): Promise<User> {
    const user = this.repository.create({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || UserRole.USER,
      isActive: true,
    });

    const savedUser = await this.repository.save(user);
    return this.mapEntityToUser(savedUser);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.repository.findOne({ where: { id } });
    return user ? this.mapEntityToUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.repository.findOne({ where: { email } });
    return user ? this.mapEntityToUser(user) : null;
  }

  async update(id: string, userData: UpdateUserDTO): Promise<User | null> {
    const updateData: Partial<UserEntity> = {};

    if (userData.firstName !== undefined) updateData.firstName = userData.firstName;
    if (userData.lastName !== undefined) updateData.lastName = userData.lastName;
    if (userData.isActive !== undefined) updateData.isActive = userData.isActive;

    if (Object.keys(updateData).length === 0) return null;

    updateData.updatedAt = new Date();

    await this.repository.update(id, updateData);
    const updatedUser = await this.repository.findOne({ where: { id } });
    return updatedUser ? this.mapEntityToUser(updatedUser) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected > 0;
  }

  private mapEntityToUser(entity: UserEntity): User {
    return {
      id: entity.id,
      email: entity.email,
      password: entity.password,
      firstName: entity.firstName,
      lastName: entity.lastName,
      role: entity.role,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}