import { expect, mock, test } from 'claude-code/testing'

test('band shows the delegated task and the outcome', async ($, on) => {
  mock.clock(on)
  on('tool.call', { tool: 'Bash' }, () => ({
    result: { stdout: 'Applied edit to app.py\nCommit abc123 feat: x', stderr: '', interrupted: false },
    text: 'Applied edit to app.py\nCommit abc123 feat: x',
  }) as never)
  on('ui.render', ($, e) => {
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box>
        <Text>base</Text>
      </Box>
    )
  })

  await $.tool.call({
    tool: 'Bash',
    command: 'aider --model m --yes-always --message "add a reset button" app.py',
  } as never)

  const ui = await $.ui.mount({
    plugin: 'aider-watch',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 10, columns: 100 },
  } as never)

  expect(await ui.find({ type: 'Text', text: /add a reset button/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Applied edit to app.py/ })).toBeDefined()
  await ui.unmount()
})
