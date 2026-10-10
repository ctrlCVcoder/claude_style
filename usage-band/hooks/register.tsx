import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { UsageSnapshot } from '../types'

const snapshot = atom({ plugin: 'usage-band', key: 'snapshot' } as const, null)

const LABELS: Record<string, string> = {
  five_hour: '5h',
  seven_day: '7d',
  spend_limit: 'spend',
}

const BAR_CELLS = 10

const colorFor = (percent: number) =>
  percent >= 90 ? 'error' : percent >= 70 ? 'warning' : 'success'

const bar = (percent: number) => {
  const clamped = Math.min(100, Math.max(0, percent))
  const filled = Math.round((clamped / 100) * BAR_CELLS)

  return { filled: '▰'.repeat(filled), empty: '▱'.repeat(BAR_CELLS - filled) }
}

const timeUntil = (iso: string | undefined, now: number) => {
  if (!iso) return ''
  const minutes = Math.max(0, Math.round((Date.parse(iso) - now) / 60000))
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  return `${minutes}m`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const usage = await $.session.usage()
    await update($, snapshot, (): UsageSnapshot => ({
      rateLimits: usage.rateLimits,
      contextPercent: usage.context.percent ?? null,
      costUsd: usage.cost?.usd ?? null,
    }))

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await update($, snapshot, (): UsageSnapshot => ({
      rateLimits: e.rateLimits,
      contextPercent: e.context.percent ?? null,
      costUsd: e.cost?.usd ?? null,
    }))

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const data = await read($, snapshot)

    if (e.props.hasSurvey || data === null) {
      return next(e)
    }

    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)

    const meter = (label: string, percent: number, resets?: string) => {
      const { filled, empty } = bar(percent)
      const color = colorFor(percent)
      const reset = timeUntil(resets, now)

      return (
        <Text>
          <Text dimColor>{label} </Text>
          <Text color={color}>{filled}</Text>
          <Text dimColor>{empty}</Text>
          <Text color={color} bold>
            {' '}
            {Math.round(percent)}%
          </Text>
          {reset ? <Text dimColor> ↻ {reset}</Text> : null}
        </Text>
      )
    }

    const parts = [
      ...data.rateLimits.map(limit => (
        <Text key={limit.kind}>{meter(LABELS[limit.kind] ?? limit.kind, limit.percentUsed, limit.resetsAt)}</Text>
      )),
      ...(data.contextPercent !== null
        ? [<Text key="ctx">{meter('ctx', data.contextPercent)}</Text>]
        : []),
      ...(data.costUsd !== null
        ? [
            <Text key="cost">
              <Text dimColor>spent </Text>
              <Text bold>${data.costUsd.toFixed(2)}</Text>
            </Text>,
          ]
        : []),
    ]

    return (
      <Box>
        <Text color="claude" bold>
          ✦ usage{' '}
        </Text>
        {parts.map((part, index) => (
          <Text key={index}>
            {index > 0 ? <Text dimColor>  │  </Text> : null}
            {part}
          </Text>
        ))}
      </Box>
    )
  })
}
