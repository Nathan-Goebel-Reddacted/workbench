import { describe, expect, it } from 'vitest'

const sources = import.meta.glob<string>(['./**/*.{ts,tsx}', '!./**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

const RELATIVE_IMPORT = /(?:import|export)\s[^'"]*?from\s+['"](\.{1,2}\/[^'"]*)['"]/g

type Import = { file: string; target: string }

function resolve(file: string, specifier: string): string {
  const segments = file.split('/').slice(0, -1)
  for (const part of specifier.split('/')) {
    if (part === '..') segments.pop()
    else if (part !== '.') segments.push(part)
  }
  return segments.filter(segment => segment !== '.').join('/')
}

function relativeImports(): Import[] {
  return Object.entries(sources).flatMap(([path, content]) => {
    const file = path.replace(/^\.\//, '')
    return [...content.matchAll(RELATIVE_IMPORT)].map(([, specifier]) => ({
      file,
      target: resolve(file, specifier).replace(/\/index$/, ''),
    }))
  })
}

function contextOf(path: string): string | null {
  const [root, name] = path.split('/')
  return root === 'contexts' && name ? name : null
}

function describeImport({ file, target }: Import): string {
  return `${file} -> ${target}`
}

describe('frontières entre contextes', () => {
  const imports = relativeImports()

  it('trouve les sources à analyser', () => {
    expect(imports.length).toBeGreaterThan(0)
  })

  it("n'atteint un autre contexte que par son index public", () => {
    const offenders = imports.filter(({ file, target }) => {
      const targetContext = contextOf(target)
      if (!targetContext || contextOf(file) === targetContext) return false
      return target !== `contexts/${targetContext}`
    })

    expect(offenders.map(describeImport)).toEqual([])
  })

  it("garde shared/ indépendant des contextes et de l'application", () => {
    const offenders = imports.filter(
      ({ file, target }) => file.startsWith('shared/') && (target.startsWith('contexts/') || target.startsWith('app/')),
    )

    expect(offenders.map(describeImport)).toEqual([])
  })

  it('ne forme aucun cycle entre contextes', () => {
    const dependencies = new Map<string, Set<string>>()
    for (const { file, target } of imports) {
      const from = contextOf(file)
      const to = contextOf(target)
      if (!from || !to || from === to) continue
      dependencies.set(from, (dependencies.get(from) ?? new Set()).add(to))
    }

    const cycles: string[] = []
    const visit = (context: string, path: string[]) => {
      for (const next of dependencies.get(context) ?? []) {
        if (next === path[0]) cycles.push([...path, next].join(' -> '))
        else if (!path.includes(next) && next > path[0]) visit(next, [...path, next])
      }
    }
    for (const context of dependencies.keys()) visit(context, [context])

    expect(cycles).toEqual([])
  })

  it('garde le modèle d’un contexte indépendant de son interface', () => {
    const MODEL = /^contexts\/[^/]+\/(types|status|widgets|api)\.ts$/
    const UI = /^contexts\/[^/]+\/(components|pages|hooks)\//
    const offenders = imports.filter(({ file, target }) => MODEL.test(file) && UI.test(target))

    expect(offenders.map(describeImport)).toEqual([])
  })

  it("fait passer l'affichage par les hooks plutôt que par l'API", () => {
    const DISPLAY = /\.tsx$/
    const API = /^((contexts\/[^/]+|app\/[^/]+)\/api|shared\/api\/.+)$/
    const offenders = imports.filter(({ file, target }) => DISPLAY.test(file) && API.test(target))

    expect(offenders.map(describeImport)).toEqual([])
  })

  it("ne fait pas dépendre un contexte de l'application", () => {
    const offenders = imports.filter(
      ({ file, target }) => file.startsWith('contexts/') && (target.startsWith('app/') || target === 'App'),
    )

    expect(offenders.map(describeImport)).toEqual([])
  })
})
