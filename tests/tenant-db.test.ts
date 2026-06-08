import { describe, it, expect } from 'vitest';
import { mergeOrgFilter, injectOrgIntoCreateData } from '../lib/tenant-db-helpers';

describe('mergeOrgFilter', () => {
  it('adds organizationId when where is empty', () => {
    expect(mergeOrgFilter(undefined, 'org_1')).toEqual({
      organizationId: 'org_1',
    });
  });

  it('adds organizationId alongside existing fields', () => {
    expect(mergeOrgFilter({ status: 'NEW' }, 'org_1')).toEqual({
      status: 'NEW',
      organizationId: 'org_1',
    });
  });

  it('wraps in AND when caller already supplied an organizationId', () => {
    const out = mergeOrgFilter({ organizationId: 'org_other' }, 'org_1');
    expect(out).toEqual({
      AND: [{ organizationId: 'org_other' }, { organizationId: 'org_1' }],
    });
    // The AND with two different organizationIds collapses to a
    // contradiction in Postgres — exactly the safe-fail we want when
    // a caller tries to sneak past the scope.
  });

  it('preserves nested where conditions while adding org scope', () => {
    expect(
      mergeOrgFilter({ AND: [{ status: 'NEW' }, { isActive: true }] }, 'org_1')
    ).toEqual({
      AND: [{ status: 'NEW' }, { isActive: true }],
      organizationId: 'org_1',
    });
  });
});

describe('injectOrgIntoCreateData', () => {
  it('adds organizationId to a single create object', () => {
    expect(injectOrgIntoCreateData({ name: 'X', email: 'x@y.z' }, 'org_1'))
      .toEqual({ name: 'X', email: 'x@y.z', organizationId: 'org_1' });
  });

  it('maps over an array (createMany)', () => {
    expect(injectOrgIntoCreateData([{ name: 'a' }, { name: 'b' }], 'org_1'))
      .toEqual([
        { name: 'a', organizationId: 'org_1' },
        { name: 'b', organizationId: 'org_1' },
      ]);
  });

  it('does not clobber an explicit organizationId', () => {
    expect(
      injectOrgIntoCreateData({ name: 'X', organizationId: 'org_other' }, 'org_1')
    ).toEqual({ name: 'X', organizationId: 'org_other' });
  });

  it('does not clobber an explicit organization relation', () => {
    expect(
      injectOrgIntoCreateData(
        { name: 'X', organization: { connect: { id: 'org_other' } } },
        'org_1'
      )
    ).toEqual({ name: 'X', organization: { connect: { id: 'org_other' } } });
  });

  it('passes null/undefined through unchanged', () => {
    expect(injectOrgIntoCreateData(null, 'org_1')).toBeNull();
    expect(injectOrgIntoCreateData(undefined, 'org_1')).toBeUndefined();
  });
});
