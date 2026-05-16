from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Project, ProjectMember, User

projects_bp = Blueprint("projects", __name__)


def get_user_role(project_id, user_id):
    """Get the role of a user in a project, or None if not a member."""
    membership = ProjectMember.query.filter_by(
        project_id=project_id, user_id=user_id
    ).first()
    return membership.role if membership else None


@projects_bp.route("/", methods=["GET"])
@jwt_required()
def list_projects():
    user_id = int(get_jwt_identity())
    memberships = ProjectMember.query.filter_by(user_id=user_id).all()
    project_ids = [m.project_id for m in memberships]
    projects = Project.query.filter(Project.id.in_(project_ids)).order_by(
        Project.created_at.desc()
    ).all()

    result = []
    for p in projects:
        data = p.to_dict()
        membership = next((m for m in memberships if m.project_id == p.id), None)
        data["my_role"] = membership.role if membership else None
        result.append(data)

    return jsonify({"projects": result}), 200


@projects_bp.route("/", methods=["POST"])
@jwt_required()
def create_project():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Project name is required"}), 400

    project = Project(
        name=name,
        description=data.get("description", "").strip(),
        created_by=user_id,
    )
    db.session.add(project)
    db.session.flush()  # Get the project ID

    # Add creator as admin member
    member = ProjectMember(
        project_id=project.id,
        user_id=user_id,
        role="admin",
    )
    db.session.add(member)
    db.session.commit()

    result = project.to_dict(include_members=True)
    result["my_role"] = "admin"
    return jsonify({"project": result}), 201


@projects_bp.route("/<int:project_id>", methods=["GET"])
@jwt_required()
def get_project(project_id):
    user_id = int(get_jwt_identity())
    role = get_user_role(project_id, user_id)

    if not role:
        return jsonify({"error": "Access denied"}), 403

    project = Project.query.get_or_404(project_id)
    result = project.to_dict(include_members=True, include_tasks=True)
    result["my_role"] = role
    return jsonify({"project": result}), 200


@projects_bp.route("/<int:project_id>", methods=["PUT"])
@jwt_required()
def update_project(project_id):
    user_id = int(get_jwt_identity())
    role = get_user_role(project_id, user_id)

    if role != "admin":
        return jsonify({"error": "Only admins can update projects"}), 403

    project = Project.query.get_or_404(project_id)
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    if "name" in data:
        name = data["name"].strip()
        if not name:
            return jsonify({"error": "Project name cannot be empty"}), 400
        project.name = name

    if "description" in data:
        project.description = data["description"].strip()

    db.session.commit()

    result = project.to_dict()
    result["my_role"] = role
    return jsonify({"project": result}), 200


@projects_bp.route("/<int:project_id>", methods=["DELETE"])
@jwt_required()
def delete_project(project_id):
    user_id = int(get_jwt_identity())
    role = get_user_role(project_id, user_id)

    if role != "admin":
        return jsonify({"error": "Only admins can delete projects"}), 403

    project = Project.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()

    return jsonify({"message": "Project deleted"}), 200
