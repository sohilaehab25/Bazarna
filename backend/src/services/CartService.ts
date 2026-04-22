import { CartRepository } from '../repositories/CartRepository';
import { ProductRepository } from '../repositories/ProductRepository';
import { Cart } from '../models/Cart';

export class CartService {
  private cartRepository = new CartRepository();
  private productRepository = new ProductRepository();

  async getCart(userId: string): Promise<Cart | null> {
    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }
    return cart;
  }

  async addToCart(userId: string, productId: string, quantity: number): Promise<Cart> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    const cart = await this.cartRepository.addItem(userId, productId, quantity);
    if (!cart) throw new Error('Could not add to cart');

    await this.recalculateTotalPrice(userId);
    return (await this.cartRepository.findByUserId(userId))!;
  }

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<Cart> {
    if (quantity > 0) {
      const product = await this.productRepository.findById(productId);
      if (!product) throw new Error('Product not found');
      if (product.stock < quantity) throw new Error('Insufficient stock');
    }

    const cart = await this.cartRepository.updateItemQuantity(userId, productId, quantity);
    if (!cart) throw new Error('Cart not found');

    await this.recalculateTotalPrice(userId);
    return (await this.cartRepository.findByUserId(userId))!;
  }

  async removeItem(userId: string, productId: string): Promise<Cart> {
    const cart = await this.cartRepository.removeItem(userId, productId);
    if (!cart) throw new Error('Cart not found');

    await this.recalculateTotalPrice(userId);
    return (await this.cartRepository.findByUserId(userId))!;
  }

  private async recalculateTotalPrice(userId: string): Promise<void> {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) return;

    let total = 0;
    for (const item of cart.items) {
      const product: any = item.productId;
      if (product && product.price) {
        total += product.price * item.quantity;
      }
    }

    await this.cartRepository.updateTotalPrice(userId, total);
  }
}
