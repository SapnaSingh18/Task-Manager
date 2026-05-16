from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import ProjectMember, User, Project

teams_bp = Blueprint("teams", __name__)


def get_user_role(project_id, user_id):
    membership = ProjectMember.query.filter_by(
        project_id=project_id, user_id=user_id
    ).first()
    return membership.role if membership else None


@teams_bp.route("/<int:project_id>/members", methods=["GET"])
@jwt_required()
def list_members(project_id):
    user_id = int(get_jwt_identity())
    role = get_user_role(project_id, user_id)

    if not role:
        return jsonify({"error": "Access denied"}), 403

    members = ProjectMember.query.filter_by(project_id=project_id).all()
    return jsonify({"members": [m.to_dict() for m in members]}), 200


@teams_bp.route("/<int:project_id>/members", methods=["POST"])
@jwt_required()
def add_member(project_id):
    user_id = int(get_jwt_identity())
    role = get_user_role(project_id, user_id)

    if role != "admin":
        return jsonify({"error": "Only admins can add members"}), 403

    # Make sure project exists
    Project.query.get_or_404(project_id)

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    email = data.get("email", "").strip().lower()
    if not email:
        return jsonify({"error": "Email is required"}), 400

    target_user = User.query.filter_by(email=email).first()
    if not target_user:
        return jsonify({"error": "No user found with that email"}), 404

    # Check if already a member
    existing = ProjectMember.query.filter_by(
        project_id=project_id, user_id=target_user.id
    ).first()
    if existing:
        return jsonify({"error": "User is already a member of this project"}), 409

    member_role = data.get("role", "member")
    if member_role not in ("admin", "member"):
        member_role = "member"

    member = ProjectMember(
        project_id=project_id,
        user_id=target_user.id,
        role=member_role,
    )
    db.session.add(member)
    db.session.commit()

    return jsonify({"member": member.to_dict()}), 201


@teams_bp.route("/<int:project_id>/members/<int:member_user_id>", methods=["PUT"])
@jwt_required()
def update_member_role(project_id, member_user_id):
    user_id = int(get_jwt_identity())
    role = get_user_role(project_id, user_id)

    if role != "admin":
        return jsonify({"error": "Only admins can change roles"}), 403

    membership = ProjectMember.query.filter_by(
        project_id=project_id, user_id=member_user_id
    ).first()
    if not membership:
        return jsonify({"error": "Member not found"}), 404

    data = request.get_json()
    new_role = data.get("role", "").strip()
    if new_role not in ("admin", "member"):
        return jsonify({"error": "Role must be 'admin' or 'member'"}), 400

    membership.role = new_role
    db.session.commit()

    return jsonify({"member": membership.to_dict()}), 200


@teams_bp.route("/<int:project_id>/members/<int:member_user_id>", methods=["DELETE"])
@jwt_required()
def remove_member(project_id, member_user_id):
    user_id = int(get_jwt_identity())
    role = get_user_role(project_id, user_id)

    if role != "admin":
        return jsonify({"error": "Only admins can remove members"}), 403

    # Prevent removing yourself if you're the only admin
    if member_user_id == user_id:
        admin_count = ProjectMember.query.filter_by(
            project_id=project_id, role="admin"
        ).count()
        if admin_count <= 1:
            return jsonify({"error": "Cannot remove the only admin"}), 400

    membership = ProjectMember.query.filter_by(
        project_id=project_id, user_id=member_user_id
    ).first()
    if not membership:
        return jsonify({"error": "Member not found"}), 404

    db.session.delete(membership)
    db.session.commit()

    return jsonify({"message": "Member removed"}), 200
