import request from 'supertest';
import app from '../app';
import userModel from '../models/auth';
import { connect, clearDatabase, closeDatabase } from './setup';

describe('Auth API', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  const userData = {
    email: 'test@example.com',
    password: 'password123',
    username: 'tester',
    instrument: 'guitar',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');

      const userInDb = await userModel.findOne({ email: userData.email });
      expect(userInDb).not.toBeNull();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user and return tokens', async () => {
      await request(app).post('/api/auth/register').send(userData);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(userData.email);
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens when given a valid refreshToken', async () => {
      await request(app).post('/api/auth/register').send(userData);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      const oldRefresh = loginRes.body.tokens.refreshToken;
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: oldRefresh });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');
      expect(res.body._id).toBe(loginRes.body.user._id);
    });

    it('should reject missing refreshToken', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/No refresh token provided/i);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and remove the refreshToken', async () => {
      await request(app).post('/api/auth/register').send(userData);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      const refresh = loginRes.body.tokens.refreshToken;
      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: refresh });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/logged out successfully/i);

      const retry = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: refresh });

      expect(retry.status).toBe(401);
      expect(retry.body.message).toMatch(/Refresh token not recognized/i);
    });
  });
});
