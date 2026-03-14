export class Settings {
    constructor() {
        this.sound = true;
        this.sensitivity = 1.0;
        this.graphics = 'medium';

        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.sound = e.target.checked;
        });
        document.getElementById('mouseSensitivity').addEventListener('input', (e) => {
            this.sensitivity = parseFloat(e.target.value);
            // Předáme do input handleru (globálně)
        });
        document.getElementById('graphicsQuality').addEventListener('change', (e) => {
            this.graphics = e.target.value;
            // Zde by se měnilo nastavení rendereru (např. shadow map)
        });
        document.getElementById('closeSettings').addEventListener('click', () => {
            document.getElementById('settingsMenu').style.display = 'none';
        });
    }
}
