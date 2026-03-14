export class InputHandler {
    constructor(camera, canvas) {
        this.camera = camera;
        this.canvas = canvas;
        this.keys = {};
        this.mouseDelta = { x: 0, y: 0 };
        this.mouseButtons = { 0: false, 2: false }; // left, right
        this.followTarget = null;
        this.buildMode = false;
        this.buildRotation = 0;
        this.sensitivity = 1.0;

        // Zachycení kurzoru
        canvas.addEventListener('click', () => {
            canvas.requestPointerLock();
        });

        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === canvas) {
                this.mouseDelta.x += e.movementX * this.sensitivity;
                this.mouseDelta.y += e.movementY * this.sensitivity;
            }
        });

        document.addEventListener('mousedown', (e) => {
            this.mouseButtons[e.button] = true;
        });
        document.addEventListener('mouseup', (e) => {
            this.mouseButtons[e.button] = false;
        });
    }

    setFollowTarget(target) {
        this.followTarget = target;
    }

    setBuildMode(enabled) {
        this.buildMode = enabled;
    }

    isBuildMode() {
        return this.buildMode;
    }

    getBuildRotation() {
        return this.buildRotation;
    }

    // Získání pozice pro umístění stavby (raycast na zem)
    getBuildPosition() {
        // Implementace raycastu z kamery na zem
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = raycaster.intersectObjects([ground]); // ground musí být globálně dostupná
        if (intersects.length > 0) {
            return intersects[0].point;
        }
        return null;
    }

    update() {
        // Pohyb kamery s follow targetem
        if (this.followTarget) {
            const idealOffset = new THREE.Vector3(0, 2, 5); // třetí osoba
            const targetPos = this.followTarget.position.clone().add(idealOffset);
            this.camera.position.lerp(targetPos, 0.1);
            this.camera.lookAt(this.followTarget.position.clone().add(new THREE.Vector3(0, 1, 0)));
        }

        // Rotace podle myši
        if (document.pointerLockElement === this.canvas && this.followTarget) {
            this.followTarget.rotation.y -= this.mouseDelta.x * 0.002;
            // Omezení vertikální rotace kamery? Tady by se měla otáčet kamera kolem hráče, ne hráč sám
            // Pro jednoduchost necháme tak.
        }
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
    }

    isKeyPressed(code) {
        return this.keys[code] || false;
    }

    isMouseDown(button) {
        return this.mouseButtons[button] || false;
    }
}
