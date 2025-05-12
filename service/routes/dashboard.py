from flask import Blueprint, jsonify
from datetime import date
from utils.db import get_db_connection

dashboard_bp = Blueprint('dashboard', __name__)

def format_machine_data(row, columns):
    formatted = {}
    type_map = {
        'machine_id': int,
        'machine_model_id': int,
        'machine_type_id': int
    }
    for col, value in zip(columns, row):
        if col in type_map:
            formatted[col] = type_map[col](value)
        elif isinstance(value, date):
            formatted[col] = value.strftime('%Y-%m-%d')
        else:
            formatted[col] = value
    return formatted

@dashboard_bp.route('/machines', methods=['GET'])
def get_all_machines():
    """Get all machines with proper CSV-style formatting"""
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

        return jsonify({"machines": machines})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()