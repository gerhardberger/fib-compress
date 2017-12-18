const pretty = require('pretty-tree')

const compress = require('./')

async function run() {
  try {
    const { edges, tree } = await compress(`${__dirname}/fixtures/fib-2.json`)
    console.log(`Mininal compressed number of edges: ${edges}`)
    console.log(pretty(tree))
  } catch (err) {
    console.error(err)
  }
}

run()
