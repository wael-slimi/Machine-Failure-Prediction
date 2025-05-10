import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import load_model
import joblib
from datetime import timedelta
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class MaintenancePredictor:
    def __init__(self, model_path='model/lstm_maintenance.h5', scaler_path='model/scaler.joblib'):
        self.model = load_model(model_path)
        self.scaler = joblib.load(scaler_path)
        self.feature_names = [
            'temperature', 'vibration', 'pressure', 'humidity',
            'days_since_maintenance', 'maintenance_urgency',
            'temperature_external', 'working_hours',
            'hour', 'day_of_week', 'month'
        ]
        self.error_mapping = {
            'temperature': 'Overheating Risk',
            'vibration': 'Mechanical Wear',
            'pressure': 'Pressure Fluctuation',
            'humidity': 'Moisture Ingress'
        }
        
    def _create_sequences(self, data, time_steps=24):
        sequences = []
        machine_data = data.sort_values('timestamp')
        features = self.scaler.transform(machine_data[self.feature_names])
        
        for i in range(len(features) - time_steps):
            sequences.append(features[i:i+time_steps])
            
        return np.array(sequences), machine_data['timestamp'].iloc[time_steps:].values
    
    def _diagnose_issue(self, sequence):
        diagnostics = []
        avg_values = np.mean(sequence, axis=0)
        
        if avg_values[0] > 2.0:
            diagnostics.append(self.error_mapping['temperature'])
        if avg_values[1] > 1.5:
            diagnostics.append(self.error_mapping['vibration'])
        if np.abs(avg_values[2]) > 2.0:
            diagnostics.append(self.error_mapping['pressure'])
        if avg_values[3] > 1.8:
            diagnostics.append(self.error_mapping['humidity'])
            
        return diagnostics if diagnostics else ['Preventive Maintenance']
    
    def predict(self, test_data):
        try:
            predictions = []
            grouped = test_data.groupby('machine_id')
            
            for machine_id, group in grouped:
                sequences, timestamps = self._create_sequences(group)
                
                if len(sequences) == 0:
                    continue
                    
                probs = self.model.predict(sequences, verbose=0).flatten()
                
                for i, prob in enumerate(probs):
                    if prob > 0.5:
                        diagnostics = self._diagnose_issue(sequences[i])
                        predictions.append({
                            'machine_id': machine_id,
                            'prediction_time': timestamps[i],
                            'probability': float(prob),
                            'expected_issues': diagnostics,
                            'urgency': 'CRITICAL' if prob > 0.75 else 'WARNING'
                        })
            
            return pd.DataFrame(predictions)
            
        except Exception as e:
            logging.error(f"Prediction failed: {str(e)}")
            raise

def main():
    try:
        test_df = pd.read_csv('new_sensor_data.csv')
        test_df['timestamp'] = pd.to_datetime(test_df['timestamp'])
        
        predictor = MaintenancePredictor()
        results = predictor.predict(test_df)
        
        if not results.empty:
            results.to_csv('maintenance_predictions.csv', index=False)
            print("\nPredicted Maintenance Requirements:")
            print(results[['machine_id', 'prediction_time', 'urgency', 'expected_issues']])
        else:
            print("No maintenance required in the next 24 hours")
            
    except Exception as e:
        logging.error(f"Main execution failed: {str(e)}")

if __name__ == "__main__":
    main()
