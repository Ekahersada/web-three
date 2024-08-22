const express = require('express');
const http = require('http');
// const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);

const io = require('socket.io')(server, {
    cors: {
      origin: '*',
    }
  });

 

let players = {};

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  // Add new player to the list
  players[socket.id] = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    movementStatus: 'Idle' // idle, walking, running
  };

  // Send the players list to the new player
  socket.emit('currentPlayers', players);

  console.log(players);

  // Broadcast new player to other players
  socket.broadcast.emit('newPlayer', { id: socket.id, player: players[socket.id] });

  // Handle player movement
  socket.on('movePlayer', (data) => {
    if (players[socket.id]) {
      players[socket.id].position = data.position;
      players[socket.id].rotation = data.rotation;
      players[socket.id].movementStatus = data.movementStatus;

      // Broadcast the movement to other players
      socket.broadcast.emit('playerMoved', { id: socket.id, player: players[socket.id] });
    }
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);

    // Remove the player from the list
    delete players[socket.id];

    // Notify other players
    io.emit('playerDisconnected', socket.id);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
