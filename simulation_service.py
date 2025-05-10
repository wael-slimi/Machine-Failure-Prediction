from flask import Flask, request, jsonify
import pandas as pd
from test_model import MaintenancePredictor
from datetime import datetime, timedelta
import numpy as np

app = Flask(__name__)

@app.route('/simulate', methods=['POST'])
def simulate():
    try:
        # Generate synthetic data
        num_machines = request.json.get('num_machines', 10)
        hours = request.json.get('hours', 24)
        start_time = datetime.now().replace(minute=0, second=0, microsecond=0)

        data = []
        for machine_id in range(1, num_machines + 1):
            for hour in range(hours):
                timestamp = start_time + timedelta(hours=hour)
                data.append({
                    'machine_id': machine_id,
                    'timestamp': timestamp,
                    'temperature': np.random.uniform(20, 100),
                    'vibration': np.random.uniform(0.1, 2.5),
                    'pressure': np.random.uniform(-3, 3),
                    'humidity': np.random.uniform(30, 90),
                    'days_since_maintenance': np.random.randint(1, 100),
                    'maintenance_urgency': np.random.uniform(0, 1),
                    'temperature_external': np.random.uniform(10, 40),
                    'working_hours': np.random.randint(0, 24),
                    'hour': timestamp.hour,
                    'day_of_week': timestamp.weekday(),
                    'month': timestamp.month
                })

        synthetic_data = pd.DataFrame(data)
        synthetic_data['timestamp'] = pd.to_datetime(synthetic_data['timestamp'])

        # Initialize the predictor
        predictor = MaintenancePredictor()

        # Predict maintenance requirements
        results = predictor.predict(synthetic_data)

        # Return results as JSON
        return jsonify(results.to_dict(orient='records'))

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
