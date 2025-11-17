import express from 'express';
import mongoose from 'mongoose';
import {
  createTicket,
  getTickets,
  getTicketsCount,
  getTicketById,
  getTicketsByLevel,
  updateTicketById
} from '../models/Ticket';
import { createTicketLog, getTicketLogs } from '../models/TicketLog';

// Helper to convert string to ObjectId
const toObjectId = (id: string | undefined) => {
  return id ? new mongoose.Types.ObjectId(id) : undefined;
};

// ==================== L1 Actions ====================

// L1: Create Ticket
export const createNewTicket = async (req: express.Request, res: express.Response) => {
  try {
    const { title, description, category, priority, expectedCompletionDate } = req.body;

    if (!title || !description || !category || !expectedCompletionDate) {
      return res.status(400).json({
        message: 'Title, description, category, and expectedCompletionDate are required'
      });
    }

    const ticket = await createTicket({
      title,
      description,
      category,
      priority: priority || 'medium',
      expectedCompletionDate: new Date(expectedCompletionDate),
      status: 'new',
      currentLevel: 1,
      escalationLevel: 1,
      createdBy: toObjectId(req.userId)
    });

    // Log action
    await createTicketLog({
      ticketId: ticket._id,
      actionType: 'created',
      newValue: 'new',
      comment: `Ticket created: ${title}`,
      performedBy: toObjectId(req.userId)
    });

    return res.status(201).json(ticket);
  } catch (err) {
    console.log('Create Ticket Error:', err);
    return res.status(400).json({ message: 'Failed to create ticket' });
  }
};

// L1: Update Ticket
export const updateTicketL1 = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { resolutionNotes,action_status } = req.body;

    const ticket = await getTicketById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.currentLevel !== 1) {
      return res.status(403).json({ message: 'Ticket is not at L1 level' });
    }

    const updated = await updateTicketById(id, {
      status: action_status,
      assignedTo: toObjectId(req.userId),
      resolutionNotes
    });

    // Log action
    await createTicketLog({
      ticketId: new mongoose.Types.ObjectId(id),
      actionType: 'action_taken',
      previousValue: ticket.status,
      newValue: action_status,
      comment: resolutionNotes || 'L1 updating ticket',
      performedBy: toObjectId(req.userId)
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.log('Update Ticket L1 Error:', err);
    return res.status(400).json({ message: 'Failed to update ticket' });
  }
};

// L1: Escalate to L2
export const escalateToL2 = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const ticket = await getTicketById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.currentLevel !== 1) {
      return res.status(403).json({ message: 'Ticket is not at L1 level' });
    }

    const updated = await updateTicketById(id, {
      status: 'escalated',
      currentLevel: 2,
      escalationLevel: 2,
      escalatedBy: toObjectId(req.userId),
      resolutionNotes: reason || ticket.resolutionNotes
    });

    // Log action
    await createTicketLog({
      ticketId: new mongoose.Types.ObjectId(id),
      actionType: 'escalated',
      previousValue: `L${ticket.currentLevel}`,
      newValue: 'L2',
      escalationReason: reason,
      comment: 'Escalated from L1 to L2',
      performedBy: toObjectId(req.userId)
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.log('Escalate to L2 Error:', err);
    return res.status(400).json({ message: 'Failed to escalate ticket' });
  }
};

// ==================== L2 Actions ====================

// L2: Assign Critical Value
export const assignCriticalValue = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { criticalValue } = req.body;

    if (!criticalValue || !['C1', 'C2', 'C3'].includes(criticalValue)) {
      return res.status(400).json({ message: 'Valid criticalValue (C1, C2, C3) is required' });
    }

    const ticket = await getTicketById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.currentLevel !== 2) {
      return res.status(403).json({ message: 'Ticket is not at L2 level' });
    }

    const updated = await updateTicketById(id, {
      criticalValue,
      assignedTo: toObjectId(req.userId)
    });

    // Log action
    await createTicketLog({
      ticketId: new mongoose.Types.ObjectId(id),
      actionType: 'critical_assigned',
      previousValue: ticket.criticalValue,
      newValue: criticalValue,
      comment: `Critical value assigned: ${criticalValue}`,
      performedBy: toObjectId(req.userId)
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.log('Assign Critical Value Error:', err);
    return res.status(400).json({ message: 'Failed to assign critical value' });
  }
};

// L2: Update Ticket
export const updateTicketL2 = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { resolutionNotes, action_status, criticalValue } = req.body;

    // Validate critical value if provided
    if (criticalValue && !['C1', 'C2', 'C3'].includes(criticalValue)) {
      return res.status(400).json({ message: 'Valid criticalValue (C1, C2, C3) is required' });
    }

    const ticket = await getTicketById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.currentLevel !== 2) {
      return res.status(403).json({ message: 'Ticket is not at L2 level' });
    }

    const updateData: any = {
      assignedTo: toObjectId(req.userId)
    };

    if (action_status) updateData.status = action_status;
    if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
    if (criticalValue) updateData.criticalValue = criticalValue;

    const updated = await updateTicketById(id, updateData);

    // Log status change
    if (action_status) {
      await createTicketLog({
        ticketId: new mongoose.Types.ObjectId(id),
        actionType: 'action_taken',
        previousValue: ticket.status,
        newValue: action_status,
        comment: resolutionNotes || 'L2 updating ticket',
        performedBy: toObjectId(req.userId)
      });
    }

    // Log critical value change
    if (criticalValue) {
      await createTicketLog({
        ticketId: new mongoose.Types.ObjectId(id),
        actionType: 'critical_assigned',
        previousValue: ticket.criticalValue,
        newValue: criticalValue,
        comment: `Critical value assigned: ${criticalValue}`,
        performedBy: toObjectId(req.userId)
      });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.log('Update Ticket L2 Error:', err);
    return res.status(400).json({ message: 'Failed to update ticket' });
  }
};

// L2: Escalate to L3
export const escalateToL3 = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const ticket = await getTicketById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.currentLevel !== 2) {
      return res.status(403).json({ message: 'Ticket is not at L2 level' });
    }

    const updated = await updateTicketById(id, {
      status: 'escalated',
      currentLevel: 3,
      escalationLevel: 3,
      escalatedBy: toObjectId(req.userId),
      resolutionNotes: reason || ticket.resolutionNotes
    });

    // Log action
    await createTicketLog({
      ticketId: new mongoose.Types.ObjectId(id),
      actionType: 'escalated',
      previousValue: `L${ticket.currentLevel}`,
      newValue: 'L3',
      escalationReason: reason,
      comment: 'Escalated from L2 to L3',
      performedBy: toObjectId(req.userId)
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.log('Escalate to L3 Error:', err);
    return res.status(400).json({ message: 'Failed to escalate ticket' });
  }
};

// ==================== L3 Actions ====================

// L3: Update Ticket
export const updateTicketL3 = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { resolution, resolutionNotes, action_status } = req.body;

    if (!resolution) {
      return res.status(400).json({ message: 'Resolution is required' });
    }

    const ticket = await getTicketById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.currentLevel !== 3) {
      return res.status(403).json({ message: 'Ticket is not at L3 level' });
    }

    const updated = await updateTicketById(id, {
      status: action_status || 'completed',
      resolution,
      resolutionNotes,
      completedDate: new Date(),
      assignedTo: toObjectId(req.userId)
    });

    // Log action
    await createTicketLog({
      ticketId: new mongoose.Types.ObjectId(id),
      actionType: 'action_taken',
      previousValue: ticket.status,
      newValue: action_status || 'completed',
      comment: `L3 completed fix: ${resolution}`,
      performedBy: toObjectId(req.userId)
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.log('Update Ticket L3 Error:', err);
    return res.status(400).json({ message: 'Failed to update ticket' });
  }
};

// L3: Mark as Resolved
export const markAsResolved = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const ticket = await getTicketById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.status !== 'completed') {
      return res.status(403).json({ message: 'Ticket must be completed before marking as resolved' });
    }

    const updated = await updateTicketById(id, {
      status: 'resolved',
      resolvedDate: new Date(),
      resolvedBy: toObjectId(req.userId)
    });

    // Log action
    await createTicketLog({
      ticketId: new mongoose.Types.ObjectId(id),
      actionType: 'resolved',
      previousValue: 'completed',
      newValue: 'resolved',
      comment: 'Ticket marked as resolved',
      performedBy: toObjectId(req.userId)
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.log('Mark as Resolved Error:', err);
    return res.status(400).json({ message: 'Failed to resolve ticket' });
  }
};

// ==================== Common Actions ====================

// Get All Tickets
export const getAllTickets = async (req: express.Request, res: express.Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (page < 1 || limit < 1) {
      return res.status(400).json({ message: 'Page and limit must be positive numbers' });
    }

    if (limit > 100) {
      return res.status(400).json({ message: 'Limit cannot exceed 100' });
    }

    const tickets = await getTickets(page, limit);
    const total = await getTicketsCount();
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      data: tickets,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    console.log('Get All Tickets Error:', err);
    return res.status(400).json({ message: 'Failed to get tickets' });
  }
};

// Get Tickets by Level
export const getTicketsByLevelHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { level } = req.params;
    const tickets = await getTicketsByLevel(parseInt(level));
    return res.status(200).json(tickets);
  } catch (err) {
    console.log('Get Tickets by Level Error:', err);
    return res.status(400).json({ message: 'Failed to get tickets' });
  }
};

// Get Ticket Detail
export const getTicketDetail = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const ticket = await getTicketById(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    return res.status(200).json(ticket);
  } catch (err) {
    console.log('Get Ticket Detail Error:', err);
    return res.status(400).json({ message: 'Failed to get ticket' });
  }
};

// Get Ticket Logs
export const getTicketLogsHandler = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const logs = await getTicketLogs(id);
    return res.status(200).json(logs);
  } catch (err) {
    console.log('Get Ticket Logs Error:', err);
    return res.status(400).json({ message: 'Failed to get ticket logs' });
  }
};
