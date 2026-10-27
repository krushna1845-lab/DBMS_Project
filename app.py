"""Campus Care request portal and password-protected admin review page."""

from __future__ import annotations

import hmac
import os
import re
from decimal import Decimal
from functools import wraps

import pymysql
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, session
from pymysql.cursors import DictCursor

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "campus-care-local-demo-secret-change-this")
PRIORITIES = {"Low", "Medium", "High"}
DECISIONS = {"Approved", "Rejected"}


def db_connection():
    return pymysql.connect(
        host=os.getenv("MYSQL_HOST", "127.0.0.1"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DATABASE", "campus_care"),
        cursorclass=DictCursor,
        autocommit=False,
        connect_timeout=4,
    )


def rows_as_json(rows):
    return [{key: float(value) if isinstance(value, Decimal) else value for key, value in row.items()} for row in rows]


def error(message, status=400):
    return jsonify({"error": message}), status


def admin_required(route):
    @wraps(route)
    def wrapped(*args, **kwargs):
        if not session.get("is_admin"):
            return error("Admin sign-in is required.", 401)
        return route(*args, **kwargs)
    return wrapped


def validate_ticket(data):
    title = str(data.get("title", "")).strip()
    requester = str(data.get("requester", "")).strip()
    email = str(data.get("contact_email", "")).strip().lower()
    category = str(data.get("category", "")).strip()
    location = str(data.get("location", "")).strip()
    details = str(data.get("details", "")).strip()
    priority = str(data.get("priority", "Medium")).strip()
    try:
        ticket_no = int(data.get("ticket_no"))
    except (TypeError, ValueError):
        raise ValueError("Ticket number must be a positive whole number.")
    if ticket_no < 1:
        raise ValueError("Ticket number must be a positive whole number.")
    if not title or not requester or not category or not location or not email:
        raise ValueError("Please complete all required fields.")
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise ValueError("Enter a valid email address so you can check the decision later.")
    if priority not in PRIORITIES:
        raise ValueError("Choose a valid priority.")
    if len(title) > 120 or len(requester) > 100 or len(email) > 254 or len(category) > 60 or len(location) > 100 or len(details) > 500:
        raise ValueError("One or more fields are too long.")
    return (ticket_no, title, requester, email, category, location, priority, details)


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/admin")
def admin_page():
    return render_template("admin.html")


@app.get("/api/health")
def health():
    try:
        with db_connection() as conn, conn.cursor() as cursor:
            cursor.execute("SELECT 1 AS connected")
            cursor.fetchone()
        return jsonify({"status": "ok", "database": "Connected"})
    except pymysql.MySQLError as exc:
        return jsonify({"status": "error", "database": str(exc)}), 503


@app.post("/api/tickets")
def create_ticket():
    try:
        values = validate_ticket(request.get_json(silent=True) or {})
        with db_connection() as conn, conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO maintenance_requests "
                "(ticket_no, title, requester, contact_email, category, location, priority, status, details, approval_status) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, 'Open', %s, 'Pending')",
                values,
            )
            conn.commit()
            return jsonify({"message": "Request submitted for admin review.", "ticket_no": values[0]}), 201
    except ValueError as exc:
        return error(str(exc))
    except pymysql.err.IntegrityError:
        return error("That ticket number already exists. Please choose another.", 409)
    except pymysql.MySQLError as exc:
        return error(f"Could not submit request: {exc}", 503)


@app.get("/api/track")
def track_ticket():
    ticket_no = request.args.get("ticket_no", "").strip()
    email = request.args.get("email", "").strip().lower()
    if not ticket_no.isdigit() or not email:
        return error("Enter the ticket number and the email address used when submitting it.")
    try:
        with db_connection() as conn, conn.cursor() as cursor:
            cursor.execute(
                "SELECT ticket_no, title, status, approval_status, admin_result, created_at, reviewed_at "
                "FROM maintenance_requests WHERE ticket_no=%s AND contact_email=%s",
                (int(ticket_no), email),
            )
            ticket = cursor.fetchone()
        if not ticket:
            return error("We couldn't find a request matching that ticket number and email.", 404)
        return jsonify(ticket)
    except pymysql.MySQLError as exc:
        return error(f"Could not look up request: {exc}", 503)


@app.get("/api/admin/session")
def admin_session():
    return jsonify({"authenticated": bool(session.get("is_admin"))})


@app.post("/api/admin/login")
def admin_login():
    password = str((request.get_json(silent=True) or {}).get("password", ""))
    expected = os.getenv("ADMIN_PASSWORD", "admin123")
    if not hmac.compare_digest(password, expected):
        return error("That admin password is not correct.", 401)
    session["is_admin"] = True
    return jsonify({"message": "Signed in."})


@app.post("/api/admin/logout")
def admin_logout():
    session.clear()
    return jsonify({"message": "Signed out."})


@app.get("/api/admin/requests")
@admin_required
def admin_requests():
    try:
        with db_connection() as conn, conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, ticket_no, title, requester, contact_email, category, location, priority, "
                "status, details, approval_status, admin_result, created_at, reviewed_at "
                "FROM maintenance_requests "
                "ORDER BY FIELD(approval_status, 'Pending', 'Approved', 'Rejected'), created_at DESC"
            )
            return jsonify(rows_as_json(cursor.fetchall()))
    except pymysql.MySQLError as exc:
        return error(f"Could not load admin requests: {exc}", 503)


@app.get("/api/admin/analytics")
@admin_required
def admin_analytics():
    try:
        with db_connection() as conn, conn.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) AS total_requests, "
                "COALESCE(SUM(approval_status='Pending'), 0) AS pending, "
                "COALESCE(SUM(approval_status='Approved'), 0) AS approved, "
                "COALESCE(SUM(approval_status='Rejected'), 0) AS rejected "
                "FROM maintenance_requests"
            )
            summary = cursor.fetchone()
            cursor.execute(
                "SELECT category, COUNT(*) AS request_count FROM maintenance_requests "
                "GROUP BY category ORDER BY request_count DESC, category ASC"
            )
            categories = cursor.fetchall()
        return jsonify({"summary": summary, "categories": categories})
    except pymysql.MySQLError as exc:
        return error(f"Could not calculate admin report: {exc}", 503)


@app.post("/api/admin/requests/<int:request_id>/decision")
@admin_required
def decide_request(request_id):
    data = request.get_json(silent=True) or {}
    decision = str(data.get("decision", "")).strip()
    result = str(data.get("result", "")).strip()
    if decision not in DECISIONS:
        return error("Choose approve or reject.")
    if not result:
        return error("Write a short response for the person who submitted the request.")
    if len(result) > 500:
        return error("The response must be 500 characters or fewer.")
    try:
        with db_connection() as conn, conn.cursor() as cursor:
            cursor.execute(
                "UPDATE maintenance_requests SET approval_status=%s, admin_result=%s, reviewed_at=NOW(), "
                "status=CASE WHEN %s='Approved' AND status='Open' THEN 'In Progress' ELSE status END "
                "WHERE id=%s",
                (decision, result, decision, request_id),
            )
            if cursor.rowcount == 0:
                cursor.execute("SELECT id FROM maintenance_requests WHERE id=%s", (request_id,))
                if not cursor.fetchone():
                    conn.rollback()
                    return error("Request not found.", 404)
            conn.commit()
        return jsonify({"message": f"Request {decision.lower()} and response saved."})
    except pymysql.MySQLError as exc:
        return error(f"Could not save decision: {exc}", 503)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=True)
