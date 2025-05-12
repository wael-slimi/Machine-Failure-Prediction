from flask import Blueprint, request, jsonify
from utils.db import get_db_connection
from models.maintenance_predictor import MaintenancePredictor
import pandas as pd
import numpy as np

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

        # Update feature_columns to include all 28 features expected by the model
        feature_columns = [
            'temperature', 'vibration', 'load', 'cycle_time', 'power_consumption',
            'feature_6', 'feature_7', 'feature_8', 'feature_9', 'feature_10',
            'feature_11', 'feature_12', 'feature_13', 'feature_14', 'feature_15',
            'feature_16', 'feature_17', 'feature_18', 'feature_19', 'feature_20',
            'feature_21', 'feature_22', 'feature_23', 'feature_24', 'feature_25',
            'feature_26', 'feature_27', 'feature_28'
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

        # Return predictions
        return jsonify(predictions.to_dict(orient='records'))
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
