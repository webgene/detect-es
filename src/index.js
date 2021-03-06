import fs from 'fs-extra'
import * as babylon from 'babylon'
import traverse from '@babel/traverse'
import globby from 'globby'
import * as types from './types'

export default async input => {
  const files = await globby(input)
  const res = await Promise.all(files.map(async file => {
    const code = await fs.readFile(file, 'utf8')
    const stats = detect(code)
    return { file, stats }
  }))
  console.log(res)
}

class Detective {
  constructor() {
    this.items = []
  }

  has(type) {
    return Boolean(this.items.find(item =>
      item.type === type || item.type.toLowerCase() === type
    ))
  }

  add(item) {
    this.items.push(item)
    return this
  }

  count(type) {
    return this.items.filter(item =>
      item.type === type || item.type.toLowerCase() === type
    ).length
  }
}

export function detect(code) {
  const detective = new Detective()
  const ast = babylon.parse(code, {
    sourceType: 'module',
    plugins: ['*']
  })
  traverse(ast, {
    VariableDeclaration(path) {
      if (path.node.kind === 'const') {
        detective.add({ type: types.CONST, loc: path.node.loc })
      }
    },
    TemplateLiteral(path) {
      detective.add({ type: types.TEMPLATE_LITERAL, loc: path.node.loc })
    },
    SpreadElement(path) {
      detective.add({ type: types.OBJECT_REST_SPREAD, loc: path.node.loc })
    }
  })
  return detective
}

export { types }
