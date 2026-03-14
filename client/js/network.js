export class NetworkManager {
    init(socket, callbacks) {
        this.socket = socket;
        this.callbacks = callbacks;

        socket.on('playerJoined', callbacks.onPlayerJoined);
        socket.on('gameStart', callbacks.onGameStart);
        socket.on('playerMoved', callbacks.onPlayerMoved);
        socket.on('playerLeft', callbacks.onPlayerLeft);
        socket.on('buildingPlaced', callbacks.onBuildingPlaced);
        socket.on('buildingDamaged', callbacks.onBuildingDamaged);
        socket.on('stormUpdate', callbacks.onStormUpdate);
        socket.on('playerDamaged', callbacks.onPlayerDamaged);
    }

    sendPosition(position, rotationY) {
        this.socket.emit('move', { x: position.x, y: position.y, z: position.z, rot: rotationY });
    }

    sendShoot(targetId, damage) {
        this.socket.emit('shoot', { targetId, damage });
    }

    sendShootBuilding(buildingId, damage) {
        this.socket.emit('shootBuilding', { buildingId, damage });
    }

    sendBuild(type, position, rotation) {
        this.socket.emit('build', { type, x: position.x, y: position.y, z: position.z, rot: rotation });
    }
}
