// server.js
const { PeerServer } = require('peer');
const cors = require('cors');

const peerServer = PeerServer({
  port: 9000,
  path: '/myapp',
  corsOptions: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

peerServer.on('connection', (client) => {
  console.log('Client connected:', client.getId());
});

peerServer.on('disconnect', (client) => {
  console.log('Client disconnected:', client.getId());
});