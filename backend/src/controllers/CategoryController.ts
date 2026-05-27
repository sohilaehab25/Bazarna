import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../dtos/CategoryDTOs';
import { validateDTO } from '../utils/validation';
import { AdminCategoryListQuery, AdminCategorySortBy, AdminCategorySortOrder } from '../repositories/CategoryRepository';
import { Category } from '../models/Category';

const categoryService = new CategoryService();

export class CategoryController {
  async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await categoryService.getAllCategories();
      res.apiSuccess('Categories retrieved successfully', categories);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch categories';
      res.apiError(message, 500);
    }
  }

  async getAdminCategories(req: Request, res: Response) {
    try {
      const query: AdminCategoryListQuery = {
        page: Math.max(1, parseInt(req.query.page as string) || 1),
        pageSize: Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 12)),
        search: (req.query.search as string) || undefined,
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        sortBy: this.parseSortBy(req.query.sortBy),
        sortOrder: this.parseSortOrder(req.query.sortOrder),
      };

      const result = await categoryService.getAdminCategories(query);
      const productCounts = await categoryService.getProductCounts();

      // Attach product counts to items
      const itemsWithCounts = result.items.map((item) => ({
        ...item.toObject(),
        productCount: productCounts.get(item._id.toString()) ?? 0,
      }));

      res.apiSuccess('Admin categories retrieved successfully', {
        items: itemsWithCounts,
        pagination: result.pagination,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch categories';
      res.apiError(message, 500);
    }
  }

  async getCategory(req: Request, res: Response) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      if (!category) {
        return res.apiError('Category not found', 404);
      }

      res.apiSuccess('Category retrieved successfully', category);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch category';
      res.apiError(message, 500);
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const createData: CreateCategoryDTO = req.body;
      await validateDTO(createData, CreateCategoryDTO);

      const categoryData: Partial<Category> = {
        name: createData.name,
        description: createData.description,
        slug: createData.slug,
        imageUrl: createData.imageUrl ?? '',
        featured: createData.featured ?? false,
      };

      const category = await categoryService.createCategory(categoryData);
      res.apiSuccess('Category created successfully', category, 201);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create category';
      res.apiError(message, 400);
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const updateData: UpdateCategoryDTO = req.body;
      await validateDTO(updateData, UpdateCategoryDTO);

      const category = await categoryService.updateCategory(req.params.id, updateData);
      if (!category) {
        return res.apiError('Category not found', 404);
      }

      res.apiSuccess('Category updated successfully', category);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update category';
      res.apiError(message, 400);
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const deleted = await categoryService.deleteCategory(req.params.id);
      if (!deleted) {
        return res.apiError('Category not found', 404);
      }

      res.apiSuccess('Category deleted successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete category';
      res.apiError(message, 500);
    }
  }

  private parseSortBy(value: unknown): AdminCategorySortBy {
    const allowed: AdminCategorySortBy[] = ['name', 'createdAt', 'updatedAt'];
    if (typeof value === 'string' && allowed.includes(value as AdminCategorySortBy)) {
      return value as AdminCategorySortBy;
    }
    return 'name';
  }

  private parseSortOrder(value: unknown): AdminCategorySortOrder {
    if (value === 'asc' || value === 'desc') return value;
    return 'asc';
  }
}