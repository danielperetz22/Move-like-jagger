import { Request, Response } from 'express';
import showModel, { IShow } from '../models/show';
import groupModel from '../models/group';
import userModel from '../models/auth';
import songModel from '../models/song';

export class ShowController {
  // Create a show (admin only)
  async create(req: Request, res: Response) {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const adminUser = await userModel.findById(userId);
    if (!adminUser?.admin) {
      return res.status(403).json({ message: 'Only admins can create shows' });
    }

    const { name, groupId, songId } = req.body;
    
    // Check if group exists
    const group = await groupModel.findById(groupId).populate('members');
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Get the song from database
    const song = await songModel.findById(songId);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    const show = await showModel.create({
      name,
      createdBy: userId,
      groupId,
      song: {
        _id: song._id,
        title: song.title,
        artist: song.artist,
        lyrics: song.rawLyrics,
        chords: song.chords
      },
      participants: (group.members as any[]).map(member => ({
        userId: member._id,
        status: 'pending'
      }))
    });
    
    res.status(201).json(show);
  }
  
  // Get shows for a user
  async getForUser(req: Request, res: Response) {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const shows = await showModel.find({
      $or: [
        { 'participants.userId': userId },
        { createdBy: userId }
      ]
    })
    .populate('createdBy', 'username')
    .populate('groupId', 'name')
    .populate('participants.userId', 'username instrument');
    
    res.json(shows);
  }
  
  // Update show participation status
  async updateParticipation(req: Request, res: Response) {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const { showId, status } = req.body;
    
    const show = await showModel.findOneAndUpdate(
      { 
        _id: showId, 
        'participants.userId': userId 
      },
      {
        $set: { 'participants.$.status': status }
      },
      { new: true }
    );
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found or user not invited' });
    }
    
    res.json(show);
  }
  
  // Get show details
  async getOne(req: Request, res: Response) {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const showId = req.params.id;
    const show = await showModel.findById(showId)
      .populate('createdBy', 'username')
      .populate('groupId', 'name')
      .populate('participants.userId', 'username instrument');
    
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Check if user is a participant or creator
    const isParticipant = show.participants.some(p => 
      p.userId._id.toString() === userId.toString() && p.status === 'accepted'
    );
    const isCreator = show.createdBy._id.toString() === userId.toString();
    
    if (!isParticipant && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to view this show' });
    }
    
    res.json(show);
  }
  
  // Update show status (start or end)
  async updateStatus(req: Request, res: Response) {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const showId = req.params.id;
    const { status } = req.body;
    
    if (!['created', 'active', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Only admins can update show status
    const adminUser = await userModel.findById(userId);
    if (!adminUser?.admin) {
      return res.status(403).json({ message: 'Only admins can update show status' });
    }
    
    const show = await showModel.findById(showId);
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    
    // Only the creator can update the show
    if (show.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the creator can update the show' });
    }
    
    show.status = status;
    await show.save();
    
    res.json(show);
  }
}
