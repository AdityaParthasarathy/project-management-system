import 'reflect-metadata';
import { describe, expect, it } from '@jest/globals';
import { toPaging } from './list-query.dto.js';

describe('toPaging', () => {
  it('defaults to newest first with no limit when no page is given', () => {
    expect(toPaging({})).toEqual({ orderBy: { createdAt: 'desc' }, skip: undefined, take: undefined });
  });

  it('computes skip/take from page and limit', () => {
    expect(toPaging({ page: 2, limit: 10, sortBy: 'name', order: 'asc' })).toEqual({
      orderBy: { name: 'asc' },
      skip: 10,
      take: 10,
    });
  });

  it('uses a default page size of 20 when only page is given', () => {
    expect(toPaging({ page: 3 })).toMatchObject({ skip: 40, take: 20 });
  });
});
