// nodemon will attempt the send control messages to the parent process via process.send
// see: https://github.com/remy/nodemon/blob/8d927f105eca3d5db96b19cdbe0c6a6d8cfb9a5f/lib/utils/bus.js#L37-L42
// we need to reserve this channel for pass through to the target script which is how firebase emulator communicates with its worker
const originalSend = process.send;
if (originalSend) {
  // dont send messages to the parent process unless the originalSend handler is defined
  process.send = (message) => true;
}

// load nodemon which will attept to emit messages to the send handler
var nodemon = require('./lib');

nodemon.on('start', function () {
  console.log('functions emulator runtime has started');
});

nodemon.on('quit', function () {
  console.error('the functions emulator runtime has quit which is unexpected');
  // We should consider restarting the server, but we will let the emulator worker manager handle that
  process.exit(1);
})

nodemon.on('restart', function (files) {
  console.log('functions emulator runtime has been restarted due to changes in these files', files);
});

if (originalSend) {
  // nodemon forwards messages from the child process to this handler, so forward them to the parent process
  nodemon.on('message', function (message) {
    originalSend.apply(process, [message]);
  })
}

// process script arguments
const thisScriptArgs = process.argv.slice(2);
const scriptIndex = thisScriptArgs.findIndex(arg => !arg.startsWith('-'));
if (scriptIndex === -1) {
  console.error('no script to run was found in commandline arguments');
  console.log('USAGE: thisScript.js [--nodeargs] <functionsRuntimeScript> more args');
  process.exit(1);
}

// we cant pass node args through nodemon because it will switch to spawn instead of fork which we need for the functions emulator
// see: https://github.com/remy/nodemon/blob/8d927f105eca3d5db96b19cdbe0c6a6d8cfb9a5f/lib/monitor/run.js#L119
// use the NODE_OPTIONS environment variable instead
let nodeArgs = thisScriptArgs.slice(0, scriptIndex);

// if there is already an inspect flag then we don't need to add another one
if (process.env.NODE_OPTIONS?.includes('--inspect')) {
  nodeArgs = nodeArgs.filter(arg => !arg.startsWith('--inspect'));
}
const nodeOptions = [
  ...(process.env.NODE_OPTIONS ? [process.env.NODE_OPTIONS] : []),
   ...nodeArgs
].join(' ');

// nodemon validates that the script exists so make sure it has a valid extension
let scriptName = thisScriptArgs[scriptIndex];
if (!scriptName.endsWith('.js')) {
  scriptName += '.js';
}

// run nodemon
nodemon({
  script: scriptName,
  //watch: [scriptName],
  spawn: false,
  nodeArgs: [],
  env: nodeArgs.length > 0 ? { NODE_OPTIONS: nodeOptions } : undefined,
  args: thisScriptArgs.slice(scriptIndex + 1),
});