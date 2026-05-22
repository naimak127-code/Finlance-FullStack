Finlance - Backend (FastAPI)
This is the core engine of the Finlance application. It is a high-performance FastAPI server that handles all business logic, data persistence, and security protocols.

Key Backend Features
Email Verification: Integrated SMTP service to ensure users verify their identity before accessing the system.

JWT Authentication: Secure, stateless user sessions using JSON Web Tokens.

Complex Data Aggregation: Custom logic to calculate "Safe-to-Spend" balances across multiple accounts (HBL, Jazz Cash).

Budget Tracking Logic: Real-time calculation of expense percentages relative to user-defined limits.

PDF Report Engine: Automated generation of financial summaries for user downloads.

Tech Stack
Framework: FastAPI (Python)

Authentication: OAuth2 with JWT (jose, passlib)

Database: [Insert your DB, e.g., SQLAlchemy/PostgreSQL]

Email Service: SMTP (Mailtrap/Gmail for development)

Validation: Pydantic (for strict data typing)

Project Structure
app/main.py: The entry point for the FastAPI server.

app/auth: Logic for registration, login, and email verification.

app/models: Database schemas and structure.

app/routers: API endpoints for Transactions, Budgets, and Reports.


Development Setup
Install Dependencies:

Bash
pip install -r requirements.txt
Run the Server:

Bash
uvicorn main:app --reload
