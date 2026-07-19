import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { analyzeRequestText } from '../utils/aiAnalysis';
import { catchAsync } from '../utils/asyncHandler';

export const analyzeRequest = catchAsync(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    res.status(401);
    throw new Error('Authentication required');
  }

  const { title, description } = req.body;
  const trimmedTitle = String(title || '').trim();
  const trimmedDescription = String(description || '').trim();

  if (!trimmedTitle || !trimmedDescription) {
    res.status(400);
    throw new Error('Title and description are required for AI analysis');
  }

  const result = await analyzeRequestText(trimmedTitle, trimmedDescription, {
    retries: 2,
    timeoutMs: 3000,
  });

  return res.status(200).json({
    summary: result.summary,
    category: result.suggestedCategory,
    suggestedCategory: result.suggestedCategory,
    priority: result.suggestedPriority,
    suggestedPriority: result.suggestedPriority,
    reason: result.reason,
    fallbackUsed: result.fallbackUsed,
  });
});
