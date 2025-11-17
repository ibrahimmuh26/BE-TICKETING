import {
  createTicket,
  getTickets,
  getTicketsCount,
  getTicketById,
  getTicketsByLevel,
  getTicketsByStatus,
  updateTicketById,
  deleteTicketById,
} from '../../models/Ticket';
import { createTestUser } from '../utils/testHelpers';
import mongoose from 'mongoose';

describe('Ticket Model', () => {
  let testUserId: string;

  beforeEach(async () => {
    const user = await createTestUser(
      'test@example.com',
      'testuser',
      'password123',
      'L1'
    );
    testUserId = user._id.toString();
  });

  describe('createTicket', () => {
    it('should create a ticket with auto-generated ticket number', async () => {
      const ticketData = {
        title: 'Test Ticket',
        description: 'Test description',
        category: 'Hardware',
        priority: 'medium' as const,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const ticket = await createTicket(ticketData);

      expect(ticket).toBeDefined();
      expect(ticket.ticketNumber).toBeDefined();
      expect(ticket.ticketNumber).toMatch(/^TKT-\d{6}-\d{4}$/);
      expect(ticket.title).toBe('Test Ticket');
      expect(ticket.status).toBe('new');
      expect(ticket.currentLevel).toBe(1);
    });

    it('should generate sequential ticket numbers', async () => {
      const ticketData = {
        title: 'Ticket 1',
        description: 'Description 1',
        category: 'Software',
        priority: 'high' as const,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const ticket1 = await createTicket(ticketData);
      const ticket2 = await createTicket({ ...ticketData, title: 'Ticket 2' });

      const num1 = parseInt(ticket1.ticketNumber.split('-')[2]);
      const num2 = parseInt(ticket2.ticketNumber.split('-')[2]);

      expect(num2).toBe(num1 + 1);
    });

    it('should set default values correctly', async () => {
      const ticketData = {
        title: 'Default Test',
        description: 'Test description',
        category: 'Network',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const ticket = await createTicket(ticketData);

      expect(ticket.priority).toBe('medium');
      expect(ticket.status).toBe('new');
      expect(ticket.currentLevel).toBe(1);
      expect(ticket.escalationLevel).toBe(1);
    });

    it('should only accept valid category values', async () => {
      const ticketData = {
        title: 'Invalid Category',
        description: 'Test',
        category: 'InvalidCategory',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      await expect(createTicket(ticketData)).rejects.toThrow();
    });

    it('should only accept valid priority values', async () => {
      const ticketData = {
        title: 'Invalid Priority',
        description: 'Test',
        category: 'Hardware',
        priority: 'urgent' as any,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      await expect(createTicket(ticketData)).rejects.toThrow();
    });

    it('should only accept valid status values', async () => {
      const ticketData = {
        title: 'Invalid Status',
        description: 'Test',
        category: 'Hardware',
        status: 'invalid_status' as any,
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      await expect(createTicket(ticketData)).rejects.toThrow();
    });
  });

  describe('getTickets', () => {
    it('should return paginated tickets', async () => {
      const ticketData = {
        title: 'Test',
        description: 'Test',
        category: 'Hardware',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      // Create 3 tickets
      await createTicket({ ...ticketData, title: 'Ticket 1' });
      await createTicket({ ...ticketData, title: 'Ticket 2' });
      await createTicket({ ...ticketData, title: 'Ticket 3' });

      const tickets = await getTickets(1, 2);

      expect(tickets.length).toBe(2);
    });

    it('should return tickets sorted by creation date descending', async () => {
      const ticketData = {
        description: 'Test',
        category: 'Hardware',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const ticket1 = await createTicket({ ...ticketData, title: 'First' });
      const ticket2 = await createTicket({ ...ticketData, title: 'Second' });

      const tickets = await getTickets();

      expect(tickets[0]._id.toString()).toBe(ticket2._id.toString());
      expect(tickets[1]._id.toString()).toBe(ticket1._id.toString());
    });

    it('should handle pagination correctly', async () => {
      const ticketData = {
        description: 'Test',
        category: 'Hardware',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      // Create 5 tickets
      for (let i = 1; i <= 5; i++) {
        await createTicket({ ...ticketData, title: `Ticket ${i}` });
      }

      const page1 = await getTickets(1, 2);
      const page2 = await getTickets(2, 2);
      const page3 = await getTickets(3, 2);

      expect(page1.length).toBe(2);
      expect(page2.length).toBe(2);
      expect(page3.length).toBe(1);
    });
  });

  describe('getTicketsCount', () => {
    it('should return correct count of tickets', async () => {
      const ticketData = {
        description: 'Test',
        category: 'Hardware',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      await createTicket({ ...ticketData, title: 'Ticket 1' });
      await createTicket({ ...ticketData, title: 'Ticket 2' });
      await createTicket({ ...ticketData, title: 'Ticket 3' });

      const count = await getTicketsCount();

      expect(count).toBe(3);
    });
  });

  describe('getTicketById', () => {
    it('should find ticket by id', async () => {
      const ticketData = {
        title: 'Find Me',
        description: 'Test',
        category: 'Hardware',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const createdTicket = await createTicket(ticketData);
      const foundTicket = await getTicketById(createdTicket._id.toString());

      expect(foundTicket).toBeDefined();
      expect(foundTicket?.title).toBe('Find Me');
    });

    it('should return null for non-existent id', async () => {
      const ticket = await getTicketById('507f1f77bcf86cd799439011');
      expect(ticket).toBeNull();
    });
  });

  describe('getTicketsByLevel', () => {
    it('should return tickets for specific level', async () => {
      const ticketData = {
        description: 'Test',
        category: 'Hardware',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      await createTicket({ ...ticketData, title: 'L1 Ticket', currentLevel: 1 });
      await createTicket({ ...ticketData, title: 'L2 Ticket', currentLevel: 2 });
      await createTicket({ ...ticketData, title: 'L1 Ticket 2', currentLevel: 1 });

      const level1Tickets = await getTicketsByLevel(1);
      const level2Tickets = await getTicketsByLevel(2);

      expect(level1Tickets.length).toBe(2);
      expect(level2Tickets.length).toBe(1);
    });
  });

  describe('getTicketsByStatus', () => {
    it('should return tickets with specific status', async () => {
      const ticketData = {
        description: 'Test',
        category: 'Hardware',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      await createTicket({ ...ticketData, title: 'New 1', status: 'new' });
      await createTicket({ ...ticketData, title: 'Attending', status: 'attending' });
      await createTicket({ ...ticketData, title: 'New 2', status: 'new' });

      const newTickets = await getTicketsByStatus('new');
      const attendingTickets = await getTicketsByStatus('attending');

      expect(newTickets.length).toBe(2);
      expect(attendingTickets.length).toBe(1);
    });
  });

  describe('updateTicketById', () => {
    it('should update ticket successfully', async () => {
      const ticketData = {
        title: 'Original Title',
        description: 'Test',
        category: 'Hardware',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const ticket = await createTicket(ticketData);

      const updatedTicket = await updateTicketById(ticket._id.toString(), {
        title: 'Updated Title',
        status: 'attending',
      });

      expect(updatedTicket?.title).toBe('Updated Title');
      expect(updatedTicket?.status).toBe('attending');
    });

    it('should escalate ticket', async () => {
      const ticketData = {
        title: 'Escalate Me',
        description: 'Test',
        category: 'Hardware',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const ticket = await createTicket(ticketData);

      const updatedTicket = await updateTicketById(ticket._id.toString(), {
        currentLevel: 2,
        escalationLevel: 2,
        status: 'escalated',
      });

      expect(updatedTicket?.currentLevel).toBe(2);
      expect(updatedTicket?.escalationLevel).toBe(2);
      expect(updatedTicket?.status).toBe('escalated');
    });
  });

  describe('deleteTicketById', () => {
    it('should delete ticket successfully', async () => {
      const ticketData = {
        title: 'Delete Me',
        description: 'Test',
        category: 'Hardware',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const ticket = await createTicket(ticketData);

      await deleteTicketById(ticket._id.toString());

      const deletedTicket = await getTicketById(ticket._id.toString());
      expect(deletedTicket).toBeNull();
    });

    it('should return null when deleting non-existent ticket', async () => {
      const result = await deleteTicketById('507f1f77bcf86cd799439011');
      expect(result).toBeNull();
    });
  });
});
