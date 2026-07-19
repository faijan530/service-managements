import request from 'supertest';
import app from '../src/index';

// Mock the AI module so we don't actually hit the LLM during tests
jest.mock('../src/utils/aiAnalysis', () => ({
  analyzeRequestText: jest.fn().mockResolvedValue({
    summary: 'Mock AI Summary',
    suggestedCategory: 'SOFTWARE',
    suggestedPriority: 'HIGH',
    reason: 'Mock Reason',
    fallbackUsed: false,
  })
}));

describe('Service Requests', () => {
  let userToken: string;
  let ticketId: string;

  beforeEach(async () => {
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123'
    });
    userToken = userRes.body.token;
  });

  describe('Create Request', () => {
    it('should successfully create a valid request', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Cannot access email',
          description: 'I am getting a 403 error when trying to open outlook.',
          category: 'SOFTWARE',
          priority: 'HIGH'
        });

      expect(res.status).toBe(201);
      expect(res.body.requestNumber).toBeDefined();
      expect(res.body.status).toBe('OPEN');
      ticketId = res.body._id;
    });

    it('should reject request missing title', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'This is a description without a title.'
        });

      expect(res.status).toBe(400);
    });

    it('should reject request with title that is too short', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'a',
          description: 'This description is long enough to pass validation.'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Title must be between 5 and 120 characters');
    });
  });

  describe('Cancel Request', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Will be cancelled',
          description: 'This ticket will be cancelled in the next step.'
        });
      ticketId = res.body._id;
    });

    it('should allow owner to cancel open request', async () => {
      const res = await request(app)
        .post(`/api/requests/${ticketId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CANCELLED');
    });

    it('should not allow cancelling already cancelled request', async () => {
      await request(app)
        .post(`/api/requests/${ticketId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      const res = await request(app)
        .post(`/api/requests/${ticketId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(409);
    });
  });

  describe('AI Endpoint', () => {
    it('should return mocked AI analysis', async () => {
      const res = await request(app)
        .post('/api/ai/analyze-request')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Computer is broken',
          description: 'It wont turn on at all.'
        });

      expect(res.status).toBe(200);
      expect(res.body.summary).toBe('Mock AI Summary');
      expect(res.body.category).toBe('SOFTWARE');
    });
  });
});
