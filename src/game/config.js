import Phaser from "phaser";
import GameScene from "./seance/Gameseane.js";

const config = {
    type: Phaser.AUTO,

    width: 400,
    height: 711,

    parent: "game-container",

    backgroundColor: "#87CEEB",

    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },

    physics: {
        default: "arcade",

        arcade: {
            gravity: {
                y: 1000
            },
            debug: false
        }
    },

    scene: [GameScene]
};

export default config;