const fs = require('fs');
const path = require('path');

// Error Handler Script
const errorHandler = `
window.onerror = function(msg, url, line, col, error) {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.background = 'rgba(255, 0, 0, 0.8)';
    div.style.color = 'white';
    div.style.padding = '10px';
    div.style.zIndex = '9999';
    div.style.fontSize = '12px';
    div.style.wordBreak = 'break-all';
    div.innerText = 'Error: ' + msg + '\\n' + url + ':' + line + ':' + col;
    document.body.appendChild(div);
    return false;
};
console.log = (function(oldLog) {
    return function(...args) {
        oldLog(...args);
        // Optional: display logs on screen if needed
    };
})(console.log);
`;

const files = [
    'js/game/InputHandler.js',
    'js/game/audio/AudioManager.js',
    'js/game/entities/Particle.js',
    'js/game/entities/FloatingText.js',
    'js/game/entities/Projectile.js',
    'js/game/entities/Missile.js',
    'js/game/entities/Drone.js',
    'js/game/entities/EnemyProjectile.js',
    'js/game/entities/EnemyMissile.js',
    'js/game/entities/Drop.js',
    'js/game/entities/Obstacle.js',
    'js/game/entities/Chest.js',
    'js/game/entities/BossAltar.js',
    'js/game/entities/Enemy.js',
    'js/game/entities/Player.js',
    'js/game/ui/Minimap.js',
    'js/game/systems/UpgradeSystem.js',
    'js/game/systems/WaveManager.js',
    'js/ui/UIManager.js',
    'js/game/Game.js',
    'js/game/main.js'
];

let bundleContent = errorHandler + '\n\n';

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Remove imports
        content = content.replace(/import .* from .*;/g, '');

        // Remove exports
        content = content.replace(/export default /g, '');
        content = content.replace(/export class /g, 'class ');
        content = content.replace(/export function /g, 'function ');
        content = content.replace(/export const /g, 'const ');
        content = content.replace(/export let /g, 'let ');
        content = content.replace(/export var /g, 'var ');

        bundleContent += `// --- ${file} ---\n`;
        bundleContent += content + '\n\n';
    } else {
        console.error(`File not found: ${file}`);
    }
});

fs.writeFileSync(path.join(__dirname, 'js/bundle.js'), bundleContent);
console.log('Bundle created at js/bundle.js');
