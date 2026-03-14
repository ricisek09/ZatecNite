import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // nepoužijeme, vlastní kamera
import { InputHandler } from './js/input.js';
import { Player } from './js/player.js';
import { BuildingSystem } from './js/building.js';
import { UIManager } from './js/ui.js';
import { Settings } from './js/settings.js';
import { NetworkManager } from './js/network.js';

// Inicializace Three.js scény
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // světle modrá

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // pro efekty
document.body.appendChild(renderer.domElement);

// Osvětlení
const ambientLight = new THREE.AmbientLight(0x404060);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
scene.add(dirLight);

// Jednoduchá země
const groundGeometry = new THREE.PlaneGeometry(200, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x3d9970 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Pomocné osy (pro ladění)
// scene.add(new THREE.AxesHelper(5));

// Herní proměnné
let localPlayer = null;
let otherPlayers = new Map();
let buildings = [];
let stormCircle = null;
let gameActive = false;
let socket;

// Inicializace modulů
const input = new InputHandler(camera, renderer.domElement);
const ui = new UIManager();
const settings = new Settings();
const network = new NetworkManager();

// Zobrazení lobby
document.getElementById('lobby').style.display = 'block';

// Připojení k serveru
socket = io();
network.init(socket, {
    onPlayerJoined: (data) => {
        ui.updatePlayerCount(data.count);
    },
    onGameStart: () => {
        document.getElementById('lobby').style.display = 'none';
        document.getElementById('gameUI').style.display = 'block';
        gameActive = true;
        // Vytvoření lokálního hráče
        localPlayer = new Player(scene, camera, input, true); // true = local
        // Nastavení kamery jako follow
        input.setFollowTarget(localPlayer.mesh);
        // Přidáme ostatní hráče, kteří už jsou na serveru
        data.players.forEach(p => {
            if (p.id !== socket.id) {
                const other = new Player(scene, null, null, false);
                other.setPosition(p.position);
                otherPlayers.set(p.id, other);
            }
        });
    },
    onPlayerMoved: (data) => {
        const player = otherPlayers.get(data.id);
        if (player) {
            player.setPosition(data.position);
            player.setRotation(data.rotation);
        }
    },
    onPlayerLeft: (id) => {
        const player = otherPlayers.get(id);
        if (player) {
            player.remove();
            otherPlayers.delete(id);
        }
    },
    onBuildingPlaced: (data) => {
        // Přidání stavby od jiného hráče
        const buildingSystem = new BuildingSystem(scene);
        const mesh = buildingSystem.createBuilding(data.type, data.position, data.rotation);
        mesh.userData = { health: data.health, id: data.id };
        buildings.push(mesh);
    },
    onBuildingDamaged: (data) => {
        // Aktualizace zdraví stavby (pro zjednodušení jen smažeme při zničení)
        const building = buildings.find(b => b.userData.id === data.id);
        if (building) {
            building.userData.health = data.health;
            if (data.health <= 0) {
                scene.remove(building);
                buildings = buildings.filter(b => b.userData.id !== data.id);
            }
        }
    },
    onStormUpdate: (data) => {
        if (!stormCircle) {
            const geometry = new THREE.CylinderGeometry(data.radius, data.radius, 50, 64);
            const material = new THREE.MeshPhongMaterial({ color: 0x8e44ad, transparent: true, opacity: 0.3 });
            stormCircle = new THREE.Mesh(geometry, material);
            stormCircle.position.y = 25;
            scene.add(stormCircle);
        } else {
            stormCircle.scale.set(data.radius / stormCircle.geometry.parameters.radiusTop, 1, data.radius / stormCircle.geometry.parameters.radiusTop);
        }
    },
    onPlayerDamaged: (data) => {
        if (data.id === socket.id) {
            ui.updateHealth(data.health);
            ui.updateShield(data.shield);
        }
    }
});

// Herní smyčka
function animate() {
    requestAnimationFrame(animate);

    if (gameActive && localPlayer) {
        // Zpracování vstupu lokálního hráče
        localPlayer.update();

        // Odeslání pozice na server
        network.sendPosition(localPlayer.mesh.position, localPlayer.mesh.rotation.y);

        // Kolize se stormem (server posílá damage, ale můžeme lokálně varovat)
        // ...

        // Střelba
        if (input.isMouseDown(0) && localPlayer.canShoot()) {
            const hit = localPlayer.shoot(scene, otherPlayers, buildings);
            if (hit) {
                if (hit.isPlayer) {
                    network.sendShoot(hit.id, hit.damage);
                } else if (hit.isBuilding) {
                    network.sendShootBuilding(hit.id, hit.damage);
                }
            }
        }

        // Stavění
        if (input.isKeyPressed('KeyB')) {
            ui.toggleBuildingPanel(true);
            input.setBuildMode(true);
        } else if (input.isKeyPressed('Escape')) {
            ui.toggleBuildingPanel(false);
            input.setBuildMode(false);
            ui.toggleSettings(true);
        }

        if (input.isBuildMode()) {
            // Rotace stavby
            if (input.isKeyPressed('KeyR')) {
                // Otočit preview
            }
            // Umístění stavby
            if (input.isMouseDown(0)) {
                const pos = input.getBuildPosition();
                if (pos) {
                    const type = ui.getSelectedBuildPiece();
                    network.sendBuild(type, pos, input.getBuildRotation());
                }
            }
        }

        // Aktualizace ostatních hráčů (interpolace)
        otherPlayers.forEach(p => p.update());
    }

    renderer.render(scene, camera);
}
animate();

// Resize okna
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
