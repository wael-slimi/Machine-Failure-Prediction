from flask import Blueprint, request, jsonify
from utils.db import get_db_connection
from models.maintenance_predictor import MaintenancePredictor
import pandas as pd
import numpy as np
from datetime import datetime

simulation_bp = Blueprint('simulation', __name__)

# Load AI model
predictor = MaintenancePredictor()

def get_prediction_status(prediction):
    """Convert prediction value to status and recommendation."""
    if prediction >= 0.9:
        return "CRITICAL", "Immediate maintenance required"
    elif prediction >= 0.7:
        return "HIGH", "Schedule maintenance soon"
    elif prediction >= 0.4:
        return "MEDIUM", "Monitor closely"
    else:
        return "LOW", "No immediate action needed"

@simulation_bp.route('/simulate', methods=['POST'])
def simulate():
    """Run predictions for the specified machine."""
    try:
        # Get machine ID from request
        data = request.get_json()
        if not data or 'machine_id' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Machine ID is required'
            }), 400

        machine_id = data['machine_id']

        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch the latest sensor data for the specified machine
        query = """
        SELECT * FROM sensor_data
        WHERE machine_id = %s
        ORDER BY timestamp DESC
        LIMIT 100
        """
        cursor.execute(query, (machine_id,))
        rows = cursor.fetchall()

        if not rows:
            return jsonify({
                'status': 'error',
                'message': f'No sensor data found for machine {machine_id}'
            }), 404

        # Get the latest timestamp from the data
        latest_timestamp = rows[0][1] if rows else datetime.now()

        # Convert to a Pandas DataFrame
        columns = [desc[0] for desc in cursor.description]
        sensor_data = pd.DataFrame(rows, columns=columns)

        # Update feature_columns to include all 28 features expected by the model
        feature_columns = [
            'temperature', 'vibration', 'load', 'cycle_time', 'power_consumption',
            'humidity', 'temperature_external', 'power_fluctuation',
            'working_hours', 'error_code', 'experience_years', 'shift',
            'session_start', 'session_end', 'maintenance_status', 'maintenance_duration',
            'interaction_count', 'recent_changes', 'machine_type', 'machine_model',
            'brand', 'installation_date', 'active', 'environment_id', 'session_id',
            'interaction_id', 'maintenance_task_id', 'maintenance_template_id'
        ]

        # Ensure all selected columns are present in the DataFrame
        for col in feature_columns:
            if col not in sensor_data.columns:
                sensor_data[col] = 0  # Add missing columns with default value 0

        # Select and preprocess the relevant columns
        sensor_data = sensor_data[feature_columns].apply(pd.to_numeric, errors='coerce')

        # Convert Decimal objects to float
        sensor_data = sensor_data.astype(float)

        # Handle missing values by filling with 0
        sensor_data = sensor_data.fillna(0)

        # Debugging logs
        print("Machine ID: " + str(machine_id))
        print("Data types:", sensor_data.dtypes)
        print("First few rows:", sensor_data.head())
        print("Input shape:", sensor_data.shape)

        # Convert to NumPy array and ensure correct data type
        sensor_data = sensor_data.to_numpy(dtype='float32')

        # Ensure the data has 28 features by padding or truncating columns
        required_features = 28
        if sensor_data.shape[1] < required_features:
            padding = required_features - sensor_data.shape[1]
            sensor_data = np.pad(sensor_data, ((0, 0), (0, padding)), mode='constant')
        elif sensor_data.shape[1] > required_features:
            sensor_data = sensor_data[:, :required_features]

        # Ensure the data has 24 time steps by padding or truncating rows
        required_timesteps = 24
        if sensor_data.shape[0] < required_timesteps:
            padding = required_timesteps - sensor_data.shape[0]
            sensor_data = np.pad(sensor_data, ((0, padding), (0, 0)), mode='constant')
        elif sensor_data.shape[0] > required_timesteps:
            sensor_data = sensor_data[:required_timesteps, :]

        # Reshape the data to match the model's expected input shape
        sensor_data = sensor_data.reshape((1, required_timesteps, required_features))

        # Run predictions
        predictions = predictor.predict(sensor_data)

        # Close the connection
        cursor.close()
        conn.close()

        # Process predictions and add additional information
        response_data = []
        for pred in predictions.to_dict(orient='records'):
            prediction_value = pred['prediction']
            status, recommendation = get_prediction_status(prediction_value)
            
            response_data.append({
                'machine_id': machine_id,
                'timestamp': latest_timestamp.isoformat(),
                'prediction': prediction_value,
                'status': status,
                'recommendation': recommendation,
                'confidence': round(prediction_value * 100, 2),
                'details': {
                    'temperature': float(sensor_data[0, -1, 0]),
                    'vibration': float(sensor_data[0, -1, 1]),
                    'load': float(sensor_data[0, -1, 2]),
                    'cycle_time': float(sensor_data[0, -1, 3]),
                    'power_consumption': float(sensor_data[0, -1, 4])
                }
            })

        return jsonify(response_data)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@simulation_bp.route('/data/<int:machine_id>', methods=['GET', 'OPTIONS'])
def get_sensor_data(machine_id):
    """Get sensor data for a specific machine."""
    if request.method == 'OPTIONS':
        return '', 204

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch the latest sensor data for the specified machine with all required features
        query = """
        WITH latest_data AS (
            SELECT 
                sd.machine_id,
                sd.timestamp,
                sd.temperature,
                sd.vibration,
                sd.load,
                sd.cycle_time,
                sd.power_consumption,
                sd.error_code,
                ei.humidity,
                ei.temperature_external,
                ei.power_fluctuation,
                muh.working_hours,
                COALESCE(hi.experience_years, 0) as experience_years,
                COALESCE(si.shift, '0') as shift,
                EXTRACT(EPOCH FROM si.session_start) as session_start,
                EXTRACT(EPOCH FROM si.session_end) as session_end,
                COALESCE(mt.maintenance_status_id, 0) as maintenance_status,
                COALESCE(EXTRACT(EPOCH FROM (mt.finished_at - mt.started_at)), 0) as maintenance_duration,
                COALESCE(COUNT(hi.interaction_id), 0) as interaction_count,
                COALESCE(EXTRACT(EPOCH FROM rc.updated_at), 0) as recent_changes,
                COALESCE(m.machine_type_id, 0) as machine_type,
                COALESCE(mm.machine_model_id, 0) as machine_model,
                COALESCE(mp.brand, '0') as brand,
                COALESCE(EXTRACT(EPOCH FROM m.installation_date), 0) as installation_date,
                COALESCE(m.working::int, 0) as active,
                COALESCE(ei.environment_id, 0) as environment_id,
                COALESCE(si.session_id, 0) as session_id,
                COALESCE(hi.interaction_id, 0) as interaction_id,
                COALESCE(mt.maintenance_task_id, 0) as maintenance_task_id,
                COALESCE(mt.maintenance_template_id, 0) as maintenance_template_id
            FROM sensor_data sd
            LEFT JOIN environmental_info ei ON sd.machine_id = ei.machine_id AND ei.timestamp = sd.timestamp
            LEFT JOIN machine_usage_history muh ON sd.machine_id = muh.machine_id AND muh.timestamp = sd.timestamp::date
            LEFT JOIN human_interaction hi ON sd.machine_id = hi.machine_id
            LEFT JOIN session_info si ON sd.machine_id = si.machine_id AND si.session_start <= sd.timestamp AND (si.session_end IS NULL OR si.session_end >= sd.timestamp)
            LEFT JOIN maintenance_tasks mt ON sd.machine_id = mt.machine_id AND mt.started_at <= sd.timestamp AND (mt.finished_at IS NULL OR mt.finished_at >= sd.timestamp)
            LEFT JOIN recent_changes rc ON sd.machine_id = rc.machine_id
            LEFT JOIN machines m ON sd.machine_id = m.machine_id
            LEFT JOIN machine_models mm ON m.machine_model_id = mm.machine_model_id
            LEFT JOIN machine_properties mp ON m.machine_id = mp.machine_id
            WHERE sd.machine_id = %s
            GROUP BY 
                sd.machine_id, sd.timestamp, sd.temperature, sd.vibration, sd.load,
                sd.cycle_time, sd.power_consumption, sd.error_code, ei.humidity, 
                ei.temperature_external, ei.power_fluctuation, muh.working_hours,
                hi.experience_years, si.shift, si.session_start, si.session_end,
                mt.maintenance_status_id, mt.finished_at, mt.started_at, rc.updated_at,
                m.machine_type_id, mm.machine_model_id, mp.brand, m.installation_date,
                m.working, ei.environment_id, si.session_id, hi.interaction_id,
                mt.maintenance_task_id, mt.maintenance_template_id
            ORDER BY sd.timestamp DESC
            LIMIT 100
        )
        SELECT * FROM latest_data
        """
        cursor.execute(query, (machine_id,))
        rows = cursor.fetchall()

        if not rows:
            return jsonify([]), 200  # Return empty array instead of error

        # Convert to a list of dictionaries
        columns = [desc[0] for desc in cursor.description]
        sensor_data = []
        for row in rows:
            data_point = {}
            for col, value in zip(columns, row):
                if isinstance(value, datetime):
                    data_point[col] = value.isoformat()
                elif isinstance(value, (int, float)):
                    data_point[col] = float(value)
                else:
                    data_point[col] = value
            sensor_data.append(data_point)

        # Return the array directly
        return jsonify(sensor_data)

    except Exception as e:
        print(f"Error fetching sensor data: {str(e)}")  # Add logging
        return jsonify([]), 200  # Return empty array on error
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
