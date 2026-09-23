import fs from 'node:fs'
import path from 'node:path'
import { rootDir } from './lib/utils.mjs'

const UI_TARGET_DIR = path.join(rootDir, 'packages/ui/src/components/ui')

// Core official components to sync into @automa/ui
const DEFAULT_COMPONENTS = [
  'button',
  'badge',
  'dialog',
  'alert-dialog',
  'sheet',
  'popover',
  'tooltip',
  'card',
  'input',
  'separator',
  'skeleton',
  'table',
  'tabs',
  'switch',
  'dropdown-menu',
  'checkbox',
  'scroll-area',
  'avatar',
  'accordion',
]

async function syncShadcnComponents(targetComponents = DEFAULT_COMPONENTS) {
  console.log('================================================================================')
  console.log('🚀 SHADCN-VUE AUTOMATED REGISTRY SYNC & CODE GENERATOR')
  console.log(`📂 Output Directory: ${UI_TARGET_DIR}`)
  console.log(`📦 Components: ${targetComponents.join(', ')}`)
  console.log('================================================================================\n')

  if (!fs.existsSync(UI_TARGET_DIR)) {
    fs.mkdirSync(UI_TARGET_DIR, { recursive: true })
  }

  const syncedComponents = []

  for (const name of targetComponents) {
    const url = `https://shadcn-vue.com/r/styles/default/${name}.json`
    try {
      const res = await fetch(url)
      if (!res.ok) {
        console.warn(`⚠️ Component [${name}] not found on registry (HTTP ${res.status}). Skipping.`)
        continue
      }
      const data = await res.json()
      const compDir = path.join(UI_TARGET_DIR, name)
      if (!fs.existsSync(compDir)) {
        fs.mkdirSync(compDir, { recursive: true })
      }

      console.log(`📥 Syncing [${name.toUpperCase()}] from official registry...`)

      if (data.files && Array.isArray(data.files)) {
        for (const file of data.files) {
          const fileName = path.basename(file.path)
          const targetFile = path.join(compDir, fileName)

          let content = file.content

          // Normalize 'reka-ui' -> 'radix-vue' for radix-vue 1.9 compatibility
          content = content.replace(/from\s+["']reka-ui["']/g, "from 'radix-vue'")
          content = content.replace(/from\s+["']reka-ui\/([^"']+)["']/g, "from 'radix-vue'")

          // Normalize relative utils import
          content = content.replace(/from\s+["']@\/lib\/utils["']/g, "from '../../../lib/utils'")
          content = content.replace(/from\s+["']@\/registry\/default\/lib\/utils["']/g, "from '../../../lib/utils'")

          // Normalize cross-component imports: '@/registry/default/ui/foo' or '@/components/ui/foo' -> '../foo'
          content = content.replace(/from\s+["']@\/registry\/default\/ui\/([^"']+)["']/g, "from '../$1'")
          content = content.replace(/from\s+["']@\/components\/ui\/([^"']+)["']/g, "from '../$1'")

          // Ensure Button & Badge have status variants (success, warning, info) for domain execution
          if (name === 'button' && fileName === 'index.ts') {
            if (!content.includes('success:')) {
              content = content.replace(
                'link: "text-primary underline-offset-4 hover:underline",',
                `link: "text-primary underline-offset-4 hover:underline",
        success: "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700",
        warning: "bg-amber-600 text-white shadow-xs hover:bg-amber-700",
        primary: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",`,
              )
            }
            if (!content.includes('"icon-xs"')) {
              content = content.replace(
                '"icon-sm": "size-9",',
                `"xs": "h-6 px-2 text-xs rounded",
        "icon-sm": "size-9",
        "icon-xs": "size-6 p-0",`,
              )
            }
          }

          if (name === 'badge' && fileName === 'index.ts') {
            if (!content.includes('success:')) {
              content = content.replace(
                'destructive:',
                `success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 font-bold",
        warning: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold",
        info: "border-blue-500/20 bg-blue-500/10 text-blue-500 font-bold",
        destructive:`,
              )
            }
          }

          fs.writeFileSync(targetFile, content, 'utf-8')
          console.log(`   📄 ${path.relative(ROOT_DIR, targetFile)} (${content.length} bytes)`)
        }
      }

      syncedComponents.push(name)
    } catch (err) {
      console.error(`   ❌ Failed to sync ${name}:`, err.message)
    }
  }

  // Generate barrel index.ts in src/components/ui/index.ts
  const barrelPath = path.join(UI_TARGET_DIR, 'index.ts')
  const barrelContent = syncedComponents
    .sort()
    .map((c) => `export * from './${c}'`)
    .join('\n')
    .concat('\n')

  fs.writeFileSync(barrelPath, barrelContent, 'utf-8')
  console.log(`\n📄 Generated barrel export: ${path.relative(ROOT_DIR, barrelPath)}`)

  console.log('\n================================================================================')
  console.log(`✨ DONE: Successfully synced and generated ${syncedComponents.length} components!`)
  console.log('================================================================================')
}

const args = process.argv.slice(2)
const targets = args.length > 0 ? args : DEFAULT_COMPONENTS
syncShadcnComponents(targets).catch((err) => {
  console.error('Fatal sync error:', err)
  process.exit(1)
})
