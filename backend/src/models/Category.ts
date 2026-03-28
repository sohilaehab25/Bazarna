export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryDTO {
  name: string;
  description?: string;
  image?: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}