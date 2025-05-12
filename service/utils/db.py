import psycopg2
import numpy as np
import pandas as pd

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

def fetch_and_preprocess_sensor_data(conn, machine_id):
    """
    Fetch and preprocess sensor data for a specific machine to match the LSTM model's input shape.

    Args:
        conn: Database connection object.
        machine_id: ID of the machine to fetch data for.

    Returns:
        A NumPy array with shape (1, 24, 28).
    """
    # Update the SQL query to fetch all 28 features from relevant tables
    query = """
    SELECT 
        sd.temperature, sd.vibration, sd.load, sd.cycle_time, sd.power_consumption,
        ei.humidity, ei.temperature_external, ei.power_fluctuation,
        muh.working_hours, sd.error_code,
        hi.experience_years, si.shift, si.session_start, si.session_end,
        mt.maintenance_status, mt.finished_at - mt.started_at AS maintenance_duration,
        COUNT(hi.interaction_id) AS interaction_count,
        rc.updated_at AS recent_changes,
        mt.machine_type_id AS machine_type, mm.model AS machine_model, mp.brand,
        m.installation_date, m.working AS active,
        ei.environment_id, si.session_id, hi.interaction_id,
        mt.maintenance_task_id, mt.maintenance_template_id
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
    ORDER BY sd.timestamp DESC
    LIMIT 24
    """

    # Fetch data from the database
    df = pd.read_sql_query(query, conn, params=(machine_id,))

    # Ensure all selected columns are present
    feature_columns = [
        'temperature', 'vibration', 'load', 'cycle_time', 'power_consumption',
        'humidity', 'temperature_external', 'power_fluctuation',
        'working_hours', 'error_code', 'experience_years', 'shift',
        'session_start', 'session_end', 'maintenance_status', 'maintenance_duration',
        'interaction_count', 'recent_changes', 'machine_type', 'machine_model',
        'brand', 'installation_date', 'active', 'environment_id', 'session_id',
        'interaction_id', 'maintenance_task_id', 'maintenance_template_id'
    ]

    for col in feature_columns:
        if col not in df.columns:
            df[col] = 0  # Add missing columns with default value 0

    # Select and preprocess the relevant columns
    df = df[feature_columns].apply(pd.to_numeric, errors='coerce')

    # Handle missing values by filling with 0
    df = df.fillna(0)

    # Convert to NumPy array and ensure correct data type
    data = df.to_numpy(dtype='float32')

    # Ensure the data has 24 time steps by padding or truncating rows
    required_timesteps = 24
    if data.shape[0] < required_timesteps:
        padding = required_timesteps - data.shape[0]
        data = np.pad(data, ((0, padding), (0, 0)), mode='constant')
    elif data.shape[0] > required_timesteps:
        data = data[:required_timesteps, :]

    # Reshape the data to match the model's expected input shape
    data = data.reshape((1, required_timesteps, len(feature_columns)))

    return data
