from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date
from app.models import Task, ProjectMember, Project

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/", methods=["GET"])
@jwt_required()
def get_dashboard():
    user_id = int(get_jwt_identity())

    # Get all projects the user is a member of
    memberships = ProjectMember.query.filter_by(user_id=user_id).all()
    project_ids = [m.project_id for m in memberships]

    # Get all tasks across user's projects
    all_tasks = Task.query.filter(Task.project_id.in_(project_ids)).all()

    # Stats
    total_tasks = len(all_tasks)
    todo_count = sum(1 for t in all_tasks if t.status == "todo")
    in_progress_count = sum(1 for t in all_tasks if t.status == "in_progress")
    done_count = sum(1 for t in all_tasks if t.status == "done")

    today = date.today()
    overdue_tasks = [
        t for t in all_tasks
        if t.due_date and t.due_date < today and t.status != "done"
    ]

    # Tasks assigned to me
    my_tasks = [t for t in all_tasks if t.assigned_to == user_id]
    my_todo = sum(1 for t in my_tasks if t.status == "todo")
    my_in_progress = sum(1 for t in my_tasks if t.status == "in_progress")
    my_done = sum(1 for t in my_tasks if t.status == "done")

    # Recent tasks (latest 10)
    recent_tasks = sorted(all_tasks, key=lambda t: t.created_at, reverse=True)[:10]

    # Projects summary
    projects = Project.query.filter(Project.id.in_(project_ids)).all()
    project_summaries = []
    for p in projects:
        p_tasks = [t for t in all_tasks if t.project_id == p.id]
        membership = next((m for m in memberships if m.project_id == p.id), None)
        project_summaries.append({
            "id": p.id,
            "name": p.name,
            "my_role": membership.role if membership else None,
            "total_tasks": len(p_tasks),
            "done_tasks": sum(1 for t in p_tasks if t.status == "done"),
            "overdue_tasks": sum(
                1 for t in p_tasks
                if t.due_date and t.due_date < today and t.status != "done"
            ),
        })

    return jsonify({
        "stats": {
            "total_projects": len(project_ids),
            "total_tasks": total_tasks,
            "todo": todo_count,
            "in_progress": in_progress_count,
            "done": done_count,
            "overdue": len(overdue_tasks),
        },
        "my_tasks": {
            "total": len(my_tasks),
            "todo": my_todo,
            "in_progress": my_in_progress,
            "done": my_done,
        },
        "overdue_tasks": [t.to_dict() for t in overdue_tasks[:10]],
        "recent_tasks": [t.to_dict() for t in recent_tasks],
        "projects": project_summaries,
    }), 200
