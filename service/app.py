from flask import Flask
from flask_cors import CORS
from routes.simulation import simulation_bp
from routes.dashboard import dashboard_bp 

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Register Blueprints
app.register_blueprint(simulation_bp, url_prefix='/api/simulation')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard') 

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
