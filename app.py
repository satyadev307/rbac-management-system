from flask_cors import CORS
from flask import Flask, request, jsonify
from extensions import db
from models import Role, User, Permission

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)  

from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager, jwt_required, get_jwt_identity, create_access_token
)

import os
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", "dev-secret")

bcrypt = Bcrypt(app)
jwt = JWTManager(app)

def is_first_setup():
    return Role.query.count() == 0

@app.route("/")
def home():
    return {
        "message": "RBAC Management System API is Running Successfully"
    }


@app.route('/add-roles', methods=['POST'])
def add_roles():

    if not is_first_setup():
        # only require JWT after first setup
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request()
        current_user_id = int(get_jwt_identity())

        if not check_permission(current_user_id, "delete"):
            return jsonify({"error": "Permission denied"}), 403

    data = request.get_json() or {}
    roles = data.get('roles')

    if not roles:
        return jsonify({"error": "No roles provided"}), 400

    added_roles = []
    duplicate_roles = []

    for role_name in roles:
        if not role_name.strip():
           return jsonify({
            "error": "Role name cannot be empty"
        }), 400
        existing = Role.query.filter_by(role_name=role_name).first()

        if existing:
            duplicate_roles.append(role_name)
        else:
            db.session.add(Role(role_name=role_name))
            added_roles.append(role_name)

    db.session.commit()

    return jsonify({
        "added": added_roles,
        "duplicates": duplicate_roles
    })

@app.route('/roles', methods=['GET'])
@jwt_required()
def get_roles():
    roles = Role.query.all()

    result = []
    for role in roles:
        result.append({
            "id": role.id,
            "role_name": role.role_name
        })

    return jsonify(result)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role_id = data.get('role_id')

    if not name or not email or not password or not role_id:
        return jsonify({"error": "Missing fields"}), 400
    
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"error": "Invalid role_id"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "User already exists"}), 400

    # 🔐 hash password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    new_user = User(
        name=name,
        email=email,
        password=hashed_password,
        role_id=role_id
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"})

@app.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    users = User.query.all()

    result = []
    for user in users:
        role = Role.query.get(user.role_id)

        result.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": role.role_name if role else None
        })

    return jsonify(result)



@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}

    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Invalid credentials"}), 401

    # 🎫 create token
    access_token = create_access_token(identity=str(user.id))

    return jsonify({"token": access_token})

def is_first_permission_setup():
    return Permission.query.count() == 0
@app.route('/set-permission', methods=['POST'])
@jwt_required()
def set_permission():
    current_user_id = int(get_jwt_identity())

    # ✅ allow first-time setup
    if not is_first_permission_setup():
        if not check_permission(current_user_id, "delete"):
            return jsonify({"error": "Permission denied"}), 403

    data = request.get_json() or {}

    role_id = data.get('role_id')
    can_read = data.get('can_read', False)
    can_write = data.get('can_write', False)
    can_delete = data.get('can_delete', False)

    if not role_id:
        return jsonify({"error": "role_id required"}), 400

    permission = Permission.query.filter_by(role_id=role_id).first()

    if permission:
        permission.can_read = can_read
        permission.can_write = can_write
        permission.can_delete = can_delete
    else:
        permission = Permission(
            role_id=role_id,
            can_read=can_read,
            can_write=can_write,
            can_delete=can_delete
        )
        db.session.add(permission)

    db.session.commit()

    return jsonify({"message": "Permission set successfully"})

@app.route('/my-permissions', methods=['GET'])
@jwt_required()
def my_permissions():

    current_user_id = int(get_jwt_identity())

    user = db.session.get(User, current_user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    permission = Permission.query.filter_by(
        role_id=user.role_id
    ).first()

    if not permission:
        return jsonify({
            "can_read": False,
            "can_write": False,
            "can_delete": False
        })

    return jsonify({
        "can_read": permission.can_read,
        "can_write": permission.can_write,
        "can_delete": permission.can_delete
    })

@app.route('/permissions', methods=['GET'])
@jwt_required()
def get_permissions():
    permissions = Permission.query.all()

    result = []
    for p in permissions:
        result.append({
            "role_id": p.role_id,
            "can_read": p.can_read,
            "can_write": p.can_write,
            "can_delete": p.can_delete
        })

    return jsonify(result)

def check_permission(user_id, action):
    user = db.session.get(User, user_id)
    if not user:
        return False

    permission = Permission.query.filter_by(role_id=user.role_id).first()
    if not permission:
        return False

    if action == "read":
        return permission.can_read
    elif action == "write":
        return permission.can_write
    elif action == "delete":
        return permission.can_delete

    return False

@app.route('/delete-user/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):

    current_user_id = int(get_jwt_identity())

    if current_user_id == user_id:
        return jsonify({"error": "You cannot delete yourself"}), 400

    if not check_permission(current_user_id, "delete"):
        return jsonify({"error": "Permission denied"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User deleted"})

@app.route('/update-user/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):

    current_user_id = int(get_jwt_identity())

    # permission check
    if not check_permission(current_user_id, "write"):
        return jsonify({"error": "Permission denied"}), 403

    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}

    user.name = data.get("name", user.name)
    user.email = data.get("email", user.email)

    db.session.commit()

    return jsonify({
        "message": "User updated successfully"
    })



@app.route('/delete-role/<int:role_id>', methods=['DELETE'])
@jwt_required()
def delete_role(role_id):
    # 🔹 get current user (for testing)
    current_user_id = int(get_jwt_identity())

    
    # 🔐 Step 1: Permission check
    if not check_permission(current_user_id, "delete"):
        return jsonify({"error": "Permission denied"}), 403

    # 🔍 Step 2: Check role exists
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"error": "Role not found"}), 404

    # 🚫 Step 3: Check dependencies (users)
    users = User.query.filter_by(role_id=role_id).all()
    if users:
        return jsonify({
            "error": "Role is assigned to users. Cannot delete."
        }), 400

    # 🧹 Step 4: Delete permissions
    Permission.query.filter_by(role_id=role_id).delete()

    # 🗑 Step 5: Delete role
    db.session.delete(role)
    db.session.commit()

    return jsonify({"message": "Role deleted successfully"})



if __name__ == '__main__':
    with app.app_context():

      db.create_all()

    # Create Admin Role
    admin_role = Role.query.filter_by(role_name="Admin").first()

    if not admin_role:
        admin_role = Role(role_name="Admin")
        db.session.add(admin_role)
        db.session.commit()
        print("✅ Admin Role Created")

    # Create Admin User
    admin_user = User.query.filter_by(
        email="admin@gmail.com"
    ).first()

    if not admin_user:

        hashed_password = bcrypt.generate_password_hash(
            "admin123"
        ).decode("utf-8")

        new_admin = User(
            name="Admin",
            email="admin@gmail.com",
            password=hashed_password,
            role_id=admin_role.id
        )

        db.session.add(new_admin)
        db.session.commit()

        print("✅ Admin User Created")
    if __name__ == "__main__":
       app.run(host="0.0.0.0", port=5000)