type AIAnalysisResult = {
  summary: string;
  suggestedCategory: string;
  suggestedPriority: string;
  reason: string;
  fallbackUsed: boolean;
};

type AIAnalysisInput = {
  title: string;
  description: string;
};

type AIAnalysisProvider = (input: AIAnalysisInput) => Promise<Partial<AIAnalysisResult> | AIAnalysisResult>;

type AIAnalysisOptions = {
  retries?: number;
  timeoutMs?: number;
  provider?: AIAnalysisProvider;
};

const ALLOWED_CATEGORIES = ['SOFTWARE', 'HARDWARE', 'NETWORK', 'ACCESS', 'OTHER'] as const;
const ALLOWED_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

const CATEGORY_ALIASES: Record<string, (typeof ALLOWED_CATEGORIES)[number]> = {
  software: 'SOFTWARE',
  app: 'SOFTWARE',
  application: 'SOFTWARE',
  hardware: 'HARDWARE',
  device: 'HARDWARE',
  laptop: 'HARDWARE',
  network: 'NETWORK',
  internet: 'NETWORK',
  wifi: 'NETWORK',
  vpn: 'NETWORK',
  access: 'ACCESS',
  permission: 'ACCESS',
  permissions: 'ACCESS',
  other: 'OTHER',
  general: 'OTHER',
};

const PRIORITY_ALIASES: Record<string, (typeof ALLOWED_PRIORITIES)[number]> = {
  low: 'LOW',
  medium: 'MEDIUM',
  moderate: 'MEDIUM',
  high: 'HIGH',
  urgent: 'URGENT',
};

const defaultHeuristicAnalysis = (input: AIAnalysisInput): AIAnalysisResult => {
  const titleLower = input.title.toLowerCase();
  const descLower = input.description.toLowerCase();

  if (titleLower.includes('vpn') || descLower.includes('vpn')) {
    return {
      summary: 'Issues establishing VPN connection to corporate network.',
      suggestedCategory: 'NETWORK',
      suggestedPriority: 'HIGH',
      reason: 'VPN connectivity issues prevent remote staff from accessing secure systems, warranting high priority.',
      fallbackUsed: false,
    };
  }

  if (titleLower.includes('internet') || descLower.includes('internet') || titleLower.includes('wifi')) {
    return {
      summary: 'Internet or Wi-Fi connectivity outage or instability.',
      suggestedCategory: 'NETWORK',
      suggestedPriority: 'MEDIUM',
      reason: 'Affects local work but offline backups or alternative tasks may remain possible.',
      fallbackUsed: false,
    };
  }

  if (titleLower.includes('laptop') || descLower.includes('laptop') || titleLower.includes('screen')) {
    return {
      summary: 'Hardware malfunction affecting company laptop.',
      suggestedCategory: 'HARDWARE',
      suggestedPriority: 'LOW',
      reason: 'Single user hardware issue. Can be resolved via temporary loaner device.',
      fallbackUsed: false,
    };
  }

  return {
    summary: 'General support inquiry.',
    suggestedCategory: 'OTHER',
    suggestedPriority: 'MEDIUM',
    reason: 'General inquiry with no specific network, hardware, or access flags.',
    fallbackUsed: false,
  };
};

const normalizeCategory = (value?: string): string => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return 'OTHER';
  }

  const alias = CATEGORY_ALIASES[normalized];
  if (alias) {
    return alias;
  }

  return ALLOWED_CATEGORIES.includes(normalized.toUpperCase() as (typeof ALLOWED_CATEGORIES)[number])
    ? normalized.toUpperCase()
    : 'OTHER';
};

const normalizePriority = (value?: string): string => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return 'MEDIUM';
  }

  const alias = PRIORITY_ALIASES[normalized];
  if (alias) {
    return alias;
  }

  return ALLOWED_PRIORITIES.includes(normalized.toUpperCase() as (typeof ALLOWED_PRIORITIES)[number])
    ? normalized.toUpperCase()
    : 'MEDIUM';
};

const sanitizeResult = (candidate: Partial<AIAnalysisResult> | undefined, fallback: AIAnalysisResult): AIAnalysisResult => {
  const summary = String(candidate?.summary || '').trim();
  const reason = String(candidate?.reason || '').trim();
  const rawCategory = String(candidate?.suggestedCategory || '').trim();
  const rawPriority = String(candidate?.suggestedPriority || '').trim();

  const categoryIsValid = Boolean(
    rawCategory && (ALLOWED_CATEGORIES.includes(rawCategory.toUpperCase() as (typeof ALLOWED_CATEGORIES)[number]) || CATEGORY_ALIASES[rawCategory.toLowerCase()]),
  );
  const priorityIsValid = Boolean(
    rawPriority && (ALLOWED_PRIORITIES.includes(rawPriority.toUpperCase() as (typeof ALLOWED_PRIORITIES)[number]) || PRIORITY_ALIASES[rawPriority.toLowerCase()]),
  );

  const fallbackUsed = !candidate || !summary || !reason || !categoryIsValid || !priorityIsValid;

  return {
    summary: summary || fallback.summary,
    suggestedCategory: categoryIsValid ? normalizeCategory(candidate?.suggestedCategory) : fallback.suggestedCategory,
    suggestedPriority: priorityIsValid ? normalizePriority(candidate?.suggestedPriority) : fallback.suggestedPriority,
    reason: reason || fallback.reason,
    fallbackUsed,
  };
};

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`AI provider timed out after ${timeoutMs}ms`)), timeoutMs);

  promise
    .then((value) => {
      clearTimeout(timer);
      resolve(value);
    })
    .catch((error) => {
      clearTimeout(timer);
      reject(error);
    });
});

export const analyzeRequestText = async (
  title: string,
  description: string,
  options: AIAnalysisOptions = {},
): Promise<AIAnalysisResult> => {
  const normalizedTitle = String(title || '').trim();
  const normalizedDescription = String(description || '').trim();
  const fallback = defaultHeuristicAnalysis({ title: normalizedTitle, description: normalizedDescription });
  const retries = Math.max(1, Number(options.retries ?? 2));
  const timeoutMs = Math.max(200, Number(options.timeoutMs ?? 3000));
  const provider = options.provider ?? (async (input) => defaultHeuristicAnalysis(input));

  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await withTimeout(provider({ title: normalizedTitle, description: normalizedDescription }), timeoutMs);
      const sanitized = sanitizeResult(response, fallback);
      if (sanitized) {
        return sanitized;
      }
    } catch (error) {
      lastError = error;
    }
  }

  return {
    ...fallback,
    fallbackUsed: true,
    reason: lastError ? `${fallback.reason} (fallback triggered after provider failure)` : fallback.reason,
  };
};

export type { AIAnalysisResult, AIAnalysisInput, AIAnalysisOptions };
