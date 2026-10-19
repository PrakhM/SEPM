import * as budgetService from '../services/budgetService.js';
import {
  createBudgetSchema,
  idParamSchema,
  listBudgetsSchema,
  updateBudgetSchema,
} from '../validators/budgetValidator.js';

export async function create(req, res) {
  const data = createBudgetSchema.parse(req.body);
  const budget = await budgetService.createBudget(req.user.id, data);
  res.status(201).json({ budget });
}

export async function list(req, res) {
  const filters = listBudgetsSchema.parse(req.query);
  const budgets = await budgetService.getBudgetsForUser(req.user.id, filters);
  res.json({ budgets });
}

export async function getOne(req, res) {
  const { id } = idParamSchema.parse(req.params);
  const budget = await budgetService.getBudget(req.user.id, id);
  res.json({ budget });
}

export async function update(req, res) {
  const { id } = idParamSchema.parse(req.params);
  const data = updateBudgetSchema.parse(req.body);
  const budget = await budgetService.updateBudget(req.user.id, id, data);
  res.json({ budget });
}

export async function remove(req, res) {
  const { id } = idParamSchema.parse(req.params);
  await budgetService.deleteBudget(req.user.id, id);
  res.status(204).end();
}
