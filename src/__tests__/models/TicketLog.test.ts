import {
  createTicketLog,
  getTicketLogs,
} from '../../models/TicketLog';
import { createTicket } from '../../models/Ticket';
import { createTestUser } from '../utils/testHelpers';
import mongoose from 'mongoose';

describe('TicketLog Model', () => {
  let testUserId: string;
  let testTicketId: string;

  beforeEach(async () => {
    const user = await createTestUser(
      'test@example.com',
      'testuser',
      'password123',
      'L1'
    );
    testUserId = user._id.toString();

    const ticket = await createTicket({
      title: 'Test Ticket',
      description: 'Test description',
      category: 'Hardware',
      priority: 'medium',
      createdBy: new mongoose.Types.ObjectId(testUserId),
      expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    testTicketId = ticket._id.toString();
  });

  describe('createTicketLog', () => {
    it('should create a ticket log for ticket creation', async () => {
      const logData = {
        ticketId: new mongoose.Types.ObjectId(testTicketId),
        actionType: 'created' as const,
        performedBy: new mongoose.Types.ObjectId(testUserId),
      };

      const log = await createTicketLog(logData);

      expect(log).toBeDefined();
      expect(log.ticketId.toString()).toBe(testTicketId);
      expect(log.actionType).toBe('created');
      expect(log.performedBy.toString()).toBe(testUserId);
    });

    it('should create a ticket log for status change', async () => {
      const logData = {
        ticketId: new mongoose.Types.ObjectId(testTicketId),
        actionType: 'status_change' as const,
        previousValue: 'new',
        newValue: 'attending',
        performedBy: new mongoose.Types.ObjectId(testUserId),
      };

      const log = await createTicketLog(logData);

      expect(log).toBeDefined();
      expect(log.actionType).toBe('status_change');
      expect(log.previousValue).toBe('new');
      expect(log.newValue).toBe('attending');
    });

    it('should create a ticket log for escalation', async () => {
      const logData = {
        ticketId: new mongoose.Types.ObjectId(testTicketId),
        actionType: 'escalated' as const,
        escalatedFrom: 'C1' as const,
        escalatedTo: 'C2' as const,
        escalationReason: 'Requires higher level support',
        performedBy: new mongoose.Types.ObjectId(testUserId),
      };

      const log = await createTicketLog(logData);

      expect(log).toBeDefined();
      expect(log.actionType).toBe('escalated');
      expect(log.escalatedFrom).toBe('C1');
      expect(log.escalatedTo).toBe('C2');
      expect(log.escalationReason).toBe('Requires higher level support');
    });

    it('should create a ticket log for assignment', async () => {
      const logData = {
        ticketId: new mongoose.Types.ObjectId(testTicketId),
        actionType: 'assigned' as const,
        comment: 'Assigned to support team',
        performedBy: new mongoose.Types.ObjectId(testUserId),
      };

      const log = await createTicketLog(logData);

      expect(log).toBeDefined();
      expect(log.actionType).toBe('assigned');
      expect(log.comment).toBe('Assigned to support team');
    });

    it('should create a ticket log for resolution', async () => {
      const logData = {
        ticketId: new mongoose.Types.ObjectId(testTicketId),
        actionType: 'resolved' as const,
        comment: 'Issue resolved by rebooting the system',
        performedBy: new mongoose.Types.ObjectId(testUserId),
      };

      const log = await createTicketLog(logData);

      expect(log).toBeDefined();
      expect(log.actionType).toBe('resolved');
      expect(log.comment).toBe('Issue resolved by rebooting the system');
    });

    it('should create a ticket log for comments', async () => {
      const logData = {
        ticketId: new mongoose.Types.ObjectId(testTicketId),
        actionType: 'comment' as const,
        comment: 'Additional information needed from user',
        performedBy: new mongoose.Types.ObjectId(testUserId),
      };

      const log = await createTicketLog(logData);

      expect(log).toBeDefined();
      expect(log.actionType).toBe('comment');
      expect(log.comment).toBe('Additional information needed from user');
    });

    it('should only accept valid action types', async () => {
      const logData = {
        ticketId: new mongoose.Types.ObjectId(testTicketId),
        actionType: 'invalid_action' as any,
        performedBy: new mongoose.Types.ObjectId(testUserId),
      };

      await expect(createTicketLog(logData)).rejects.toThrow();
    });

    it('should only accept valid critical values for escalation', async () => {
      const logData = {
        ticketId: new mongoose.Types.ObjectId(testTicketId),
        actionType: 'escalated' as const,
        escalatedFrom: 'C4' as any,
        escalatedTo: 'C5' as any,
        performedBy: new mongoose.Types.ObjectId(testUserId),
      };

      await expect(createTicketLog(logData)).rejects.toThrow();
    });
  });

  describe('getTicketLogs', () => {
    it('should return all logs for a ticket', async () => {
      // Create multiple logs
      await createTicketLog({
        ticketId: new mongoose.Types.ObjectId(testTicketId),
        actionType: 'created',
        performedBy: new mongoose.Types.ObjectId(testUserId),
      });

      await createTicketLog({
        ticketId: new mongoose.Types.ObjectId(testTicketId),
        actionType: 'status_change',
        previousValue: 'new',
        newValue: 'attending',
        performedBy: new mongoose.Types.ObjectId(testUserId),
      });

      await createTicketLog({
        ticketId: new mongoose.Types.ObjectId(testTicketId),
        actionType: 'resolved',
        comment: 'Resolved',
        performedBy: new mongoose.Types.ObjectId(testUserId),
      });

      const logs = await getTicketLogs(testTicketId);

      expect(logs.length).toBe(3);
    });

    it('should return logs sorted by creation date descending', async () => {
      const log1 = await createTicketLog({
        ticketId: new mongoose.Types.ObjectId(testTicketId),
        actionType: 'created',
        performedBy: new mongoose.Types.ObjectId(testUserId),
      });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const log2 = await createTicketLog({
        ticketId: new mongoose.Types.ObjectId(testTicketId),
        actionType: 'status_change',
        previousValue: 'new',
        newValue: 'attending',
        performedBy: new mongoose.Types.ObjectId(testUserId),
      });

      const logs = await getTicketLogs(testTicketId);

      expect(logs[0]._id.toString()).toBe(log2._id.toString());
      expect(logs[1]._id.toString()).toBe(log1._id.toString());
    });

    it('should return empty array for ticket with no logs', async () => {
      const newTicket = await createTicket({
        title: 'No Logs',
        description: 'Test',
        category: 'Hardware',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const logs = await getTicketLogs(newTicket._id.toString());

      expect(logs).toEqual([]);
    });

    it('should only return logs for the specified ticket', async () => {
      const ticket2 = await createTicket({
        title: 'Second Ticket',
        description: 'Test',
        category: 'Software',
        createdBy: new mongoose.Types.ObjectId(testUserId),
        expectedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Create logs for both tickets
      await createTicketLog({
        ticketId: new mongoose.Types.ObjectId(testTicketId),
        actionType: 'created',
        performedBy: new mongoose.Types.ObjectId(testUserId),
      });

      await createTicketLog({
        ticketId: ticket2._id,
        actionType: 'created',
        performedBy: new mongoose.Types.ObjectId(testUserId),
      });

      const ticket1Logs = await getTicketLogs(testTicketId);
      const ticket2Logs = await getTicketLogs(ticket2._id.toString());

      expect(ticket1Logs.length).toBe(1);
      expect(ticket2Logs.length).toBe(1);
      expect(ticket1Logs[0].ticketId.toString()).toBe(testTicketId);
      expect(ticket2Logs[0].ticketId.toString()).toBe(ticket2._id.toString());
    });
  });
});
