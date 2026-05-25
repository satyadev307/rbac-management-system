# RBAC Management System

A full-stack Role Based Access Control (RBAC) Management System built using Flask, JWT Authentication, HTML, CSS, and JavaScript.

---

# Features

## Authentication
- User Login
- JWT Token Authentication
- Secure Password Hashing

## Role Management
- Add Roles
- View Roles
- Delete Roles

## User Management
- Add Users
- Edit Users
- Delete Users
- Search Users

## Permission Management
- Read / Write / Delete Permissions
- Role-based Access Control
- Frontend + Backend Permission Enforcement

## Dashboard
- Admin Dashboard UI
- Statistics Cards
- Search & Filter
- Toast Notifications
- Confirmation Modals

---

# Tech Stack

## Backend
- Flask
- Flask-JWT-Extended
- Flask-Bcrypt
- SQLAlchemy
- SQLite

## Frontend
- HTML
- CSS
- JavaScript

---

# Installation

## Clone Repository

```bash
git clone https://github.com/satyadev307/rbac-management-system.git
```

## Create Virtual Environment

```bash
python -m venv venv
```

## Activate Virtual Environment

### Windows

```bash
venv\Scripts\activate
```

## Install Dependencies

```bash
pip install -r requirements.txt
```

## Run Flask App

```bash
python app.py
```

---

# API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /login | Login |
| POST | /register | Register User |
| GET | /users | Get Users |
| POST | /add-roles | Add Roles |
| GET | /roles | Get Roles |
| POST | /set-permission | Set Permissions |

---

# Future Improvements

- Pagination
- Charts & Analytics
- Dark Mode
- Deployment
- Mobile Responsive Design

---

# Author

Satyadev