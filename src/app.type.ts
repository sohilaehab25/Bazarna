// =============================================================================
// Central Type Definitions
// =============================================================================

// ---------------------------------------------------------------------------
// Generic API Response
// ---------------------------------------------------------------------------

export interface ApiResponse<T = undefined> {
    success: boolean;
    message: string;
    data: T;
}

// ---------------------------------------------------------------------------
// Auth / User
// ---------------------------------------------------------------------------

export interface User {
    id?: string;
    _id?: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
}

// ---------------------------------------------------------------------------
// Products & Categories
// ---------------------------------------------------------------------------

export interface Category {
    _id: string;
    name: string;
    description: string;
}

export interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    categoryId: Category;
    imageUrl: string;
    stock: number;
    rating?: number;
    reviews?: number;
}

export interface FeaturedInfo {
    icon: string;
    title: string;
    description: string;
    link: string;
    linkText: string;
}

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

export interface CartItem {
    product: Product;
    quantity: number;
}

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------

export interface WishlistItem extends Product {
    addedAt: Date;
}

// ---------------------------------------------------------------------------
// Orders / Checkout
// ---------------------------------------------------------------------------

export interface customerInfo {
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    city: string;
}

export interface items {
    productId: string;
    quantity: number;
}

export interface Order {
    _id: string;
    orderNumber?: number;
    items: items[];
    totalPrice: number;
    status: 'pending' | 'paid' | 'processing' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    paymentMethod: 'cash' | 'visa' | 'paymob';
    createdAt: Date;
    customer?: customerInfo;
}

export interface GuestCheckoutPayload {
    items: items[];
    paymentMethod: 'cash' | 'visa' | 'paymob';
    customer: customerInfo;
}
