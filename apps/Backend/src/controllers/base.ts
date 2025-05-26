import { Request, Response } from 'express';
import { Model, Document, Types } from 'mongoose';

export abstract class BaseController<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const items = await this.model.find();
      res.status(200).json(items);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error retrieving data' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid ID format' });
      return;
    }

    try {
      const item = await this.model.findById(id);
      if (!item) {
        res.status(404).json({ message: 'Item not found' });
        return;
      }
      res.status(200).json(item);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error retrieving item' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const newItem = new this.model(req.body);
      const saved = await newItem.save();
      res.status(201).json(saved);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error creating item' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid ID format' });
      return;
    }

    try {
      const updated = await this.model.findByIdAndUpdate(id, req.body, { new: true });
      if (!updated) {
        res.status(404).json({ message: 'Item not found' });
        return;
      }
      res.status(200).json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error updating item' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid ID format' });
      return;
    }

    try {
      const deleted = await this.model.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ message: 'Item not found' });
        return;
      }
      res.status(200).json({ message: 'Item deleted successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error deleting item' });
    }
  }
}
