import { ApiResponse } from '../../../../../app.type';

export interface AdminCategory {
  _id: string;
  name: string;
  description: string;
  slug: string;
  imageUrl: string;
  featured: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export type AdminCategoriesSortBy = 'name' | 'createdAt' | 'productCount';
export type AdminCategoriesSortOrder = 'asc' | 'desc';

export interface AdminCategoriesQuery {
  page: number;
  pageSize: number;
  search?: string;
  featured?: boolean;
  sortBy: AdminCategoriesSortBy;
  sortOrder: AdminCategoriesSortOrder;
}

export interface AdminCategoriesPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminCategoriesResponse {
  items: AdminCategory[];
  pagination: AdminCategoriesPagination;
}

export interface CreateCategoryPayload {
  name: string;
  description: string;
  slug?: string;
  imageUrl?: string;
  featured?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  slug?: string;
  imageUrl?: string;
  featured?: boolean;
}

export type AdminCategoriesResponseApi = ApiResponse<AdminCategoriesResponse>;
export type AdminCategoryApi = ApiResponse<AdminCategory>;
