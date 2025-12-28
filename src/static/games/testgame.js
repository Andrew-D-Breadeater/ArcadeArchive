// Check if Kaplay is already running to prevent double-initialization
if (typeof add === 'undefined') {
    kaplay({
        width: 1600,
        height: 800,
        scale: 1,
        background: [50, 50, 50], // Grey background to see canvas edges
        root: document.querySelector(".game-container"),
        debug: true,
        pixelDensity: 1,
        letterbox: false, // Keeps aspect ratio correct in fullscreen
    });
}

scene("main", () => {

    // 1. Red Center Block
    add([
        rect(100, 100),
        pos(center()),
        anchor("center"),
        color(255, 0, 0),
    ]);

    // 2. Green Top-Left Block (Should touch top-left corner)
    add([
        rect(50, 50),
        pos(0, 0),
        color(0, 255, 0),
    ]);

    // 3. Blue Bottom-Right Block (Should touch bottom-right corner)
    // If you can't see this, the canvas is being cut off!
    add([
        rect(50, 50),
        pos(width() - 50, height() - 50),
        color(0, 0, 255),
    ]);

    // 4. Resolution Text
    add([
        text(`Canvas: ${width()} x ${height()}`),
        pos(center().x, 50),
        anchor("center"),
        color(255, 255, 255)
    ]);
});

go("main");