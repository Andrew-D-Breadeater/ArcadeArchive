import os
from flask import Flask, render_template, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from . import db


# Initialize the Flask app
app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')

# Configure the app
app.config['SECRET_KEY'] = 'dev_super_secret_key_change_in_production'

db.init_app(app) # Initialize the database with the app

# --- Helper Functions ---

def transfer_guest_scores_to_user(user_id):
    """
    Checks for scores in the session and saves them to the database for the user.
    """
    guest_scores = session.get('guest_scores', [])
    if not guest_scores:
        return # Do nothing if there are no guest scores

    database = db.get_db()
    try:
        for score_data in guest_scores:
            database.execute(
                'INSERT INTO score_history (user_id, game_name, score) VALUES (?, ?, ?)',
                (user_id, score_data['game_name'], score_data['score'])
            )
        database.commit()
        # Clear the guest scores from the session now that they are saved
        session.pop('guest_scores', None)
        print(f"Transferred {len(guest_scores)} guest scores to user_id {user_id}")
    except sqlite3.Error as e:
        print(f"Database error during guest score transfer: {e}")

GAMES = [
    {
        'id': 'pong',
        'name': 'Pong',
        'description': 'A classic paddle game.'
    },
    {
        'id': 'snake',
        'name': 'Snake',
        'description': "Don't eat your own tail!"
    },
    {
        'id': 'tetris',
        'name': 'Tetris',
        'description': 'Clear the lines.'
    },
    {
        'id': 'sokoban',
        'name': 'Sokoban',
        'description': 'Push the boxes to their places.'
    }
]

#---ROUTES---

# --- HTML Page Routes ---

@app.route('/')
def index():
    """Serves the main game lobby."""
    # Pass the list of games to the template
    return render_template('index.html', games=GAMES)

@app.route('/game')  # Changed from /game.html
def game():
    # Get the game name from the URL parameter
    game_name = request.args.get('game', 'Unknown')
    # Capitalize it for a nice title
    page_title = game_name.capitalize()
    
    # Pass the title to the template
    return render_template('game.html', title=page_title)

@app.route('/leaderboard') # Changed from /leaderboard.html
def leaderboard():
    return render_template('leaderboard.html')

@app.route('/about') # Changed from /about.html
def about():
    return render_template('about.html')

@app.route('/auth') # Changed from /auth.html
def auth():
    return render_template('auth.html')

# --- API Routes ---
#--- User Registration, Login, Logout, Status ---

@app.route('/api/register', methods=['POST'])
def register():
    # 1. Get the data from the frontend's request
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # 2. Basic Validation
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    # 3. Connect to the database
    database = db.get_db()
    
    try:
        # Check if user already exists
        if database.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone() is not None:
            return jsonify({'error': f"User {username} is already registered."}), 409

        # Insert new user
        hashed_password = generate_password_hash(password)
        cursor = database.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            (username, hashed_password)
        )
        database.commit()
        
        # Get the ID of the user we just created
        new_user_id = cursor.lastrowid
        
        # Log the new user in automatically
        session['user_id'] = new_user_id
        session['username'] = username
        
        # Transfer any guest scores
        transfer_guest_scores_to_user(new_user_id)
        
    except sqlite3.Error as e:
        print(f"Database error on register: {e}")
        return jsonify({'error': 'A database error occurred.'}), 500

    return jsonify({
        'message': 'User created and logged in successfully',
        'user': {'id': new_user_id, 'username': username}
    }), 201


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    database = db.get_db()
    
    try:
        user = database.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()

        if user is None or not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Incorrect username or password'}), 401

        # Log the user in
        session['user_id'] = user['id']
        session['username'] = user['username']

        # Transfer any guest scores
        transfer_guest_scores_to_user(user['id'])

    except sqlite3.Error as e:
        print(f"Database error on login: {e}")
        return jsonify({'error': 'A database error occurred.'}), 500

    return jsonify({
        'message': 'Logged in successfully',
        'user': {'id': user['id'], 'username': user['username']}
    }), 200

@app.route('/api/logout', methods=['POST'])
def logout():
    # The session.clear() function removes all data from the session
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/status', methods=['GET'])
def status():
    # We check if 'user_id' exists in the session dictionary.
    if 'user_id' in session:
        # If it exists, the user is logged in. Send back their info.
        return jsonify({
            'logged_in': True,
            'user_id': session['user_id'],
            'username': session['username']
        }), 200
    else:
        # If not, they are a guest.
        return jsonify({'logged_in': False}), 200

#--- Game Score Submission and Leaderboard api ---

#---Guest user routes ---

@app.route('/api/session-score', methods=['POST'])
def add_session_score():
    """
    Temporarily saves a score to the session for a guest user.
    """
    data = request.get_json()
    game_name = data.get('game_name')
    score = data.get('score')

    # Basic validation
    if not game_name or score is None or not isinstance(score, int) or score < 0:
        return jsonify({'error': 'Invalid score data provided'}), 400

    # 1. Get the existing guest scores list from the session.
    #    If it doesn't exist, default to an empty list.
    guest_scores = session.get('guest_scores', [])
    
    # 2. Add the new score
    guest_scores.append({
        'game_name': game_name,
        'score': score
    })

    # 3. Save the updated list back into the session
    session['guest_scores'] = guest_scores

    # Let the frontend know how many scores are saved
    return jsonify({
        'message': 'Guest score saved to session',
        'guest_score_count': len(guest_scores)
    }), 200
    
@app.route('/api/guest-personal-scores/<string:game_name>', methods=['GET'])
def get_guest_personal_scores(game_name):
    """
    Retrieves scores from the session for a specific game for a guest user.
    """
    guest_scores = session.get('guest_scores', [])
    
    # Filter the list to only include scores for the requested game
    scores_for_game = [
        score for score in guest_scores 
        if score['game_name'] == game_name
    ]
    
    # We can add a played_at timestamp here for consistency with the real API
    # This isn't strictly necessary but makes the frontend logic identical.
    from datetime import datetime
    for score in scores_for_game:
        score['played_at'] = datetime.utcnow().isoformat() + 'Z'

    return jsonify(scores_for_game), 200

#---Autorized user routes ---

@app.route('/api/submit-score', methods=['POST'])
def submit_score():
    # 1. Check if the user is logged in
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401

    # 2. Get the data from the request
    data = request.get_json()
    game_name = data.get('game_name')
    score = data.get('score')

    # 3. Validate the incoming data
    if not game_name or score is None:
        return jsonify({'error': 'game_name and score are required'}), 400
    
    if not isinstance(score, int) or score < 0:
        return jsonify({'error': 'Score must be a non-negative integer'}), 400

    # 4. Get the user ID from the session and insert into the database
    user_id = session['user_id']
    database = db.get_db()

    try:
        database.execute(
            'INSERT INTO score_history (user_id, game_name, score) VALUES (?, ?, ?)',
            (user_id, game_name, score)
        )
        database.commit()
    except sqlite3.Error as e:
        print(f"Database error: {e}") # Log the actual error on the server
        return jsonify({'error': 'A database error occurred while saving the score.'}), 500

    return jsonify({'message': 'Score submitted successfully'}), 201

@app.route('/api/leaderboard/<string:game_name>', methods=['GET'])
def get_leaderboard(game_name):
    
    # We can add a limit to our query, defaulting to 10
    # Example: /api/leaderboard/pong?limit=20
    limit = request.args.get('limit', 10, type=int)

    database = db.get_db()

    try:
        # Query our leaderboard VIEW, not the history table.
        # We join with the users table to get the actual username.
        scores = database.execute(
            """
            SELECT u.username, l.best_score
            FROM leaderboard l
            JOIN users u ON l.user_id = u.id
            WHERE l.game_name = ?
            ORDER BY l.best_score DESC
            LIMIT ?
            """,
            (game_name, limit)
        ).fetchall()

        # Convert the list of Row objects to a list of dictionaries
        leaderboard_data = [dict(row) for row in scores]

    except sqlite3.Error as e:
        print(f"Database error on leaderboard fetch: {e}")
        return jsonify({'error': 'A database error occurred.'}), 500

    return jsonify(leaderboard_data), 200

@app.route('/api/personal-scores/<string:game_name>', methods=['GET'])
def get_personal_scores(game_name):
    # 1. Check if the user is logged in
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
        
    user_id = session['user_id']
    database = db.get_db()

    try:
        # We query the full score_history table, not the leaderboard view,
        # because we want to see ALL of the user's past attempts.
        scores = database.execute(
            """
            SELECT score, played_at
            FROM score_history
            WHERE user_id = ? AND game_name = ?
            ORDER BY played_at DESC
            """,
            (user_id, game_name)
        ).fetchall()

        personal_scores_data = [dict(row) for row in scores]

    except sqlite3.Error as e:
        print(f"Database error on personal scores fetch: {e}")
        return jsonify({'error': 'A database error occurred.'}), 500

    return jsonify(personal_scores_data), 200

# --- Main Entry Point ---

if __name__ == '__main__':
    # Check if the environment variable exists
    if os.environ.get('DOCKER_CONTAINER') == 'true':
        host_ip = '0.0.0.0'
        print("Running in Docker mode (0.0.0.0)")
    else:
        host_ip = '127.0.0.1'
        print("Running in Local mode (127.0.0.1)")

    app.run(host=host_ip, port=5000, debug=True)