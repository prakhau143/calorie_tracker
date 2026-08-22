import { User } from '../models/user.js';
import { DailyLog } from '../models/dailyLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, AppError } from '../utils/response.js';

export const createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  ok(res, user, 201);
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  ok(res, users);
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  ok(res, user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.userId, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  ok(res, user);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  await DailyLog.deleteMany({ userId: req.params.userId });
  ok(res, { deleted: true });
});
