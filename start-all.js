const { spawn } = require('child_process');
const path = require('path');

const processes = [
  {
    name: 'Library MCP',
    cmd: 'uvicorn',
    args: ['main:app', '--host', '127.0.0.1', '--port', '8001'],
    cwd: path.join(__dirname, 'packages', 'mcp-server-library'),
    color: '\x1b[36m' // Cyan
  },
  {
    name: 'Cafeteria MCP',
    cmd: 'uvicorn',
    args: ['main:app', '--host', '127.0.0.1', '--port', '8002'],
    cwd: path.join(__dirname, 'packages', 'mcp-server-cafeteria'),
    color: '\x1b[32m' // Green
  },
  {
    name: 'Events MCP',
    cmd: 'uvicorn',
    args: ['main:app', '--host', '127.0.0.1', '--port', '8003'],
    cwd: path.join(__dirname, 'packages', 'mcp-server-events'),
    color: '\x1b[35m' // Magenta
  },
  {
    name: 'Academics MCP',
    cmd: 'uvicorn',
    args: ['main:app', '--host', '127.0.0.1', '--port', '8004'],
    cwd: path.join(__dirname, 'packages', 'mcp-server-academics'),
    color: '\x1b[33m' // Yellow
  },
  {
    name: 'Orchestrator',
    cmd: 'npm',
    args: ['run', 'dev', '--workspace=ai-orchestrator'],
    cwd: __dirname,
    color: '\x1b[34m' // Blue
  },
  {
    name: 'Dashboard',
    cmd: 'npm',
    args: ['run', 'dev', '--workspace=dashboard'],
    cwd: __dirname,
    color: '\x1b[37m' // White
  }
];

const spawnedProcesses = [];

console.log('\x1b[1m\x1b[34m%s\x1b[0m', '🚀 Starting Unified Campus Intelligence Dashboard Suite...');
console.log('Press Ctrl+C to stop all services.\n');

processes.forEach(proc => {
  const child = spawn(proc.cmd, proc.args, {
    cwd: proc.cwd,
    shell: true,
    stdio: 'pipe',
    env: { ...process.env, FORCE_COLOR: 'true' }
  });

  spawnedProcesses.push({ name: proc.name, child });

  const prefix = `${proc.color}[${proc.name}]\x1b[0m`;

  child.stdout.on('data', data => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.log(`${prefix} ${line}`);
    });
  });

  child.stderr.on('data', data => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.error(`${prefix} \x1b[31m[ERROR]\x1b[0m ${line}`);
    });
  });

  child.on('close', code => {
    console.log(`${prefix} exited with code ${code}`);
  });

  child.on('error', err => {
    console.error(`${prefix} failed to start: ${err.message}`);
  });
});

// Handle graceful shutdown
const cleanup = () => {
  console.log('\n\x1b[1m\x1b[31m%s\x1b[0m', '🛑 Shutting down all services...');
  spawnedProcesses.forEach(({ name, child }) => {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', child.pid, '/f', '/t']);
      } else {
        child.kill('SIGINT');
      }
      console.log(`Sent shutdown signal to ${name}`);
    } catch (err) {
      console.error(`Failed to kill ${name}: ${err.message}`);
    }
  });
  setTimeout(() => process.exit(0), 1000);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
