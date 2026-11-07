const { execSync } = require('child_process');

const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
const env = { ...process.env, CI: 'false' };

if (nodeMajor >= 17) {
  env.NODE_OPTIONS = (env.NODE_OPTIONS ? env.NODE_OPTIONS + ' ' : '') + '--openssl-legacy-provider';
}

execSync('react-app-rewired build', { stdio: 'inherit', env });
