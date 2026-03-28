"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const UserEntity_1 = require("../models/UserEntity");
const CategoryEntity_1 = require("../models/CategoryEntity");
const ProductEntity_1 = require("../models/ProductEntity");
const OrderEntity_1 = require("../models/OrderEntity");
const OrderItemEntity_1 = require("../models/OrderItemEntity");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cute_bazar',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    entities: [UserEntity_1.UserEntity, CategoryEntity_1.CategoryEntity, ProductEntity_1.ProductEntity, OrderEntity_1.OrderEntity, OrderItemEntity_1.OrderItemEntity],
    migrations: ['src/migrations/*.ts'],
    subscribers: ['src/subscribers/*.ts'],
});
