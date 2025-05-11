# data_processing.py
import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from sqlalchemy import create_engine
from datetime import timedelta
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/data_processing.log'),
        logging.StreamHandler()
    ]
)

# Database connection parameters
DB_PARAMS = {
    'dbname': 'machine_monitoring',
    'user': 'admin',
    'password': 'secret',
    'host': 'localhost',
    'port': '5432'
}

def load_data_from_db():
    """Load data from PostgreSQL database with proper maintenance task handling"""
    try:
        engine = create_engine(
            f'postgresql://{DB_PARAMS["user"]}:{DB_PARAMS["password"]}@'
            f'{DB_PARAMS["host"]}:{DB_PARAMS["port"]}/{DB_PARAMS["dbname"]}'
        )
        
        logging.info("Loading data from database...")
        
        tables = {
            'sensor': 'sensor_data',
            'machines': 'machines',
            'maintenance_logs': 'maintenance_activity_logs',
            'maintenance_tasks': 'maintenance_tasks',
            'env': 'environmental_info',
            'usage': 'machine_usage_history'
        }
        
        data = {}
        for name, table in tables.items():
            data[name] = pd.read_sql_table(table, engine)
            logging.info(f"Loaded {len(data[name])} rows from {table}")
            
        return (data['sensor'], data['machines'], 
                data['maintenance_logs'], data['maintenance_tasks'],
                data['env'], data['usage'])
    
    except Exception as e:
        logging.error(f"Error loading data: {str(e)}")
        raise

def link_maintenance_to_machines(maintenance_logs, maintenance_tasks, machines):
    """Connect maintenance logs to machines through tasks with validation"""
    try:
        # Validate required columns exist
        required_columns = {
            'maintenance_logs': ['maintenance_task_id'],
            'maintenance_tasks': ['maintenance_task_id', 'machine_id']
        }
        
        for df_name, cols in required_columns.items():
            for col in cols:
                if col not in locals()[df_name].columns:
                    raise ValueError(f"Column '{col}' missing from {df_name}")

        # Merge maintenance logs with tasks
        maintenance_merged = maintenance_logs.merge(
            maintenance_tasks[['maintenance_task_id', 'machine_id']],
            on='maintenance_task_id',
            how='left'
        )
        
        # Handle missing machine_ids
        missing_ids = maintenance_merged['machine_id'].isna().sum()
        if missing_ids > 0:
            logging.warning(f"Filling {missing_ids} missing machine_ids with synthetic values")
            valid_machines = machines['machine_id'].unique()
            maintenance_merged['machine_id'] = maintenance_merged['machine_id'].fillna(
                pd.Series(np.random.choice(valid_machines, size=len(maintenance_merged)))
            )    
        return maintenance_merged
        
    except Exception as e:
        logging.error(f"Machine ID handling failed: {str(e)}")
        raise

def create_training_dataframe():
    """Create processed dataframe for 24-hour maintenance prediction"""
    try:
        # Load data including maintenance_tasks
        sensor, machines, maintenance_logs, maintenance_tasks, env, usage = load_data_from_db()
        
        # Log available columns for debugging
        logging.info(f"Sensor columns: {sensor.columns.tolist()}")
        logging.info(f"Maintenance logs columns: {maintenance_logs.columns.tolist()}")
        
        # Link maintenance data to machines
        maintenance = link_maintenance_to_machines(maintenance_logs, maintenance_tasks, machines)
        
        # Convert timestamps with error handling
        def safe_datetime_conversion(df, col):
            df[col] = pd.to_datetime(df[col], errors='coerce')
            null_count = df[col].isna().sum()
            if null_count > 0:
                logging.warning(f"Dropped {null_count} rows with invalid {col} dates")
                df.dropna(subset=[col], inplace=True)
            return df
        
        sensor = safe_datetime_conversion(sensor, 'timestamp')
        maintenance = safe_datetime_conversion(maintenance, 'date')
        env = safe_datetime_conversion(env, 'timestamp')
        usage = safe_datetime_conversion(usage, 'timestamp')
        machines['installation_date'] = pd.to_datetime(machines['installation_date'], errors='coerce')
        
        # Sort data
        sensor.sort_values(['machine_id', 'timestamp'], inplace=True)
        maintenance.sort_values(['machine_id', 'date'], inplace=True)
        env.sort_values(['machine_id', 'timestamp'], inplace=True)
        usage.sort_values(['machine_id', 'timestamp'], inplace=True)

        # Merge machine properties with sensor data
        df = pd.merge(
            sensor,
            machines[['machine_id', 'machine_model_id', 'machine_type_id', 'installation_date']],
            on='machine_id',
            how='left' 
        )
        
        # Add maintenance features
        last_maintenance = maintenance.groupby('machine_id')['date'].max().reset_index()
        last_maintenance.columns = ['machine_id', 'last_maintenance_date']
        df = pd.merge(df, last_maintenance, on='machine_id', how='left')
        
        # Fill missing maintenance dates with installation dates
        df['last_maintenance_date'] = df['last_maintenance_date'].fillna(df['installation_date'])
        
        # Calculate maintenance features
        df['days_since_maintenance'] = (df['timestamp'] - df['last_maintenance_date']).dt.days.abs()
        df['maintenance_urgency'] = 1 / (df['days_since_maintenance'].replace(0, 0.1) + 1e-6)
        
        # Add environmental context
        df = pd.merge(
            df,
            env[['machine_id', 'timestamp', 'temperature_external', 'humidity']],
            on=['machine_id', 'timestamp'],
            how='left'
        )
        
        # Add usage patterns
        df = pd.merge(
            df,
            usage[['machine_id', 'timestamp', 'working_hours']],
            on=['machine_id', 'timestamp'],
            how='left'
        )
        
        # Create temporal features
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['month'] = df['timestamp'].dt.month
        
        # Create rolling features only for existing sensor metrics
        window_sizes = ['1H', '6H', '24H']
        existing_metrics = []
        
        # Check which sensor metrics actually exist
        for metric in ['temperature', 'vibration', 'pressure', 'humidity']:
            if metric in sensor.columns:
                existing_metrics.append(metric)
                logging.info(f"Creating rolling features for {metric}")
            else:
                logging.warning(f"Sensor metric not found: {metric}")
        
        # Create rolling features
        for col in existing_metrics:
            for window in window_sizes:
                try:
                    df[f'{col}_rolling_mean_{window}'] = df.groupby('machine_id', group_keys=False)\
                        .apply(lambda g: g.rolling(window, on='timestamp', min_periods=1)[col].mean())
                    df[f'{col}_rolling_max_{window}'] = df.groupby('machine_id', group_keys=False)\
                        .apply(lambda g: g.rolling(window, on='timestamp', min_periods=1)[col].max())
                except Exception as e:
                    logging.error(f"Failed to create rolling features for {col}: {str(e)}")
                    continue
        
        # Create target variable - maintenance needed in next 24 hours
        maintenance['is_maintenance'] = 1
        df = pd.merge_asof(
            df.sort_values('timestamp'),
            maintenance[['machine_id', 'date', 'is_maintenance']].sort_values('date'),
            left_on='timestamp',
            right_on='date',
            by='machine_id',
            direction='forward',
            tolerance=pd.Timedelta('24H')
        )
        df['needs_maintenance'] = df['is_maintenance'].fillna(0).astype(int)
        
        # Cleanup
        df = df.drop(columns=[
            'last_maintenance_date', 
            'error_code', 
            'installation_date', 
            'date', 
            'is_maintenance'
        ])
        
        # Forward fill and drop remaining NAs
        df = df.ffill().dropna()
        
        logging.info(f"Final processed dataframe shape: {df.shape}")
        logging.info(f"Class distribution:\n{df['needs_maintenance'].value_counts(normalize=True)}")
        
        return df

    except Exception as e:
        logging.error(f"Data processing failed: {str(e)}")
        raise

def generate_heatmap(df):
    """Generate and save correlation heatmap"""
    try:
        plt.figure(figsize=(20, 18))
        corr = df.select_dtypes(include=np.number).corr()
        
        # Create mask for upper triangle
        mask = np.triu(np.ones_like(corr, dtype=bool))
        
        sns.heatmap(
            corr, 
            mask=mask,
            annot=True, 
            fmt=".2f", 
            cmap='coolwarm',
            center=0,
            annot_kws={'size': 8},
            linewidths=0.5,
            cbar_kws={'shrink': 0.8}
        )
        plt.title('Feature Correlation Matrix (24H Maintenance Prediction)', fontsize=16)
        plt.xticks(rotation=45, ha='right', fontsize=8)
        plt.yticks(fontsize=8)
        plt.tight_layout()
        plt.savefig('feature_correlations.png', dpi=300, bbox_inches='tight')
        plt.close()
        logging.info("Saved correlation heatmap to feature_correlations.png")
        
    except Exception as e:
        logging.error(f"Heatmap generation failed: {str(e)}")
        raise

if __name__ == "__main__":
    try:
        logging.info("Starting 24-hour maintenance prediction data processing pipeline")
        processed_df = create_training_dataframe()
        
        # Generate and save visualizations
        generate_heatmap(processed_df)
        
        # Save processed data
        processed_df.to_csv('processed_maintenance_prediction_data.csv', index=False)
        logging.info("Successfully saved processed data to processed_maintenance_prediction_data.csv")
        
        # Print sample data
        print("\nSample processed data (24H maintenance prediction):")
        print(processed_df[
            ['machine_id', 'timestamp', 'temperature', 'vibration', 
             'days_since_maintenance', 'needs_maintenance']
        ].head())
        
    except Exception as e:
        logging.error(f"Main pipeline execution failed: {str(e)}")