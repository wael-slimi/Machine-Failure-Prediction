from flask import Flask
from flask_cors import CORS
from routes.simulation import simulation_bp
from routes.dashboard import dashboard_bp 

app = Flask(__name__)

# Configure CORS with specific settings
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# Register Blueprints
app.register_blueprint(simulation_bp, url_prefix='/api/simulation')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard') 

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
