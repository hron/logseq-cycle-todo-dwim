import '@logseq/libs'

async function main() {
  logseq.UI.showMsg('cycle-todo-dwim AAAA')
}

// bootstrap
logseq.ready(main).catch(console.error)
