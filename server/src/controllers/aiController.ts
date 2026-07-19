import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { analyzeRequestText } from '../utils/aiAnalysis';

export const analyzeRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { title, description } = req.body;
    const trimmedTitle = String(title || '').trim();
    const trimmedDescription = String(description || '').trim();

    if (!trimmedTitle || !trimmedDescription) {
      return res.status(400).json({ error: 'Title and description are required for AI analysis' });
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
  } catch (error) {
    return res.status(500).json({ error: 'AI Analysis engine failed' });
  }
};
