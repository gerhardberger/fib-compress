const fs = require('fs')
const { promisify } = require('util')

const readFile = promisify(fs.readFile)
const IP_BLOCK_SIZE = 8

function _addressToPrefix(addr, mask) {
  return addr.split('.').map(block => {
    const binBlock = Number(block).toString(2)
    const padding = '0'.repeat(IP_BLOCK_SIZE - binBlock.length)
    return padding + binBlock
  }).join('').substr(0, mask)
}

function preorder(node, f, i) {
  if (!node) return

  const x = f(node, i)
  preorder(node.left, f, x)
  preorder(node.right, f, x)
}

function postorder(node, f) {
  if (!node) return

  postorder(node.left, f)
  postorder(node.right, f)
  f(node)
}

function _generate(table, prefix, node) {
  if (table.length === 0) return

  node.left = {}
  node.right = {}

  for (let row of table) {
    if (row.prefix === prefix) {
      node.label = row.label
    }
  }

  const filteredTable = table.filter(r => (r.prefix.length > prefix.length))
  _generate(filteredTable, prefix + '0', node.left)
  _generate(filteredTable, prefix + '1', node.right)
}

function prefixTableToPrefixTree(table) {
  const root = {}
  _generate(table, '', root)
  return root
}

async function load(filename) {
  const table = JSON.parse(await readFile(filename))

  const prefixTable = table.map(row => ({
    prefix: _addressToPrefix(row.address, row.mask),
    label: row.label
  }))

  return prefixTableToPrefixTree(prefixTable)
}

function cleanup(node) {
  delete node.stride
  delete node.left
  delete node.right

  if (!node.label) {
    delete node.label
  } else {
    node.leaf = {
      label: node.label,
      prefix: node.prefix
    }
    delete node.label
    delete node.prefix
  }

  if (node.nodes) {
    node.nodes.forEach(cleanup)
  }
}

module.exports = {
  preorder,
  postorder,
  load,
  cleanup
}
