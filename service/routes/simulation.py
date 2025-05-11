from flask import Blueprint, request, jsonify
from utils.db import get_db_connection
from models.maintenance_predictor import MaintenancePredictor
import pandas as pd

simulation_bp = Blueprint('simulation', __name__)

# Load AI model
predictor = MaintenancePredictor()

@simulation_bp.route('/simulate', methods=['POST'])
def simulate():
    """Fetch data from sensor_data and run predictions."""
    try:
        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch the latest sensor data
        query = """
        SELECT * FROM sensor_data
        ORDER BY timestamp DESC
        LIMIT 100
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        # Convert to a Pandas DataFrame
        columns = [desc[0] for desc in cursor.description]
        sensor_data = pd.DataFrame(rows, columns=columns)

        # Run predictions
        predictions = predictor.predict(sensor_data)

        # Close the connection
        cursor.close()
        conn.close()

        # Return predictions
        return jsonify(predictions.to_dict(orient='records'))
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
