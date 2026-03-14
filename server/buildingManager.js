class BuildingManager {
    constructor() {
        this.buildings = new Map();
        this.nextId = 0;
    }

    addBuilding(ownerId, type, position, rotation) {
        const id = this.nextId++;
        const building = {
            id,
            ownerId,
            type,
            position,
            rotation,
            health: 100
        };
        this.buildings.set(id, building);
        return building;
    }

    getBuilding(id) {
        return this.buildings.get(id);
    }

    removeBuilding(id) {
        this.buildings.delete(id);
    }

    reset() {
        this.buildings.clear();
        this.nextId = 0;
    }
}

module.exports = BuildingManager;
