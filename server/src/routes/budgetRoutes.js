import { Router } from 'express';

import * as budgetController from '../controllers/budgetController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// Every budget is user-scoped, so all of them require a session.
router.use(authMiddleware);

router.post('/', budgetController.create);
router.get('/', budgetController.list);
router.get('/:id', budgetController.getOne);
router.patch('/:id', budgetController.update);
router.delete('/:id', budgetController.remove);

export default router;
