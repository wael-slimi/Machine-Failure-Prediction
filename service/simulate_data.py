import psycopg2
from datetime import datetime
import random
import time
from utils.db import get_db_connection

def simulate_sensor_data(machine_id):
    """Simulate sensor data for a machine."""
    return {
        'machine_id': machine_id,
        'timestamp': datetime.now(),
        'temperature': random.uniform(20, 100),
        'vibration': random.uniform(0.1, 2.5),
        'load': random.uniform(0, 100),
        'cycle_time': random.uniform(10, 60),
        'power_consumption': random.uniform(100, 500),
        'error_code': random.choice(['E1', 'E2', 'E3', None])
    }

def insert_sensor_data():
    """Insert simulated data into the sensor_data table."""
    conn = get_db_connection()
    cursor = conn.cursor()

    for machine_id in range(1, 11):  # Simulate for 10 machines
        data = simulate_sensor_data(machine_id)
        cursor.execute(
            """
            INSERT INTO sensor_data (machine_id, timestamp, temperature, vibration, load, cycle_time, power_consumption, error_code)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (data['machine_id'], data['timestamp'], data['temperature'], data['vibration'], data['load'], data['cycle_time'], data['power_consumption'], data['error_code'])
        )
        print(f"Inserted data for machine {machine_id}")

    conn.commit()
    cursor.close()
    conn.close()

def populate_machines_table():
    """Ensure the machines table has valid machine IDs."""
    conn = get_db_connection()
    cursor = conn.cursor()

    for machine_id in range(1, 11):  # Create 10 machines
        cursor.execute(
            """
            INSERT INTO machines (machine_id, machine_label, machine_model_id, machine_type_id, box_macaddress, installation_date, working)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (machine_id) DO NOTHING
            """,
            (machine_id, f"Machine {machine_id}", 1, 1, f"00:1B:44:11:3A:{machine_id:02X}", datetime.now().date(), True)
        )
    conn.commit()
    cursor.close()
    conn.close()

def populate_machine_models_table():
    """Ensure the machine_models table has valid entries."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Insert a default machine model with ID 1
    cursor.execute(
        """
        INSERT INTO machine_models (machine_model_id, model, brand, machine_type_id, active)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (machine_model_id) DO NOTHING
        """,
        (1, "Model A", "Brand X", 1, "Y")
    )

    conn.commit()
    cursor.close()
    conn.close()

def populate_boxes_table():
    """Ensure the boxes table has valid entries."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Insert default box entries
    for machine_id in range(1, 11):
        cursor.execute(
            """
            INSERT INTO boxes (box_macaddress, box_label, enabled)
            VALUES (%s, %s, %s)
            ON CONFLICT (box_macaddress) DO NOTHING
            """,
            (f"00:1B:44:11:3A:{machine_id:02X}", f"Box {machine_id}", True)
        )

    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    populate_machine_models_table()  # Populate machine_models table
    populate_boxes_table()  # Populate boxes table
    populate_machines_table()  # Populate machines table
    while True:
        insert_sensor_data()
        time.sleep(5)  # Simulate data every 5 seconds
