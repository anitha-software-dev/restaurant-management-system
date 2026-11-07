const { execSync } = require('child_process');

const env = { ...process.env, CI: 'false' };
execSync('react-scripts build', { stdio: 'inherit', env });
