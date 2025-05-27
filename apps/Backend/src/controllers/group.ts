import { Request, Response } from 'express';
import groupModel, { IGroup } from '../models/group';
import userModel from '../models/auth';
import mongoose from 'mongoose';

export class GroupController {
    // Create a new group (admins only)
    async create(req: Request, res: Response) {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const adminUser = await userModel.findById(userId);
        if (!adminUser?.admin) {
            return res.status(403).json({ message: 'Only admins can create groups' });
        }

        const { name, memberIds } = req.body as { name: string; memberIds: string[] };

        // Filter out any admin IDs; only allow non-admin users
        const validMembers = await userModel.find({ _id: { $in: memberIds }, admin: false });

        // Create group document
        const group = await groupModel.create({
            name,
            createdBy: userId,
            members: validMembers.map(u => u._id)
        });

        res.status(201).json(group);
    }

    // Add members to existing group (admins only)
    async addMembers(req: Request, res: Response) {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const adminUser = await userModel.findById(userId);
        if (!adminUser?.admin) {
            return res.status(403).json({ message: 'Only admins can add members' });
        }

        const groupId = req.params.id;
        const { memberIds } = req.body as { memberIds: string[] };

        // Find the group
        const group = await groupModel.findById(groupId) as IGroup;
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Filter to non-admin users
        const validMembers = await userModel.find({ _id: { $in: memberIds }, admin: false });

        // Append any new IDs (avoid duplicates)
        const newIds = validMembers
            .map(u => u._id)
            .filter(id => !group.members.includes(new mongoose.Types.ObjectId(id)));

        group.members.push(...newIds.map(id => new mongoose.Types.ObjectId(id)));
        await group.save();

        res.status(200).json(group);
    }

    // (Optional) List all groups
    async list(req: Request, res: Response) {
        const groups = await groupModel.find().populate('members', 'username email');
        res.json(groups);
    }

    // (Optional) Get a single group
    async getOne(req: Request, res: Response) {
        const group = await groupModel.findById(req.params.id).populate('members', 'username email');
        if (!group) return res.status(404).json({ message: 'Group not found' });
        res.json(group);
    }
}
