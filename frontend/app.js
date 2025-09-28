// --- Main App Initializer ---
// This single event listener will run when the page is ready.
document.addEventListener('DOMContentLoaded', () => {
    // We run an "init" function for each feature.
    // Each function checks if it's on the right page before running.
    initLeaderboardTabs();
    initGamePage();
    initAuthForms();
    initScoresTable();
});


// --- FEATURE: Leaderboard Tabs ---
function initLeaderboardTabs() {
    const leaderboardNav = document.querySelector('.leaderboard-nav');
    if (!leaderboardNav) return; // Only run on the leaderboard page

    const tabButtons = leaderboardNav.querySelectorAll('.btn');
    const leaderboardTables = document.querySelectorAll('.leaderboard-table');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetGame = button.dataset.game;

            // Deactivate all buttons
            tabButtons.forEach(btn => {
                btn.classList.replace('btn-primary', 'btn-secondary');
            });
            // Activate the clicked button
            button.classList.replace('btn-secondary', 'btn-primary');
            
            // Hide all tables
            leaderboardTables.forEach(table => table.classList.add('hidden'));

            // Show the target table
            const targetTable = document.getElementById(targetGame + '-leaderboard');
            if (targetTable) {
                targetTable.classList.remove('hidden');
            }
        });
    });
}


// --- FEATURE: Game Page (Modals & Dynamic Content) ---
function initGamePage() {
    const gameTitleElement = document.getElementById('game-title');
    if (!gameTitleElement) return; // Only run on the game page

    // --- State ---
    let isLoggedIn = false;

    // --- Elements ---
    const modalOverlay = document.getElementById('modal-overlay');
    const guestModal = document.getElementById('guest-score-modal');
    const userModal = document.getElementById('user-score-modal');
    const allCloseButtons = document.querySelectorAll('.close-button, .close-cross');
    const gameMessage = document.getElementById('game-message'); // <<< RESTORED THIS

    // --- Functions ---
    function showScoreModal(score) {
        modalOverlay.classList.remove('hidden');
        if (isLoggedIn) {
            userModal.querySelector('.modal-score').textContent = score;
            userModal.classList.remove('hidden');
        } else {
            guestModal.querySelector('.modal-score').textContent = score;
            guestModal.classList.remove('hidden');
        }
    }

    function hideScoreModal() {
        modalOverlay.classList.add('hidden');
        guestModal.classList.add('hidden');
        userModal.classList.add('hidden');
    }
    
    // --- Event Listeners ---
    allCloseButtons.forEach(button => button.addEventListener('click', hideScoreModal));
    modalOverlay.addEventListener('click', hideScoreModal);
    guestModal.addEventListener('click', (e) => e.stopPropagation());
    userModal.addEventListener('click', (e) => e.stopPropagation());

    // --- Page Setup ---
    const urlParams = new URLSearchParams(window.location.search);
    const gameName = urlParams.get('game');

    if (gameName) {
        const formattedGameName = gameName.charAt(0).toUpperCase() + gameName.slice(1);
        gameTitleElement.textContent = formattedGameName;
        document.title = `ArcadeArchive - ${formattedGameName}`;

        const playButton = document.getElementById('play-button');
        playButton.addEventListener('click', () => {
            // LATER: This is where the real game will start
            // For now, show the "No game yet" message, then simulate a game end
            
            playButton.classList.add('hidden');
            gameMessage.classList.remove('hidden'); // <<< SHOW THE MESSAGE

            setTimeout(() => {
                gameMessage.classList.add('hidden'); // <<< HIDE THE MESSAGE
                
                // Now, simulate the game ending and show the score modal
                const dummyScore = Math.floor(Math.random() * 10000);
                showScoreModal(dummyScore);
                playButton.classList.remove('hidden');

            }, 2000); // Total simulation time is 2 seconds
        });
    } else {
        gameTitleElement.textContent = 'Unknown Game';
    }
}


// --- FEATURE: Personal Scores Table (Simplified "Show All" Version) ---
// --- FEATURE: Personal Scores Table (Corrected "Show All" Version) ---
function initScoresTable() {
    const scoresContainer = document.querySelector('.personal-scores-container');
    if (!scoresContainer) return;

    // --- MOCK DATA ---
    const mockScores = [
        { score: 8500, date: '2025-09-26' }, { score: 12000, date: '2025-09-27' },
        { score: 4200, date: '2025-09-22' }, { score: 15500, date: '2025-09-25' },
        { score: 9100, date: '2025-09-24' }, { score: 7300, date: '2025-09-23' },
        { score: 18000, date: '2025-09-28' }, { score: 3500, date: '2025-09-21' },
    ];

    // --- Elements ---
    const tableBody = document.getElementById('scores-table-body');
    const sortByDateButton = document.getElementById('sort-by-date');
    const sortByScoreButton = document.getElementById('sort-by-score');
    const toggleAllButton = document.getElementById('toggle-all-scores');
    
    // --- State and Configuration ---
    const initialScoresToShow = 5;
    let currentSort = 'date';
    let isShowingAll = false;
    let sortedScores = [];

    // --- Functions ---
    function renderScoresTable() {
        tableBody.innerHTML = '';
        const scoresToDisplay = isShowingAll ? sortedScores : sortedScores.slice(0, initialScoresToShow);

        scoresToDisplay.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${item.score}</td><td>${item.date}</td>`;
            tableBody.appendChild(row);
        });

        toggleAllButton.textContent = isShowingAll ? 'Show Less' : 'Show All';
        toggleAllButton.disabled = sortedScores.length <= initialScoresToShow;
    }
    
    function sortAndRender() {
        sortedScores = [...mockScores].sort((a, b) => {
            if (currentSort === 'score') return b.score - a.score;
            return new Date(b.date) - new Date(a.date);
        });
        renderScoresTable();
    }

    // --- Event Listeners ---
    sortByDateButton.addEventListener('click', () => {
        currentSort = 'date';
        sortByDateButton.classList.replace('btn-secondary', 'btn-primary');
        sortByScoreButton.classList.replace('btn-primary', 'btn-secondary');
        sortAndRender();
    });

    sortByScoreButton.addEventListener('click', () => {
        currentSort = 'score';
        sortByScoreButton.classList.replace('btn-secondary', 'btn-primary');
        sortByDateButton.classList.replace('btn-primary', 'btn-secondary');
        sortAndRender();
    });

    toggleAllButton.addEventListener('click', () => {
        isShowingAll = !isShowingAll;
        renderScoresTable();
    });

    // --- Initial Load ---
    sortAndRender();
}

// --- FEATURE: Auth Form Toggle ---
function initAuthForms() {
    const loginContainer = document.getElementById('login-form-container');
    if (!loginContainer) return; // Only run on the auth page

    const registerContainer = document.getElementById('register-form-container');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
    });
}