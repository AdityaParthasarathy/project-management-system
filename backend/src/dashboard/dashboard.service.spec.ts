import { describe, expect, it, jest } from '@jest/globals';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('returns counts from the database scoped to the user', async () => {
    const counts = [3, 10, 4, 5, 2];
    let i = 0;
    const count = jest.fn<(...a: any[]) => any>().mockImplementation(() => Promise.resolve(counts[i++]));
    const service = new DashboardService({ project: { count }, task: { count } } as any);
    const result = await service.getDashboard(9);
    expect(result).toEqual({ totalProjects: 3, totalTasks: 10, completedTasks: 4, pendingTasks: 5, projectsInProgress: 2 });
    for (const call of count.mock.calls) expect(call[0].where.userId).toBe(9);
  });
});
