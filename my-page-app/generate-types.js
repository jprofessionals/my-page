import { createClient, defaultPlugins } from '@hey-api/openapi-ts'
import fs from 'node:fs'

const outputDir = 'src/data/types'

fs.rmSync(outputDir, { recursive: true, force: true })

await createClient({
  client: '@hey-api/client-fetch',
  input: 'src/api.yaml',
  output: outputDir,
  plugins: [
    ...defaultPlugins,
    '@hey-api/client-fetch',
    {
      asClass: false, // default
      name: '@hey-api/sdk',
    },
  ],
})
