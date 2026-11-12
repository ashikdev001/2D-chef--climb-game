import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {

    constructor() {
        super("GameScene");

        this.score = 0;

        this.gameStarted = false;
        this.gameOver = false;

        this.currentSpeed = 180;
        this.jumpPower = 570;

        this.platformList = [];
        this.foodList = [];

        this.clouds = [];
        this.birds = [];

        this.nextPlatformX = 0;
        this.lastPlatformY = 0;

        this.musicStarted = false;
        this.ignoreTapUntil = 0;
    }

    // =====================================
    // PRELOAD
    // =====================================

    preload() {

        this.load.image(
            "chef",
            "/assets/character/chef.png"
        );

        this.load.image(
            "cloud",
            "/assets/background/cloud.png"
        );

        this.load.image(
            "bird",
            "/assets/background/bird.png"
        );

        this.load.audio(
            "background",
            "/assets/sounds/background.mp3"
        );

        this.load.audio(
            "jump",
            "/assets/sounds/jump.mp3"
        );

        this.load.audio(
            "collect",
            "/assets/sounds/collect.mp3"
        );

        this.load.audio(
            "gameover",
            "/assets/sounds/gameover.mp3"
        );

        this.load.audio(
            "click",
            "/assets/sounds/click.mp3"
        );

    }

    // =====================================
    // CREATE
    // =====================================

    create() {

        const width = this.scale.width;
        const height = this.scale.height;

        this.score = 0;

        this.gameStarted = false;
        this.gameOver = false;

        this.currentSpeed = 180;

        this.platformList = [];
        this.foodList = [];

        this.clouds = [];
        this.birds = [];

        this.musicStarted = false;

        this.cameras.main.setBackgroundColor("#87CEEB");

        this.physics.world.setBounds(
            0,
            0,
            1000000,
            height + 300
        );

        this.cameras.main.setBounds(
            0,
            0,
            1000000,
            height
        );

        // Background
        this.createMovingBackground();

        // Sounds
        this.backgroundMusic = this.sound.add(
            "background",
            {
                loop: true,
                volume: 0.25
            }
        );

        this.jumpSound = this.sound.add(
            "jump",
            { volume: 0.6 }
        );

        this.collectSound = this.sound.add(
            "collect",
            { volume: 0.7 }
        );

        this.gameOverSound = this.sound.add(
            "gameover",
            { volume: 0.7 }
        );

        this.clickSound = this.sound.add(
            "click",
            { volume: 0.6 }
        );

        // =================================
        // PLATFORM GROUP
        // =================================

        this.platforms = this.physics.add.staticGroup();

        const startingY = height - 85;

        this.createPlatform(
            120,
            startingY,
            270,
            false
        );

        this.lastPlatformY = startingY;
        this.nextPlatformX = 120;

        // =================================
        // PLAYER
        // =================================

        this.player = this.physics.add.sprite(
            110,
            startingY - 10 - 32,
            "chef"
        );

        this.player.setDisplaySize(65, 80);

        // Body dimensions are adjusted for display scale.
        const bodyWidth = 38;
        const bodyHeight = 64;

        this.player.body.setSize(
            bodyWidth / this.player.scaleX,
            bodyHeight / this.player.scaleY,
            true
        );

        this.player.setCollideWorldBounds(false);

        this.player.setMaxVelocity(350, 900);

        // Freeze before Start
        this.player.body.setAllowGravity(false);

        this.player.setVelocity(0, 0);

        // Initial platforms
        for (let i = 0; i < 7; i++) {
            this.generateNextPlatform();
        }

        // Platform collision
        this.physics.add.collider(
            this.player,
            this.platforms,
            null,
            this.canLandOnPlatform,
            this
        );

        // Camera stays still before game starts
        this.cameras.main.scrollX = 0;
        this.cameras.main.scrollY = 0;

        // UI
        this.createUI();

        // Keyboard
        this.keys = this.input.keyboard.addKeys({
            jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
            restart: Phaser.Input.Keyboard.KeyCodes.R
        });

        // Touch anywhere to jump
        this.input.on(
            "pointerdown",
            this.handleScreenTap,
            this
        );

        // Keyboard jump
        this.input.keyboard.on(
            "keydown-SPACE",
            this.handleKeyboardJump,
            this
        );

        // Responsive
        this.scale.on(
            "resize",
            this.handleResize,
            this
        );

        this.events.once(
            Phaser.Scenes.Events.SHUTDOWN,
            () => {
                this.sound.stopAll();
            }
        );

    }

    // =====================================
    // UI
    // =====================================

    createUI() {

        const width = this.scale.width;
        const height = this.scale.height;

        // Title - center top
        this.titleText = this.add.text(
            width / 2,
            18,
            "CHEF'S CRAZY CLIMB",
            {
                fontSize: "23px",
                color: "#ffffff",
                fontStyle: "bold",
                stroke: "#333333",
                strokeThickness: 4
            }
        );

        this.titleText
            .setOrigin(0.5, 0)
            .setScrollFactor(0)
            .setDepth(100);

        // Score - top right
        this.scoreText = this.add.text(
            width - 15,
            60,
            "🍕 0",
            {
                fontSize: "23px",
                color: "#ffffff",
                fontStyle: "bold",
                stroke: "#333333",
                strokeThickness: 4
            }
        );

        this.scoreText
            .setOrigin(1, 0)
            .setScrollFactor(0)
            .setDepth(100);

        // Start overlay
        this.startOverlay = this.add.rectangle(
            width / 2,
            height / 2,
            width,
            height,
            0x000000,
            0.25
        );

        this.startOverlay
            .setScrollFactor(0)
            .setDepth(150);

        // Start button
        this.startButton = this.add.text(
            width / 2,
            height / 2,
            "▶ START GAME",
            {
                fontSize: "25px",
                color: "#ffffff",
                fontStyle: "bold",
                backgroundColor: "#159447",
                padding: {
                    x: 25,
                    y: 18
                }
            }
        );

        this.startButton
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(151)
            .setInteractive();

        this.startButton.on(
            "pointerdown",
            () => this.startGame()
        );

    }

    // =====================================
    // START GAME
    // =====================================

    startGame() {

        if (this.gameStarted || this.gameOver) {
            return;
        }

        this.gameStarted = true;

        this.ignoreTapUntil = this.time.now + 300;

        this.unlockAudio();

        this.clickSound.play();

        this.player.body.setAllowGravity(true);

        this.player.setVelocityX(
            this.currentSpeed
        );

        this.startOverlay.destroy();
        this.startButton.destroy();

        this.cameras.main.startFollow(
            this.player,
            true,
            0.08,
            0
        );

    }

    // =====================================
    // AUDIO
    // =====================================

    unlockAudio() {

        if (this.sound.context?.state === "suspended") {
            this.sound.context.resume();
        }

        if (
            this.gameStarted &&
            !this.musicStarted &&
            !this.gameOver
        ) {

            this.backgroundMusic.play();

            this.musicStarted = true;

        }

    }

    // =====================================
    // TOUCH INPUT
    // =====================================

    handleScreenTap() {

        if (!this.gameStarted || this.gameOver) {
            return;
        }

        if (this.time.now < this.ignoreTapUntil) {
            return;
        }

        this.tryJump();

    }

    handleKeyboardJump() {

        if (!this.gameStarted || this.gameOver) {
            return;
        }

        this.tryJump();

    }

    // =====================================
    // JUMP
    // =====================================

    tryJump() {

        if (!this.player.body) return;

        const body = this.player.body;

        const onGround =
            body.blocked.down ||
            body.touching.down;

        if (!onGround) return;

        this.player.setVelocityY(
            -this.jumpPower
        );

        this.jumpSound.play();

    }

    // =====================================
    // BACKGROUND - CLOUDS AND BIRDS
    // =====================================

   createMovingBackground() {

    this.clouds = [];
    this.birds = [];

    const width = this.scale.width;
    const height = this.scale.height;

    // CLOUDS - Always visible
    for (let i = 0; i < 7; i++) {

        const cloud = this.add.image(
            i * 180 + 50,
            Phaser.Math.Between(80, height * 0.55),
            "cloud"
        );

        cloud.setDisplaySize(
            Phaser.Math.Between(100, 145),
            Phaser.Math.Between(55, 80)
        );

        cloud.setScrollFactor(0.2);
        cloud.setDepth(-10);

        this.clouds.push(cloud);
    }

    // BIRDS - Occasionally appear
    this.birdTimer = this.time.addEvent({

        delay: Phaser.Math.Between(5000, 9000),

        loop: true,

        callback: () => {

            if (!this.gameStarted || this.gameOver) return;

            const bird = this.add.image(
                this.player.x + width + 100,
                Phaser.Math.Between(100, height * 0.45),
                "bird"
            );

            bird.setDisplaySize(48, 38);

            bird.setDepth(-5);

            bird.setScrollFactor(1);

            bird.speed = Phaser.Math.Between(100, 160);

            this.birds.push(bird);

        }

    });

}
    // =====================================
    // UPDATE BACKGROUND
    // =====================================

   updateMovingBackground(delta) {

    const width = this.scale.width;
    const height = this.scale.height;

    const cameraX = this.cameras.main.scrollX;

    // CLOUDS - Continuous background
    this.clouds.forEach(cloud => {

        const screenX = cloud.x - cameraX * 0.2;

        // Cloud leaves screen - bring it back
        if (screenX < -180) {

            cloud.x = cameraX * 0.2 + width + 180;

            cloud.y = Phaser.Math.Between(
                80,
                height * 0.55
            );

        }

    });

    // BIRDS - Opposite direction
    this.birds = this.birds.filter(bird => {

        bird.x -= bird.speed * delta / 1000;

        if (bird.x < cameraX - 150) {

            bird.destroy();

            return false;
        }

        return true;

    });

}

    // =====================================
    // CREATE PLATFORM
    // =====================================

    createPlatform(x, y, width, addFood = true) {

        const platform = this.add.rectangle(
            x,
            y,
            width,
            20,
            0x78cf45
        );

        this.physics.add.existing(platform, true);

        this.platforms.add(platform);

        const grass = this.add.rectangle(
            x,
            y - 9,
            width,
            6,
            0xb5ed65
        );

        const soil = this.add.rectangle(
            x,
            y + 14,
            width - 4,
            9,
            0xa96538
        );

        grass.setDepth(1);
        soil.setDepth(1);

        platform.decorations = [
            grass,
            soil
        ];

        this.platformList.push(platform);

        if (addFood) {
            this.createFood(x, y - 55);
        }

        return platform;

    }

    // =====================================
    // FOOD
    // =====================================

    createFood(x, y) {

        const foods = [
            { emoji: "🍕", points: 10 },
            { emoji: "🍔", points: 20 },
            { emoji: "🍩", points: 30 }
        ];

        const selected = Phaser.Utils.Array.GetRandom(
            foods
        );

        const food = this.add.text(
            x,
            y,
            selected.emoji,
            {
                fontSize: "34px"
            }
        );

        food.setOrigin(0.5);

        food.setDepth(5);

        this.physics.add.existing(food);

        food.body.setAllowGravity(false);

        food.body.setImmovable(true);

        food.body.setSize(35, 35);

        food.points = selected.points;

        food.collected = false;

        this.physics.add.overlap(
            this.player,
            food,
            this.collectFood,
            null,
            this
        );

        this.foodList.push(food);

    }

    // =====================================
    // COLLECT FOOD + POINT POPUP
    // =====================================

    collectFood(player, food) {

        if (
            !food.active ||
            food.collected ||
            this.gameOver
        ) {
            return;
        }

        food.collected = true;

        this.score += food.points;

        this.scoreText.setText(
            `🍕 ${this.score}`
        );

        this.collectSound.play();

        // Points popup
        const pointsText = this.add.text(
            food.x,
            food.y - 20,
            `+${food.points}`,
            {
                fontSize: "25px",
                color: "#ffff00",
                fontStyle: "bold",
                stroke: "#333333",
                strokeThickness: 4
            }
        );

        pointsText.setOrigin(0.5);

        pointsText.setDepth(50);

        this.tweens.add({

            targets: pointsText,

            y: pointsText.y - 65,

            alpha: 0,

            scale: 1.4,

            duration: 800,

            onComplete: () => {
                pointsText.destroy();
            }

        });

        // Food disappear animation
        this.tweens.add({

            targets: food,

            y: food.y - 40,

            alpha: 0,

            scale: 1.5,

            duration: 250,

            onComplete: () => {
                food.destroy();
            }

        });

        this.updateDifficulty();

    }

    // =====================================
    // DIFFICULTY / RUNNING SPEED
    // =====================================

    updateDifficulty() {

        if (this.score < 50) {

            this.currentSpeed = 180;

        } else if (this.score < 100) {

            this.currentSpeed = 210;

        } else if (this.score < 200) {

            this.currentSpeed = 240;

        } else if (this.score < 300) {

            this.currentSpeed = 275;

        } else {

            this.currentSpeed = 310;

        }

    }

    // =====================================
    // GENERATE PLATFORM
    // =====================================

    generateNextPlatform() {

        let minGap = 245;
        let maxGap = 270;

        if (this.score >= 50) {
            minGap = 255;
            maxGap = 285;
        }

        if (this.score >= 100) {
            minGap = 270;
            maxGap = 300;
        }

        if (this.score >= 200) {
            minGap = 280;
            maxGap = 315;
        }

        if (this.score >= 300) {
            minGap = 290;
            maxGap = 325;
        }

        const gap = Phaser.Math.Between(
            minGap,
            maxGap
        );

        const x = this.nextPlatformX + gap;

        const heightChange = Phaser.Math.Between(
            -45,
            45
        );

        const y = Phaser.Math.Clamp(
            this.lastPlatformY + heightChange,
            this.scale.height * 0.60,
            this.scale.height * 0.87
        );

        const platformWidth = Phaser.Math.Between(
            145,
            175
        );

        this.createPlatform(
            x,
            y,
            platformWidth,
            true
        );

        this.nextPlatformX = x;

        this.lastPlatformY = y;

    }

    generatePlatforms() {

        const cameraRight =
            this.cameras.main.scrollX +
            this.scale.width;

        while (
            this.nextPlatformX <
            cameraRight + 700
        ) {

            this.generateNextPlatform();

        }

    }

    // =====================================
    // PLATFORM LANDING
    // =====================================

    canLandOnPlatform(player, platform) {

        return (
            player.body.velocity.y > 0 &&
            player.body.prev.y + player.body.height
                <= platform.body.top + 15
        );

    }

    // =====================================
    // CLEANUP OLD OBJECTS
    // =====================================

    cleanupObjects() {

        const cameraLeft =
            this.cameras.main.scrollX - 400;

        this.platformList =
            this.platformList.filter(platform => {

                if (!platform.active) {
                    return false;
                }

                if (platform.x < cameraLeft) {

                    platform.decorations?.forEach(
                        item => item.destroy()
                    );

                    this.platforms.remove(
                        platform,
                        true,
                        true
                    );

                    return false;
                }

                return true;

            });

        this.foodList =
            this.foodList.filter(food => {

                if (!food.active) {
                    return false;
                }

                if (food.x < cameraLeft) {

                    food.destroy();

                    return false;
                }

                return true;

            });

    }

    // =====================================
    // GAME OVER
    // =====================================

    showGameOver() {

        if (this.gameOver) return;

        this.gameOver = true;

        if (this.backgroundMusic.isPlaying) {
            this.backgroundMusic.stop();
        }

        this.gameOverSound.play();

        this.physics.pause();

        const width = this.scale.width;
        const height = this.scale.height;

        const centerX = width / 2;
        const centerY = height / 2;

        const overlay = this.add.rectangle(
            centerX,
            centerY,
            width,
            height,
            0x000000,
            0.75
        );

        overlay
            .setScrollFactor(0)
            .setDepth(200);

        this.add.text(
            centerX,
            centerY - 80,
            "GAME OVER!",
            {
                fontSize: "36px",
                color: "#ff4444",
                fontStyle: "bold"
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

        this.add.text(
            centerX,
            centerY - 20,
            `Your Score: ${this.score}`,
            {
                fontSize: "25px",
                color: "#ffffff"
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(201);

        const restartButton = this.add.text(
            centerX,
            centerY + 55,
            "🔄 RESTART",
            {
                fontSize: "25px",
                color: "#ffffff",
                backgroundColor: "#159447",
                padding: {
                    x: 22,
                    y: 15
                }
            }
        );

        restartButton
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(202)
            .setInteractive();

        restartButton.on(
            "pointerdown",
            () => {
                this.scene.restart();
            }
        );

    }

    // =====================================
    // RESIZE
    // =====================================

    handleResize(gameSize) {

        const width = gameSize.width;

        if (this.titleText?.active) {

            this.titleText.setPosition(
                width / 2,
                18
            );

        }

        if (this.scoreText?.active) {

            this.scoreText.setPosition(
                width - 15,
                60
            );

        }

        this.physics.world.setBounds(
            0,
            0,
            1000000,
            gameSize.height + 300
        );

    }

    // =====================================
    // UPDATE
    // =====================================

    update(time, delta) {

        if (
            !this.player ||
            !this.player.body ||
            this.gameOver
        ) {
            return;
        }

        // Background animation
        this.updateMovingBackground(delta);

        // Wait for Start button
        if (!this.gameStarted) {
            return;
        }

        // Automatic running
        this.player.setVelocityX(
            this.currentSpeed
        );

        // Generate new platforms
        this.generatePlatforms();

        // Remove old objects
        this.cleanupObjects();

        // Game over
        if (
            this.player.y >
            this.scale.height + 120
        ) {

            this.showGameOver();

        }

        // Keyboard restart
        if (
            Phaser.Input.Keyboard.JustDown(
                this.keys.restart
            )
        ) {

            this.scene.restart();

        }

    }

}