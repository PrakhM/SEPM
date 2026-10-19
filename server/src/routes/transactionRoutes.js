import { Router } from 'express';

import * as transactionController from '../controllers/transactionController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// Every transaction route is user-scoped, so all of them require a session.
router.use(authMiddleware);

router.post('/', transactionController.create);
router.get('/', transactionController.list);
router.get('/:id', transactionController.getOne);
router.patch('/:id', transactionController.update);
router.delete('/:id', transactionController.remove);

export default router;
