import request from 'supertest';
import app from '../src/index';
import { User } from '../src/models/User';
import { ServiceRequest } from '../src/models/ServiceRequest';
import bcrypt from 'bcryptjs';

describe('Authorization & Security', () => {
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let adminId: string;
  let ticketId: string;

  beforeEach(async () => {
    // Create User
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'Password123'
    });
    userToken = userRes.body.token;
    userId = userRes.body.user.id;

    // Create Admin
    const adminPassword = await bcrypt.hash('AdminPass123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: 'ADMIN'
    });
    
    // Login Admin to get token
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'AdminPass123'
    });
    adminToken = adminLoginRes.body.token;
    adminId = adminLoginRes.body.user.id;

    // Create a ticket for Regular User
    const ticketRes = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'User Ticket',
        description: 'Need help with account'
      });
    ticketId = ticketRes.body._id;
  });

  describe('Guest Access', () => {
    it('should reject unauthenticated access to protected routes', async () => {
      const res = await request(app).get('/api/requests');
      expect(res.status).toBe(401);
    });
  });

  describe('IDOR & BOLA', () => {
    it('should not allow another user to fetch this users ticket', async () => {
      // Create second user
      const user2Res = await request(app).post('/api/auth/register').send({
        name: 'Second User',
        email: 'user2@example.com',
        password: 'Password123'
      });
      const user2Token = user2Res.body.token;

      // Try to access user1's ticket
      const res = await request(app)
        .get(`/api/requests/${ticketId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.status).toBe(403);
    });

    it('should not allow user to update ticket status', async () => {
      const res = await request(app)
        .patch(`/api/requests/${ticketId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(res.status).toBe(403);
    });
  });

  describe('Admin Access', () => {
    it('should allow admin to fetch any users ticket', async () => {
      const res = await request(app)
        .get(`/api/requests/${ticketId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('User Ticket');
    });

    it('should allow admin to update ticket status', async () => {
      const res = await request(app)
        .patch(`/api/requests/${ticketId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'IN_REVIEW' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('IN_REVIEW');
    });
  });
});
