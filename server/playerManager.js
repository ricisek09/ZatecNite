class PlayerManager {
    constructor() {
        this.players = new Map();
    }

    initPlayers(playerList) {
        playerList.forEach(p => {
            this.players.set(p.id, {
                id: p.id,
                position: p.position,
                health: 100,
                shield: 50,
                rotation: 0
            });
        });
    }

    updatePlayer(id, data) {
        const player = this.players.get(id);
        if (player) {
            player.position = { x: data.x, y: data.y, z: data.z };
            player.rotation = data.rot;
        }
    }

    getPlayer(id) {
        return this.players.get(id);
    }

    removePlayer(id) {
        this.players.delete(id);
    }

    getCount() {
        return this.players.size;
    }

    getPlayersOutsideStorm(stormCircle) {
        const outside = [];
        const center = stormCircle.center;
        const radius = stormCircle.radius;
        this.players.forEach(player => {
            const dx = player.position.x - center.x;
            const dz = player.position.z - center.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist > radius) {
                outside.push(player);
            }
        });
        return outside;
    }

    reset() {
        this.players.clear();
    }
}

module.exports = PlayerManager;
