import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import nock from 'nock';
import app from '../app';

let mongo: MongoMemoryServer;
let accessToken: string;
let userId: string;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());

  // Register a user and grab their accessToken
  const userData = {
    email: 'test@example.com',
    password: 'password123',
    username: 'testuser',
    instrument: 'guitar'
  };
  const res = await request(app)
    .post('/api/auth/register')
    .send(userData);

  accessToken = res.body.tokens.accessToken;
  userId      = res.body.user._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
  nock.cleanAll();
  nock.restore();
});

describe('Auth Endpoints', () => {
  // Add tests for new functionality
  describe('User Profile and Search', () => {
    it('GET /api/auth/me → returns current user details', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        _id: userId,
        email: 'test@example.com',
        username: 'testuser',
        instrument: 'guitar',
        admin: expect.any(Boolean)
      });
    });

    it('GET /api/auth/me → rejects unauthenticated access', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/search → finds users by username', async () => {
      // Register another test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'searchtest@example.com',
          password: 'password123',
          username: 'searchuser',
          instrument: 'piano'
        });
      
      const res = await request(app)
        .get('/api/auth/search?query=search')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toMatchObject({
        username: 'searchuser',
        email: 'searchtest@example.com'
      });
    });

    it('GET /api/auth/search → finds users by email', async () => {
      const res = await request(app)
        .get('/api/auth/search?query=searchtest')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toMatchObject({
        username: 'searchuser',
        email: 'searchtest@example.com'
      });
    });

    it('GET /api/auth/search → requires authentication', async () => {
      const res = await request(app)
        .get('/api/auth/search?query=test');
      
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/search → requires query parameter', async () => {
      const res = await request(app)
        .get('/api/auth/search')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(400);
    });
  });
});

describe('Protected Song CRUD', () => {
  it('rejects unauthenticated access to GET /api/songs', async () => {
    const res = await request(app).get('/api/songs');
    expect(res.status).toBe(401);
  });

  let songId: string;

  it('POST /api/songs → creates a new song with admin set', async () => {
    const payload = {
      artist:    'Coldplay',
      title:     'Yellow',
      rawLyrics: 'Look at the stars...',
      chords: [
        { id: 'c_major', name: 'C Major', notes: ['C','E','G'], intervals: ['P1','M3','P5'], midiKeys: [60,64,67] }
      ]
    };

    const res = await request(app)
      .post('/api/songs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      artist:    payload.artist,
      title:     payload.title,
      rawLyrics: payload.rawLyrics,
      chords:    payload.chords,
      admin:     userId
    });

    songId = res.body._id;
  });

  it('GET /api/songs → returns only this admin’s songs', async () => {
    const res = await request(app)
      .get('/api/songs')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe(songId);
  });

  it('GET /api/songs/:id → returns the specific song', async () => {
    const res = await request(app)
      .get(`/api/songs/${songId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(songId);
    expect(res.body.admin).toBe(userId);
  });

  it('returns 404 for another admin’s songId', async () => {
    // create a second user
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'foo@example.com',
        password: 'pass1234',
        username: 'foo',
        instrument: 'bass'
      });
    const otherToken = res2.body.tokens.accessToken;

    // try to fetch the first song with the second user’s token
    const res = await request(app)
      .get(`/api/songs/${songId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });

  it('GET /api/songs/search/:artist/:title → fetches, saves and returns the song', async () => {
    // mock external APIs
    nock('https://api.lyrics.ovh')
      .get('/v1/Coldplay/Yellow')
      .reply(200, { lyrics: 'Look at the stars...' });

    nock('https://chords.alday.dev')
      .get('/chords')
      .query({ 'note[]': ['C', 'G'] })  
        .reply(200, [
        { id: 'c_major', name: 'C Major', notes: ['C','E','G'], intervals: ['P1','M3','P5'], midiKeys: [60,64,67] },
        { id: 'g_major', name: 'G Major', notes: ['G','B','D'], intervals: ['P1','M3','P5'], midiKeys: [67,71,74] }
      ]);

    const res = await request(app)
      .get('/api/songs/search/Coldplay/Yellow?chords=C,G')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      artist:    'Coldplay',
      title:     'Yellow',
      rawLyrics: 'Look at the stars...',
      chords: expect.arrayContaining([
        expect.objectContaining({ id: 'c_major' }),
        expect.objectContaining({ id: 'g_major' })
      ]),
      admin: expect.any(String)
    });
  });
});
