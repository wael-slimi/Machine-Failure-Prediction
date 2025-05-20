import os
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from lstm_model import MaintenanceLSTM
import logging
import gc  # Garbage collection
from tensorflow.keras.callbacks import ModelCheckpoint
import joblib
import pickle



# Configure logging
os.makedirs('logs', exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/training.log'),
        logging.StreamHandler()
    ]
)

def load_data_in_chunks(file_path, chunk_size=100000):
    """Load data in chunks to reduce memory usage"""
    try:
        chunks = pd.read_csv(file_path, chunksize=chunk_size)
        df = pd.concat(chunks)
        logging.info(f"Data loaded. Shape: {df.shape}")
        return df
    except Exception as e:
        logging.error(f"Error loading data: {str(e)}")
        raise

def preprocess_and_save_sequences(df, output_dir='data_sequences'):
    """Process data in batches and save sequences to disk"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Initialize scaler
    features = df.drop(columns=['needs_maintenance', 'machine_id', 'timestamp'])
    scaler = StandardScaler()
    scaler.fit(features)
    joblib.dump(scaler, 'model/scaler.joblib')
    
    # Process each machine separately
    machine_groups = df.groupby('machine_id')
    seq_files = []
    
    for i, (machine_id, group) in enumerate(machine_groups):
        # Process features
        machine_features = group.drop(
            columns=['needs_maintenance', 'machine_id', 'timestamp']
        ).values
        machine_target = group['needs_maintenance'].values
        
        # Normalize
        machine_features = scaler.transform(machine_features)
        
        # Create sequences
        time_steps = 24
        X_seq = []
        y_seq = []
        
        for j in range(len(machine_features) - time_steps):
            X_seq.append(machine_features[j:j+time_steps])
            y_seq.append(machine_target[j+time_steps])
        
        # Save to disk
        seq_file = f"{output_dir}/machine_{machine_id}_seq.npz"
        np.savez(seq_file, X=np.array(X_seq), y=np.array(y_seq))
        seq_files.append(seq_file)
        
        # Clear memory
        del X_seq, y_seq
        gc.collect()
        
        if (i+1) % 100 == 0:
            logging.info(f"Processed {i+1}/{len(machine_groups)} machines")
    
    return seq_files

def load_sequences(seq_files, sample_fraction=0.1):
    """Load a fraction of sequences to reduce memory usage"""
    X_list, y_list = [], []
    
    for i, file in enumerate(seq_files):
        if np.random.rand() < sample_fraction:  # Random sampling
            data = np.load(file)
            X_list.append(data['X'])
            y_list.append(data['y'])
        
        if (i+1) % 100 == 0:
            logging.info(f"Loaded {i+1}/{len(seq_files)} sequence files")
    
    return np.concatenate(X_list), np.concatenate(y_list)

def main():
    try:
        logging.info("Starting memory-optimized training pipeline")
        
        # 1. Load data in chunks
        df = load_data_in_chunks('processed_maintenance_prediction_data.csv')
        
        # 2. Preprocess and save sequences
        seq_files = preprocess_and_save_sequences(df)
        
        # 3. Load subset of sequences
        X, y = load_sequences(seq_files, sample_fraction=0.3)  # Use 30% of data
        logging.info(f"Final sequences loaded. X shape: {X.shape}, y shape: {y.shape}")
        
        # 4. Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, shuffle=False
        )
        
        # 5. Initialize model with smaller architecture
        input_shape = (X_train.shape[1], X_train.shape[2])
        model = MaintenanceLSTM(input_shape)
        
        # 6. Train with checkpointing
        checkpoint = ModelCheckpoint(
            'model/lstm_checkpoint.h5',
            save_best_only=True,
            monitor='val_loss'
        )
        
        history = model.model.fit(
            X_train, y_train,
            validation_split=0.2,
            epochs=20,
            batch_size=64,
            callbacks=[checkpoint],
            verbose=1
        )
        
        # 7. Save final model
        model.save('model/lstm_maintenance_final.h5')

        # 8 Save training history
        os.makedirs('ml_model', exist_ok=True)
        with open('ml_model/training_history.pkl', 'wb') as f:
            pickle.dump(history.history, f)
        
        logging.info("Training completed successfully")
        
    except Exception as e:
        logging.error(f"Pipeline failed: {str(e)}")
        raise

if __name__ == "__main__":
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
    main()