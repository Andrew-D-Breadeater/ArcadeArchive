// src/static/games/breakout.js

// --- CONFIGURATION ---
const COLORS = {
    BACKGROUND: [253, 246, 227], // Cream,
    LETTERBOX_BG: [245, 239, 220], // Dark cream
    PADDLE: [46, 125, 50],       // Green
    BALL: [46, 125, 50],         // Green
    BLOCKS: [
        [255, 0, 77],   // Red
        [255, 163, 0],  // Orange
        [255, 236, 39], // Yellow
        [0, 228, 54],   // Green
        [41, 173, 255], // Blue
    ],
    TEXT: [76, 175, 80], // Bright Green
};

// 1. Initialize Kaplay
if (typeof add === 'undefined') {
    kaplay({
        background: COLORS.BACKGROUND,
        width: 800,
        height: 600,
        scale: 1,
        root: document.querySelector(".game-container"),
        debug: true,
        letterbox: true,
        font: 'VT323',
        letterboxColor: COLORS.LETTERBOX,
    });
}

scene("main", () => {

    // --- SETTINGS ---
    const PADDLE_ACCEL = 50;
    const PADDLE_FRICTION = 0.45;
    const BALL_START_SPEED = 400;
    const PADDLE_INFLUENCE = 0.6;
    const MAX_LIVES = 3;

    // New Settings for Shrinking
    const PADDLE_START_WIDTH = 100;
    const MIN_PADDLE_WIDTH = 40;
    const PADDLE_SHRINK_STEP = 10;

    // --- STATE ---
    let score = 0;
    let lives = MAX_LIVES;
    let currentSpeed = BALL_START_SPEED;
    let isBallAttached = true;
    let activeBlocks = 0;

    // --- OBJECTS ---

    const paddle = add([
        rect(PADDLE_START_WIDTH, 20),
        pos(center().x, height() - 50),
        anchor("center"),
        color(...COLORS.PADDLE),
        area(),
        "paddle",
        { currentVelX: 0 }
    ]);

    const ball = add([
        rect(12, 12),
        pos(0, 0),
        anchor("center"),
        color(...COLORS.BALL),
        area(),
        "ball",
        { vel: vec2(0, 0) }
    ]);

    // UI Labels
    const scoreLabel = add([
        text("Score: 0"),
        pos(20, 20),
        color(...COLORS.TEXT),
        z(50)
    ]);

    const livesLabel = add([
        text(`Lives: ${lives}`),
        pos(width() - 140, 20),
        color(...COLORS.TEXT),
        z(50)
    ]);

    const msgLabel = add([
        text("Click to Launch"),
        pos(center()),
        anchor("center"),
        color(...COLORS.TEXT),
        opacity(1),
    ]);

    // --- LEVEL GENERATION ---
    function spawnBlocks() {
        destroyAll("block");

        const rows = 5;
        const cols = 10;
        const blockW = 70;
        const blockH = 20;
        const gap = 10;
        const offsetX = (width() - (cols * (blockW + gap))) / 2 + (blockW / 2);
        const offsetY = 80;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                add([
                    rect(blockW, blockH),
                    pos(offsetX + col * (blockW + gap), offsetY + row * (blockH + gap)),
                    anchor("center"),
                    color(...COLORS.BLOCKS[row % COLORS.BLOCKS.length]),
                    area(),
                    "block",
                    { points: (rows - row) * 10 }
                ]);
                activeBlocks++;
            }
        }
    }

    // --- GAMEPLAY HELPERS ---

    function resetBall() {
        isBallAttached = true;
        ball.vel = vec2(0, 0);
        msgLabel.text = "Click to Launch";
        msgLabel.opacity = 1;
    }

    function launchBall() {
        if (!isBallAttached) return;

        isBallAttached = false;
        const dirX = rand(-0.5, 0.5);
        ball.vel = vec2(dirX, -1).unit().scale(currentSpeed);
        msgLabel.opacity = 0;
    }

    function checkLevelClear() {
        if (activeBlocks <= 0) {
            // 1. Difficulty Increase
            currentSpeed += 50;

            // 2. Shrink Paddle (mechanic added)
            // We use Math.max to ensure we don't go below the minimum
            paddle.width = Math.max(MIN_PADDLE_WIDTH, paddle.width - PADDLE_SHRINK_STEP);

            // 3. Rewards
            lives += 1;
            livesLabel.text = `Lives: ${lives}`;

            // 4. UI Update
            msgLabel.text = "LEVEL CLEARED!\nSpeed Up & Shrink!";
            msgLabel.opacity = 1;

            resetBall();

            wait(2, () => {
                spawnBlocks();
                if (isBallAttached) msgLabel.text = "Click to Launch";
            });
        }
    }

    // --- UPDATE LOOP ---

    onUpdate(() => {
        // PADDLE MOVEMENT
        const targetX = mousePos().x;
        const diff = targetX - paddle.pos.x;

        paddle.currentVelX += diff * PADDLE_ACCEL * dt();
        paddle.currentVelX *= PADDLE_FRICTION;
        paddle.pos.x += paddle.currentVelX;

        // Clamp paddle logic must use current width (paddle.width)
        // because the width changes dynamically now!
        const halfPaddle = paddle.width / 2;
        if (paddle.pos.x < halfPaddle) {
            paddle.pos.x = halfPaddle;
            paddle.currentVelX = 0;
        }
        if (paddle.pos.x > width() - halfPaddle) {
            paddle.pos.x = width() - halfPaddle;
            paddle.currentVelX = 0;
        }

        // BALL LOGIC
        if (isBallAttached) {
            ball.pos.x = paddle.pos.x;
            ball.pos.y = paddle.pos.y - 20;
        } else {
            ball.move(ball.vel);

            if (ball.pos.x < 0 || ball.pos.x > width()) {
                ball.vel.x = -ball.vel.x;
            }
            if (ball.pos.y < 0) {
                ball.vel.y = -ball.vel.y;
            }

            if (ball.pos.y > height()) {
                lives--;
                livesLabel.text = `Lives: ${lives}`;
                shake(20);

                if (lives <= 0) {
                    window.handleGameOver(score);
                    go("gameover", score);
                } else {
                    resetBall();
                }
            }
        }
    });

    // --- INPUT ---
    onClick(() => launchBall());
    onKeyPress("space", () => launchBall());

    // --- COLLISIONS ---

    // Ball hits Paddle
    ball.onCollide("paddle", (p, col) => {
        // Use manual collision resolution to prevent sticking
        if (col.isTop() || col.isBottom()) {
            // Normal Bounce
            ball.vel.y = -Math.abs(ball.vel.y);
            ball.vel.x += paddle.currentVelX * PADDLE_INFLUENCE;
            ball.vel = ball.vel.unit().scale(currentSpeed);

            // Anti-horizontal lock
            if (Math.abs(ball.vel.y) < currentSpeed * 0.2) {
                ball.vel.y = (ball.vel.y > 0 ? 1 : -1) * currentSpeed * 0.3;
                ball.vel = ball.vel.unit().scale(currentSpeed);
            }
        } else {
            // Side hit - just reflect horizontally
            ball.vel.x = -ball.vel.x;
        }

        //play("hit", { speed: 1.5 });
    });

    // Ball hits Block
    ball.onCollide("block", (block, col) => {
        destroy(block);
        activeBlocks--;

        // Improved Bounce Logic using Collision info
        if (col.isLeft() || col.isRight()) {
            ball.vel.x = -ball.vel.x;
        } else {
            ball.vel.y = -ball.vel.y;
        }

        score += block.points;
        scoreLabel.text = `Score: ${score}`;

        checkLevelClear();
    });

    // Start the game
    spawnBlocks();
    resetBall();
});

scene("gameover", (finalScore) => {
    add([
        text("GAME OVER"),
        pos(center().x, center().y - 50),
        anchor("center"),
        color(...COLORS.TEXT),
        scale(2)
    ]);
    add([
        text(`Final Score: ${finalScore}`),
        pos(center().x, center().y + 50),
        anchor("center"),
        color(...COLORS.TEXT),
    ]);
});

go("main");