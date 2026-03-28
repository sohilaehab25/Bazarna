import { Response } from 'express';
import { CategoryService } from '../../services/CategoryService';
import { AuthRequest } from '../../middlewares/auth';

const categoryService = new CategoryService();

export class CategoryController {
  async getAllCategories(req: AuthRequest, res: Response) {
    try {
      const categories = await categoryService.getAllCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async getCategory(req: AuthRequest, res: Response) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      res.json(category);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async createCategory(req: AuthRequest, res: Response) {
    try {
      const category = await categoryService.createCategory(req.body, req.user!.role);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateCategory(req: AuthRequest, res: Response) {
    try {
      const category = await categoryService.updateCategory(
        req.params.id,
        req.body,
        req.user!.role
      );

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      res.json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async deleteCategory(req: AuthRequest, res: Response) {
    try {
      const deleted = await categoryService.deleteCategory(req.params.id, req.user!.role);

      if (!deleted) {
        return res.status(404).json({ message: 'Category not found' });
      }

      res.json({ message: 'Category deleted successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}