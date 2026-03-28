import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { UserEntity } from './UserEntity';
import { CategoryEntity } from './CategoryEntity';
import { OrderItemEntity } from './OrderItemEntity';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @Column('uuid')
  categoryId: string;

  @ManyToOne(() => CategoryEntity)
  @JoinColumn({ name: 'categoryId' })
  category: CategoryEntity;

  @Column('uuid')
  storeOwnerId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'storeOwnerId' })
  storeOwner: UserEntity;

  @Column('jsonb', { default: [] })
  images: string[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrderItemEntity, orderItem => orderItem.product)
  orderItems: OrderItemEntity[];
}