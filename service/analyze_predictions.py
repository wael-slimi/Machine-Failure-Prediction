import requests

def analyze_predictions(api_url, machine_id):
    """
    Fetch predictions from the API and analyze potential problems.

    Args:
        api_url (str): The URL of the API endpoint.
        machine_id (int): The ID of the machine to analyze.

    Returns:
        str: Analysis of the predicted problems.
    """
    # Make a POST request to the API
    response = requests.post(api_url, json={"machine_id": machine_id})
    
    if response.status_code != 200:
        return f"Error: Unable to fetch predictions. Status code: {response.status_code}, Message: {response.text}"
    
    # Parse the predictions
    predictions = response.json()
    
    if not predictions:
        return "No predictions available for analysis."
    
    # Analyze the predictions
    analysis = []
    for i, prediction in enumerate(predictions):
        score = prediction.get("prediction", 0)
        if score > 0.8:
            analysis.append(f"Time Step {i + 1}: High likelihood of a critical issue (Score: {score:.2f}).")
        elif score > 0.5:
            analysis.append(f"Time Step {i + 1}: Moderate likelihood of a potential issue (Score: {score:.2f}).")
        else:
            analysis.append(f"Time Step {i + 1}: Low likelihood of an issue (Score: {score:.2f}).")
    
    return "\n".join(analysis)

# Example usage
if __name__ == "__main__":
    API_URL = "http://127.0.0.1:5000/api/simulation/simulate"
    MACHINE_ID = 1  # Replace with the actual machine ID
    result = analyze_predictions(API_URL, MACHINE_ID)
    print(result)
