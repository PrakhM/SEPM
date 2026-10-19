import * as transactionService from '../services/transactionService.js';
import {
  createTransactionSchema,
  idParamSchema,
  listTransactionsSchema,
  updateTransactionSchema,
} from '../validators/transactionValidator.js';

export async function create(req, res) {
  const data = createTransactionSchema.parse(req.body);
  const key = req.get('Idempotency-Key');

  const { transaction, statusCode } =
    await transactionService.createTransaction(req.user.id, data, key);

  // A replayed request gets its ORIGINAL stored status code, not a fresh 201
  // — conventions.md: "return the stored response with the same status code".
  res.status(statusCode).json({ transaction });
}

export async function list(req, res) {
  const filters = listTransactionsSchema.parse(req.query);
  const result = await transactionService.listTransactions(
    req.user.id,
    filters,
  );
  res.json(result);
}

export async function getOne(req, res) {
  const { id } = idParamSchema.parse(req.params);
  const transaction = await transactionService.getTransaction(req.user.id, id);
  res.json({ transaction });
}

export async function update(req, res) {
  const { id } = idParamSchema.parse(req.params);
  const data = updateTransactionSchema.parse(req.body);
  const transaction = await transactionService.updateTransaction(
    req.user.id,
    id,
    data,
  );
  res.json({ transaction });
}

export async function remove(req, res) {
  const { id } = idParamSchema.parse(req.params);
  await transactionService.deleteTransaction(req.user.id, id);
  res.status(204).end();
}
