const { fork } = require('child_process');
const path = require('path');

// Fork the watch.js script
const child = fork(
  path.join(__dirname, 'watch.js'),
  process.argv.slice(2),
  { stdio: ['pipe', 'inherit', 'inherit', 'ipc'] }
);

// Listen to all message events from the child process
child.on('message', (message) => {
  console.log('Child message:', message);
});

// Also listen to other events for debugging
child.on('error', (error) => {
  console.error('Child process error:', error);
});

child.on('exit', (code, signal) => {
  console.log(`Child process exited with code ${code} and signal ${signal}`);
  process.exit();
});

// Read from stdin and send to child process
process.stdin.setEncoding('utf8');
process.stdin.on('data', (data) => {
  const input = data.toString().trim();
  if (input) {
    child.send(input);
  }
});

// Keep stdin open
process.stdin.resume();
