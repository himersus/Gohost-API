import { ChildProcess } from "child_process";

const activeStreams = new Map<string, ChildProcess>();

export function registerStream(id: string, proc: ChildProcess): void {
  const existing = activeStreams.get(id);
  if (existing) {
    existing.kill("SIGTERM");
  }
  activeStreams.set(id, proc);
  proc.on("close", () => {
    activeStreams.delete(id);
  });
}

export function killStream(id: string): void {
  const proc = activeStreams.get(id);
  if (proc) {
    proc.kill("SIGTERM");
    activeStreams.delete(id);
  }
}

export function killAllStreams(): void {
  for (const [id, proc] of activeStreams) {
    proc.kill("SIGTERM");
  }
  activeStreams.clear();
}
