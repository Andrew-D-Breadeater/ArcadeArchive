import sqlite3
import os

# 1. Define paths so the script runs correctly from anywhere
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # The 'src' folder
PROJECT_ROOT = os.path.dirname(BASE_DIR)              # The project root
INSTANCE_FOLDER = os.path.join(PROJECT_ROOT, 'instance')
DB_PATH = os.path.join(INSTANCE_FOLDER, 'database.db')
SCHEMA_PATH = os.path.join(BASE_DIR, 'schema.sql')

def init_db():
    print("--- Initializing Database ---")
    
    # 2. Create the 'instance' folder if it doesn't exist
    if not os.path.exists(INSTANCE_FOLDER):
        os.makedirs(INSTANCE_FOLDER)
        print(f"Created folder: {INSTANCE_FOLDER}")

    # 3. Connect to (or create) the database file
    connection = sqlite3.connect(DB_PATH)
    
    # 4. Read and execute the SQL instructions
    with open(SCHEMA_PATH) as f:
        connection.executescript(f.read())

    connection.commit()
    connection.close()
    
    print(f"Database created successfully at: {DB_PATH}")

if __name__ == '__main__':
    init_db()