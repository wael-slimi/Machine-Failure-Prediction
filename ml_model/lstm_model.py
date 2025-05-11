import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.regularizers import l2
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import numpy as np
import logging

class MaintenanceLSTM:
    def __init__(self, input_shape):
        self.input_shape = input_shape
        self.model = self._build_model()
        logging.basicConfig(level=logging.INFO)
        
    def _build_model(self):
        """Build LSTM model architecture"""
        model = Sequential([
            LSTM(128, 
                 input_shape=self.input_shape,
                 return_sequences=True,
                 kernel_regularizer=l2(0.01)),
            BatchNormalization(),
            Dropout(0.3),
            
            LSTM(64,
                 kernel_regularizer=l2(0.01)),
            BatchNormalization(),
            Dropout(0.3),
            
            Dense(32, activation='relu'),
            Dense(1, activation='sigmoid')
        ])
        
        optimizer = Adam(learning_rate=0.001)
        model.compile(
            optimizer=optimizer,
            loss='binary_crossentropy',
            metrics=[
                'accuracy',
                tf.keras.metrics.Precision(name='precision'),
                tf.keras.metrics.Recall(name='recall'),
                tf.keras.metrics.AUC(name='auc')
            ]
        )
        return model
    
    def train(self, X_train, y_train, X_val, y_val, epochs=50, batch_size=64):
        """Train the LSTM model"""
        callbacks = [
            EarlyStopping(patience=10, restore_best_weights=True),
            ModelCheckpoint(
                'ml_model/model/best_lstm.h5',
                save_best_only=True,
                monitor='val_auc',
                mode='max'
            )
        ]
        
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks,
            class_weight=self._get_class_weights(y_train)
        )
        return history
    
    def _get_class_weights(self, y_train):
        """Calculate class weights for imbalanced data"""
        class_counts = np.bincount(y_train)
        total = len(y_train)
        return {
            0: (1 / class_counts[0]) * (total / 2.0),
            1: (1 / class_counts[1]) * (total / 2.0)
        }
    
    def evaluate(self, X_test, y_test):
        """Evaluate model performance"""
        return self.model.evaluate(X_test, y_test, verbose=0)
    
    def predict(self, X):
        """Make predictions"""
        return self.model.predict(X)
    
    def save(self, path='ml_model/model/lstm_maintenance.h5'):
        """Save the trained model"""
        self.model.save(path)
        logging.info(f"Model saved to {path}")