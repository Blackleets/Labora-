/** Serializes remote writes and rejects stale snapshots in this browser tab. */
let writeTail: Promise<void> = Promise.resolve();
let generation = 0;

const enqueue = <T>(work: () => Promise<T>): Promise<T> => {
  const result = writeTail.then(work, work);
  writeTail = result.then(() => undefined, () => undefined);
  return result;
};

export const captureOperationalSnapshotGeneration = () => generation;

export const enqueueOperationalSnapshot = async <T>(
  capturedGeneration: number,
  work: () => Promise<T>
): Promise<T | undefined> =>
  enqueue(async () => {
    if (capturedGeneration !== generation) return undefined;
    return work();
  });

export const runExplicitOperationalMutation = async <T>(work: () => Promise<T>): Promise<T> => {
  generation += 1;
  try {
    return await enqueue(work);
  } finally {
    generation += 1;
  }
};

/** Test-only reset; never used by the application runtime. */
export const resetOperationalWriteCoordinatorForTest = () => {
  writeTail = Promise.resolve();
  generation = 0;
};
