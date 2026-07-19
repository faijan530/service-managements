const test = require('node:test');
const assert = require('node:assert/strict');
const { canTransitionStatus } = require('../src/utils/requestWorkflow');

test('allows the standard forward status chain', () => {
  assert.equal(canTransitionStatus('OPEN', 'IN_REVIEW'), true);
  assert.equal(canTransitionStatus('IN_REVIEW', 'IN_PROGRESS'), true);
  assert.equal(canTransitionStatus('IN_PROGRESS', 'RESOLVED'), true);
});

test('rejects invalid jumps and out-of-order transitions', () => {
  assert.equal(canTransitionStatus('OPEN', 'RESOLVED'), false);
  assert.equal(canTransitionStatus('IN_REVIEW', 'RESOLVED'), false);
  assert.equal(canTransitionStatus('RESOLVED', 'OPEN'), false);
});
