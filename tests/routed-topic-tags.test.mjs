import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

function newsApp() {
  const document = {
    addEventListener() {},
    getElementById() { return null },
  }
  const context = {
    document,
    console,
    localStorage: {
      getItem() { return null },
      setItem() {},
    },
    URL,
    URLSearchParams,
    TextDecoder,
    Uint8Array,
    fetch: async () => { throw new Error('not used') },
  }
  context.window = context
  vm.runInNewContext(
    `${fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site', 'news', 'news-app.js'), 'utf8')}\nglobalThis.NewsApp = NewsApp;\n`,
    context,
  )
  return Object.create(context.NewsApp.prototype)
}

test('routed feed tags use the news page topic buttons', () => {
  const app = newsApp()
  const tags = app.uiTagsForRoutedArticle({
    title: 'Research agenda proposes seven open problems for multi-agent AI swarms',
    summary: 'A researcher scores each problem for alignment.',
    tags: ['announcement', 'model_release', 'open_source', 'ai_agents', 'research_paper', 'industry_move'],
    matching_tags: ['model_release', 'open_source', 'research_paper'],
  })
  assert.ok(tags.includes('agents'))
  assert.ok(tags.includes('research'))
  assert.ok(tags.includes('ai'))
  assert.equal(tags.includes('model_release'), false)
  assert.equal(tags.includes('ai_agents'), false)
  assert.equal(tags.includes('research_paper'), false)
  assert.equal(tags.includes('open_source'), false)
})

test('an open-source model story stays visible under those topic buttons', () => {
  const app = newsApp()
  const tags = app.uiTagsForRoutedArticle({
    title: 'Lab publishes an open-source model release',
    summary: 'The weights are on GitHub.',
    matching_tags: ['model_release', 'open_source'],
  })
  assert.ok(tags.includes('models'))
  assert.ok(tags.includes('open-source'))
  assert.ok(tags.includes('product'))
})
