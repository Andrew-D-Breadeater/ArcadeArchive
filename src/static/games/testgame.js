// 1. Initialize
kaboom({
    background: [29, 43, 83], // Pitch black
    width: 800,
    height: 400,
    scale: 1,
    root: document.querySelector(".game-container"),
    debug: true, // Show the green debug text
});

// 2. Simple Scene
scene("main", () => {
    
    // Paddles
    add([
        rect(20, 80),
        pos(20, height() / 2),
        anchor("center"),
        color(255, 255, 255),
        area(),
        "paddle",
    ]);
    debug.log("Left paddle added");

    // Player Paddle (Mouse control for simplicity on first test)
    const player = add([
        rect(20, 80),
        pos(width() - 20, height() / 2),
        anchor("center"),
        color(255, 255, 255),
        area(),
        "paddle",
    ]);
    debug.log("Right paddle added");

    // Ball
    const ball = add([
        rect(15, 15),
        pos(center()),
        color(255, 255, 255),
        area(),
        { vel: vec2(400, 400) }, // Custom component for movement
        "ball",
    ]);
    debug.log("Ball added");

    // Simple Score
    let score = 0;
    const scoreLabel = add([
        text(score),
        pos(center().x, 50),
        anchor("center"),
    ]);

    // Update Loop
    onUpdate(() => {
        player.pos.y = mousePos().y;

        // Simple ball movement
        ball.move(ball.vel.x, ball.vel.y);

        // Bounce off top/bottom
        if (ball.pos.y < 0 || ball.pos.y > height()) {
            ball.vel.y = -ball.vel.y;
        }

        // Loose condition (Ball goes past player)
        if (ball.pos.x > width()) {
            // --- THE BRIDGE ---
            // Call the global function we defined in app.js
            window.handleGameOver(score);
            // Shake screen
            shake();
            // Go to a pause state or restart
            go("gameover");
        }

        // Bounce off left wall (AI side)
        if (ball.pos.x < 0) {
            ball.vel.x = -ball.vel.x;
        }
    });
});

go("main");