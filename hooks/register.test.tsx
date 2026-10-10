import { expect, test } from 'claude-code/testing'

test('band stays out of the way before the first measurement', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box>
        <Text>base</Text>
      </Box>
    )
  })

  const ui = await $.ui.mount({
    plugin: 'usage-band',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 10, columns: 100 },
  } as never)

  expect(await ui.find({ type: 'Text', text: /Usage/ })).toBeUndefined()
  await ui.unmount()
})
