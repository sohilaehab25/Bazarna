import CartModel, { Cart, ICartItem } from '../models/Cart';
import mongoose from 'mongoose';

export class CartRepository {
  async findByUserId(userId: string): Promise<Cart | null> {
    return await CartModel.findOne({ userId }).populate('items.productId');
  }

  async create(userId: string): Promise<Cart> {
    const cart = new CartModel({ userId, items: [], totalPrice: 0 });
    return await cart.save();
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<Cart | null> {
    const cart = await CartModel.findOne({ userId });
    if (!cart) {
      const newCart = new CartModel({
        userId,
        items: [{ productId: new mongoose.Types.ObjectId(productId), quantity }],
        totalPrice: 0 // Will be updated by service
      });
      return await newCart.save();
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId: new mongoose.Types.ObjectId(productId), quantity });
    }

    return await cart.save();
  }

  async updateItemQuantity(userId: string, productId: string, quantity: number): Promise<Cart | null> {
    const cart = await CartModel.findOne({ userId });
    if (!cart) return null;

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
      return await cart.save();
    }

    return cart;
  }

  async removeItem(userId: string, productId: string): Promise<Cart | null> {
    return await CartModel.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId: new mongoose.Types.ObjectId(productId) } } },
      { new: true }
    ).populate('items.productId');
  }

  async clearCart(userId: string): Promise<void> {
    await CartModel.findOneAndUpdate({ userId }, { items: [], totalPrice: 0 });
  }

  async updateTotalPrice(userId: string, totalPrice: number): Promise<void> {
    await CartModel.findOneAndUpdate({ userId }, { totalPrice });
  }
}
