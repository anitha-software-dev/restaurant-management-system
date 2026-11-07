const { execSync } = require('child_process');

const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
const env = { 
  ...process.env, 
  CI: 'false',
  GENERATE_SOURCEMAP: 'false'
};

let nodeOptions = env.NODE_OPTIONS || '';
if (nodeMajor >= 17 && !nodeOptions.includes('--openssl-legacy-provider')) {
  nodeOptions = (nodeOptions + ' --openssl-legacy-provider').trim();
}
if (!nodeOptions.includes('--max-old-space-size')) {
  nodeOptions = (nodeOptions + ' --max-old-space-size=4096').trim();
}
env.NODE_OPTIONS = nodeOptions;

try {
  execSync('npx --no-install react-app-rewired build', { stdio: 'inherit', env });
} catch (err) {
  process.exit(err.status || 1);
}
