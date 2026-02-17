import { spawnSync } from 'child_process';

const testFiles = ['tests/dialect-preferences.test.mjs', 'tests/romanization.test.mjs'];

for (const testFile of testFiles) {
  const run = spawnSync('node', [testFile], { stdio: 'inherit' });
  if (run.status !== 0) {
    process.exit(run.status || 1);
  }
}

console.log('Test entrypoint completed successfully.');
