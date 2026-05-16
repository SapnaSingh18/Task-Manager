from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from app.config import Config

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    CORS(app, supports_credentials=True)

    # Register blueprints
    from app.auth.routes import auth_bp
    from app.projects.routes import projects_bp
    from app.teams.routes import teams_bp
    from app.tasks.routes import tasks_bp
    from app.dashboard.routes import dashboard_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(teams_bp, url_prefix="/api/projects")
    app.register_blueprint(tasks_bp, url_prefix="/api/projects")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    with app.app_context():
        db.create_all()

    return app
