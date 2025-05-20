import pickle
import matplotlib.pyplot as plt

# Load the saved history
def main():
    with open('training_history.pkl', 'rb') as f:
        history = pickle.load(f)

    plt.figure(figsize=(8, 5))
    plt.plot(history['loss'], label='Training Loss')
    plt.plot(history['val_loss'], label='Validation Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.title('Training and Validation Loss Curves')
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    plt.savefig('training_curve.png', dpi=300)
    plt.show()

if __name__ == "__main__":
    main() 