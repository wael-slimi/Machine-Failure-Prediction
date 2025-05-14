from flask import Blueprint, jsonify
from utils.db import get_db_connection

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/machines', methods=['GET'])
def get_machines():
    """Get all machines."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch all machines
        query = """
        SELECT * FROM machines
        ORDER BY machine_id
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        # Convert to list of dictionaries
        columns = [desc[0] for desc in cursor.description]
        machines = []
        for row in rows:
            machine = dict(zip(columns, row))
            # Convert date to string for JSON serialization
            if 'installation_date' in machine:
                machine['installation_date'] = machine['installation_date'].isoformat()
            machines.append(machine)

        cursor.close()
        conn.close()

        return jsonify({'machines': machines})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dashboard_bp.route('/machines/<int:machine_id>', methods=['GET'])
def get_machine(machine_id):
    """Get a specific machine by ID."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch the machine
        query = """
        SELECT * FROM machines
        WHERE machine_id = %s
        """
        cursor.execute(query, (machine_id,))
        row = cursor.fetchone()

        if not row:
            return jsonify({'status': 'error', 'message': 'Machine not found'}), 404

        # Convert to dictionary
        columns = [desc[0] for desc in cursor.description]
        machine = dict(zip(columns, row))
        
        # Convert date to string for JSON serialization
        if 'installation_date' in machine:
            machine['installation_date'] = machine['installation_date'].isoformat()

        cursor.close()
        conn.close()

        return jsonify(machine)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500