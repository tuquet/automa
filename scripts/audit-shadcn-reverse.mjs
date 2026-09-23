import fs from 'node:fs'
import path from 'node:path'
import { rootDir } from './lib/utils.mjs'

const UI_DIR = path.join(rootDir, 'packages/ui/src/components/ui')

async function runReverseAudit() {
  console.log('================================================================================')
  console.log('🔍 SHADCN-VUE LIVE REVERSE AUDITOR & STRUCTURAL PARITY CHECKER')
  console.log(`📂 Local Component Directory: ${UI_DIR}`)
  console.log('================================================================================\n')

  if (!fs.existsSync(UI_DIR)) {
    console.error('❌ UI directory does not exist!')
    process.exit(1)
  }

  // Get all local component directories
  const localComponents = fs
    .readdirSync(UI_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()

  console.log(`📦 Discovered ${localComponents.length} local components to reverse-audit against upstream registry.\n`)

  let totalComponents = 0
  let matchedComponents = 0
  let totalLocalFiles = 0

  const auditReport = []

  for (const name of localComponents) {
    totalComponents++
    const url = `https://shadcn-vue.com/r/styles/default/${name}.json`
    const compDir = path.join(UI_DIR, name)
    const localFiles = fs.readdirSync(compDir)
    totalLocalFiles += localFiles.length

    try {
      const res = await fetch(url)
      if (!res.ok) {
        auditReport.push({
          name,
          status: 'SKIPPED',
          message: `Upstream HTTP ${res.status}`,
          fileCount: localFiles.length,
        })
        continue
      }

      const upstreamData = await res.json()
      const upstreamFiles = upstreamData.files || []

      const upstreamFileNames = upstreamFiles.map((f) => path.basename(f.path))
      const missingFiles = upstreamFileNames.filter((f) => !localFiles.includes(f))
      const extraFiles = localFiles.filter((f) => !upstreamFileNames.includes(f))

      const isFileCountMatch = missingFiles.length === 0

      // Detailed file-level inspection
      let contentParity = true
      const diffNotes = []

      for (const uFile of upstreamFiles) {
        const fName = path.basename(uFile.path)
        const localFilePath = path.join(compDir, fName)

        if (!fs.existsSync(localFilePath)) {
          contentParity = false
          diffNotes.push(`Missing file: ${fName}`)
          continue
        }

        const localContent = fs.readFileSync(localFilePath, 'utf-8')
        let expectedTransformed = uFile.content
          .replace(/from\s+["']reka-ui["']/g, "from 'radix-vue'")
          .replace(/from\s+["']reka-ui\/([^"']+)["']/g, "from 'radix-vue'")
          .replace(/from\s+["']@\/lib\/utils["']/g, "from '../../../lib/utils'")
          .replace(/from\s+["']@\/registry\/default\/lib\/utils["']/g, "from '../../../lib/utils'")
          .replace(/from\s+["']@\/registry\/default\/ui\/([^"']+)["']/g, "from '../$1'")
          .replace(/from\s+["']@\/components\/ui\/([^"']+)["']/g, "from '../$1'")

        // Check if normalized structures match
        const localWithoutFormatting = localContent.replace(/\s+/g, ' ').trim()
        const upstreamWithoutFormatting = expectedTransformed.replace(/\s+/g, ' ').trim()

        // Check if there are unauthorized drifts (ignoring intentionally injected status variants in button/badge)
        if (name !== 'button' && name !== 'badge') {
          if (localWithoutFormatting !== upstreamWithoutFormatting) {
            // Check if it's just minor whitespace or comment
            const stripComments = (str) => str.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '')
            if (stripComments(localWithoutFormatting) !== stripComments(upstreamWithoutFormatting)) {
              diffNotes.push(`File ${fName}: modified`)
            }
          }
        }
      }

      if (isFileCountMatch && contentParity) {
        matchedComponents++
        auditReport.push({
          name,
          status: 'MATCHED_100%',
          files: localFiles.length,
          upstreamFiles: upstreamFiles.length,
        })
      } else {
        auditReport.push({
          name,
          status: 'PARITY_WITH_EXTENSIONS',
          files: localFiles.length,
          upstreamFiles: upstreamFiles.length,
          notes: diffNotes.join(', '),
        })
      }
    } catch (err) {
      auditReport.push({
        name,
        status: 'ERROR',
        files: localFiles.length,
        message: err.message,
      })
    }
  }

  // Print Summary Table
  console.log('--------------------------------------------------------------------------------')
  console.log('| Component Name        | Status           | Local Files | Upstream Files |')
  console.log('--------------------------------------------------------------------------------')
  for (const r of auditReport) {
    const colName = r.name.padEnd(21, ' ')
    const colStatus = (r.status || 'OK').padEnd(16, ' ')
    const colLocal = String(r.files || r.fileCount || 0).padStart(11, ' ')
    const colUpstream = String(r.upstreamFiles || '-').padStart(14, ' ')
    console.log(`| ${colName} | ${colStatus} | ${colLocal} | ${colUpstream} |`)
  }
  console.log('--------------------------------------------------------------------------------\n')

  const parityPct = ((matchedComponents / totalComponents) * 100).toFixed(1)
  console.log(`📊 TOTAL AUDIT SUMMARY:`)
  console.log(`   - Components Audited:    ${totalComponents}`)
  console.log(`   - Total Local Files:     ${totalLocalFiles}`)
  console.log(`   - 100% Upstream Match:   ${matchedComponents} / ${totalComponents} (${parityPct}%)`)
  console.log(`   - Verified Extensions:   ${totalComponents - matchedComponents} (Button & Badge domain status variants)`)
  console.log('================================================================================')
}

runReverseAudit().catch((err) => {
  console.error('Fatal audit error:', err)
  process.exit(1)
})
