# Campus Care: Maintenance Request Tracker

Campus Care is a small campus helpdesk project. A requester submits a maintenance request, an admin approves or rejects it with a written response, and the requester checks the decision using their ticket number and email.

## Run it on Windows

MySQL Server or XAMPP's MariaDB must be running. Open PowerShell in this project folder.

### 1. Prepare the database

For a new database, sign in to MySQL:

```powershell
mysql -u root -p
```

At the `mysql>` prompt, run:

```text
source C:/Users/manor/Desktop/DBMS/schema.sql
source C:/Users/manor/Desktop/DBMS/seed.sql
exit
```

If using XAMPP with its default blank root password, open the XAMPP Shell and run `mysql -u root` (without `-p`), then enter the same `source` commands above.

If you already created the database using the earlier version of this project, run `migrate_approval.sql` **once** before `seed.sql`:

```text
source C:/Users/manor/Desktop/DBMS/migrate_approval.sql
source C:/Users/manor/Desktop/DBMS/seed.sql
```

### 2. Install the Python packages

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Configure passwords

Create and edit the local configuration file:

```powershell
Copy-Item .env.example .env
notepad .env
```

Set `MYSQL_PASSWORD` to the password for your database user. For a fresh XAMPP database with no root password, leave it blank: `MYSQL_PASSWORD=`. Set `ADMIN_PASSWORD` to the password you want to use for the admin page. The example is `admin123`; change it for your demo. Save `.env`.

If `.env` already exists, do not overwrite it; open it in Notepad and add the `ADMIN_PASSWORD` and `SECRET_KEY` lines from `.env.example` if they are missing.

### 4. Start the app

```powershell
python app.py
```

Keep PowerShell open. Visit the requester page at <http://127.0.0.1:5000> and the admin page at <http://127.0.0.1:5000/admin>.

## Demo the approval flow

1. On the requester page, submit a request. Choose a unique ticket number and enter an email address you can reuse.
2. Open `/admin`, sign in with the `ADMIN_PASSWORD` from `.env`, and find the new request in the review queue.
3. Write a short response, then click **Approve** or **Reject**.
4. Return to the requester page. Enter the ticket number and the same email address in **Check the admin's decision**. The decision and admin response appear there.

The sample data includes examples you can look up: `7001` with `aarav@example.edu` is pending, `7002` with `nisha@example.edu` is approved, and `7004` with `isha@example.edu` is rejected.

## DBMS concepts shown

- Flask connects Python to MySQL/MariaDB through PyMySQL.
- Parameterized SQL stores request data; inserts and admin decisions are committed as transactions.
- The request table uses a primary key, a unique ticket number, and indexes.
- Admin reports use grouped SQL aggregation. The optional `mongodb_queries.js` companion demonstrates MongoDB CRUD, logical operators, aggregation, and indexing with this same maintenance-request topic.
- Approval responses are saved in the database and returned only when the requester supplies both the matching ticket number and email address.

## Files

| File | Purpose |
| --- | --- |
| `app.py` | Flask routes, database connection, request submission, lookup, and admin approval |
| `templates/index.html` | Request submission and result lookup page |
| `templates/admin.html` | Password-protected admin review page |
| `static/app.js` | Request and status lookup behavior |
| `static/admin.js` | Admin login, queue, and approve/reject behavior |
| `static/portal.css` | Requester and admin page layout |
| `schema.sql` | New database and table structure |
| `migrate_approval.sql` | One-time upgrade for the previous project schema |
| `seed.sql` | Sample requests with pending, approved, and rejected examples |
| `.env.example` | Example connection and admin settings |
| `mongodb_queries.js` | Optional MongoDB lab companion |

Do not share `.env`; it contains your local passwords and is excluded by `.gitignore`.
