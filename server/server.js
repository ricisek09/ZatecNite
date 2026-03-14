const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const GameLogic = require('./gameLogic');
const PlayerManager = require('./playerManager');
const Storm = require('./storm');
const BuildingManager = require('./buildingManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, '../client')));

const gameLogic = new GameLogic();
const playerManager = new PlayerManager();
const storm = new Storm();
const buildingManager = new BuildingManager();

let gameState = 'lobby'; // lobby, playing
let playersInLobby = 0;
const MAX_PLAYERS = 10;

io.on('connection', (socket) => {
    console.log('Nový hráč:', socket.id);

    if (gameState === 'playing') {
        socket.emit('gameInProgress');
        socket.disconnect();
        return;
    }

    // Přidání do lobby
    playersInLobby++;
    io.emit('playerJoined', { count: playersInLobby });

    // Pokud je dost hráčů, spustíme hru
    if (playersInLobby >= 2 && gameState === 'lobby') {
        startGame();
    }

    socket.on('move', (data) => {
        if (gameState === 'playing') {
            playerManager.updatePlayer(socket.id, data);
            socket.broadcast.emit('playerMoved', { id: socket.id, ...data });
        }
    });

    socket.on('shoot', (data) => {
        if (gameState === 'playing') {
            // Zpracování zásahu hráče
            const target = playerManager.getPlayer(data.targetId);
            if (target) {
                target.health -= data.damage;
                io.to(data.targetId).emit('playerDamaged', { health: target.health, shield: target.shield });
                if (target.health <= 0) {
                    // Hráč eliminován
                    io.emit('playerEliminated', data.targetId);
                    playerManager.removePlayer(data.targetId);
                }
            }
        }
    });

    socket.on('shootBuilding', (data) => {
        if (gameState === 'playing') {
            const building = buildingManager.getBuilding(data.buildingId);
            if (building) {
                building.health -= data.damage;
                io.emit('buildingDamaged', { id: data.buildingId, health: building.health });
                if (building.health <= 0) {
                    buildingManager.removeBuilding(data.buildingId);
                }
            }
        }
    });

    socket.on('build', (data) => {
        if (gameState === 'playing') {
            const building = buildingManager.addBuilding(socket.id, data.type, { x: data.x, y: data.y, z: data.z }, data.rot);
            io.emit('buildingPlaced', {
                id: building.id,
                type: data.type,
                position: { x: data.x, y: data.y, z: data.z },
                rotation: data.rot,
                health: building.health
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Hráč odpojen:', socket.id);
        playersInLobby--;
        io.emit('playerLeft', socket.id);
        playerManager.removePlayer(socket.id);
        if (gameState === 'playing' && playerManager.getCount() < 2) {
            // Konec hry, návrat do lobby
            gameState = 'lobby';
            // Reset všeho
        }
    });
});

function startGame() {
    gameState = 'playing';
    playerManager.reset();
    buildingManager.reset();
    storm.reset();
    // Inicializace hráčů v lobby (všichni aktuálně připojení)
    const players = Array.from(io.sockets.sockets.values()).map(s => ({ id: s.id, position: { x: 0, y: 1.5, z: 0 } }));
    playerManager.initPlayers(players);
    io.emit('gameStart', { players });

    // Spuštění stormu
    storm.start((circleData) => {
        io.emit('stormUpdate', circleData);
        // Poškození hráčů mimo storm
        const playersOutside = playerManager.getPlayersOutsideStorm(circleData);
        playersOutside.forEach(p => {
            p.health -= 5;
            io.to(p.id).emit('playerDamaged', { health: p.health, shield: p.shield });
        });
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server běží na portu ${PORT}`);
});
