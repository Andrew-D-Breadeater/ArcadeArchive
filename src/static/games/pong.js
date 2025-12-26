// src/static/games/pong.js

kaboom({
    background: [29, 43, 83],
    width: 800,
    height: 400,
    scale: 1,
    root: document.querySelector(".game-container"),
    debug: true,
});

scene("main", () => {

    // --- SETTINGS ---
    // Physics constants (Applied to both paddles for symmetry)
    const ACCEL = 30;         // Acceleration factor (Spring tension)
    const FRICTION = 0.65;    // Dampening factor (0.0 - 1.0)
    const AI_ERROR_RANGE = 50; // Higher number = AI makes bigger mistakes (Easier for player)
    const AI_FOCUS_SPEED = 3; // Controls how fast the AI moves its "mental target" (Lower = Slower reaction)

    // --- OBJECTS ---

    // Left Paddle (AI / Player 2)
    const player2 = add([
        rect(20, 100),
        pos(30, height() / 2),
        anchor("center"),
        color(255, 255, 255),
        area(),
        "paddle",
        "player2",
        { currentVelY: 0 } // Custom property for physics
    ]);

    // Right Paddle (Player 1)
    const player1 = add([
        rect(20, 100),
        pos(width() - 30, height() / 2),
        anchor("center"),
        color(255, 255, 255),
        area(),
        "paddle",
        "player1",
        { currentVelY: 0 } // Custom property for physics
    ]);

    // Ball
    const ball = add([
        rect(15, 15),
        pos(center()),
        anchor("center"),
        color(255, 255, 255),
        area(),
        { vel: vec2(400, 400) }, // Using vec2 for velocity
        "ball",
    ]);

    // Score
    let score = 0;
    const scoreLabel = add([
        text("0"),
        pos(center().x, 50),
        anchor("center"),
        color(255, 255, 255),
    ]);

    // --- LOGIC ---

    let aiMentalTargetY = height() / 2; // Persistent variable to track the AI's mental focus point

    onUpdate(() => {
        // --- 1. PLAYER 1 MOVEMENT (Right Side) ---
        // Target: Mouse Y position
        const p1TargetY = mousePos().y;

        // Calculate distance to target
        const p1Diff = p1TargetY - player1.pos.y;

        // Apply Spring Physics
        player1.currentVelY += p1Diff * ACCEL * dt();
        player1.currentVelY *= FRICTION;
        player1.pos.y += player1.currentVelY;

        // Clamp to screen
        if (player1.pos.y < 50) {
            player1.pos.y = 50;
            player1.currentVelY = 0; // Kill velocity on impact
        }
        if (player1.pos.y > height() - 50) {
            player1.pos.y = height() - 50;
            player1.currentVelY = 0;
        }

        // --- 2. PLAYER 2 MOVEMENT (Left Side / AI) ---
        // Target: Ball Y position (AI tracking)
        let realTargetY = height() / 2;

        if (ball.vel.x < 0) {
            const distanceX = ball.pos.x - 30;
            const timeToImpact = distanceX / Math.abs(ball.vel.x);
            const predictedY = ball.pos.y + (ball.vel.y * timeToImpact);

            // Note: We apply error to the *Destination*, not the lerp
            realTargetY = predictedY + rand(-AI_ERROR_RANGE, AI_ERROR_RANGE);
        }

        // 2. Smoothly move the "Mental Target" towards the "Real Target"
        // lerp(current, target, speed) creates a smooth transition
        aiMentalTargetY = lerp(aiMentalTargetY, realTargetY, dt() * AI_FOCUS_SPEED);

        // 3. Physics uses the Mental Target (No huge jumps in distance = No teleporting)
        const p2Diff = aiMentalTargetY - player2.pos.y;


        // Apply Spring Physics
        player2.currentVelY += p2Diff * ACCEL * dt();
        player2.currentVelY *= FRICTION;
        player2.pos.y += player2.currentVelY;

        // Clamp to screen
        if (player2.pos.y < 50) {
            player2.pos.y = 50;
            player2.currentVelY = 0;
        }
        if (player2.pos.y > height() - 50) {
            player2.pos.y = height() - 50;
            player2.currentVelY = 0;
        }

        // --- 3. BALL MOVEMENT ---
        ball.move(ball.vel.x, ball.vel.y);

        // Bounce off Top/Bottom
        if (ball.pos.y < 0 && ball.vel.y < 0) {
            ball.vel.y = -ball.vel.y;
        }
        if (ball.pos.y > height() && ball.vel.y > 0) {
            ball.vel.y = -ball.vel.y;
        }

        // Bounce off Left Wall (Safety net if AI misses)
        if (ball.pos.x < 0 && ball.vel.x < 0) {
            ball.vel.x = -ball.vel.x;
        }

        // Game Over (Ball goes past Player 1)
        if (ball.pos.x > width()) {
            window.handleGameOver(score);
            go("gameover");
        }
    });

    // --- COLLISIONS ---
    ball.onCollide("paddle", () => {
        // Reverse X direction
        ball.vel.x = -ball.vel.x;

        // Speed up slightly on every hit
        ball.vel.x *= 1.05;
        ball.vel.y *= 1.05;

        score += 100;
        scoreLabel.text = score;
        shake(1);
    });
});

scene("gameover", () => {
    add([
        text("Game Over"),
        pos(center()),
        anchor("center"),
        color(255, 0, 0),
    ]);
});

go("main");