// src/static/games/pong.js

const COLORS = {
    BACKGROUND: [253, 246, 227], // Cream
    PADDLE: [46, 125, 50],       // Green
    BALL: [46, 125, 50],         // Green
    SCORE_TEXT: [76, 175, 80],   // Bright Green
    INFO_TEXT: [76, 175, 80],      // Bright Green
    GAME_OVER_TEXT: [76, 175, 80], // Bright Green
    RESTART_TEXT: [76, 175, 80], // Bright Green
};

// 1. Initialize Kaplay
if (typeof add === 'undefined') {
    kaplay({
        background: COLORS.BACKGROUND,
        width: 800,
        height: 400,
        scale: 1,
        root: document.querySelector(".game-container"),
        debug: true,
        letterbox: true,
        font: 'VT323',
    });
}

scene("main", () => {

    // --- SETTINGS ---
    const ACCEL = 30;         
    const FRICTION = 0.35;    
    const AI_ERROR_RANGE = 50; 
    const AI_FOCUS_SPEED = 3; 
    const WIN_SCORE = 3;      

    // --- STATE ---
    let scoreP1 = 0;
    let scoreP2 = 0;
    let matchTime = 0;      
    let isGameActive = false; 

    // --- OBJECTS ---

    const player2 = add([
        rect(20, 100),
        pos(30, height() / 2),
        anchor("center"),
        color(...COLORS.PADDLE),
        area(),
        "paddle",
        "player2",
        { currentVelY: 0 }
    ]);

    const player1 = add([
        rect(20, 100),
        pos(width() - 30, height() / 2),
        anchor("center"),
        color(...COLORS.PADDLE),
        area(),
        "paddle",
        "player1",
        { currentVelY: 0 } 
    ]);

    const ball = add([
        rect(15, 15),
        pos(center()),
        anchor("center"),
        color(...COLORS.BALL),
        area(),
        { vel: vec2(0, 0) }, 
        "ball",
    ]);

    // UI Layer
    const scoreLabel = add([
        text("0 - 0", { size: 48 }),
        pos(center().x, 50),
        anchor("center"),
        color(...COLORS.SCORE_TEXT),
        z(50)
    ]);

    const infoLabel = add([
        text(""),
        pos(center().x, center().y-35),
        anchor("center"),
        color(...COLORS.INFO_TEXT),
        scale(1.5),
        z(100) 
    ]);

    // --- LOGIC ---

    let aiMentalTargetY = height() / 2; 

    // Helper: The Custom Scoring Formula
    function calculateLeaderboardScore() {
        const diff = Math.abs(scoreP1 - scoreP2);
        // Avoid division by zero if time is somehow 0 (instant win?)
        const t = Math.max(matchTime, 0.01); 
        
        let finalScore = (diff * 100) / t;

        if (scoreP1 > scoreP2) {
            // Player Won: Reward big difference
            finalScore *= (2 * diff);
        } else {
            // Player Lost: Penalize big difference
            finalScore *= (1 / Math.max(diff, 1));
        }

        return Math.round(finalScore);
    }

    // Helper: Countdown Sequence
    function startRound() {
        isGameActive = false;
        
        // Reset positions
        ball.pos = center();
        ball.vel = vec2(0, 0); 
        player1.pos.y = height() / 2;
        player2.pos.y = height() / 2;
        player1.currentVelY = 0;
        player2.currentVelY = 0;

        // Countdown Animation
        infoLabel.text = "3";
        wait(1, () => {
            infoLabel.text = "2";
            wait(1, () => {
                infoLabel.text = "1";
                wait(1, () => {
                    infoLabel.text = "GO!";
                    // Launch Ball
                    const dirX = choose([-1, 1]);
                    const dirY = rand(-0.8, 0.8);
                    ball.vel = vec2(dirX * 400, dirY * 400);
                    
                    isGameActive = true; 
                    
                    wait(0.5, () => {
                        infoLabel.text = "";
                    });
                });
            });
        });
    }

    onUpdate(() => {
        if (!isGameActive) return;

        matchTime += dt();

        // --- 1. PLAYER 1 MOVEMENT ---
        const p1TargetY = mousePos().y;
        const p1Diff = p1TargetY - player1.pos.y;

        player1.currentVelY += p1Diff * ACCEL * dt();
        player1.currentVelY *= FRICTION;
        player1.pos.y += player1.currentVelY;

        if (player1.pos.y < 50) { player1.pos.y = 50; player1.currentVelY = 0; }
        if (player1.pos.y > height() - 50) { player1.pos.y = height() - 50; player1.currentVelY = 0; }

        // --- 2. PLAYER 2 MOVEMENT (AI) ---
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

        if (ball.pos.y < 0 && ball.vel.y < 0) ball.vel.y = -ball.vel.y;
        if (ball.pos.y > height() && ball.vel.y > 0) ball.vel.y = -ball.vel.y;

        // --- SCORING LOGIC ---
        
        if (ball.pos.x > width()) {
            scoreP2++;
            handlePoint("AI Scores!");
        }

        if (ball.pos.x < 0) {
            scoreP1++;
            handlePoint("You Score!");
        }
    });

    function handlePoint(message) {
        shake(10);
        scoreLabel.text = `${scoreP2} - ${scoreP1}`;
        infoLabel.text = message;
        
        isGameActive = false; 

        // Check for Match Win
        if (scoreP1 >= WIN_SCORE || scoreP2 >= WIN_SCORE) {
            const calculatedScore = calculateLeaderboardScore();
            const winnerText = scoreP1 >= WIN_SCORE ? "YOU WIN!" : "AI WINS!";
            
            wait(1.5, () => {
                window.handleGameOver(calculatedScore); 
                go("gameover", { 
                    winner: winnerText,
                    score: calculatedScore
                });
            });
        } else {
            // Next Round
            wait(1.5, () => {
                startRound();
            });
        }
    }

    // --- COLLISIONS ---
    ball.onCollide("paddle", () => {
        ball.vel.x = -ball.vel.x;
        ball.vel.x *= 1.05;
        ball.vel.y *= 1.05;
        shake(0.5);
    });

    // Start the first round
    startRound();
});

scene("gameover", (data) => {
    add([
        text(data.winner),
        pos(center().x, center().y - 100),
        anchor("center"),
        color(...COLORS.GAME_OVER_TEXT),
    ]);
    add([
        text(`Score: ${data.score}`),
        pos(center().x, center().y+120),
        anchor("center"),
        scale(0.8),
        color(...COLORS.GAME_OVER_TEXT),
    ]);
    add([
        text("Press Play to Restart"),
        pos(center().x, center().y + 90),
        anchor("center"),
        scale(0.5),
        color(...COLORS.RESTART_TEXT),
    ]);
});

go("main");