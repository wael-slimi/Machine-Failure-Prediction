import pandas as pd
from your_model_module import load_model  # Replace with your actual model import
from flask import Flask, request, jsonify

app = Flask(__name__)

def simulate_24h_cycle(csv_path, model_path):
    # Load the CSV file
    data = pd.read_csv(csv_path)
    
    # Load the ML model
    model = load_model(model_path)  # Replace with your model loading logic

    # Simulate the 24-hour cycle
    results = []
    for hour in range(24):
        # Filter or prepare data for the current hour
        hour_data = data[data['hour'] == hour]  # Adjust based on your CSV structure
        
        # Make predictions
        predictions = model.predict(hour_data.drop(columns=['hour']))  # Drop non-feature columns
        results.append((hour, predictions))
    
    # Log or visualize results
    for hour, prediction in results:
        print(f"Hour {hour}: {prediction}")
    return results

@app.route('/simulate', methods=['POST'])
def simulate():
    # Extract parameters from the request
    csv_path = request.json.get('csv_path', '/home/zven/Projects/PFE/ ml_model/processed_maintenance_prediction_data.csv')
    model_path = request.json.get('model_path', '/path/to/your/model.pkl')

    # Run the simulation
    try:
        results = simulate_24h_cycle(csv_path, model_path)
        return jsonify({"status": "success", "results": results})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
