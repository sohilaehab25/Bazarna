import OrderModel, { Order } from '../models/Order';

export class OrderRepository {
  async create(orderData: Partial<Order>): Promise<Order> {
    const order = new OrderModel(orderData);
    return await order.save();
  }

  async findById(id: string): Promise<Order | null> {
    return await OrderModel.findById(id).populate('userId').populate('items.productId');
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return await OrderModel.find({ userId }).populate('userId').populate('items.productId').sort({ createdAt: -1 });
  }

  async findAll(): Promise<Order[]> {
    return await OrderModel.find().populate('userId').populate('items.productId').sort({ createdAt: -1 });
  }

  async update(id: string, orderData: Partial<Order>): Promise<Order | null> {
    return await OrderModel.findByIdAndUpdate(id, orderData, { new: true }).populate('userId').populate('items.productId');
  }

  async delete(id: string): Promise<boolean> {
    const result = await OrderModel.findByIdAndDelete(id);
    return !!result;
  }
}