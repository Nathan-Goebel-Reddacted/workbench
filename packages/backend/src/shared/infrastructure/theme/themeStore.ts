import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const CONFIG_PATH = join(process.cwd(), 'theme-config.json')

export function readThemeConfig(): Record<string, string> {
    if (!existsSync(CONFIG_PATH)) return {}
    try {
        return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as Record<string, string>
    } catch {
        return {}
    }
}

export function writeThemeConfig(colors: Record<string, string>): void {
    writeFileSync(CONFIG_PATH, JSON.stringify(colors, null, 2))
}
