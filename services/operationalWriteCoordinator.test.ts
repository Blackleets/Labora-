import { beforeEach, describe, expect, it } from 'vitest';
import {
  captureOperationalSnapshotGeneration,
  enqueueOperationalSnapshot,
  resetOperationalWriteCoordinatorForTest,
  runExplicitOperationalMutation
} from './operationalWriteCoordinator';

describe('operational write coordinator', () => {
  beforeEach(() => resetOperationalWriteCoordinatorForTest());

  it('drops a queued snapshot when an explicit deletion begins later', async () => {
    const events: string[] = [];
    const staleSnapshot = captureOperationalSnapshotGeneration();
    const sync = enqueueOperationalSnapshot(staleSnapshot, async () => { events.push('sync'); });
    const deletion = runExplicitOperationalMutation(async () => { events.push('delete'); });

    await Promise.all([sync, deletion]);
    expect(events).toEqual(['delete']);
  });

  it('finishes an already-running snapshot before the explicit deletion', async () => {
    const events: string[] = [];
    let releaseSnapshot!: () => void;
    const snapshotGate = new Promise<void>((resolve) => { releaseSnapshot = resolve; });
    const sync = enqueueOperationalSnapshot(captureOperationalSnapshotGeneration(), async () => {
      events.push('sync-start');
      await snapshotGate;
      events.push('sync-end');
    });
    await Promise.resolve();

    const deletion = runExplicitOperationalMutation(async () => { events.push('delete'); });
    releaseSnapshot();

    await Promise.all([sync, deletion]);
    expect(events).toEqual(['sync-start', 'sync-end', 'delete']);
  });

  it('drops a snapshot captured while a deletion is in flight', async () => {
    const events: string[] = [];
    let releaseDeletion!: () => void;
    const deletionGate = new Promise<void>((resolve) => { releaseDeletion = resolve; });
    const deletion = runExplicitOperationalMutation(async () => {
      events.push('delete-start');
      await deletionGate;
      events.push('delete-end');
    });
    const staleSnapshot = captureOperationalSnapshotGeneration();
    const sync = enqueueOperationalSnapshot(staleSnapshot, async () => { events.push('sync'); });
    releaseDeletion();

    await Promise.all([deletion, sync]);
    expect(events).toEqual(['delete-start', 'delete-end']);
  });
});
