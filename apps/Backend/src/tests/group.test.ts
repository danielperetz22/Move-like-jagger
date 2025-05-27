import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import userModel from '../models/auth';

let mongo: MongoMemoryServer;
let adminToken: string;
let adminId: string;
let regularToken: string;
let regularUserId: string;
let groupId: string;

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
  const adminRes = await request(app)
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
  const userRes = await request(app)
    .post('/api/auth/register')
    .send(userData);

  regularToken = userRes.body.tokens.accessToken;
  regularUserId = userRes.body.user._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

describe('Group API', () => {
  it('rejects unauthenticated access to GET /api/groups', async () => {
    const res = await request(app).get('/api/groups');
    expect(res.status).toBe(401);
  });

  it('rejects non-admin user from creating a group', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${regularToken}`)
      .send({ name: 'Test Group' });

    expect(res.status).toBe(403);
  });

  it('allows admin to create a group', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ 
        name: 'Test Group',
        memberIds: [regularUserId]
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'Test Group',
      createdBy: adminId,
      members: expect.arrayContaining([regularUserId])
    });

    groupId = res.body._id;
  });

  it('allows admin to add members to a group', async () => {
    // Register another regular user
    const userData = {
      email: 'user2@example.com',
      password: 'password123',
      username: 'regularuser2',
      instrument: 'bass'
    };
    const userRes = await request(app)
      .post('/api/auth/register')
      .send(userData);

    const newUserId = userRes.body.user._id;

    // Add the new user to the group
    const res = await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberIds: [newUserId] });

    expect(res.status).toBe(200);
    expect(res.body.members).toContain(newUserId);
    expect(res.body.members).toContain(regularUserId);
  });

  it('rejects non-admin user from adding members to a group', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${regularToken}`)
      .send({ memberIds: ['someId'] });

    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent group', async () => {
    const fakeGroupId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/groups/${fakeGroupId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('returns all groups for authenticated user', async () => {
    const res = await request(app)
      .get('/api/groups')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]._id).toBe(groupId);
  });

  it('returns group details by ID', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(groupId);
    expect(res.body.name).toBe('Test Group');
    expect(res.body.createdBy).toBe(adminId);
    expect(Array.isArray(res.body.members)).toBe(true);
  });

  it('prevents adding non-existent users to group', async () => {
    const fakeUserId = new mongoose.Types.ObjectId().toString();
    
    const res = await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberIds: [fakeUserId] });

    expect(res.status).toBe(200);
    // No new members should be added since the ID doesn't exist
    expect(res.body.members).not.toContain(fakeUserId);
  });
});
