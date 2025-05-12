from flask import Blueprint, jsonify, request
from datetime import date
from utils.db import get_db_connection

dashboard_bp = Blueprint('dashboard', __name__)

def format_machine_data(row, columns):
    formatted = {}
    type_map = {
        'machine_id': int,
        'machine_model_id': int,
        'machine_type_id': int,
        'working': bool
    }
    for col, value in zip(columns, row):
        if col in type_map:
            formatted[col] = type_map[col](value)
        elif isinstance(value, date):
            formatted[col] = value.strftime('%Y-%m-%d')
        else:
            formatted[col] = value
    return formatted

@dashboard_bp.route('/machines', methods=['GET', 'OPTIONS'])
def get_all_machines():
    """Get all machines with proper formatting"""
    if request.method == 'OPTIONS':
        # Handle preflight request
        return '', 204

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                machine_id,
                machine_label,
                machine_model_id,
                machine_type_id,
                box_macaddress::text,  -- Convert macaddr to string
                installation_date,
                working
            FROM machines
            ORDER BY machine_id
        """)
        
        columns = [desc[0] for desc in cursor.description]
        machines = [format_machine_data(row, columns) for row in cursor.fetchall()]

        # Return machines directly as an array
        return jsonify(machines)

    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "Failed to fetch machines"
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@dashboard_bp.route('/machines/<int:machine_id>', methods=['GET', 'OPTIONS'])
def get_machine(machine_id):
    """Get a specific machine by ID"""
    if request.method == 'OPTIONS':
        return '', 204

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT 
                machine_id,
                machine_label,
                machine_model_id,
                machine_type_id,
                box_macaddress::text,
                installation_date,
                working
            FROM machines
            WHERE machine_id = %s
        """, (machine_id,))
        
        row = cursor.fetchone()
        if not row:
            return jsonify({
                "error": "Machine not found",
                "message": f"No machine found with ID {machine_id}"
            }), 404

        columns = [desc[0] for desc in cursor.description]
        machine = format_machine_data(row, columns)

        return jsonify(machine)

    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": f"Failed to fetch machine {machine_id}"
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()