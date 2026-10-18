import * as authService from '../services/authService.js';
import { loginSchema, registerSchema } from '../validators/authValidator.js';

export async function register(req, res) {
  const data = registerSchema.parse(req.body);
  const { user, token } = await authService.register(data);
  res.status(201).json({ user, token });
}

export async function login(req, res) {
  const data = loginSchema.parse(req.body);
  const { user, token } = await authService.login(data);
  res.json({ user, token });
}

// authMiddleware has already verified the token and set req.user.
export function me(req, res) {
  res.json({ user: req.user });
}
