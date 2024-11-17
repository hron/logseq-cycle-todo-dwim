import '@logseq/libs'

async function main() {
  logseq.UI.showMsg("hello, I'm a sample plugin! :)")
}

// bootstrap
logseq.ready(main).catch(console.error)
