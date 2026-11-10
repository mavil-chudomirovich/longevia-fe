import { describe, expect, it } from 'vitest';
import { getActiveNavHref } from './nav-active';

const NAV_HREFS = ['/', '/diet', '/diet/suggestions', '/progress'] as const;

describe('getActiveNavHref', () => {
  it('highlights the home item only on the root path', () => {
    expect(getActiveNavHref('/', NAV_HREFS)).toBe('/');
  });

  it('highlights the diet item on its exact path and child paths', () => {
    expect(getActiveNavHref('/diet', NAV_HREFS)).toBe('/diet');
    expect(getActiveNavHref('/diet/', NAV_HREFS)).toBe('/diet');
    expect(getActiveNavHref('/diet/foods', NAV_HREFS)).toBe('/diet');
    expect(getActiveNavHref('/diet/targets', NAV_HREFS)).toBe('/diet');
  });

  it('prefers the deeper suggestions item over the diet parent', () => {
    expect(getActiveNavHref('/diet/suggestions', NAV_HREFS)).toBe('/diet/suggestions');
    expect(getActiveNavHref('/diet/suggestions/', NAV_HREFS)).toBe('/diet/suggestions');
  });

  it('highlights only the progress item on progress child paths', () => {
    expect(getActiveNavHref('/progress', NAV_HREFS)).toBe('/progress');
    expect(getActiveNavHref('/progress/metrics', NAV_HREFS)).toBe('/progress');
    expect(getActiveNavHref('/progress/metrics/history', NAV_HREFS)).toBe('/progress');
  });

  it('does not match a path prefix that is only part of a segment', () => {
    expect(getActiveNavHref('/dietary', NAV_HREFS)).toBeUndefined();
    expect(getActiveNavHref('/progress-report', NAV_HREFS)).toBeUndefined();
  });

  it('returns undefined for routes outside the navigation', () => {
    expect(getActiveNavHref('/login', NAV_HREFS)).toBeUndefined();
    expect(getActiveNavHref('/profile', NAV_HREFS)).toBeUndefined();
  });

  it('ignores query strings and hash fragments defensively', () => {
    expect(getActiveNavHref('/diet/suggestions?goal=Longevity', NAV_HREFS)).toBe(
      '/diet/suggestions'
    );
    expect(getActiveNavHref('/progress#today', NAV_HREFS)).toBe('/progress');
  });
});
