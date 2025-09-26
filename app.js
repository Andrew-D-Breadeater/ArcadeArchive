document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const leaderboardTables = document.querySelectorAll('.leaderboard-table');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetGame = button.dataset.game;

            // Deactivate all buttons and hide all tables
            tabButtons.forEach(btn => btn.classList.remove('active'));
            leaderboardTables.forEach(table => table.classList.add('hidden'));

            // Activate the clicked button
            button.classList.add('active');

            // Show the target leaderboard table
            const targetTable = document.getElementById(targetGame + '-leaderboard');
            if (targetTable) {
                targetTable.classList.remove('hidden');
            }
        });
    });
});

// --- Game Page Logic ---

// Find the play button, but only if it exists on the current page
const playButton = document.getElementById('play-button');
const gameMessage = document.getElementById('game-message');

if (playButton && gameMessage) {
    playButton.addEventListener('click', () => {
        // Show the message and hide the button
        gameMessage.classList.remove('hidden');
        playButton.classList.add('hidden');

        // The "animation": hide the message and show the button again after 2 seconds
        setTimeout(() => {
            gameMessage.classList.add('hidden');
            playButton.classList.remove('hidden');
        }, 2000); // 2000 milliseconds = 2 seconds
    });
}

// --- Dynamic Game Page Logic ---

// This code block should only run if we are on the game page.
// We can check by seeing if the 'game-title' element exists.
const gameTitleElement = document.getElementById('game-title');

if (gameTitleElement) {
    // 1. Read the URL to find out which game to load
    const urlParams = new URLSearchParams(window.location.search);
    const gameName = urlParams.get('game'); // This will be 'pong', 'snake', etc.

    if (gameName) {
        // 2. Update the page content
        // Capitalize the first letter for a nice title
        const formattedGameName = gameName.charAt(0).toUpperCase() + gameName.slice(1);
        
        gameTitleElement.textContent = formattedGameName;
        document.title = `ArcadeArchive - ${formattedGameName}`;

        // 3. Set up the "Play" button logic
        const playButton = document.getElementById('play-button');
        const gameMessage = document.getElementById('game-message');

        playButton.addEventListener('click', () => {
            gameMessage.classList.remove('hidden');
            playButton.classList.add('hidden');

            // LATER: Instead of a dummy message, this is where we will
            // actually load and start the game script for `gameName`.
            
            setTimeout(() => {
                gameMessage.classList.add('hidden');
                playButton.classList.remove('hidden');
            }, 2000);
        });

    } else {
        // Handle case where someone lands on game.html without a game parameter
        gameTitleElement.textContent = 'Unknown Game';
    }
}