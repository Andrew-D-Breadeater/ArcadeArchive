// --- Main App Initializer ---
// This single event listener will run when the page is ready.
document.addEventListener('DOMContentLoaded', () => {
    // We run an "init" function for each feature.
    // Each function checks if it's on the right page before running.
    initAuthStatus();
    initLeaderboardTabs();
    initGamePage();
    initAuthForms();
    initScoresTable();
});


// --- FEATURE: Leaderboard Tabs (Live Data & Cache) ---
function initLeaderboardTabs() {
    const leaderboardNav = document.querySelector('.leaderboard-nav');
    if (!leaderboardNav) return;

    // --- State and Elements ---
    const leaderboardCache = {}; // Simple object to cache results
    const tabButtons = leaderboardNav.querySelectorAll('.btn');
    
    // --- The main function to fetch and render a leaderboard ---
    async function loadLeaderboard(gameName) {
        const targetTable = document.getElementById(gameName + '-leaderboard');
        if (!targetTable) return;

        // Hide all other tables
        document.querySelectorAll('.leaderboard-table').forEach(table => table.classList.add('hidden'));

        // Step 1: Check the cache first
        if (leaderboardCache[gameName]) {
            console.log(`Loading '${gameName}' leaderboard from cache.`);
            renderTable(targetTable, leaderboardCache[gameName]);
            targetTable.classList.remove('hidden');
            return; // We're done!
        }

        // Step 2: If not in cache, fetch from the API
        console.log(`Fetching '${gameName}' leaderboard from API.`);
        try {
            const response = await fetch(`/api/leaderboard/${gameName}`);
            if (response.ok) {
                const data = await response.json();
                // Step 3: Save the data to the cache for next time
                leaderboardCache[gameName] = data;
                renderTable(targetTable, data);
            } else {
                console.error(`Failed to fetch leaderboard for ${gameName}`);
                renderTable(targetTable, []); // Render an empty table on error
            }
        } catch (error) {
            console.error(`Network error fetching leaderboard for ${gameName}:`, error);
            renderTable(targetTable, []);
        }
        
        targetTable.classList.remove('hidden');
    }

    // --- Renders the actual HTML for a given table ---
    function renderTable(tableElement, data) {
        const ol = tableElement.querySelector('ol');
        ol.innerHTML = ''; // Clear old data

        if (data.length === 0) {
            ol.innerHTML = '<li>No scores yet!</li>';
            return;
        }

        data.forEach(entry => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="name">${entry.username}</span> <span class="score">${entry.best_score}</span>`;
            ol.appendChild(li);
        });
    }

    // --- Event Listeners for the tabs ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetGame = button.dataset.game;

            // Update button styles
            tabButtons.forEach(btn => btn.classList.replace('btn-primary', 'btn-secondary'));
            button.classList.replace('btn-secondary', 'btn-primary');
            
            // Load the data for the clicked tab
            loadLeaderboard(targetGame);
        });
    });

    // --- Initial Load ---
    // Automatically load the first tab when the page opens
    const initialGame = leaderboardNav.querySelector('.btn').dataset.game;
    if (initialGame) {
        loadLeaderboard(initialGame);
    }
}


/// --- FEATURE: Game Page (Dialogs & Dynamic Content) ---
async function initGamePage() {
    const gameTitleElement = document.getElementById('game-title');
    if (!gameTitleElement) return;

    // --- State ---
    let loginStatus = { logged_in: false };
    try {
        const statusResponse = await fetch('/api/status');
        if (statusResponse.ok) {
            loginStatus = await statusResponse.json();
        }
    } catch (error) {
        console.error("Could not fetch login status:", error);
    }

    // --- Elements ---
    const guestDialog = document.getElementById('guest-score-dialog');
    const userDialog = document.getElementById('user-score-dialog');
    const gameMessage = document.getElementById('game-message');
    const playButton = document.getElementById('play-button');

    console.log("Game page init:", { guestDialog, userDialog });

    // --- Functions ---
    function showScoreModal(score) {
        if (loginStatus.logged_in) {
            if (userDialog) { // Safety check
                userDialog.querySelector('.modal-score').textContent = score;
                console.log("Showing user score submition dialog.");
                userDialog.showModal();
            }
        } else {
            if (guestDialog) { // Safety check
                guestDialog.querySelector('.modal-score').textContent = score;
                console.log("Showing guest score submition dialog.");
                guestDialog.showModal();
            }
        }
    }

    // --- Page Setup & Score Submission ---
    const urlParams = new URLSearchParams(window.location.search);
    const gameName = urlParams.get('game');

    if (gameName) {
        const formattedGameName = gameName.charAt(0).toUpperCase() + gameName.slice(1);
        gameTitleElement.textContent = formattedGameName;
        document.title = `ArcadeArchive - ${formattedGameName}`;

        playButton.addEventListener('click', () => {
            playButton.classList.add('hidden');
            gameMessage.classList.remove('hidden');

            setTimeout(async () => { // Make this async to handle score submission
                gameMessage.classList.add('hidden');

                const dummyScore = Math.floor(Math.random() * 10000);

                // --- SCORE SUBMISSION LOGIC ---
                try {
                    let scoreEndpoint = loginStatus.logged_in ? '/api/submit-score' : '/api/session-score';

                    const scoreResponse = await fetch(scoreEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ game_name: gameName, score: dummyScore })
                    });

                    if (scoreResponse.ok) {
                        console.log("Score submitted, dispatching refresh event.");
                        // Dispatch the custom event on success
                        document.dispatchEvent(new CustomEvent('scoreSubmitted', { detail: { gameName } }));
                    } else {
                        // Log an error on failure
                        console.error("Failed to submit score. Status:", scoreResponse.status);
                    }

                } catch (error) {
                    console.error("Network error submitting score:", error);
                }

                console.log("About to call showScoreModal with score:", dummyScore);

                showScoreModal(dummyScore);
                playButton.classList.remove('hidden');
            }, 2000);
        });
    } else {
        gameTitleElement.textContent = 'Unknown Game';
    }
}


// --- FEATURE: Personal Scores Table (Live Data & Refresh) ---
async function initScoresTable() { // Make the function async
    const scoresContainer = document.querySelector('.personal-scores-container');
    if (!scoresContainer) return;

    // --- State and Configuration ---
    let loginStatus = { logged_in: false };
    const initialScoresToShow = 5;
    let currentSort = 'date';
    let isShowingAll = false;
    let allScores = []; // This will hold our data from the API

    // --- Elements ---
    const tableBody = document.getElementById('scores-table-body');
    const sortByDateButton = document.getElementById('sort-by-date');
    const sortByScoreButton = document.getElementById('sort-by-score');
    const toggleAllButton = document.getElementById('toggle-all-scores');

    // --- Get the current game name from the URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const gameName = urlParams.get('game');
    if (!gameName) return; // Can't fetch scores without a game name

    // ---  Function to fetch and render data ---
    // This is now the single source of truth for getting data.
    async function refreshTableData() {
        try {
            const scoreEndpoint = loginStatus.logged_in
                ? `/api/personal-scores/${gameName}`
                : `/api/guest-personal-scores/${gameName}`;

            const scoresResponse = await fetch(scoreEndpoint);
            if (scoresResponse.ok) {
                allScores = await scoresResponse.json();
                renderScoresTable(); // Re-render the table with new data
            }
        } catch (error) {
            console.error("Failed to refresh personal scores:", error);
        }
    }

    // --- renderScoresTable function is now just for displaying data ---
    function renderScoresTable() {
        tableBody.innerHTML = '';
        // Sort the master list of scores
        const sortedScores = [...allScores].sort((a, b) => {
            if (currentSort === 'score') return b.score - a.score;
            // The played_at field is a string, so we need to parse it
            return new Date(b.played_at) - new Date(a.played_at);
        });

        const scoresToDisplay = isShowingAll ? sortedScores : sortedScores.slice(0, initialScoresToShow);

        scoresToDisplay.forEach(item => {
            const row = document.createElement('tr');
            // Format the date to be more readable
            const formattedDate = new Date(item.played_at).toLocaleDateString();
            row.innerHTML = `<td>${item.score}</td><td>${formattedDate}</td>`;
            tableBody.appendChild(row);
        });

        toggleAllButton.textContent = isShowingAll ? 'Show Less' : 'Show All';
        toggleAllButton.disabled = allScores.length <= initialScoresToShow;
    }

    // --- Event Listeners ---
    sortByDateButton.addEventListener('click', () => {
        currentSort = 'date';
        sortByDateButton.classList.replace('btn-secondary', 'btn-primary');
        sortByScoreButton.classList.replace('btn-primary', 'btn-secondary');
        renderScoresTable(); // Just re-render, no need to re-fetch
    });

    sortByScoreButton.addEventListener('click', () => {
        currentSort = 'score';
        sortByScoreButton.classList.replace('btn-secondary', 'btn-primary');
        sortByDateButton.classList.replace('btn-primary', 'btn-secondary');
        renderScoresTable();
    });

    toggleAllButton.addEventListener('click', () => {
        isShowingAll = !isShowingAll;
        renderScoresTable();
    });

    //  Listen for the custom event from the game page
    document.addEventListener('scoreSubmitted', (event) => {
        if (event.detail.gameName === gameName) {
            console.log("Heard scoreSubmitted event, refreshing table...");
            refreshTableData();
        }
    });

    // --- Initial Load ---
    // This is the new, cleaner initial load sequence.
    try {
        // 1. Get the login status first
        const statusResponse = await fetch('/api/status');
        if (statusResponse.ok) {
            loginStatus = await statusResponse.json();
        }
        // 2. Then, call our reusable function to fetch and render the scores.
        await refreshTableData();
    } catch (error) {
        console.error("Initial data load for scores table failed:", error);
    }
}

// --- FEATURE: Auth Form Toggle & Submission ---
function initAuthForms() {
    const loginContainer = document.getElementById('login-form-container');
    if (!loginContainer) return; // Only run on the auth page

    // --- Get all the elements ---
    const registerContainer = document.getElementById('register-form-container');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // --- Toggle Logic (unchanged) ---
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

    // ---  Login Form Submission Logic ---
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Stop the form from reloading the page

        // Get the form data
        const formData = new FormData(loginForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                // If login is successful, redirect to the home page
                window.location.href = '/';
            } else {
                // If there's an error, show it to the user
                const errorData = await response.json();
                alert(`Login failed: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Could not connect to the server.');
        }
    });

    // ---  Register Form Submission Logic ---
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());

        // Simple client-side check for password match
        if (data.password !== data['confirm-password']) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: data.username,
                    password: data.password // Only send what the API needs
                })
            });

            if (response.ok) {
                // If registration is successful, auto-login worked. Redirect home.
                window.location.href = '/';
            } else {
                const errorData = await response.json();
                alert(`Registration failed: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Network error:', error);
            alert('Could not connect to the server.');
        }
    });
}

// --- FEATURE: Global Authentication Status & Logout ---
async function initAuthStatus() {
    // --- Get all the elements ---
    const loginButton = document.getElementById('login-nav-button');
    const logoutButton = document.getElementById('logout-nav-button');
    const logoutDialog = document.getElementById('logout-confirm-dialog');
    
    // These elements exist on every page because they are in base.html
    if (!loginButton || !logoutButton || !logoutDialog) return;

    // --- Check login status on page load ---
    try {
        const response = await fetch('/api/status');
        const data = await response.json();

        if (data.logged_in) {
            // User is logged in: show Logout button
            loginButton.classList.add('hidden');
            logoutButton.classList.remove('hidden');
        } else {
            // User is a guest: show Login button
            logoutButton.classList.add('hidden');
            loginButton.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Failed to fetch auth status:", error);
        // Default to showing the login button on error
        logoutButton.classList.add('hidden');
        loginButton.classList.remove('hidden');
    }

    // --- Event Listeners for Logout Flow ---
    logoutButton.addEventListener('click', () => {
        logoutDialog.showModal(); // Use the dialog's built-in method
    });

    // Listen for when the dialog is closed (by any means)
    logoutDialog.addEventListener('close', async () => {
        // .returnValue is set by the button that closed the dialog
        if (logoutDialog.returnValue === 'confirm') {
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                if (response.ok) {
                    // On successful logout, reload the page to reset everything
                    window.location.reload();
                } else {
                    alert("Logout failed. Please try again.");
                }
            } catch (error) {
                alert("Could not connect to the server to log out.");
            }
        }
    });
}