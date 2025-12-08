import sqlite3
import os
from flask import g

# Path to the database file (avoids hardcoding it)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
DB_PATH = os.path.join(PROJECT_ROOT, 'instance', 'database.db')

def get_db():
    """
    Opens a new database connection if there is none for the current request.
    The connection is stored in Flask's `g` object.
    """
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        # Allows us to access columns by name (e.g., row['score'])
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    """Closes the database connection at the end of the request."""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_app(app):
    """Register the close_db function and a CLI command with the Flask app."""
    # Tells Flask to call close_db when cleaning up after a request
    app.teardown_appcontext(close_db)