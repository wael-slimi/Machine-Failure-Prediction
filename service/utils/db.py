import psycopg2

DB_PARAMS = {
    'dbname': 'machine_monitoring',
    'user': 'admin',
    'password': 'secret',
    'host': 'localhost',
    'port': '5432'
}

def get_db_connection():
    """Create a connection to the PostgreSQL database."""
    return psycopg2.connect(
        dbname=DB_PARAMS['dbname'],
        user=DB_PARAMS['user'],
        password=DB_PARAMS['password'],
        host=DB_PARAMS['host'],
        port=DB_PARAMS['port']
    )
