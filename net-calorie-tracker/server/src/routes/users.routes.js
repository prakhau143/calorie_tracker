import { Router } from 'express';
import { validate } from '../validators/validate.js';
import { userSchema, userUpdateSchema, userIdParamsSchema } from '../validators/user.validator.js';
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/users.controller.js';

export const usersRouter = Router();

usersRouter.post('/', validate(userSchema), createUser);
usersRouter.get('/', listUsers);
usersRouter.get('/:userId', validate(userIdParamsSchema, 'params'), getUser);
usersRouter.put(
  '/:userId',
  validate(userIdParamsSchema, 'params'),
  validate(userUpdateSchema),
  updateUser,
);
usersRouter.delete('/:userId', validate(userIdParamsSchema, 'params'), deleteUser);
