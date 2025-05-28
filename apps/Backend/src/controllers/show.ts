import { Request, Response } from 'express';
import showModel from '../models/show';
import userModel from '../models/auth';
import songModel from '../models/song';

export class ShowController {
  // Create a show (admin only)
  create = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      const { name, songId } = req.body;
      
      if (!songId) {
        return res.status(400).json({ message: 'Song ID is required' });
      }
      
      // Get the song to make sure it exists
      const song = await songModel.findById(songId);
      if (!song) {
        return res.status(404).json({ message: 'Song not found' });
      }
      
      // Create show without requiring a group
      const show = new showModel({
        name: name || `${song.artist} - ${song.title}`,
        createdBy: userId,
        // Remove groupId requirement
        song: {
          _id: song._id,
          title: song.title,
          artist: song.artist,
          lyrics: song.rawLyrics,
          chords: song.chords || []
        },
        status: 'active', // Default to active
      });
      
      await show.save();
      res.status(201).json(show);
    } catch (error) {
      console.error('Error creating show:', error);
      res.status(500).json({ message: 'Failed to create show' });
    }
  };

  // Get active shows
  getActive = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      // Find active shows created by admins
      const activeShow = await showModel.findOne({ 
        status: 'active'
      })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
      
      if (!activeShow) {
        return res.status(404).json({ message: 'No active shows found' });
      }
      
      res.json(activeShow);
    } catch (error) {
      console.error('Error getting active shows:', error);
      res.status(500).json({ message: 'Failed to get active shows' });
    }
  };

  // Get shows for a user
  getForUser = async (req: Request, res: Response): Promise<Response | void> => {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const shows = await showModel.find({
      $or: [
        { 'participants.userId': userId },
        { createdBy: userId }
      ]
    })
    .populate('createdBy', 'username')
    .populate('participants.userId', 'username instrument');
    
    res.json(shows);
  };

  // Update show participation status
  updateParticipation = async (req: Request, res: Response): Promise<Response | void> => {
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
  };

  // Get show details
  getOne = async (req: Request, res: Response): Promise<Response | void> => {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const showId = req.params.id;
    const show = await showModel.findById(showId)
    .populate('createdBy', 'username');
      
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }
    const isCreator = show.createdBy._id.toString() === userId.toString();
    if (!isCreator) {
      return res.status(403).json({ message: 'Not authorized to view this show' });
    }
    
    res.json(show);
  };

  // Update show status (start or end)
  updateStatus = async (req: Request, res: Response): Promise<Response | void> => {
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
  };
}
