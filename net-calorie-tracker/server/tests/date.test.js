import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isWithinAllowedWindow } from '../src/utils/date.js';

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

describe('isWithinAllowedWindow', () => {
  const fixedNow = new Date('2026-08-23T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts today', () => {
    expect(isWithinAllowedWindow(toDateString(fixedNow))).toBe(true);
  });

  it('accepts exactly 30 days in the past', () => {
    const date = new Date(fixedNow);
    date.setUTCDate(date.getUTCDate() - 30);
    expect(isWithinAllowedWindow(toDateString(date))).toBe(true);
  });

  it('accepts 31 days in the past (client-timezone skew tolerance)', () => {
    const date = new Date(fixedNow);
    date.setUTCDate(date.getUTCDate() - 31);
    expect(isWithinAllowedWindow(toDateString(date))).toBe(true);
  });

  it('rejects 32 days in the past', () => {
    const date = new Date(fixedNow);
    date.setUTCDate(date.getUTCDate() - 32);
    expect(isWithinAllowedWindow(toDateString(date))).toBe(false);
  });

  it('accepts tomorrow (client-timezone skew tolerance)', () => {
    const date = new Date(fixedNow);
    date.setUTCDate(date.getUTCDate() + 1);
    expect(isWithinAllowedWindow(toDateString(date))).toBe(true);
  });

  it('rejects the day after tomorrow', () => {
    const date = new Date(fixedNow);
    date.setUTCDate(date.getUTCDate() + 2);
    expect(isWithinAllowedWindow(toDateString(date))).toBe(false);
  });

  it('rejects malformed date strings', () => {
    expect(isWithinAllowedWindow('2026/08/23')).toBe(false);
    expect(isWithinAllowedWindow('not-a-date')).toBe(false);
  });
});
