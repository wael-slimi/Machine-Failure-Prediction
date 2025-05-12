from flask import Flask
from routes.simulation import simulation_bp
from routes.dashboard import dashboard_bp 

app = Flask(__name__)

# Register Blueprints
app.register_blueprint(simulation_bp, url_prefix='/api/simulation')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard') 

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
