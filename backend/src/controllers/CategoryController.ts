import { Request, Response } from 'express';
import { CategoryService } from '../services/CategoryService';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../dtos/CategoryDTOs';
import { validateDTO } from '../utils/validation';

const categoryService = new CategoryService();

export class CategoryController {
  async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await categoryService.getAllCategories();
      res.apiSuccess('Categories retrieved successfully', categories);
    } catch (error: any) {
      res.apiError(error.message, 500);
    }
  }

  async getCategory(req: Request, res: Response) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      if (!category) {
        return res.apiError('Category not found', 404);
      }

      res.apiSuccess('Category retrieved successfully', category);
    } catch (error: any) {
      res.apiError(error.message, 500);
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const createData: CreateCategoryDTO = req.body;
      await validateDTO(createData, CreateCategoryDTO);

      const category = await categoryService.createCategory(createData);
      res.apiSuccess('Category created successfully', category, 201);
    } catch (error: any) {
      res.apiError(error.message, 400);
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
    } catch (error: any) {
      res.apiError(error.message, 400);
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const deleted = await categoryService.deleteCategory(req.params.id);
      if (!deleted) {
        return res.apiError('Category not found', 404);
      }

      res.apiSuccess('Category deleted successfully');
    } catch (error: any) {
      res.apiError(error.message, 500);
    }
  }
}