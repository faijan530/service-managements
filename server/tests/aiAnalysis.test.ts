const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeRequestText } = require('../src/utils/aiAnalysis');

test('falls back to safe defaults when the provider returns invalid values', async () => {
  const result = await analyzeRequestText('VPN issue', 'I cannot connect to the office network', {
    retries: 1,
    timeoutMs: 100,
    provider: async () => ({
      summary: 'bad payload',
      suggestedCategory: 'INVALID_CATEGORY',
      suggestedPriority: 'CRITICAL',
      reason: 'This should be rejected',
    }),
  });

  assert.equal(result.suggestedCategory, 'NETWORK');
  assert.equal(result.suggestedPriority, 'HIGH');
  assert.equal(result.fallbackUsed, true);
});

test('falls back gracefully when the provider throws', async () => {
  const result = await analyzeRequestText('laptop issue', 'The screen on my laptop is flickering', {
    retries: 2,
    timeoutMs: 100,
    provider: async () => {
      throw new Error('provider unavailable');
    },
  });

  assert.equal(result.suggestedCategory, 'HARDWARE');
  assert.equal(result.suggestedPriority, 'LOW');
  assert.equal(result.fallbackUsed, true);
});
