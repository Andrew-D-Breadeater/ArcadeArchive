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

# --- Routes ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/game')  # Changed from /game.html
def game():
    return render_template('game.html')

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
    
    # 4. Check if the username already exists
    try:
        user = database.execute(
            'SELECT id FROM users WHERE username = ?', (username,)
        ).fetchone()

        if user is not None:
            return jsonify({'error': f"User {username} is already registered."}), 409 # 409 Conflict

        # 5. If username is new, hash the password and insert the new user
        hashed_password = generate_password_hash(password)
        database.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            (username, hashed_password)
        )
        database.commit()

    except sqlite3.Error as e:
        print(f"Database error: {e}") # Log the actual error on the server
        return jsonify({'error': 'A database error occurred while saving the score.'}), 500

    # 6. Return a success message
    return jsonify({'message': 'User created successfully'}), 201 # 201 Created

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    database = db.get_db()
    
    try:
        user = database.execute(
            'SELECT * FROM users WHERE username = ?', (username,)
        ).fetchone()

        # Check if user exists AND if the password is correct
        if user is None:
            return jsonify({'error': 'Incorrect username or password'}), 401 # 401 Unauthorized
        elif not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Incorrect username or password'}), 401

        # If everything is correct, log them in by setting the session
        session.clear() # Clear any old session data
        session['user_id'] = user['id']
        session['username'] = user['username']

    except sqlite3.Error as e:
        print(f"Database error: {e}") # Log the actual error on the server
        return jsonify({'error': 'A database error occurred while saving the score.'}), 500

    return jsonify({'message': 'Logged in successfully'}), 200 # 200 OK

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