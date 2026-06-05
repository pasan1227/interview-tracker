import { describe, it, expect } from 'vitest';
import { DASHBOARD_ROUTES, safeCallbackUrl } from '@/routes';

describe('safeCallbackUrl', () => {
  it('returns the value when it starts with a single slash', () => {
    expect(safeCallbackUrl('/dashboard/candidates')).toBe(
      '/dashboard/candidates'
    );
  });

  it('falls back when value is missing', () => {
    expect(safeCallbackUrl(null)).toBe('/dashboard');
    expect(safeCallbackUrl(undefined)).toBe('/dashboard');
    expect(safeCallbackUrl('')).toBe('/dashboard');
  });

  it('rejects protocol-relative URLs (open-redirect vector)', () => {
    expect(safeCallbackUrl('//evil.com/x')).toBe('/dashboard');
  });

  it('rejects absolute URLs', () => {
    expect(safeCallbackUrl('https://evil.com/x')).toBe('/dashboard');
    expect(safeCallbackUrl('http://localhost:3000/dashboard')).toBe('/dashboard');
  });

  it('rejects values that do not start with a slash', () => {
    expect(safeCallbackUrl('dashboard')).toBe('/dashboard');
  });

  it('rejects non-string values', () => {
    // @ts-expect-error — runtime check tested intentionally
    expect(safeCallbackUrl(42)).toBe('/dashboard');
  });
});

describe('DASHBOARD_ROUTES', () => {
  it('builds resource detail paths', () => {
    expect(DASHBOARD_ROUTES.candidates.detail('abc')).toBe(
      '/dashboard/candidates/abc'
    );
    expect(DASHBOARD_ROUTES.interviews.edit('xyz')).toBe(
      '/dashboard/interviews/xyz/edit'
    );
    expect(DASHBOARD_ROUTES.positions.delete('p1')).toBe(
      '/dashboard/positions/p1/delete'
    );
  });

  it('builds nested stage paths inside workflows', () => {
    expect(DASHBOARD_ROUTES.settings.workflows.detail('wf')).toBe(
      '/dashboard/settings/workflows/wf'
    );
    expect(DASHBOARD_ROUTES.settings.workflows.stages.edit('wf', 'st')).toBe(
      '/dashboard/settings/workflows/wf/stages/st/edit'
    );
  });

  it('exposes flat list pages', () => {
    expect(DASHBOARD_ROUTES.feedback).toBe('/dashboard/feedback');
    expect(DASHBOARD_ROUTES.reports).toBe('/dashboard/reports');
    expect(DASHBOARD_ROUTES.profile).toBe('/dashboard/profile');
  });
});
