import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

export interface Violation { file: string; line: number; rule: string; text: string }

const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white'
const UTIL = 'bg|text|border|ring|fill|stroke|from|via|to|outline|divide|placeholder|accent|caret|decoration|shadow'

const RULES: { rule: string; re: RegExp; css?: boolean }[] = [
  { rule: 'raw colour (#hex)', re: /(?<![\w&/-])#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b(?!\s*[:{])/, css: true },
  { rule: 'raw colour (rgb/hsl)', re: /\b(?:rgba?|hsla?)\(\s*\d/, css: true },
  { rule: 'Tailwind palette class', re: new RegExp(`(?<![\\w-])(?:[a-z-]+:)*(?:${UTIL})-(?:${PALETTE})(?:-\\d{2,3})?(?:\\/\\d+)?(?![\\w-])`) },
  { rule: 'serif font', re: /\bfont-serif\b|font-family:[^;]*\bserif\b(?<!sans-serif)|['"](?:Georgia|Times New Roman|Playfair[^'"]*|Merriweather|Lora)['"]/i, css: true },
  { rule: 'emoji', re: /[\u{1F300}-\u{1FAFF}\u{1F600}-\u{1F64F}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u, css: true },
  { rule: 'icon library other than lucide-react', re: /from\s+['"](?:react-icons[^'"]*|@heroicons\/[^'"]+|@radix-ui\/react-icons|@tabler\/icons-react|@phosphor-icons\/[^'"]+|@mui\/icons-material[^'"]*|react-feather|@fortawesome\/[^'"]+)['"]/ },
  { rule: 'chart library other than @ads/charts', re: /from\s+['"](?:recharts|chart\.js|react-chartjs-2|@nivo\/[^'"]+|victory|@visx\/[^'"]+|apexcharts|react-apexcharts|highcharts[^'"]*|echarts[^'"]*|@tremor\/[^'"]+|plotly[^'"]*)['"]/ },
  { rule: 'lucide stroke must be 1.5', re: /strokeWidth=\{?\s*['"]?(?!1\.5\b)\d+(?:\.\d+)?/ },
  // A line that sets font-mono and renders a money value. Heuristic; document real exceptions with ads-lint-ignore.
  { rule: 'font-mono on a financial figure (use tabular-nums)', re: /^(?=.*\bfont-mono\b)(?=.*\b(?:amount|price|money|currency|valuation|formatCurrency|formatMoney|fmtMoney|fmtEur|fmtUsd)\b)/i },
]

const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'coverage', 'ads', '__fixtures__', 'fixtures'])
const EXT = /\.(tsx?|jsx?|css)$/
const TEST = /\.(test|spec)\.[tj]sx?$/

function walk(dir: string, out: string[]) {
  let entries: string[]
  try { entries = readdirSync(dir) } catch { return }
  for (const e of entries) {
    if (SKIP_DIRS.has(e)) continue
    const p = join(dir, e)
    const s = statSync(p)
    if (s.isDirectory()) walk(p, out)
    else if (EXT.test(e) && !TEST.test(e)) out.push(p)
  }
}

/** Scan the given directories (relative to `root`) and return every violation. */
export function findDesignViolations(dirs: string[], root = process.cwd(), opts: { allow?: RegExp[] } = {}): Violation[] {
  const files: string[] = []
  for (const d of dirs) walk(join(root, d), files)
  const out: Violation[] = []
  for (const f of files) {
    const isCss = f.endsWith('.css')
    const lines = readFileSync(f, 'utf8').split('\n')
    lines.forEach((text, i) => {
      // `ads-lint-ignore: <reason>` on the line (or the line above) documents a deliberate exception.
      if (/ads-lint-ignore/.test(text) || /ads-lint-ignore/.test(lines[i - 1] ?? '')) return
      if (opts.allow?.some(a => a.test(text))) return
      for (const r of RULES) {
        if (isCss && !r.css) continue
        if (r.re.test(text)) out.push({ file: relative(root, f), line: i + 1, rule: r.rule, text: text.trim().slice(0, 160) })
      }
    })
  }
  return out
}
