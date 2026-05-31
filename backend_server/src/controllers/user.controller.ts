import { Request, Response } from 'express';
import * as userService from '../services/user.service';

export async function listUsers(_req: Request, res: Response) {
  const items = await userService.listUsers();
  res.json(items);
}

export async function createUser(req: Request, res: Response) {
  const payload = req.body;
  const created = await userService.createUser(payload);
  res.status(201).json(created);
}
