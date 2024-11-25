import '@logseq/libs'
import type { BlockEntity } from '@logseq/libs/dist/LSPlugin'
import { DateTime, Duration } from 'luxon'

type TodoStyle = 'TODO' | 'LATER'

async function preferredTodoStyle(): Promise<TodoStyle> {
  const userConfigs = await logseq.App.getUserConfigs()
  return userConfigs.preferredTodo as TodoStyle
}

async function getChosenBlocks(): Promise<[BlockEntity[], boolean]> {
  const selected = await logseq.Editor.getSelectedBlocks()
  if (selected) return [selected, true]

  const uuid = await logseq.Editor.checkEditing()
  if (!uuid) return [[], false]

  const editingBlock = (await logseq.Editor.getBlock(
    uuid as string
  )) as BlockEntity

  // to get ahead of Logseq block content saving process
  editingBlock.content = await logseq.Editor.getEditingBlockContent()

  return [[editingBlock], false]
}

const todoSequences = {
  TODO: ['', 'TODO', 'DOING', 'DONE'] as const,
  LATER: ['', 'LATER', 'NOW', 'DONE'] as const,
} as const

type MarkerTODOStyle = (typeof todoSequences.TODO)[number]
type MarkerLATERStyle = (typeof todoSequences.LATER)[number]
type Marker = MarkerTODOStyle | MarkerLATERStyle

function getMarker(block: BlockEntity) {
  let currentMarker = ''
  const allPossibleMarkers = Object.values(todoSequences)
    .flat()
    .filter(
      (marker, index, self) => marker !== '' && self.indexOf(marker) === index
    )
  const matchData = block.content?.match(
    new RegExp(`^(${allPossibleMarkers.join('|')})`)
  )
  if (matchData) {
    currentMarker = matchData[1]
  }
  return currentMarker as Marker
}

function setMarker(block: BlockEntity, newMarker: Marker) {
  const content = block.content || ''
  const currentMarker = getMarker(block)
  if (currentMarker === '') {
    return `${newMarker} ${content}`
  } else {
    return content
      .replace(new RegExp(`^\\s*${currentMarker}`), newMarker)
      .trim()
  }
}

async function computeNextMarker(currentMarker: Marker) {
  const userPreferredStyle = await preferredTodoStyle()
  const todoSeq = todoSequences[userPreferredStyle] as readonly Marker[]
  return todoSeq[(todoSeq.indexOf(currentMarker) + 1) % todoSeq.length]
}

type Timestamp = {
  date: DateTime
  repeatingPeriod?: Duration
}

const toLongUnits = {
  y: 'years',
  m: 'months',
  w: 'weeks',
  d: 'days',
} as const

const timestampTypes = ['SCHEDULED', 'DEADLINE'] as const

function parseTimestamps(block: BlockEntity) {
  return timestampTypes.map((t) => {
    const matchData = block.content?.match(
      new RegExp(
        `${t}: <(....-..-..) ...(?: [0-9-:]+)?(?: \\.\\+([0-9]+)([ymwd]))?>`
      )
    )

    if (!matchData) return undefined

    const date = DateTime.fromFormat(matchData[1], 'yyyy-MM-dd')
    let repeatingPeriod: Duration | undefined = undefined
    if (matchData[2] && matchData[3])
      repeatingPeriod = Duration.fromObject({
        [toLongUnits[matchData[3]]]: Number.parseInt(matchData[2]),
      })
    return {
      date,
      repeatingPeriod,
    }
  })
}

async function startMarker() {
  const todoStyle = await preferredTodoStyle()
  return todoSequences[todoStyle].at(1) as Marker
}

function updateTimestamps(
  content: string,
  currentTimestamps: [Timestamp?, Timestamp?]
) {
  for (const [i, t] of timestampTypes.entries()) {
    if (!currentTimestamps[i] || !currentTimestamps[i].repeatingPeriod) continue
    const updatedTimestamp = currentTimestamps[i].date.plus(
      currentTimestamps[i].repeatingPeriod
    )

    content = content.replace(
      new RegExp(`${t}: <....-..-.. ...`),
      `${t}: <${updatedTimestamp.toFormat('yyyy-MM-dd EEE')}`
    )
  }
  return content
}

async function cycleTODOdwim(): Promise<void[]> {
  const [blocks] = await getChosenBlocks()
  if (blocks.length === 0) return []

  return Promise.all(
    blocks.map(async (b) => {
      const currentMarker = getMarker(b)

      const [scheduled, deadline] = parseTimestamps(b)
      const nextMarker = await computeNextMarker(currentMarker)
      let newContent = setMarker(b, nextMarker)
      if (
        nextMarker === 'DONE' &&
        (scheduled?.repeatingPeriod || deadline?.repeatingPeriod)
      ) {
        newContent = setMarker(b, await startMarker())
        newContent = updateTimestamps(newContent, [scheduled, deadline])
      }
      return logseq.Editor.updateBlock(b.uuid, newContent)
    })
  )
}

async function main() {
  logseq.App.registerCommandPalette(
    {
      label: 'Cycle TODO (Do What I Mean)',
      key: 'cycle-todo-dwim',
      keybinding: {
        mac: 'mod+shift+enter',
        binding: 'ctrl+shift+enter',
        mode: 'global',
      },
    },
    cycleTODOdwim
  )
}

// bootstrap
logseq.ready(main).catch(console.error)
