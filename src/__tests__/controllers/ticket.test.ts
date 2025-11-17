import request from 'supertest';
import express from 'express';
import {
  createNewTicket,
  updateTicketL1,
  escalateToL2,
  updateTicketL2,
  escalateToL3,
  updateTicketL3,
  markAsResolved,
  getAllTickets,
  getTicketsByLevelHandler,
  getTicketDetail,
  getTicketLogsHandler,
  assignCriticalValue,
} from '../../controller/ticket';
import { createTestUser } from '../utils/testHelpers';
import { createTicket } from '../../models/Ticket';
import mongoose from 'mongoose';

// Create a test app
const app = express();
app.use(express.json());

// Add userId to request for testing
app.use((req, res, next) => {
  // Get userId from custom header
  const userId = req.get('x-test-user-id');
  if (userId) {
    req.userId = userId;
  }
  next();
});

app.post('/tickets', createNewTicket);
app.post('/tickets/:id/update-l1', updateTicketL1);
app.post('/tickets/:id/escalate-l2', escalateToL2);
app.post('/tickets/:id/update-l2', updateTicketL2);
app.post('/tickets/:id/escalate-l3', escalateToL3);
app.post('/tickets/:id/update-l3', updateTicketL3);
app.post('/tickets/:id/resolve', markAsResolved);
app.post('/tickets/:id/critical', assignCriticalValue);
app.get('/tickets', getAllTickets);
app.get('/tickets/level/:level', getTicketsByLevelHandler);
app.get('/tickets/:id', getTicketDetail);
app.get('/tickets/:id/logs', getTicketLogsHandler);

describe('Ticket Controller', () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await createTestUser('test@example.com', 'testuser', 'password123', 'L1');
    testUserId = user._id.toString();
  });

  describe('POST /tickets (createNewTicket)', () => {
    it('should create a new ticket successfully', async () => {
      const response = await request(app)
        .post('/tickets')
        .set('x-test-user-id', testUserId)
        .send({
          title: 'Test Ticket',
          description: 'Test description',
          category: 'Hardware',
          priority: 'high',
          expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Test Ticket');
      expect(response.body.description).toBe('Test description');
      expect(response.body.category).toBe('Hardware');
      expect(response.body.priority).toBe('high');
      expect(response.body.status).toBe('new');
      expect(response.body.currentLevel).toBe(1);
      expect(response.body.ticketNumber).toBeDefined();
    });

    it('should create ticket with default medium priority', async () => {
      const response = await request(app)
        .post('/tickets')
        .set('x-test-user-id', testUserId)
        .send({
          title: 'Test Ticket',
          description: 'Test description',
          category: 'Software',
          expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

      expect(response.status).toBe(201);
      expect(response.body.priority).toBe('medium');
    });

    it('should fail when title is missing', async () => {
      const response = await request(app)
        .post('/tickets')
        .set('x-test-user-id', testUserId)
        .send({
          description: 'Test',
          category: 'Hardware',
          expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Title, description, category, and expectedCompletionDate are required'
      );
    });

    it('should fail when description is missing', async () => {
      const response = await request(app)
        .post('/tickets')
        .set('x-test-user-id', testUserId)
        .send({
          title: 'Test',
          category: 'Hardware',
          expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

      expect(response.status).toBe(400);
    });

    it('should fail when category is missing', async () => {
      const response = await request(app)
        .post('/tickets')
        .set('x-test-user-id', testUserId)
        .send({
          title: 'Test',
          description: 'Test',
          expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

      expect(response.status).toBe(400);
    });

    it('should fail when expectedCompletionDate is missing', async () => {
      const response = await request(app)
        .post('/tickets')
        .set('x-test-user-id', testUserId)
        .send({
          title: 'Test',
          description: 'Test',
          category: 'Hardware',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /tickets/:id/update-l1 (updateTicketL1)', () => {
    let ticketId: string;

    beforeEach(async () => {
      const ticket = await createTicket({
        title: 'L1 Ticket',
        description: 'Test',
        category: 'Hardware',
        priority: 'medium',
        currentLevel: 1,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      ticketId = ticket._id.toString();
    });

    it('should update L1 ticket successfully', async () => {
      const response = await request(app)
        .post(`/tickets/${ticketId}/update-l1`)
        .set('x-test-user-id', testUserId)
        .send({
          action_status: 'attending',
          resolutionNotes: 'Working on it',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('attending');
      expect(response.body.resolutionNotes).toBe('Working on it');
    });

    it('should fail when ticket not found', async () => {
      const response = await request(app)
        .post('/tickets/507f1f77bcf86cd799439011/update-l1')
        .set('x-test-user-id', testUserId)
        .send({
          action_status: 'attending',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Ticket not found');
    });

    it('should fail when ticket is not at L1 level', async () => {
      const l2Ticket = await createTicket({
        title: 'L2 Ticket',
        description: 'Test',
        category: 'Hardware',
        currentLevel: 2,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const response = await request(app)
        .post(`/tickets/${l2Ticket._id}/update-l1`)
        .set('x-test-user-id', testUserId)
        .send({
          action_status: 'attending',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Ticket is not at L1 level');
    });
  });

  describe('POST /tickets/:id/escalate-l2 (escalateToL2)', () => {
    let ticketId: string;

    beforeEach(async () => {
      const ticket = await createTicket({
        title: 'Escalate Ticket',
        description: 'Test',
        category: 'Hardware',
        currentLevel: 1,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      ticketId = ticket._id.toString();
    });

    it('should escalate ticket from L1 to L2', async () => {
      const response = await request(app)
        .post(`/tickets/${ticketId}/escalate-l2`)
        .set('x-test-user-id', testUserId)
        .send({
          reason: 'Requires advanced support',
        });

      expect(response.status).toBe(200);
      expect(response.body.currentLevel).toBe(2);
      expect(response.body.escalationLevel).toBe(2);
      expect(response.body.status).toBe('escalated');
    });

    it('should fail when ticket not found', async () => {
      const response = await request(app)
        .post('/tickets/507f1f77bcf86cd799439011/escalate-l2')
        .set('x-test-user-id', testUserId)
        .send({
          reason: 'Test',
        });

      expect(response.status).toBe(404);
    });

    it('should fail when ticket is not at L1 level', async () => {
      const l2Ticket = await createTicket({
        title: 'Already L2',
        description: 'Test',
        category: 'Hardware',
        currentLevel: 2,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const response = await request(app)
        .post(`/tickets/${l2Ticket._id}/escalate-l2`)
        .set('x-test-user-id', testUserId)
        .send({
          reason: 'Test',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Ticket is not at L1 level');
    });
  });

  describe('POST /tickets/:id/critical (assignCriticalValue)', () => {
    let ticketId: string;

    beforeEach(async () => {
      const ticket = await createTicket({
        title: 'L2 Ticket',
        description: 'Test',
        category: 'Hardware',
        currentLevel: 2,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      ticketId = ticket._id.toString();
    });

    it('should assign critical value successfully', async () => {
      const response = await request(app)
        .post(`/tickets/${ticketId}/critical`)
        .set('x-test-user-id', testUserId)
        .send({
          criticalValue: 'C2',
        });

      expect(response.status).toBe(200);
      expect(response.body.criticalValue).toBe('C2');
    });

    it('should accept C1, C2, and C3 values', async () => {
      for (const value of ['C1', 'C2', 'C3']) {
        const ticket = await createTicket({
          title: `Ticket ${value}`,
          description: 'Test',
          category: 'Hardware',
          currentLevel: 2,
          createdBy: new mongoose.Types.ObjectId(testUserId),
          expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        const response = await request(app)
          .post(`/tickets/${ticket._id}/critical`)
          .set('x-test-user-id', testUserId)
          .send({
            criticalValue: value,
          });

        expect(response.status).toBe(200);
        expect(response.body.criticalValue).toBe(value);
      }
    });

    it('should fail with invalid critical value', async () => {
      const response = await request(app)
        .post(`/tickets/${ticketId}/critical`)
        .set('x-test-user-id', testUserId)
        .send({
          criticalValue: 'C4',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Valid criticalValue (C1, C2, C3) is required');
    });

    it('should fail when ticket is not at L2 level', async () => {
      const l1Ticket = await createTicket({
        title: 'L1 Ticket',
        description: 'Test',
        category: 'Hardware',
        currentLevel: 1,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const response = await request(app)
        .post(`/tickets/${l1Ticket._id}/critical`)
        .set('x-test-user-id', testUserId)
        .send({
          criticalValue: 'C1',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Ticket is not at L2 level');
    });
  });

  describe('POST /tickets/:id/update-l2 (updateTicketL2)', () => {
    let ticketId: string;

    beforeEach(async () => {
      const ticket = await createTicket({
        title: 'L2 Ticket',
        description: 'Test',
        category: 'Hardware',
        currentLevel: 2,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      ticketId = ticket._id.toString();
    });

    it('should update L2 ticket successfully', async () => {
      const response = await request(app)
        .post(`/tickets/${ticketId}/update-l2`)
        .set('x-test-user-id', testUserId)
        .send({
          action_status: 'attending',
          resolutionNotes: 'L2 working on it',
          criticalValue: 'C2',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('attending');
      expect(response.body.resolutionNotes).toBe('L2 working on it');
      expect(response.body.criticalValue).toBe('C2');
    });

    it('should fail when ticket is not at L2 level', async () => {
      const l1Ticket = await createTicket({
        title: 'L1 Ticket',
        description: 'Test',
        category: 'Hardware',
        currentLevel: 1,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const response = await request(app)
        .post(`/tickets/${l1Ticket._id}/update-l2`)
        .set('x-test-user-id', testUserId)
        .send({
          action_status: 'attending',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Ticket is not at L2 level');
    });
  });

  describe('POST /tickets/:id/escalate-l3 (escalateToL3)', () => {
    let ticketId: string;

    beforeEach(async () => {
      const ticket = await createTicket({
        title: 'L2 Ticket',
        description: 'Test',
        category: 'Hardware',
        currentLevel: 2,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      ticketId = ticket._id.toString();
    });

    it('should escalate ticket from L2 to L3', async () => {
      const response = await request(app)
        .post(`/tickets/${ticketId}/escalate-l3`)
        .set('x-test-user-id', testUserId)
        .send({
          reason: 'Critical issue',
        });

      expect(response.status).toBe(200);
      expect(response.body.currentLevel).toBe(3);
      expect(response.body.escalationLevel).toBe(3);
      expect(response.body.status).toBe('escalated');
    });

    it('should fail when ticket is not at L2 level', async () => {
      const l1Ticket = await createTicket({
        title: 'L1 Ticket',
        description: 'Test',
        category: 'Hardware',
        currentLevel: 1,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const response = await request(app)
        .post(`/tickets/${l1Ticket._id}/escalate-l3`)
        .set('x-test-user-id', testUserId)
        .send({
          reason: 'Test',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Ticket is not at L2 level');
    });
  });

  describe('POST /tickets/:id/update-l3 (updateTicketL3)', () => {
    let ticketId: string;

    beforeEach(async () => {
      const ticket = await createTicket({
        title: 'L3 Ticket',
        description: 'Test',
        category: 'Hardware',
        currentLevel: 3,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      ticketId = ticket._id.toString();
    });

    it('should update L3 ticket successfully', async () => {
      const response = await request(app)
        .post(`/tickets/${ticketId}/update-l3`)
        .set('x-test-user-id', testUserId)
        .send({
          resolution: 'Fixed by replacing hardware',
          resolutionNotes: 'Hardware replaced',
          action_status: 'completed',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('completed');
      expect(response.body.resolution).toBe('Fixed by replacing hardware');
      expect(response.body.resolutionNotes).toBe('Hardware replaced');
      expect(response.body.completedDate).toBeDefined();
    });

    it('should fail when resolution is missing', async () => {
      const response = await request(app)
        .post(`/tickets/${ticketId}/update-l3`)
        .set('x-test-user-id', testUserId)
        .send({
          resolutionNotes: 'Notes',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Resolution is required');
    });

    it('should fail when ticket is not at L3 level', async () => {
      const l1Ticket = await createTicket({
        title: 'L1 Ticket',
        description: 'Test',
        category: 'Hardware',
        currentLevel: 1,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const response = await request(app)
        .post(`/tickets/${l1Ticket._id}/update-l3`)
        .set('x-test-user-id', testUserId)
        .send({
          resolution: 'Fixed',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Ticket is not at L3 level');
    });
  });

  describe('POST /tickets/:id/resolve (markAsResolved)', () => {
    let ticketId: string;

    beforeEach(async () => {
      const ticket = await createTicket({
        title: 'Completed Ticket',
        description: 'Test',
        category: 'Hardware',
        status: 'completed',
        currentLevel: 3,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      ticketId = ticket._id.toString();
    });

    it('should mark completed ticket as resolved', async () => {
      const response = await request(app)
        .post(`/tickets/${ticketId}/resolve`)
        .set('x-test-user-id', testUserId);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('resolved');
      expect(response.body.resolvedDate).toBeDefined();
    });

    it('should fail when ticket is not completed', async () => {
      const newTicket = await createTicket({
        title: 'New Ticket',
        description: 'Test',
        category: 'Hardware',
        status: 'new',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const response = await request(app)
        .post(`/tickets/${newTicket._id}/resolve`)
        .set('x-test-user-id', testUserId);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Ticket must be completed before marking as resolved');
    });
  });

  describe('GET /tickets (getAllTickets)', () => {
    beforeEach(async () => {
      // Create multiple tickets
      for (let i = 1; i <= 15; i++) {
        await createTicket({
          title: `Ticket ${i}`,
          description: 'Test',
          category: 'Hardware',
          createdBy: new mongoose.Types.ObjectId(testUserId),
          expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      }
    });

    it('should return paginated tickets with default pagination', async () => {
      const response = await request(app).get('/tickets');

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.data.length).toBe(10); // Default limit
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalItems).toBe(15);
    });

    it('should support custom pagination', async () => {
      const response = await request(app).get('/tickets?page=2&limit=5');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(5);
      expect(response.body.pagination.currentPage).toBe(2);
      expect(response.body.pagination.itemsPerPage).toBe(5);
    });

    it('should default invalid page number to 1', async () => {
      const response = await request(app).get('/tickets?page=0');

      // page=0 defaults to page=1 due to || 1 in controller
      expect(response.status).toBe(200);
      expect(response.body.pagination.currentPage).toBe(1);
    });

    it('should fail with limit exceeding 100', async () => {
      const response = await request(app).get('/tickets?limit=101');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Limit cannot exceed 100');
    });
  });

  describe('GET /tickets/level/:level (getTicketsByLevelHandler)', () => {
    beforeEach(async () => {
      await createTicket({
        title: 'L1 Ticket',
        description: 'Test',
        category: 'Hardware',
        currentLevel: 1,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      await createTicket({
        title: 'L2 Ticket',
        description: 'Test',
        category: 'Software',
        currentLevel: 2,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    });

    it('should return tickets for specific level', async () => {
      const response = await request(app).get('/tickets/level/1');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].currentLevel).toBe(1);
    });

    it('should return L2 tickets', async () => {
      const response = await request(app).get('/tickets/level/2');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].currentLevel).toBe(2);
    });
  });

  describe('GET /tickets/:id (getTicketDetail)', () => {
    let ticketId: string;

    beforeEach(async () => {
      const ticket = await createTicket({
        title: 'Detail Ticket',
        description: 'Test description',
        category: 'Hardware',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      ticketId = ticket._id.toString();
    });

    it('should return ticket details', async () => {
      const response = await request(app).get(`/tickets/${ticketId}`);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Detail Ticket');
      expect(response.body.description).toBe('Test description');
      expect(response.body.category).toBe('Hardware');
    });

    it('should fail when ticket not found', async () => {
      const response = await request(app).get('/tickets/507f1f77bcf86cd799439011');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Ticket not found');
    });
  });

  describe('GET /tickets/:id/logs (getTicketLogsHandler)', () => {
    let ticketId: string;

    beforeEach(async () => {
      const ticket = await createTicket({
        title: 'Ticket with logs',
        description: 'Test',
        category: 'Hardware',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      ticketId = ticket._id.toString();
    });

    it('should return ticket logs', async () => {
      const response = await request(app).get(`/tickets/${ticketId}/logs`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array for ticket with no logs', async () => {
      const response = await request(app).get(`/tickets/${ticketId}/logs`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});
