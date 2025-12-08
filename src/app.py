import os
from flask import Flask, render_template

# Initialize the Flask app
# We explicitly tell it where to find the 'template' and 'static' folders
# because they are inside the 'src' folder structure.
app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')

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