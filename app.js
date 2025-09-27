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

const gameTitleElement = document.getElementById('game-title');

if (gameTitleElement) {
    //--- Modal Logic ---
    // --- SIMULATE LOGIN STATE ---
    // For now, we'll use a variable. Later, this will come from the server.
    // Change this to `true` to test the logged-in user modal.
    let isLoggedIn = false; 

    // --- Get all the modal elements ---
    const modalOverlay = document.getElementById('modal-overlay');
    const guestModal = document.getElementById('guest-score-modal');
    const userModal = document.getElementById('user-score-modal');
    const allCloseButtons = document.querySelectorAll('.close-button, .close-cross');

    // --- Functions to show and hide the modal ---
    function showScoreModal(score) {
        modalOverlay.classList.remove('hidden');

        if (isLoggedIn) {
            // Update and show the user modal
            userModal.querySelector('.modal-score').textContent = score;
            userModal.classList.remove('hidden');
        } else {
            // Update and show the guest modal
            guestModal.querySelector('.modal-score').textContent = score;
            guestModal.classList.remove('hidden');
        }
    }

    function hideScoreModal() {
        modalOverlay.classList.add('hidden');
        guestModal.classList.add('hidden');
        userModal.classList.add('hidden');
    }
    
    // --- Event listeners to close the modal ---
    allCloseButtons.forEach(button => button.addEventListener('click', hideScoreModal));
    modalOverlay.addEventListener('click', hideScoreModal);

    // Stop clicks inside the modal from closing it (event propagation)
    guestModal.addEventListener('click', (e) => e.stopPropagation());
    userModal.addEventListener('click', (e) => e.stopPropagation());


    // --- Game page setup logic ---
    const urlParams = new URLSearchParams(window.location.search);
    const gameName = urlParams.get('game');

    if (gameName) {
        const formattedGameName = gameName.charAt(0).toUpperCase() + gameName.slice(1);
        gameTitleElement.textContent = formattedGameName;
        document.title = `ArcadeArchive - ${formattedGameName}`;

        const playButton = document.getElementById('play-button');
        
        playButton.addEventListener('click', () => {
            console.log("Simulating game play for 2 seconds...");
            playButton.classList.add('hidden');

            setTimeout(() => {
                const dummyScore = Math.floor(Math.random() * 10000);
                console.log("Simulated game over. Score:", dummyScore);
                showScoreModal(dummyScore);
                playButton.classList.remove('hidden');
            }, 2000);
        });

    } else {
        gameTitleElement.textContent = 'Unknown Game';
    }
}

// --- Auth Form Toggle Logic ---

const loginContainer = document.getElementById('login-form-container');
const registerContainer = document.getElementById('register-form-container');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

// Check if these elements exist before adding listeners
if (loginContainer && registerContainer && showRegisterLink && showLoginLink) {
    showRegisterLink.addEventListener('click', (event) => {
        event.preventDefault(); // Prevents the link from jumping to the top of the page
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (event) => {
        event.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });
}