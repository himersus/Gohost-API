export function sanitizeShellArg(input: string): string {
  return input.replace(/[^a-zA-Z0-9_\-\.@\/:]/g, "");
}

export function sanitizeBranchName(input: string): string {
  return input.replace(/[^a-zA-Z0-9_\-\.\/]/g, "");
}

export function sanitizeSubdomain(input: string): string {
  return input.replace(/[^a-zA-Z0-9\-]/g, "");
}

export function sanitizeUsername(input: string): string {
  return input.replace(/[^a-zA-Z0-9_\-\.]/g, "");
}

export function sanitizeForDockerCompose(input: string): string {
  return input.replace(/[^a-zA-Z0-9_\-\.\/\s]/g, "");
}
