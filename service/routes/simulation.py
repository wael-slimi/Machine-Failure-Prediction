from flask import Blueprint, request, jsonify, Response
from utils.db import get_db_connection
from models.maintenance_predictor import MaintenancePredictor
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import time

simulation_bp = Blueprint('simulation', __name__)

# Load AI model
predictor = MaintenancePredictor()

# Store simulation state
simulation_state = {
    'current_timestamp': None,
    'is_running': False
}

def generate_sensor_data_stream(machine_id):
    """Generate a stream of sensor data for a specific machine."""
    while True:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # Fetch the latest sensor data for the specified machine
            query = """
            SELECT 
                sd.timestamp,
                sd.temperature,
                sd.vibration,
                sd.load,
                sd.power_consumption
            FROM sensor_data sd
            WHERE sd.machine_id = %s
            ORDER BY sd.timestamp DESC
            LIMIT 1
            """
            cursor.execute(query, (machine_id,))
            row = cursor.fetchone()

            if row:
                # Convert to dictionary
                columns = [desc[0] for desc in cursor.description]
                data = dict(zip(columns, row))
                
                # Convert datetime to string for JSON serialization
                if 'timestamp' in data:
                    data['timestamp'] = data['timestamp'].isoformat()
                
                # Yield the data in SSE format
                yield f"data: {json.dumps(data)}\n\n"
            
            cursor.close()
            conn.close()
            
            # Wait for 5 seconds before next update
            time.sleep(5)
            
        except Exception as e:
            print(f"Error in sensor data stream: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            time.sleep(5)

@simulation_bp.route('/sensor-stream/<int:machine_id>', methods=['GET'])
def stream_sensor_data(machine_id):
    """Stream real-time sensor data for a specific machine."""
    return Response(
        generate_sensor_data_stream(machine_id),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )

@simulation_bp.route('/data/<int:machine_id>', methods=['GET', 'OPTIONS'])
def get_sensor_data(machine_id):
    """Get sensor data for a specific machine."""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch the latest sensor data for the specified machine
        query = """
        SELECT 
            sd.machine_id,
            sd.timestamp,
            sd.temperature,
            sd.vibration,
            sd.load,
            sd.cycle_time,
            sd.power_consumption,
            ei.humidity,
            ei.temperature_external,
            ei.power_fluctuation,
            muh.working_hours,
            sd.error_code,
            hi.experience_years,
            si.shift,
            si.session_start,
            si.session_end,
            mt.maintenance_status_id,
            mt.finished_at - mt.started_at AS maintenance_duration,
            COUNT(hi.interaction_id) AS interaction_count,
            rc.updated_at AS recent_changes,
            m.machine_type_id AS machine_type,
            mm.model AS machine_model,
            mp.brand,
            m.installation_date,
            m.working AS active,
            ei.environment_id,
            si.session_id,
            hi.interaction_id,
            mt.maintenance_task_id,
            mt.maintenance_template_id
        FROM sensor_data sd
        LEFT JOIN environmental_info ei ON sd.machine_id = ei.machine_id
        LEFT JOIN machine_usage_history muh ON sd.machine_id = muh.machine_id
        LEFT JOIN human_interaction hi ON sd.machine_id = hi.machine_id
        LEFT JOIN session_info si ON sd.machine_id = si.machine_id
        LEFT JOIN maintenance_tasks mt ON sd.machine_id = mt.machine_id
        LEFT JOIN recent_changes rc ON sd.machine_id = rc.machine_id
        LEFT JOIN machines m ON sd.machine_id = m.machine_id
        LEFT JOIN machine_models mm ON m.machine_model_id = mm.machine_model_id
        LEFT JOIN machine_properties mp ON m.machine_id = mp.machine_id
        WHERE sd.machine_id = %s
        GROUP BY 
            sd.machine_id, sd.timestamp, sd.temperature, sd.vibration, sd.load,
            sd.cycle_time, sd.power_consumption, ei.humidity, ei.temperature_external,
            ei.power_fluctuation, muh.working_hours, sd.error_code, hi.experience_years,
            si.shift, si.session_start, si.session_end, mt.maintenance_status_id,
            mt.finished_at, mt.started_at, rc.updated_at, m.machine_type_id,
            mm.model, mp.brand, m.installation_date, m.working, ei.environment_id,
            si.session_id, hi.interaction_id, mt.maintenance_task_id,
            mt.maintenance_template_id
        ORDER BY sd.timestamp DESC
        LIMIT 20
        """
        cursor.execute(query, (machine_id,))
        rows = cursor.fetchall()

        # Convert to list of dictionaries
        columns = [desc[0] for desc in cursor.description]
        sensor_data = []
        for row in rows:
            data_point = dict(zip(columns, row))
            # Convert datetime to string for JSON serialization
            if 'timestamp' in data_point:
                data_point['timestamp'] = data_point['timestamp'].isoformat()
            sensor_data.append(data_point)

        # Close the connection
        cursor.close()
        conn.close()

        return jsonify(sensor_data)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@simulation_bp.route('/stream')
def stream_predictions():
    """Stream predictions in real-time."""
    def generate():
        try:
            # Connect to the database
            conn = get_db_connection()
            cursor = conn.cursor()

            # Get the earliest timestamp for machine 5000
            query = """
            SELECT MIN(timestamp) as start_time
            FROM sensor_data
            WHERE machine_id = 5000
            """
            cursor.execute(query)
            start_time = cursor.fetchone()[0]
            current_time = start_time

            while True:
                # Fetch data for the current hour
                query = """
                SELECT * FROM sensor_data
                WHERE machine_id = 5000
                AND timestamp = %s
                """
                cursor.execute(query, (current_time,))
                row = cursor.fetchone()

                if not row:
                    break

                # Convert row to dictionary
                columns = [desc[0] for desc in cursor.description]
                sensor_data = dict(zip(columns, row))

                # Prepare data for prediction
                feature_columns = [
                    'temperature', 'vibration', 'load', 'cycle_time', 'power_consumption',
                    'feature_6', 'feature_7', 'feature_8', 'feature_9', 'feature_10',
                    'feature_11', 'feature_12', 'feature_13', 'feature_14', 'feature_15',
                    'feature_16', 'feature_17', 'feature_18', 'feature_19', 'feature_20',
                    'feature_21', 'feature_22', 'feature_23', 'feature_24', 'feature_25',
                    'feature_26', 'feature_27', 'feature_28'
                ]

                # Create a DataFrame with the current data point
                df = pd.DataFrame([sensor_data])
                
                # Add missing features with default values
                for col in feature_columns:
                    if col not in df.columns:
                        df[col] = 0

                # Convert to numeric and handle missing values
                df = df[feature_columns].apply(pd.to_numeric, errors='coerce').fillna(0)

                # Convert to NumPy array
                data = df.to_numpy(dtype='float32')

                # Reshape for the model (1 timestep, 28 features)
                data = data.reshape((1, 1, 28))

                # Run prediction
                prediction = predictor.predict(data)

                # Yield the prediction
                yield f"data: {json.dumps({'prediction': prediction.to_dict(orient='records')[0]})}\n\n"

                # Move to next hour
                current_time += timedelta(hours=1)

                # Wait for 1 second before next prediction
                time.sleep(1)

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    return Response(generate(), mimetype='text/event-stream')

@simulation_bp.route('/simulate', methods=['POST'])
def simulate():
    """Simulate streaming historical data for machine 5000."""
    try:
        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor()

        # If simulation is not running, start from the beginning
        if not simulation_state['is_running']:
            # Get the earliest timestamp for machine 5000
            query = """
            SELECT MIN(timestamp) as start_time
            FROM sensor_data
            WHERE machine_id = 5000
            """
            cursor.execute(query)
            start_time = cursor.fetchone()[0]
            simulation_state['current_timestamp'] = start_time
            simulation_state['is_running'] = True

        # Get the next hour of data
        current_time = simulation_state['current_timestamp']
        next_hour = current_time + timedelta(hours=1)

        # Fetch data for the current hour
        query = """
        SELECT * FROM sensor_data
        WHERE machine_id = 5000
        AND timestamp = %s
        """
        cursor.execute(query, (current_time,))
        row = cursor.fetchone()

        if not row:
            # If no more data, reset simulation
            simulation_state['is_running'] = False
            return jsonify({
                'status': 'complete',
                'message': 'Simulation completed - reached end of data'
            })

        # Convert row to dictionary
        columns = [desc[0] for desc in cursor.description]
        sensor_data = dict(zip(columns, row))

        # Prepare data for prediction
        feature_columns = [
            'temperature', 'vibration', 'load', 'cycle_time', 'power_consumption',
            'feature_6', 'feature_7', 'feature_8', 'feature_9', 'feature_10',
            'feature_11', 'feature_12', 'feature_13', 'feature_14', 'feature_15',
            'feature_16', 'feature_17', 'feature_18', 'feature_19', 'feature_20',
            'feature_21', 'feature_22', 'feature_23', 'feature_24', 'feature_25',
            'feature_26', 'feature_27', 'feature_28'
        ]

        # Create a DataFrame with the current data point
        df = pd.DataFrame([sensor_data])
        
        # Add missing features with default values
        for col in feature_columns:
            if col not in df.columns:
                df[col] = 0

        # Convert to numeric and handle missing values
        df = df[feature_columns].apply(pd.to_numeric, errors='coerce').fillna(0)

        # Convert to NumPy array
        data = df.to_numpy(dtype='float32')

        # Reshape for the model (24 timesteps, 28 features)
        # Repeat the current data point 24 times to match the expected shape
        data = np.repeat(data, 24, axis=0)
        data = data.reshape((1, 24, 28))

        # Run prediction
        prediction = predictor.predict(data)

        # Update simulation state
        simulation_state['current_timestamp'] = next_hour

        # Close the connection
        cursor.close()
        conn.close()

        # Return both the sensor data and prediction
        return jsonify({
            'status': 'running',
            'timestamp': current_time.isoformat(),
            'sensor_data': sensor_data,
            'prediction': prediction.to_dict(orient='records')[0]
        })

    except Exception as e:
        simulation_state['is_running'] = False
        return jsonify({'status': 'error', 'message': str(e)}), 500

@simulation_bp.route('/simulation/status', methods=['GET'])
def get_simulation_status():
    """Get the current simulation status."""
    return jsonify({
        'is_running': simulation_state['is_running'],
        'current_timestamp': simulation_state['current_timestamp'].isoformat() if simulation_state['current_timestamp'] else None
    })

@simulation_bp.route('/simulation/reset', methods=['POST'])
def reset_simulation():
    """Reset the simulation to the beginning."""
    simulation_state['is_running'] = False
    simulation_state['current_timestamp'] = None
    return jsonify({'status': 'success', 'message': 'Simulation reset'})
