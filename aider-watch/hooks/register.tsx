import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { AiderJob } from '../types'

const job = atom({ plugin: 'aider-watch', key: 'job' } as const, null)

const AIDER = /(^|[\s;&|("'])aider(\.exe)?(\s|$)/
const MESSAGE = /--message(?:=|\s+)("(?:[^"\\]|\\.)*"|'[^']*'|\S+)/
const OUTCOME = /^(Applied edit to |Commit |Tokens: |Cost: |Added .* to the chat|Git repo: |Model: )/

const unquote = (value: string) => value.replace(/^(["'])([\s\S]*)\1$/, '$2').replace(/\\"/g, '"')

const parse = (command: string) => {
  const match = MESSAGE.exec(command)

  if (!AIDER.test(command) || !match?.[1]) return null

  const task = unquote(match[1]).replace(/\s+/g, ' ').trim()
  const rest = command.slice((match.index ?? 0) + match[0].length)
  const files = rest
    .split(/\s+/)
    .filter(token => token && !token.startsWith('-') && !/^[|&;>]/.test(token))
    .slice(0, 8)

  return { task, files }
}

const clock = (ms: number) => {
  const seconds = Math.round(ms / 1000)

  return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`
}

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text)

export const register: Register = on => {
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const parsed = parse(e.command)

    if (parsed === null) {
      return next(e)
    }

    const startedAt = await $.clock.now()
    await update($, job, (): AiderJob => ({
      ...parsed,
      status: 'running',
      startedAt,
      elapsedMs: 0,
      lines: [],
      isHidden: false,
    }))

    const tick = $.clock.every(1000, async () => {
      const now = await $.clock.now()
      await update($, job, (current): AiderJob | null =>
        current && current.status === 'running' ? { ...current, elapsedMs: now - startedAt } : current,
      )
    })

    const ran = await next(e)
    tick.cancel()

    const now = await $.clock.now()
    const text = ran.deny === undefined ? (ran.text ?? '') : ''
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => OUTCOME.test(line))
      .slice(-6)
    const hasFailed = ran.deny !== undefined || ran.isError === true

    await update($, job, (current): AiderJob | null =>
      current
        ? { ...current, status: hasFailed ? 'failed' : 'done', elapsedMs: now - startedAt, lines }
        : current,
    )

    return ran
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const current = await read($, job)

    if (e.props.hasSurvey || current === null || current.isHidden) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)
    const isRunning = current.status === 'running'
    const color = isRunning ? 'warning' : current.status === 'done' ? 'success' : 'error'
    const icon = isRunning ? '⚙' : current.status === 'done' ? '✓' : '✗'
    const verb = isRunning ? 'running' : current.status === 'done' ? 'done in' : 'failed after'

    return (
      <Box flexDirection="column">
        <Box>
          <Text color={color} bold>
            {icon} aider{' '}
          </Text>
          <Text color={color}>
            {verb} {clock(current.elapsedMs)}
          </Text>
          {current.files.length > 0 ? (
            <Text dimColor>  ·  {clip(current.files.join(' '), 60)}</Text>
          ) : null}
          {isRunning ? null : (
            <Button key="hide" label="  Hide" onPress={() => update($, job, c => (c ? { ...c, isHidden: true } : c))} />
          )}
        </Box>
        <Box>
          <Text dimColor>  task  </Text>
          <Text>{clip(current.task, 200)}</Text>
        </Box>
        {current.lines.map((line, index) => (
          <Box key={index}>
            <Text dimColor>  ↳ </Text>
            <Text>{clip(line, 160)}</Text>
          </Box>
        ))}
      </Box>
    )
  })
}
