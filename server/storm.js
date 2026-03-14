class Storm {
    constructor() {
        this.center = { x: 0, z: 0 };
        this.radius = 100;
        this.active = false;
    }

    start(onUpdate) {
        this.active = true;
        this.radius = 80;
        const interval = setInterval(() => {
            if (!this.active) {
                clearInterval(interval);
                return;
            }
            this.radius -= 5;
            if (this.radius < 10) this.radius = 10;
            onUpdate({ center: this.center, radius: this.radius });
        }, 10000); // každých 10 sekund se zmenší
    }

    reset() {
        this.active = false;
        this.radius = 100;
    }
}

module.exports = Storm;
