import { ApiResponse, Category } from '../../../../../app.type';

export type AdminProductStatus = 'active' | 'draft' | 'archived';
export type AdminProductsStockState = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
export type AdminProductsSortBy = 'updatedAt' | 'createdAt' | 'name' | 'price' | 'stock' | 'status';
export type AdminProductsSortOrder = 'asc' | 'desc';
export type AdminProductsBulkAction = 'activate' | 'mark-draft' | 'archive' | 'delete';

export interface AdminProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  categoryId: Category | null;
  imageUrl: string;
  stock: number;
  lowStockThreshold?: number;
  status?: AdminProductStatus;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProductsQuery {
  page: number;
  pageSize: number;
  search: string;
  categoryId: string | null;
  status: AdminProductStatus | 'all';
  stockState: AdminProductsStockState;
  sortBy: AdminProductsSortBy;
  sortOrder: AdminProductsSortOrder;
}

export interface AdminProductsPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AdminProductsResponse {
  items: AdminProduct[];
  pagination: AdminProductsPagination;
  appliedFilters: {
    search: string;
    categoryId: string | null;
    status: AdminProductStatus | 'all';
    stockState: AdminProductsStockState;
    sortBy: AdminProductsSortBy;
    sortOrder: AdminProductsSortOrder;
  };
}

export interface AdminProductsBulkActionPayload {
  productIds: string[];
  action: AdminProductsBulkAction;
}

export interface AdminProductsBulkActionResult {
  matchedCount: number;
  modifiedCount: number;
  deletedCount: number;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  stock: number;
  lowStockThreshold?: number;
  status?: AdminProductStatus;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  imageUrl?: string;
  stock?: number;
  lowStockThreshold?: number;
  status?: AdminProductStatus;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export type AdminProductsResponseApi = ApiResponse<AdminProductsResponse>;
export type AdminProductsCategoriesApi = ApiResponse<Category[]>;
export type AdminProductsBulkActionApi = ApiResponse<AdminProductsBulkActionResult>;
export type AdminProductDetailApi = ApiResponse<AdminProduct>;
export type AdminProductCreateApi = ApiResponse<AdminProduct>;
export type AdminProductUpdateApi = ApiResponse<AdminProduct>;
