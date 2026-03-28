import { DataSource } from 'typeorm';
import { UserEntity } from '../models/UserEntity';
import { CategoryEntity } from '../models/CategoryEntity';
import { ProductEntity } from '../models/ProductEntity';
import { OrderEntity } from '../models/OrderEntity';
import { OrderItemEntity } from '../models/OrderItemEntity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cute_bazar',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  entities: [UserEntity, CategoryEntity, ProductEntity, OrderEntity, OrderItemEntity],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});