import tensorflow as tf

# Check if TensorFlow is built with GPU support
print("Is TensorFlow built with GPU support? ", tf.test.is_built_with_cuda())

# Check if a GPU is available
print("Is GPU available? ", tf.config.list_physical_devices('GPU'))

# Get detailed information about GPUs
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    print(f"Number of GPUs Available: {len(gpus)}")
    for gpu in gpus:
        print(f"GPU Details: {gpu}")
else:
    print("No GPUs detected.")
