// src/static/games/pong.js

// 1. Initialize Kaplay
if (typeof add === 'undefined') {
    kaplay({
        background: [29, 43, 83],
        width: 800,
        height: 400,
        scale: 2,
        root: document.querySelector(".game-container"),
        debug: true,
        letterbox: false,
    });
}

scene("main", () => {

    // --- SETTINGS ---
    const ACCEL = 30;         
    const FRICTION = 0.65;    
    const AI_ERROR_RANGE = 50; 
    const AI_FOCUS_SPEED = 2.6; 
    const WIN_SCORE = 3;      // First to 3 wins

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
        { currentVelY: 0 }
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
        { currentVelY: 0 } 
    ]);

    // Ball
    const ball = add([
        rect(15, 15),
        pos(center()),
        anchor("center"),
        color(255, 255, 255),
        area(),
        { vel: vec2(400, 400) }, 
        "ball",
    ]);

    // Score Variables
    let scoreP1 = 0;
    let scoreP2 = 0;

    // Score UI (Displays "0 - 0")
    const scoreLabel = add([
        text("0 - 0"),
        pos(center().x, 50),
        anchor("center"),
        color(255, 255, 255),
    ]);

    // --- LOGIC ---

    let aiMentalTargetY = height() / 2; 

    onUpdate(() => {
        // --- 1. PLAYER 1 MOVEMENT (Right Side) ---
        const p1TargetY = mousePos().y;
        const p1Diff = p1TargetY - player1.pos.y;

        player1.currentVelY += p1Diff * ACCEL * dt();
        player1.currentVelY *= FRICTION;
        player1.pos.y += player1.currentVelY;

        if (player1.pos.y < 50) { player1.pos.y = 50; player1.currentVelY = 0; }
        if (player1.pos.y > height() - 50) { player1.pos.y = height() - 50; player1.currentVelY = 0; }

        // --- 2. PLAYER 2 MOVEMENT (Left Side / AI) ---
        let realTargetY = height() / 2;

        if (ball.vel.x < 0) {
            const distanceX = ball.pos.x - 30;
            const timeToImpact = distanceX / Math.abs(ball.vel.x);
            const predictedY = ball.pos.y + (ball.vel.y * timeToImpact);
            realTargetY = predictedY + rand(-AI_ERROR_RANGE, AI_ERROR_RANGE);
        }

        aiMentalTargetY = lerp(aiMentalTargetY, realTargetY, dt() * AI_FOCUS_SPEED);
        const p2Diff = aiMentalTargetY - player2.pos.y;

        player2.currentVelY += p2Diff * ACCEL * dt();
        player2.currentVelY *= FRICTION;
        player2.pos.y += player2.currentVelY;

        if (player2.pos.y < 50) { player2.pos.y = 50; player2.currentVelY = 0; }
        if (player2.pos.y > height() - 50) { player2.pos.y = height() - 50; player2.currentVelY = 0; }

        // --- 3. BALL MOVEMENT ---
        ball.move(ball.vel.x, ball.vel.y);

        // Bounce off Top/Bottom
        if (ball.pos.y < 0 && ball.vel.y < 0) ball.vel.y = -ball.vel.y;
        if (ball.pos.y > height() && ball.vel.y > 0) ball.vel.y = -ball.vel.y;

        // --- SCORING LOGIC ---
        
        // Ball goes past Player 1 (Right Wall) -> AI Scores
        if (ball.pos.x > width()) {
            scoreP2++;
            updateGame("AI Scores!");
        }

        // Ball goes past Player 2 (Left Wall) -> Player Scores
        if (ball.pos.x < 0) {
            scoreP1++;
            updateGame("You Score!");
        }
    });

    // Helper to handle scoring, resetting, and checking win condition
    function updateGame(message) {
        shake(1);
        scoreLabel.text = `${scoreP2} - ${scoreP1}`;
        
        // Check for Match Win
        if (scoreP1 >= WIN_SCORE || scoreP2 >= WIN_SCORE) {
            // Submit the player's score (e.g., 3 if they won, 1 if they lost)
            window.handleGameOver(scoreP1); 
            go("gameover", { winner: scoreP1 >= WIN_SCORE ? "YOU WIN!" : "AI WINS!" });
        } else {
            // Reset Ball for next point
            resetBall();
        }
    }

    function resetBall() {
        ball.pos = center();
        // Launch ball towards the person who just lost the point? 
        // Or random X direction, random Y angle
        ball.vel.x = choose([-400, 400]);
        ball.vel.y = rand(-400, 400);
    }

    // --- COLLISIONS ---
    ball.onCollide("paddle", () => {
        ball.vel.x = -ball.vel.x;
        // Speed up slightly on every hit
        ball.vel.x *= 1.05;
        ball.vel.y *= 1.05;
        shake(0.25);
        // Note: No score increase here anymore, only on wall hit
    });
});

scene("gameover", (data) => {
    add([
        text(data.winner),
        pos(center().x, center().y - 100),
        anchor("center"),
        color(255, 255, 255),
    ]);
    add([
        text("Press Play to Restart"),
        pos(center().x, center().y + 100),
        anchor("center"),
        scale(0.5),
        color(255, 255, 255),
    ]);
});

go("main");