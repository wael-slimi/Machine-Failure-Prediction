from flask import Blueprint, jsonify
from utils.db import get_db_connection

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/machines', methods=['GET'])
def get_machines_dashboard():
    """Fetch all machine data with latest sensor readings for the dashboard."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query to fetch machine details and latest sensor data
        query = """
        SELECT 
            m.machine_id, 
            m.machine_label, 
            mm.model AS machine_model, 
            mm.brand, 
            b.box_macaddress,
            m.installation_date, 
            m.working AS is_active,
            sd.temperature,
            sd.vibration,
            sd.load,
            sd.error_code,
            sd.timestamp AS last_reading_time
        FROM machines m
        JOIN machine_models mm ON m.machine_model_id = mm.machine_model_id
        JOIN boxes b ON m.box_macaddress = b.box_macaddress
        LEFT JOIN (
            SELECT DISTINCT ON (machine_id) *
            FROM sensor_data
            ORDER BY machine_id, timestamp DESC
        ) sd ON m.machine_id = sd.machine_id
        ORDER BY m.machine_id;
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        
        # Convert rows to list of dictionaries
        columns = [desc[0] for desc in cursor.description]
        machines = [dict(zip(columns, row)) for row in rows]

        cursor.close()
        conn.close()

        return jsonify(machines)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500