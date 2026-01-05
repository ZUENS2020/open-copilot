export function err2String(err: unknown, stack = false): string {
  try {
    if (err instanceof Error) {
      const errorWithCause = err as Error & { cause?: unknown };
      const causeMsg =
        errorWithCause.cause instanceof Error
          ? errorWithCause.cause.message
          : errorWithCause.cause
            ? String(errorWithCause.cause)
            : "";
      const stackStr = stack && err.stack ? err.stack : "";
      const parts = [err.message];
      if (causeMsg) parts.push(`more message: ${causeMsg}`);
      if (stackStr) parts.push(stackStr);
      return parts.join("\n");
    }
    const json = JSON.stringify(err);
    return json ?? String(err);
  } catch {
    return String(err);
  }
}
