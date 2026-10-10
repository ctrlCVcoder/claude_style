export type AiderJob = {
  task: string
  files: string[]
  status: 'running' | 'done' | 'failed'
  startedAt: number
  elapsedMs: number
  lines: string[]
  isHidden: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'aider-watch': { job: AiderJob | null }
  }
}
