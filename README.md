# ArcadeArchive

![Status](https://img.shields.io/badge/status-in%20progress-yellow)
![Frontend](https://img.shields.io/badge/frontend-vanilla%20js-blue)
![Backend](https://img.shields.io/badge/backend-flask%20(planned)-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

> **:warning: WORK IN PROGRESS :warning:**
> This repository currently contains the **frontend shell only**. The user interface is functional, but it is not yet connected to a backend. All data (scores, leaderboards) is mock data. The project is not yet in a playable state.

A web-based collection of classic arcade games built with Python, Flask, and vanilla JavaScript. This is an educational project focused on demonstrating a full-stack web application from the ground up.

![Screenshot of ArcadeArchive Game Lobby](/DesignDocuments/DocImages/frontpageScreenshot.png)

---

## About The Project

This project was built as a hands-on learning exercise to cover the entire lifecycle of a modern web application. It features a distinct frontend and backend, user authentication, and dynamic, data-driven UI components, all without relying on heavy frontend frameworks like React or Vue.

## Core Features (Target)

*   **Guest Gameplay:** Play any game instantly without an account.
*   **User Accounts:** Register and log in to save your progress.
*   **Persistent Leaderboards:** See how your best scores stack up against others.
*   **Personal Score History:** Track your own performance for each game.
*   **Responsive Design:** Playable on both desktop and mobile devices.

## Built With

*   **Frontend:**
    *   HTML5
    *   CSS3 (with variables)
    *   Vanilla JavaScript (ES6+)
*   **Backend (Planned):**
    *   Python 3 / Flask
*   **Database (Planned):**
    *   SQLite
*   **Game Engine (Planned):**
    *   Kaboom.js

## Getting Started

Currently, you can run the frontend shell to explore the user interface.

### Running the Frontend Shell

1.  **Clone the repo**
    ```sh
    git clone https://github.com/Andrew-D-Breadeater/ArcadeArchive.git
    ```
2.  **Navigate into the project directory**
    ```sh
    cd ArcadeArchive/frontend
    ```
3.  **Open the main page**
    Simply open the `index.html` file in your favorite web browser.

> Backend setup instructions will be added here once the backend is developed. A Docker setup may be provided to simplify this process in the future.

## Future Features

- [ ] **Implement Backend:** Build the Flask server and SQLite database.
- [ ] **Implement Games:** Code the actual games (Pong, Snake, etc.) with Kaboom.js.
- [ ] **Connect Frontend & Backend:** Replace all mock data with real API calls.
- [ ] **Add User Profile Pages:** Create pages for users to see their stats.

## License

Distributed under the MIT License. See `LICENSE` for more information.
