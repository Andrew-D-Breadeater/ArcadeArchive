// src/static/games/snake.js

// --- CONFIGURATION ---
const COLORS = {
    BACKGROUND: [253, 246, 227], // Cream
    HEAD: [27, 94, 32],       //Dark green
    BODY: [46, 125, 50],       // Green
    TAIL: [46, 125, 50],       // Green
    FOOD: [255, 99, 71],      // Tomato Red
    TEXT: [76, 175, 80], // Bright Green
    LETTERBOX_BG: [245, 239, 220], // Dark cream
};

// 1. Initialize Kaplay
if (typeof add === 'undefined') {
    kaplay({
        background: COLORS.LETTERBOX_BG,
        width: 800,
        height: 600,
        scale: 1,
        root: document.querySelector(".game-container"),
        debug: true,
        letterbox: true,
        font: 'VT323',
    });
}

scene("main", () => {

    // --- DRAW GAME BOARD BACKGROUND ---
    add([
        rect(width(), height()), // Fill the logical game size (800x600)
        pos(0, 0),
        color(...COLORS.BACKGROUND),
        z(-100), // Put it waaaay in the back
        "game_background" // Tag it just in case
    ]);

    // --- SETTINGS ---
    const BLOCK_SIZE = 40; // Size of grid cells
    const MOVE_DELAY = 0.15; // Speed (lower is faster)
    const GRID_W = Math.floor(width() / BLOCK_SIZE);
    const GRID_H = Math.floor(height() / BLOCK_SIZE);

    // --- STATE ---
    let score = 0;
    let growthPotential = 2; // Start growing immediately to length 3
    let gameActive = false;
    let timer = 0;

    // Direction Vector (Starts moving Right)
    let currentDir = vec2(1, 0);
    let inputQueue = []; // Buffer to prevent self-collision on quick taps

    // The Snake Queue (Array of Game Objects)
    // [Tail, Body, Body, ... , Head]
    let snakeBody = [];

    // --- LAYERS & UI ---

    const scoreLabel = add([
        text("Score: 0"),
        pos(20, 20),
        color(...COLORS.TEXT),
        z(100)
    ]);

    // Instructions Overlay
    const startMsg = add([
        text("Tap LEFT side to Turn LEFT\nTap RIGHT side to Turn RIGHT\n\nClick to Start"),
        pos(center()),
        anchor("center"),
        color(...COLORS.TEXT),
        z(100),
        "ui"
    ]);

    // --- HELPERS ---

    // Function to calculate grid position to screen pixels
    function toScreen(x, y) {
        return vec2(x * BLOCK_SIZE + BLOCK_SIZE / 2, y * BLOCK_SIZE + BLOCK_SIZE / 2);
    }

    function spawnFood() {
        // Find a random spot not occupied by snake
        let valid = false;
        let x, y;

        while (!valid) {
            x = randi(0, GRID_W);
            y = randi(0, GRID_H);
            valid = true;

            // Simple check against body positions
            for (let seg of snakeBody) {
                // Convert screen pos back to grid for check
                const gx = Math.floor(seg.pos.x / BLOCK_SIZE);
                const gy = Math.floor(seg.pos.y / BLOCK_SIZE);
                if (gx === x && gy === y) {
                    valid = false;
                    break;
                }
            }
        }

        add([
            rect(BLOCK_SIZE * 0.8, BLOCK_SIZE * 0.8),
            pos(toScreen(x, y)),
            anchor("center"),
            color(...COLORS.FOOD),
            area({ scale: 0.8 }),
            "food",
            { gridPos: vec2(x, y) }
        ]);
    }

    function updateSegmentVisuals() {
        // Iterate through body to update looks based on position in queue
        snakeBody.forEach((seg, index) => {
            const isHead = index === snakeBody.length - 1;
            const isTail = index === 0;

            if (isHead) {
                seg.color = rgb(...COLORS.HEAD);
                seg.scale = vec2(1, 1);
            } else if (isTail) {
                seg.color = rgb(...COLORS.TAIL);
                // "Trapezoid" look: we scale it down to look tapered
                seg.scale = vec2(0.6, 0.6);
            } else {
                seg.color = rgb(...COLORS.BODY);
                seg.scale = vec2(0.9, 0.9); // Slightly smaller than grid for "segmented" look
            }
        });
    }

    // --- GAME LOGIC ---

    function moveSnake() {
        // 1. Process Input
        if (inputQueue.length > 0) {
            const input = inputQueue.shift();

            if (typeof input === 'string') {
                // RELATIVE TURN (Mouse/Touch)
                if (input === 'left') {
                    currentDir = vec2(currentDir.y, -currentDir.x);
                } else {
                    currentDir = vec2(-currentDir.y, currentDir.x);
                }
            } else {
                // ABSOLUTE TURN (Keyboard Vector)
                // Prevent 180 degree turns (suicide)
                // If new dir is exactly opposite to current dir, ignore it
                if (input.x !== -currentDir.x || input.y !== -currentDir.y) {
                    currentDir = input;
                }
            }
        }

        // 2. Calculate New Head Position
        const head = snakeBody[snakeBody.length - 1];
        // Convert pixel pos to grid pos
        const gridX = Math.floor(head.pos.x / BLOCK_SIZE);
        const gridY = Math.floor(head.pos.y / BLOCK_SIZE);

        const nextX = gridX + currentDir.x;
        const nextY = gridY + currentDir.y;

        // 3. Collision Checks

        // Wall Collision
        if (nextX < 0 || nextX >= GRID_W || nextY < 0 || nextY >= GRID_H) {
            die();
            return;
        }

        // Self Collision
        // We check against all body parts EXCEPT the tail (because the tail might move away this frame)
        // unless we are growing, in which case the tail stays.
        const ignoreTail = growthPotential <= 0;

        for (let i = 0; i < snakeBody.length; i++) {
            if (ignoreTail && i === 0) continue; // Skip tail check if it's moving

            const seg = snakeBody[i];
            const gx = Math.floor(seg.pos.x / BLOCK_SIZE);
            const gy = Math.floor(seg.pos.y / BLOCK_SIZE);

            if (gx === nextX && gy === nextY) {
                die();
                return;
            }
        }

        // 4. Create New Head
        const newHead = add([
            rect(BLOCK_SIZE, BLOCK_SIZE),
            pos(toScreen(nextX, nextY)),
            anchor("center"),
            color(...COLORS.HEAD),
            area({ scale: 0.5 }), // Smaller hitbox for food collection
            "snake_seg"
        ]);

        // Add to Queue
        snakeBody.push(newHead);

        // 5. Check Food
        const food = get("food")[0];

        if (food && food.gridPos.x === nextX && food.gridPos.y === nextY) {
            destroy(food);
            score += 10;
            scoreLabel.text = `Score: ${score}`;
            growthPotential += 1;
            shake(2);
            spawnFood();
        }

        // 6. Handle Tail (Growth)
        if (growthPotential > 0) {
            growthPotential--;
            // Do NOT remove tail -> Snake grows
        } else {
            // Remove tail -> Snake moves
            const tail = snakeBody.shift();
            destroy(tail);
        }

        // 7. Update Visuals (Head becomes Body, new Tail becomes smaller)
        updateSegmentVisuals();
    }

    function die() {
        gameActive = false;
        shake(10);
        wait(1, () => {
            window.handleGameOver(score);
            go("gameover", score);
        });
    }

    // --- UPDATE LOOP ---

    onUpdate(() => {
        if (!gameActive) return;

        // Custom Timer for grid movement
        timer += dt();
        if (timer >= MOVE_DELAY) {
            moveSnake();
            timer = 0;
        }
    });

    // --- INPUT ---

    // --- INPUT ---

    // 1. Mouse/Touch: Relative Steering (Cross Product Math)
    onMousePress(() => {
        if (!gameActive) {
            startGame();
            return;
        }

        // Get the head object to calculate positions relative to it
        const head = snakeBody[snakeBody.length - 1];

        // 1. Calculate Vector from Head to Mouse Click
        const clickVecX = mousePos().x - head.pos.x;
        const clickVecY = mousePos().y - head.pos.y;

        // 2. Calculate 2D Cross Product
        // Formula: (Dir.x * Click.y) - (Dir.y * Click.x)
        const crossProduct = (currentDir.x * clickVecY) - (currentDir.y * clickVecX);

        // 3. Determine Side
        // In screen coords (Y down), Negative is Right/Clockwise, Positive is Left/Counter-Clockwise
        // We limit inputQueue length to prevent "over-steering"
        if (inputQueue.length < 2) {
            if (crossProduct < 0) {
                // Click was "Left" relative to movement -> Turn Counter-Clockwise
                inputQueue.push('left');
            } else {
                // Click was "Right" relative to movement -> Turn Clockwise
                inputQueue.push('right');
            }
        }
    });

    // 2. Keyboard: Absolute Direction
    // We translate absolute keys into turns or direction updates
    // Note: We check if the new direction is valid (not 180 degree turn)

    function handleKeyInput(newDir) {
        if (!gameActive) {
            startGame();
            return;
        }
        inputQueue.push(newDir);
    }

    onKeyPress("up", () => inputQueue.push(vec2(0, -1)));
    onKeyPress("w", () => inputQueue.push(vec2(0, -1)));

    onKeyPress("down", () => inputQueue.push(vec2(0, 1)));
    onKeyPress("s", () => inputQueue.push(vec2(0, 1)));

    onKeyPress("left", () => inputQueue.push(vec2(-1, 0)));
    onKeyPress("a", () => inputQueue.push(vec2(-1, 0)));

    onKeyPress("right", () => inputQueue.push(vec2(1, 0)));
    onKeyPress("d", () => inputQueue.push(vec2(1, 0)));

    // Helper to start game (extracted to avoid duplication)
    function startGame() {
        if (get("ui").length > 0) {
            destroyAll("ui");
            gameActive = true;

            const startX = Math.floor(GRID_W / 2);
            const startY = Math.floor(GRID_H / 2);
            const head = add([
                rect(BLOCK_SIZE, BLOCK_SIZE),
                pos(toScreen(startX, startY)),
                anchor("center"),
                color(...COLORS.HEAD),
                area(),
                "snake_seg"
            ]);
            snakeBody = [head];
            spawnFood();
        }
    }
});

scene("gameover", (finalScore) => {
    add([
        text("GAME OVER"),
        pos(center().x, center().y - 100),
        anchor("center"),
        color(...COLORS.TEXT),
        scale(2)
    ]);
    add([
        text(`Final Score: ${finalScore}`),
        pos(center().x, center().y + 120),
        anchor("center"),
        color(...COLORS.TEXT),
    ]);

    add([
        text("Press Play to Restart"),
        pos(center().x, center().y + 90),
        anchor("center"),
        scale(0.5),
        color(...COLORS.TEXT),
    ]);
});

go("main");