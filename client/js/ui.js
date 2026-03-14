export class UIManager {
    constructor() {
        this.healthBar = document.getElementById('healthFill');
        this.shieldBar = document.getElementById('shieldFill');
        this.weaponName = document.getElementById('currentWeapon');
        this.ammo = document.getElementById('ammo');
        this.buildingPanel = document.getElementById('buildingPanel');
        this.settingsMenu = document.getElementById('settingsMenu');
        this.selectedPiece = 'wall';
        this.initBuildingSelection();
    }

    initBuildingSelection() {
        const pieces = document.querySelectorAll('.build-piece');
        pieces.forEach(p => {
            p.addEventListener('click', () => {
                pieces.forEach(p => p.classList.remove('selected'));
                p.classList.add('selected');
                this.selectedPiece = p.dataset.type;
            });
        });
    }

    updateHealth(value) {
        this.healthBar.style.width = value + '%';
    }

    updateShield(value) {
        this.shieldBar.style.width = value + '%';
    }

    updateWeapon(name, current, max) {
        this.weaponName.textContent = name;
        this.ammo.textContent = current + '/' + max;
    }

    toggleBuildingPanel(show) {
        this.buildingPanel.style.display = show ? 'flex' : 'none';
    }

    toggleSettings(show) {
        this.settingsMenu.style.display = show ? 'block' : 'none';
    }

    getSelectedBuildPiece() {
        return this.selectedPiece;
    }

    updatePlayerCount(count) {
        document.getElementById('playerCount').textContent = count;
    }
}
