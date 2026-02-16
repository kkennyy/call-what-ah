import { spawnSync } from 'child_process';

const run = spawnSync('node', ['tests/dialect-preferences.test.mjs'], { stdio: 'inherit' });
if (run.status !== 0) {
  process.exit(run.status || 1);
}
console.log('Test entrypoint completed successfully.');