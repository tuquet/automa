import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const TARGET_DIR = path.join(ROOT_DIR, 'packages/automa-ui/upstream-shadcn')

async function downloadFullShadcnRegistry() {
  console.log('================================================================================')
  console.log('📥 DOWNLOADING FULL 66 COMPONENTS FROM OFFICIAL SHADCN-VUE REGISTRY (ALL)')
  console.log(`📂 Target Directory: ${TARGET_DIR}`)
  console.log('================================================================================\n')

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true })
  }

  const indexRes = await fetch('https://shadcn-vue.com/r/index.json')
  if (!indexRes.ok) {
    throw new Error(`Failed to fetch index.json: HTTP ${indexRes.status}`)
  }

  const allComponents = await indexRes.json()
  console.log(`🔎 Discovered ${allComponents.length} total components in official registry.\n`)

  let totalFiles = 0
  let successComponents = 0

  for (const comp of allComponents) {
    if (comp.type !== 'registry:ui') continue

    const name = comp.name
    const url = `https://shadcn-vue.com/r/styles/default/${name}.json`

    try {
      const res = await fetch(url)
      if (!res.ok) {
        // Some might be in the index without default style endpoint
        continue
      }
      const data = await res.json()

      console.log(`📦 [${name.toUpperCase()}]`)
      if (data.files && Array.isArray(data.files)) {
        for (const file of data.files) {
          const relativePath = file.path.replace(/^ui\//, '')
          const fullPath = path.join(TARGET_DIR, relativePath)
          const dir = path.dirname(fullPath)
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
          }
          fs.writeFileSync(fullPath, file.content, 'utf-8')
          console.log(`   📄 ${path.relative(ROOT_DIR, fullPath)} (${file.content.length} bytes)`)
          totalFiles++
        }
      }
      successComponents++
    } catch (err) {
      console.warn(`   ⚠️ Could not fetch ${name}: ${err.message}`)
    }
  }

  console.log('\n================================================================================')
  console.log(`🎉 SUCCESS: Downloaded ${totalFiles} official files across ${successComponents} UI components!`)
  console.log('================================================================================')
}

downloadFullShadcnRegistry().catch((err) => {
  console.error('Fatal error downloading registry:', err)
  process.exit(1)
})
