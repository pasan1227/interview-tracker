import { describe, it, expect } from 'vitest';
import { DASHBOARD_ROUTES, safeCallbackUrl } from '@/routes';

describe('safeCallbackUrl', () => {
  it('returns the value when it starts with a single slash', () => {
    expect(safeCallbackUrl('/candidates')).toBe(
      '/candidates'
    );
  });

  it('falls back when value is missing', () => {
    expect(safeCallbackUrl(null)).toBe('/');
    expect(safeCallbackUrl(undefined)).toBe('/');
    expect(safeCallbackUrl('')).toBe('/');
  });

  it('rejects protocol-relative URLs (open-redirect vector)', () => {
    expect(safeCallbackUrl('//evil.com/x')).toBe('/');
  });

  it('rejects absolute URLs', () => {
    expect(safeCallbackUrl('https://evil.com/x')).toBe('/');
    expect(safeCallbackUrl('http://localhost:3000/dashboard')).toBe('/');
  });

  it('rejects values that do not start with a slash', () => {
    expect(safeCallbackUrl('dashboard')).toBe('/');
  });

  it('rejects non-string values', () => {
    // @ts-expect-error — runtime check tested intentionally
    expect(safeCallbackUrl(42)).toBe('/');
  });
});

describe('DASHBOARD_ROUTES', () => {
  it('builds resource detail paths', () => {
    expect(DASHBOARD_ROUTES.candidates.detail('abc')).toBe(
      '/candidates/abc'
    );
    expect(DASHBOARD_ROUTES.interviews.edit('xyz')).toBe(
      '/interviews/xyz/edit'
    );
    expect(DASHBOARD_ROUTES.positions.delete('p1')).toBe(
      '/positions/p1/delete'
    );
  });

  it('builds nested stage paths inside workflows', () => {
    expect(DASHBOARD_ROUTES.settings.workflows.detail('wf')).toBe(
      '/settings/workflows/wf'
    );
    expect(DASHBOARD_ROUTES.settings.workflows.stages.edit('wf', 'st')).toBe(
      '/settings/workflows/wf/stages/st/edit'
    );
  });

  it('exposes flat list pages', () => {
    expect(DASHBOARD_ROUTES.feedback).toBe('/feedback');
    expect(DASHBOARD_ROUTES.reports).toBe('/reports');
    expect(DASHBOARD_ROUTES.profile).toBe('/profile');
  });
});
