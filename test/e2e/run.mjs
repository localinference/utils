import { spawnSync } from 'node:child_process'

const bunCommand = process.platform === 'win32' ? 'bun.exe' : 'bun'
const denoCommand = process.platform === 'win32' ? 'deno.cmd' : 'deno'

const runtimeCommands = [
  {
    label: 'node',
    command: process.execPath,
    args: ['test/e2e/runsInNode/run.mjs'],
  },
  {
    label: 'bun',
    command: bunCommand,
    args: ['test/e2e/runsInBun/run.mjs'],
  },
  {
    label: 'deno',
    command: denoCommand,
    shell: process.platform === 'win32',
    args: [
      'run',
      '--node-modules-dir=auto',
      '--allow-env',
      '--allow-read',
      '--allow-net',
      'test/e2e/runsInDeno/run.mjs',
    ],
  },
  {
    label: 'browsers',
    command: process.execPath,
    args: ['test/e2e/runsInBrowsers/run.mjs'],
  },
]

for (const runtime of runtimeCommands) {
  console.log(`Running ${runtime.label} e2e`)

  const result = spawnSync(runtime.command, runtime.args, {
    shell: runtime.shell ?? false,
    stdio: 'inherit',
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
