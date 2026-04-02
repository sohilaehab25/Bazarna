import 'reflect-metadata';
import { UserRole } from '../../models/User';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(ROLES_KEY, roles, target.constructor, propertyKey);
  };
};