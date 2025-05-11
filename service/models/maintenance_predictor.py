from tensorflow.keras.models import load_model
import pandas as pd

class MaintenancePredictor:
    def __init__(self, model_path='/home/zven/Projects/PFE/ml_model/model/lstm_maintenance_final.h5'):
        self.model = load_model(model_path, compile=False)

    def predict(self, data: pd.DataFrame):
        """Run predictions on the input data."""
        # Preprocess data (implement preprocessing logic here)
        # For now, assume data is ready for prediction
        predictions = self.model.predict(data)
        return pd.DataFrame(predictions, columns=['prediction'])
