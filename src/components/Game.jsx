import { useEffect, useRef } from "react";
import Phaser from "phaser";
import config from "../game/config";

function Game() {
    const gameRef = useRef(null);
    const gameInstanceRef = useRef(null);

    useEffect(() => {
        if (!gameRef.current || gameInstanceRef.current) {
            return;
        }

        const game = new Phaser.Game({
            ...config,
            parent: gameRef.current
        });

        gameInstanceRef.current = game;

        return () => {
            if (gameInstanceRef.current) {
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div className="game-wrapper">
            <div
                ref={gameRef}
                id="game-container"
            />
        </div>
    );
}

export default Game;