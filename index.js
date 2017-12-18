const { preorder, postorder, load, cleanup } = require('./util')

const clone = o => JSON.parse(JSON.stringify(o))

function normalize(root) {
  preorder(root, (node, i) => {
    if (!node.label) {
      node.label = i
    }
    return node.label
  }, root.label || 'd0')

  postorder(root, (node) => {
    if (!node.left && !node.right) return

    if ((node.label === node.left.label) && (node.label === node.right.label)) {
      delete node.left
      delete node.right
      return
    }

    node.label = null
  })
}

function height(root) {
  root = clone(root)

  postorder(root, (node) => {
    if (!node.left && !node.right) {
      node.label = 1
      return
    }

    node.label = 1 + (node.left.label > node.right.label ?
      node.left.label : node.right.label)
  })

  return root.label
}

function children(root, level) {
  const children = []

  preorder(root, (node, i) => {
    if (i === level) {
      children.push(node)
    }
    return i + 1
  }, 0)

  return children
}

function stride(root) {
  postorder(root, (node) => {
    if (!node.left && !node.right) {
      node.stride = { value: 0, level: 0 }
      return
    }

    let minVal = Infinity
    let minLevel = 0
    for (let k = 1; k <= height(node); ++k) {
      const childrenSum = children(node, k)
        .reduce((acc, n) => (acc + n.stride.value), 0)
      const val = Math.pow(2, k) + childrenSum

      if (val < minVal) {
        minVal = val
        minLevel = k
      }
    }

    node.stride = {
      value: minVal,
      level: minLevel
    }
  })
}

function _buildCompressedTree(root, prefix) {
  for (let i = 0; i < root.nodes.length; ++i) {
    const child = root.nodes[i]

    const s = i.toString(2)
    const padding = '0'.repeat(root.stride.level - s.length)
    const newPrefix = prefix + padding + s

    if (child.stride.level > 0) {
      child.nodes = children(child, child.stride.level)
      _buildCompressedTree(child, newPrefix)
    } else {
      child.prefix = newPrefix
    }
  }
}

function compress(root) {
  root.nodes = children(root, root.stride.level)
  _buildCompressedTree(root, '')
}

module.exports = async function(filename) {
  const root = await load(filename)

  normalize(root)

  stride(root)

  const edges = root.stride.value

  compress(root)

  cleanup(root)

  return {
    edges,
    tree: root
  }
}
