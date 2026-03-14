import * as THREE from 'three';

export class Player {
    constructor(scene, camera, input, isLocal = false) {
        this.scene = scene;
        this.camera = camera;
        this.input = input;
        this.isLocal = isLocal;
        this.speed = 0.1;
        this.sprintSpeed = 0.2;
        this.jumpPower = 0.15;
        this.velocity = new THREE.Vector3();
        this.onGround = true;

        // Vytvoření modelu hráče
        this.mesh = new THREE.Group();
        const bodyGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: isLocal ? 0x00ff00 : 0xff0000 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.75;
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);

        const headGeo = new THREE.SphereGeometry(0.3);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.5 + 0.3;
        head.castShadow = true;
        head.receiveShadow = true;
        this.mesh.add(head);

        this.mesh.position.y = 1.5; // kvůli kolizím se zemí
        scene.add(this.mesh);

        // Zbraň (jednoduchý kvádr)
        const weaponGeo = new THREE.BoxGeometry(0.1, 0.1, 0.8);
        const weaponMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        this.weapon = new THREE.Mesh(weaponGeo, weaponMat);
        this.weapon.position.set(0.3, 0.8, 0.5);
        this.mesh.add(this.weapon);
    }

    setPosition(pos) {
        this.mesh.position.copy(pos);
    }

    setRotation(yaw) {
        this.mesh.rotation.y = yaw;
    }

    update() {
        if (!this.isLocal) {
            // U ostatních hráčů jen interpolace (zjednodušeno)
            return;
        }

        // Pohyb
        const moveX = (this.input.isKeyPressed('KeyD') ? 1 : 0) - (this.input.isKeyPressed('KeyA') ? 1 : 0);
        const moveZ = (this.input.isKeyPressed('KeyS') ? 1 : 0) - (this.input.isKeyPressed('KeyW') ? 1 : 0);
        const sprint = this.input.isKeyPressed('ShiftLeft');
        const crouch = this.input.isKeyPressed('KeyC');
        const jump = this.input.isKeyPressed('Space');

        let speed = sprint ? this.sprintSpeed : this.speed;
        if (crouch) speed *= 0.5;

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.mesh.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.mesh.quaternion);

        this.velocity.x = 0;
        this.velocity.z = 0;
        if (moveZ !== 0) this.velocity.add(forward.multiplyScalar(moveZ * speed));
        if (moveX !== 0) this.velocity.add(right.multiplyScalar(moveX * speed));

        // Skok
        if (jump && this.onGround) {
            this.velocity.y = this.jumpPower;
            this.onGround = false;
        }

        // Gravita
        if (!this.onGround) {
            this.velocity.y -= 0.01;
        }

        this.mesh.position.x += this.velocity.x;
        this.mesh.position.y += this.velocity.y;
        this.mesh.position.z += this.velocity.z;

        // Jednoduchá kolize se zemí
        if (this.mesh.position.y < 1.5) {
            this.mesh.position.y = 1.5;
            this.velocity.y = 0;
            this.onGround = true;
        }
    }

    canShoot() {
        // Zjednodušeně vždy true
        return true;
    }

    shoot(scene, otherPlayers, buildings) {
        // Raycast z kamery
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const allObjects = [];
        otherPlayers.forEach(p => allObjects.push(p.mesh));
        buildings.forEach(b => allObjects.push(b));
        const intersects = raycaster.intersectObjects(allObjects);
        if (intersects.length > 0) {
            const hit = intersects[0].object;
            // Zjistíme, zda je to hráč nebo stavba
            if (hit.parent && hit.parent.type === 'Group') { // hráč je Group
                // Najdeme ID hráče
                for (let [id, player] of otherPlayers) {
                    if (player.mesh === hit.parent) {
                        return { isPlayer: true, id: id, damage: 20 };
                    }
                }
            } else {
                // Stavba
                const building = buildings.find(b => b === hit);
                if (building) {
                    return { isBuilding: true, id: building.userData.id, damage: 50 };
                }
            }
        }
        return null;
    }

    remove() {
        this.scene.remove(this.mesh);
    }
}
