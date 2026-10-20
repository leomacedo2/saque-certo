/** Serialize writes so an older snapshot can never overwrite a newer one. */
export function createWriteQueue(write: (value: string) => Promise<void>) {
  let tail: Promise<void> = Promise.resolve();
  return (value: string): Promise<void> => {
    const job = tail.catch(() => undefined).then(() => write(value));
    tail = job;
    return job;
  };
}
