from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models import Task, ProjectMember, Project

tasks_bp = Blueprint("tasks", __name__)


def get_user_role(project_id, user_id):
    membership = ProjectMember.query.filter_by(
        project_id=project_id, user_id=user_id
    ).first()
    return membership.role if membership else None


@tasks_bp.route("/<int:project_id>/tasks", methods=["GET"])
@jwt_required()
def list_tasks(project_id):
    user_id = int(get_jwt_identity())
    role = get_user_role(project_id, user_id)

    if not role:
        return jsonify({"error": "Access denied"}), 403

    # Optional query filters
    status = request.args.get("status")
    priority = request.args.get("priority")
    assigned_to = request.args.get("assigned_to")

    query = Task.query.filter_by(project_id=project_id)

    if status:
        query = query.filter_by(status=status)
    if priority:
        query = query.filter_by(priority=priority)
    if assigned_to:
        query = query.filter_by(assigned_to=int(assigned_to))

    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify({"tasks": [t.to_dict() for t in tasks]}), 200


@tasks_bp.route("/<int:project_id>/tasks", methods=["POST"])
@jwt_required()
def create_task(project_id):
    user_id = int(get_jwt_identity())
    role = get_user_role(project_id, user_id)

    if role != "admin":
        return jsonify({"error": "Only admins can create tasks"}), 403

    Project.query.get_or_404(project_id)

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Task title is required"}), 400

    # Validate status and priority
    status = data.get("status", "todo")
    if status not in ("todo", "in_progress", "done"):
        status = "todo"

    priority = data.get("priority", "medium")
    if priority not in ("low", "medium", "high"):
        priority = "medium"

    # Parse due_date
    due_date = None
    if data.get("due_date"):
        try:
            due_date = datetime.strptime(data["due_date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Validate assigned_to is a project member
    assigned_to = data.get("assigned_to")
    if assigned_to:
        assigned_to = int(assigned_to)
        member_check = ProjectMember.query.filter_by(
            project_id=project_id, user_id=assigned_to
        ).first()
        if not member_check:
            return jsonify({"error": "Assigned user is not a project member"}), 400

    task = Task(
        title=title,
        description=data.get("description", "").strip(),
        status=status,
        priority=priority,
        due_date=due_date,
        project_id=project_id,
        assigned_to=assigned_to,
        created_by=user_id,
    )
    db.session.add(task)
    db.session.commit()

    return jsonify({"task": task.to_dict()}), 201


@tasks_bp.route("/<int:project_id>/tasks/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task(project_id, task_id):
    user_id = int(get_jwt_identity())
    role = get_user_role(project_id, user_id)

    if not role:
        return jsonify({"error": "Access denied"}), 403

    task = Task.query.filter_by(id=task_id, project_id=project_id).first_or_404()
    return jsonify({"task": task.to_dict()}), 200


@tasks_bp.route("/<int:project_id>/tasks/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(project_id, task_id):
    user_id = int(get_jwt_identity())
    role = get_user_role(project_id, user_id)

    if not role:
        return jsonify({"error": "Access denied"}), 403

    task = Task.query.filter_by(id=task_id, project_id=project_id).first_or_404()
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Members can only update status of tasks assigned to them
    if role == "member":
        if "status" not in data or len(data) > 1:
            return jsonify({"error": "Members can only update task status"}), 403
        if task.assigned_to != user_id:
            return jsonify({"error": "You can only update tasks assigned to you"}), 403

        new_status = data["status"]
        if new_status not in ("todo", "in_progress", "done"):
            return jsonify({"error": "Invalid status"}), 400
        task.status = new_status
        db.session.commit()
        return jsonify({"task": task.to_dict()}), 200

    # Admin can update everything
    if "title" in data:
        title = data["title"].strip()
        if not title:
            return jsonify({"error": "Title cannot be empty"}), 400
        task.title = title

    if "description" in data:
        task.description = data["description"].strip()

    if "status" in data:
        status = data["status"]
        if status not in ("todo", "in_progress", "done"):
            return jsonify({"error": "Invalid status"}), 400
        task.status = status

    if "priority" in data:
        priority = data["priority"]
        if priority not in ("low", "medium", "high"):
            return jsonify({"error": "Invalid priority"}), 400
        task.priority = priority

    if "due_date" in data:
        if data["due_date"]:
            try:
                task.due_date = datetime.strptime(data["due_date"], "%Y-%m-%d").date()
            except ValueError:
                return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        else:
            task.due_date = None

    if "assigned_to" in data:
        if data["assigned_to"]:
            assigned_to = int(data["assigned_to"])
            member_check = ProjectMember.query.filter_by(
                project_id=project_id, user_id=assigned_to
            ).first()
            if not member_check:
                return jsonify({"error": "Assigned user is not a project member"}), 400
            task.assigned_to = assigned_to
        else:
            task.assigned_to = None

    db.session.commit()
    return jsonify({"task": task.to_dict()}), 200


@tasks_bp.route("/<int:project_id>/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(project_id, task_id):
    user_id = int(get_jwt_identity())
    role = get_user_role(project_id, user_id)

    if role != "admin":
        return jsonify({"error": "Only admins can delete tasks"}), 403

    task = Task.query.filter_by(id=task_id, project_id=project_id).first_or_404()
    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Task deleted"}), 200
