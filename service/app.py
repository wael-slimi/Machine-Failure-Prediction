from flask import Flask
from routes.simulation import simulation_bp

app = Flask(__name__)

# Register Blueprints
app.register_blueprint(simulation_bp, url_prefix='/api/simulation')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
