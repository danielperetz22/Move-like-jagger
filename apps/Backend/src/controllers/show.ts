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
      
      // DELETE any existing active shows first, instead of just marking them completed
      console.log('Deleting any existing active shows...');
      const deleteResult = await showModel.deleteMany({ status: 'active' });
      console.log(`Deleted ${deleteResult.deletedCount} active shows`);
      
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
      console.log(`New show created with ID: ${show._id}`);
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

    // Allow access to all users if the show is active
    // Only allow creator access if the show is completed
    const isCreator = show.createdBy._id.toString() === userId.toString();
    const user = await userModel.findById(userId);
    const isAdmin = user?.admin === true;
    
    if (show.status === 'active' || isCreator || isAdmin) {
      // Any user can view active shows, or creator/admin can view any show
      return res.json(show);
    } else {
      return res.status(403).json({ message: 'Not authorized to view this show' });
    }
  };

  // Update show status (start or end)
  updateStatus = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      const showId = req.params.id;
      const { status } = req.body;
      
      console.log(`Updating show ${showId} status to: ${status}`);
      
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
      
      // REMOVE THIS CHECK - allow any admin to update show status
      // if (show.createdBy.toString() !== userId.toString()) {
      //   return res.status(403).json({ message: 'Only the creator can update the show' });
      // }
      
      show.status = status;
      await show.save();
      
      console.log(`Show ${showId} status updated to ${status}`);
      
      return res.json(show);
    } catch (error: any) {
      console.error(`Error updating show status:`, error);
      return res.status(500).json({ 
        message: 'Failed to update show status',
        error: error.message
      });
    }
  };

  // End all active shows (admin only)
  endAllShows = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      // Only admins can end all shows
      const adminUser = await userModel.findById(userId);
      if (!adminUser?.admin) {
        return res.status(403).json({ message: 'Only admins can end all shows' });
      }
      
      console.log(`Admin ${userId} is ending all active shows`);
      
      // End all active shows
      const result = await showModel.updateMany(
        { status: 'active' },
        { status: 'completed' }
      );
      
      console.log(`Updated ${result.modifiedCount} active shows to completed`);
      
      return res.json({ 
        success: true, 
        message: `${result.modifiedCount} shows ended` 
      });
    } catch (error: any) {
      console.error(`Error ending all shows:`, error);
      return res.status(500).json({ 
        message: 'Failed to end all shows',
        error: error.message
      });
    }
  };

  // Delete a specific show (admin only)
  deleteShow = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      const showId = req.params.id;
      
      // Only admins can delete shows
      const adminUser = await userModel.findById(userId);
      if (!adminUser?.admin) {
        return res.status(403).json({ message: 'Only admins can delete shows' });
      }
      
      console.log(`Admin ${userId} is deleting show ${showId}`);
      
      const show = await showModel.findById(showId);
      if (!show) {
        return res.status(404).json({ message: 'Show not found' });
      }
      
      // Allow any admin to delete the show
      await showModel.findByIdAndDelete(showId);
      
      console.log(`Show ${showId} has been deleted`);
      
      return res.json({ 
        success: true, 
        message: 'Show deleted successfully' 
      });
    } catch (error: any) {
      console.error(`Error deleting show:`, error);
      return res.status(500).json({ 
        message: 'Failed to delete show',
        error: error.message
      });
    }
  };

  // Delete all active shows (admin only)
  deleteAllActiveShows = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      
      // Only admins can delete shows
      const adminUser = await userModel.findById(userId);
      if (!adminUser?.admin) {
        return res.status(403).json({ message: 'Only admins can delete shows' });
      }
      
      console.log(`Admin ${userId} is deleting all active shows`);
      
      // Delete all active shows
      const result = await showModel.deleteMany({ status: 'active' });
      
      console.log(`Deleted ${result.deletedCount} active shows`);
      
      return res.json({ 
        success: true, 
        message: `${result.deletedCount} shows deleted` 
      });
    } catch (error: any) {
      console.error(`Error deleting active shows:`, error);
      return res.status(500).json({ 
        message: 'Failed to delete active shows',
        error: error.message
      });
    }
  };
}
