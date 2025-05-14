from flask import Flask
from flask_cors import CORS
from routes.simulation import simulation_bp
from routes.dashboard import dashboard_bp

app = Flask(__name__)

# Configure CORS
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "expose_headers": ["Content-Type", "Authorization"],
        "max_age": 3600
    }
})

# Register blueprints
app.register_blueprint(simulation_bp, url_prefix='/api/simulation')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
