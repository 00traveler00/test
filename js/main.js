import { Game } from './game/Game.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    window.game = game; // グローバルに公開（デバッグ用）
    game.start();
});
