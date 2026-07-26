import { Router } from 'express';
import { createTicket, getTickets, updateTicket, replyToTicket } from '../controllers/ticket.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All ticket routes require authentication
router.use(authenticate);

// POST /api/tickets - Create a new ticket (for any user)
router.post('/', createTicket);

// GET /api/tickets - List all tickets (filtered by operator, status, etc.)
router.get('/', getTickets);

// PUT /api/tickets/:id - Update ticket (operator actions: resolve, escalate)
router.put('/:id', updateTicket);

// POST /api/tickets/:id/reply - Add a reply to a ticket
router.post('/:id/reply', replyToTicket);

export default router;
