import express from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import {
  // L1 Actions
  createNewTicket,
  updateTicketL1,
  escalateToL2,

  // L2 Actions
  updateTicketL2,
  escalateToL3,

  // L3 Actions
  updateTicketL3,
  markAsResolved,

  // Common Actions
  getAllTickets,
  getTicketsByLevelHandler,
  getTicketDetail,
  getTicketLogsHandler
} from '../controller/ticket';

export default (router: express.Router) => {
  router.get('/tickets', authenticate, getAllTickets);
  router.get('/tickets/level/:level', authenticate, getTicketsByLevelHandler);
  router.get('/tickets/:id', authenticate, getTicketDetail);
  router.get('/tickets/:id/logs', authenticate, getTicketLogsHandler);

  router.post('/tickets', authenticate, authorize(['L1']), createNewTicket);
  router.post('/tickets/:id/update-l1', authenticate, authorize(['L1']), updateTicketL1);
  router.post('/tickets/:id/escalate-l2', authenticate, authorize(['L1']), escalateToL2);

  router.post('/tickets/:id/update-l2', authenticate, authorize(['L2']), updateTicketL2);
  router.post('/tickets/:id/escalate-l3', authenticate, authorize(['L2']), escalateToL3);

  router.post('/tickets/:id/update-l3', authenticate, authorize(['L3']), updateTicketL3);
  router.post('/tickets/:id/resolve', authenticate, authorize(['L3']), markAsResolved);
};
