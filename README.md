# ArcadeArchive

![Status](https://img.shields.io/badge/status-in%20progress-yellow)
![Frontend](https://img.shields.io/badge/frontend-vanilla%20js-blue)
![Backend](https://img.shields.io/badge/backend-flask%20(planned)-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

> **:warning: WORK IN PROGRESS :warning:**
>  This repository currently contains the **interface**. The site is fully functional and connected to backend, but has no games. The project is not yet in a playable state.

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

You can run the application using either **Docker** (recommended for a zero-setup experience) or a local **Python** environment.

### Prerequisites
*   **Git**
*   **Docker Desktop** (for Option 1)
*   *OR* **Python 3.11+** (for Option 2)

### Option 1: Docker (Recommended)

This method requires no local Python installation.

1.  **Clone the repository**
    ```sh
    git clone https://github.com/Andrew-D-Breadeater/ArcadeArchive.git
    cd ArcadeArchive
    ```

2.  **Start the server**
    ```sh
    docker compose up -d
    ```

3.  **Initialize the Database** (Only required the first time)
    ```sh
    docker compose run --rm web python src/init_db.py
    ```

4.  **Play!**
    Open [http://localhost:5000](http://localhost:5000) in your browser.

---

### Option 2: Local Python Setup

1.  **Clone the repository**
    ```sh
    git clone https://github.com/Andrew-D-Breadeater/ArcadeArchive.git
    cd ArcadeArchive
    ```

2.  **Set up the Virtual Environment**
    ```sh
    # Create venv
    python -m venv .venv

    # Activate venv (Linux/macOS)
    source .venv/bin/activate
    
    # Activate venv (Windows)
    .venv\Scripts\activate
    ```

3.  **Install Dependencies**
    ```sh
    pip install -r requirements.txt
    ```

4.  **Initialize the Database**
    ```sh
    python src/init_db.py
    ```

5.  **Run the Server**
    ```sh
    python src/app.py
    ```
    Open [http://localhost:5000](http://localhost:5000) in your browser.
    
## Features (not all implemented yet)

- [x] **Implement Backend:** Build the Flask server and SQLite database.
- [ ] **Implement Games:** Code the actual games (Pong, Snake, etc.) with Kaboom.js.
- [x] **Connect Frontend & Backend:** Replace all mock data with real API calls.
- [ ] **Add User Profile Pages:** Create pages for users to see their stats.

## License

Distributed under the MIT License. See `LICENSE` for more information.
