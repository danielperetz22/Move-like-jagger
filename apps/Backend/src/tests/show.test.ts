import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import initApp from '../server';
import userModel from '../models/auth';
import songModel from '../models/song';
import showModel from '../models/show';

let mongo: MongoMemoryServer;
let adminToken: string;
let adminId: string;
let regularToken: string;
let regularUserId: string;
let groupId: string;
let songId: string;
let showId: string;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  // Register an admin user
  const adminData = {
    email: 'admin@example.com',
    password: 'password123',
    username: 'adminuser',
    instrument: 'guitar'
  };
  const adminRes = await request(initApp)
    .post('/api/auth/register')
    .send(adminData);

  adminToken = adminRes.body.tokens.accessToken;
  adminId = adminRes.body.user._id;

  // Set admin flag for the admin user
  await userModel.findByIdAndUpdate(adminId, { admin: true });

  // Register a regular user
  const userData = {
    email: 'user@example.com',
    password: 'password123',
    username: 'regularuser',
    instrument: 'drums'
  };
  const userRes = await request(initApp)
    .post('/api/auth/register')
    .send(userData);

  regularToken = userRes.body.tokens.accessToken;
  regularUserId = userRes.body.user._id;

  // Create a group
  const groupRes = await request(initApp)
    .post('/api/groups')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ 
      name: 'Test Group',
      memberIds: [regularUserId]
    });
  
  groupId = groupRes.body._id;

  // Create a song
  const song = await songModel.create({
    admin: adminId,
    artist: 'Test Artist',
    title: 'Test Song',
    rawLyrics: 'Test lyrics content',
    chords: []
  });
  
  songId = song._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  // Clear shows before each test
  await showModel.deleteMany({});
});

describe('Show API', () => {
  describe('POST /api/shows', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(initApp)
        .post('/api/shows')
        .send({
          name: 'Test Show',
          groupId,
          songId
        });

      expect(res.status).toBe(401);
    });

    it('should reject non-admin users from creating shows', async () => {
      const res = await request(initApp)
        .post('/api/shows')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          name: 'Test Show',
          groupId,
          songId
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Only admins can create shows');
    });

    it('should allow admin to create a show', async () => {
      const res = await request(initApp)
        .post('/api/shows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Show',
          groupId,
          songId
        });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: 'Test Show',
        createdBy: adminId,
        groupId,
        status: 'created'
      });
      expect(res.body.song).toMatchObject({
        title: 'Test Song',
        artist: 'Test Artist',
        lyrics: 'Test lyrics content'
      });
      expect(res.body.participants).toHaveLength(1);
      expect(res.body.participants[0]).toMatchObject({
        userId: regularUserId,
        status: 'pending'
      });

      showId = res.body._id;
    });

    it('should return 404 for non-existent group', async () => {
      const fakeGroupId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(initApp)
        .post('/api/shows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Show',
          groupId: fakeGroupId,
          songId
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Group not found');
    });

    it('should return 404 for non-existent song', async () => {
      const fakeSongId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(initApp)
        .post('/api/shows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Show',
          groupId,
          songId: fakeSongId
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Song not found');
    });
  });

  describe('GET /api/shows/my-shows', () => {
    beforeEach(async () => {
      // Create a show for testing
      await request(initApp)
        .post('/api/shows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Show',
          groupId,
          songId
        });
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(initApp).get('/api/shows/my-shows');
      expect(res.status).toBe(401);
    });

    it('should return shows for admin user', async () => {
      const res = await request(initApp)
        .get('/api/shows/my-shows')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Test Show');
      expect(res.body[0].createdBy.username).toBe('adminuser');
    });

    it('should return shows for regular user (as participant)', async () => {
      const res = await request(initApp)
        .get('/api/shows/my-shows')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].participants).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: expect.objectContaining({
              username: 'regularuser'
            })
          })
        ])
      );
    });
  });

  describe('PUT /api/shows/participation', () => {
    beforeEach(async () => {
      // Create a show for testing
      const res = await request(initApp)
        .post('/api/shows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Show',
          groupId,
          songId
        });
      showId = res.body._id;
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(initApp)
        .put('/api/shows/participation')
        .send({
          showId,
          status: 'accepted'
        });

      expect(res.status).toBe(401);
    });

    it('should allow participant to update their status', async () => {
      const res = await request(initApp)
        .put('/api/shows/participation')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          showId,
          status: 'accepted'
        });

      expect(res.status).toBe(200);
      expect(res.body.participants[0]).toMatchObject({
        userId: regularUserId,
        status: 'accepted'
      });
    });

    it('should return 404 for non-existent show or non-participant', async () => {
      const fakeShowId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(initApp)
        .put('/api/shows/participation')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          showId: fakeShowId,
          status: 'accepted'
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Show not found or user not invited');
    });
  });

  describe('GET /api/shows/:id', () => {
    beforeEach(async () => {
      // Create a show for testing
      const res = await request(initApp)
        .post('/api/shows')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Show',
          groupId,
          songId
        });
      showId = res.body._id;
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(initApp).get(`/api/shows/${showId}`);
      expect(res.status).toBe(401);
    });

    it('should return show details for creator', async () => {
      const res = await request(initApp)
        .get(`/api/shows/${showId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(showId);
      expect(res.body.name).toBe('Test Show');
      expect(res.body.createdBy.username).toBe('adminuser');
    });

    it('should return show details for accepted participant', async () => {
      // First accept participation
      await request(initApp)
        .put('/api/shows/participation')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          showId,
          status: 'accepted'
        });

      const res = await request(initApp)
        .get(`/api/shows/${showId}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(showId);
      expect(res.body.name).toBe('Test Show');
    });

    it('should reject pending participants from viewing show details', async () => {
      const res = await request(initApp)
        .get(`/api/shows/${showId}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Not authorized to view this show');
    });

    it('should return 404 for non-existent show', async () => {
      const fakeShowId = new mongoose.Types.ObjectId().toString();
      
      const res = await request(initApp)
        .get(`/api/shows/${fakeShowId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Show not found');
    });
  });
});