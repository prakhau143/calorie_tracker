import { Activity } from '../models/activity.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, AppError } from '../utils/response.js';
import { prefixRegex } from '../utils/escapeRegex.js';

export const searchActivities = asyncHandler(async (req, res) => {
  const { search, page, limit } = req.query;
  const filter = search
    ? {
        $or: [{ activityName: prefixRegex(search) }, { specificMotion: prefixRegex(search) }],
      }
    : {};

  const [items, total] = await Promise.all([
    Activity.find(filter)
      .sort({ activityName: 1, specificMotion: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Activity.countDocuments(filter),
  ]);

  ok(res, { items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const getActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.activityId);
  if (!activity) throw new AppError('Activity not found', 404, 'NOT_FOUND');
  ok(res, activity);
});
