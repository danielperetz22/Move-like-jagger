import request from 'supertest';
import app from '../app';      
import nock from 'nock';

describe('Lyrics & Chords API', () => {
  beforeAll(() => {
    // Mock Lyrics.ovh
    nock('https://api.lyrics.ovh')
      .get('/v1/Coldplay/Yellow')
      .reply(200, { lyrics: 'Look at the stars...' });
    // Mock Alday.dev Chords
    nock('https://chords.alday.dev')
      .get('/chords')
      .query({ note: 'c' })
      .reply(200, [
        { id: 'c_major', name: 'C Major', notes: ['C','E','G'], intervals: ['P1','M3','P5'], midiKeys: [60,64,67] }
      ]);
  });

  it('GET /api/lyrics/:artist/:title → returns lyrics', async () => {
    const res = await request(app).get('/api/lyrics/Coldplay/Yellow');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('lyrics');
    expect(res.body.lyrics).toMatch(/Look at the stars/);
  });

  it('GET /api/chords?note=c → returns chord array', async () => {
    const res = await request(app).get('/api/chords?note=c');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({
      id: 'c_major',
      name: 'C Major',
      notes: expect.arrayContaining(['C','E','G'])
    });
  });
});
