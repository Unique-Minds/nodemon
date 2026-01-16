// Loop that outputs a message every 5 seconds and never ends
setInterval(() => {
  console.log('Message output at', new Date().toISOString());
  process.send('from test.js');
}, 5000);

// Keep the process alive
console.log('Starting infinite loop!. Press Ctrl+C to stop.', process.argv);


process.on('message', (message) => {
  console.log('**TEST** Message received:', message);
});