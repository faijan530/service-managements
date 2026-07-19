import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';

export const analyzeRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required for AI analysis' });
    }

    const titleLower = String(title).toLowerCase();
    const descLower = String(description).toLowerCase();

    if (titleLower.includes('vpn') || descLower.includes('vpn')) {
      return res.status(200).json({
        summary: 'Issues establishing VPN connection to corporate network.',
        suggestedCategory: 'NETWORK',
        suggestedPriority: 'HIGH',
        reason: 'VPN connectivity issues prevent remote staff from accessing secure systems, warranting high priority.',
      });
    } else if (titleLower.includes('internet') || descLower.includes('internet') || titleLower.includes('wifi')) {
      return res.status(200).json({
        summary: 'Internet or Wi-Fi connectivity outage/instability.',
        suggestedCategory: 'NETWORK',
        suggestedPriority: 'MEDIUM',
        reason: 'Affects local work but offline backups or alternative tasks may remain possible.',
      });
    } else if (titleLower.includes('laptop') || descLower.includes('laptop') || titleLower.includes('screen')) {
      return res.status(200).json({
        summary: 'Hardware malfunction affecting company laptop.',
        suggestedCategory: 'HARDWARE',
        suggestedPriority: 'LOW',
        reason: 'Single user hardware issue. Can be resolved via temporary loaner device.',
      });
    } else {
      return res.status(200).json({
        summary: 'General support inquiry.',
        suggestedCategory: 'OTHER',
        suggestedPriority: 'MEDIUM',
        reason: 'General inquiry with no specific network, hardware, or access flags.',
      });
    }
  } catch (error) {
    return res.status(500).json({ error: 'AI Analysis engine failed' });
  }
};
