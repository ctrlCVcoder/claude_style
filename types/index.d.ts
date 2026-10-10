export type UsageSnapshot = {
  rateLimits: { kind: string; percentUsed: number; resetsAt?: string }[]
  contextPercent: number | null
  costUsd: number | null
}

declare module 'claude-code' {
  interface PluginState {
    'usage-band': { snapshot: UsageSnapshot | null }
  }
}
