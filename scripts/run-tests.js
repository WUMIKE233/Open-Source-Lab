import { readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const packagesDir = join(rootDir, 'packages');

const testFiles = readdirSync(packagesDir)
  .flatMap((packageName) => {
    const testDir = join(packagesDir, packageName, 'test');
    try {
      if (!statSync(testDir).isDirectory()) {
        return [];
      }
    } catch {
      return [];
    }

    return readdirSync(testDir)
      .filter((fileName) => fileName.endsWith('.test.js'))
      .map((fileName) => join(testDir, fileName));
  })
  .sort();

if (testFiles.length === 0) {
  console.error('No test files found under packages/*/test/*.test.js');
  process.exit(1);
}

console.log(`Running ${testFiles.length} test file(s):`);
for (const testFile of testFiles) {
  console.log(`- ${relative(rootDir, testFile)}`);
}

const result = spawnSync(process.execPath, ['--test', ...testFiles], {
  cwd: rootDir,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
