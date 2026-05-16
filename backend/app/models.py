from datetime import datetime, date
from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    memberships = db.relationship("ProjectMember", back_populates="user", cascade="all, delete-orphan")
    created_projects = db.relationship("Project", back_populates="creator", foreign_keys="Project.created_by")
    assigned_tasks = db.relationship("Task", back_populates="assignee", foreign_keys="Task.assigned_to")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, default="")
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    creator = db.relationship("User", back_populates="created_projects", foreign_keys=[created_by])
    members = db.relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    tasks = db.relationship("Task", back_populates="project", cascade="all, delete-orphan")

    def to_dict(self, include_members=False, include_tasks=False):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "created_by": self.created_by,
            "creator": self.creator.to_dict() if self.creator else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "member_count": len(self.members),
            "task_count": len(self.tasks),
        }
        if include_members:
            data["members"] = [m.to_dict() for m in self.members]
        if include_tasks:
            data["tasks"] = [t.to_dict() for t in self.tasks]
        return data


class ProjectMember(db.Model):
    __tablename__ = "project_members"

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(10), default="member")  # 'admin' or 'member'

    # Relationships
    project = db.relationship("Project", back_populates="members")
    user = db.relationship("User", back_populates="memberships")

    __table_args__ = (db.UniqueConstraint("project_id", "user_id", name="unique_project_member"),)

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "user_id": self.user_id,
            "role": self.role,
            "user": self.user.to_dict() if self.user else None,
        }


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default="")
    status = db.Column(db.String(20), default="todo")  # todo, in_progress, done
    priority = db.Column(db.String(10), default="medium")  # low, medium, high
    due_date = db.Column(db.Date, nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = db.relationship("Project", back_populates="tasks")
    assignee = db.relationship("User", back_populates="assigned_tasks", foreign_keys=[assigned_to])
    creator = db.relationship("User", foreign_keys=[created_by])

    def to_dict(self):
        is_overdue = False
        if self.due_date and self.status != "done":
            is_overdue = self.due_date < date.today()

        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "priority": self.priority,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "project_id": self.project_id,
            "assigned_to": self.assigned_to,
            "assignee": self.assignee.to_dict() if self.assignee else None,
            "created_by": self.created_by,
            "creator": self.creator.to_dict() if self.creator else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "is_overdue": is_overdue,
        }
