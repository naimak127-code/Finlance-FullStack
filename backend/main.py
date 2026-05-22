import hashlib
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi_mail import FastMail, MessageSchema, MessageType, ConnectionConfig
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from sqlalchemy import ForeignKey
import uuid

# 1. DATABASE SETUP (Must come before the Classes!)
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:320042280@localhost:3306/finlance_db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. TABLES (These use 'Base', which is now defined above)
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String (255), unique=False)
    password = Column(String (255))
    email = Column(String (255), unique=True)
    is_active = Column(Boolean, default=False)
    verification_token = Column(String(255))   # A unique random string
    

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    date = Column(String (255))
    type = Column(String (255))
    desc = Column(String (255))
    amount = Column(Float)
    category = Column(String (255))
    account = Column(String (255))
    user_id = Column(Integer, ForeignKey("users.id"))

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(255))
    limit = Column(Float)

    user_id = Column(Integer, ForeignKey("users.id"))

class UserCategory(Base):
    __tablename__ = "user_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255))

    user_id = Column(Integer, ForeignKey("users.id"))

class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255))

    user_id = Column(Integer, ForeignKey("users.id"))

# Create the tables in the database file
Base.metadata.create_all(bind=engine)

# 3. APP SETUP
app = FastAPI()

conf = ConnectionConfig(
    MAIL_USERNAME = "naimak127@gmail.com",
    MAIL_PASSWORD = "dvohlfwcjnxbzicc",
    MAIL_FROM = "naimak127@gmail.com",
    MAIL_PORT = 587,
    MAIL_SERVER = "smtp.gmail.com",
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to read data from the database
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 4. DATA MODELS (For reading what the frontend sends)
class TransactionCreate(BaseModel):
    date: str
    type: str
    desc: str
    amount: float
    category: str
    account: str
    user_id: int

class BudgetCreate(BaseModel):
    category: str
    limit: float
    user_id: int

class ProfileUpdate(BaseModel):
    username: str
    email: str

class CategoryCreate(BaseModel):
    name: str
    user_id: int

class AccountCreate(BaseModel):
    name: str
    user_id: int
    

# 5. ROUTES (The Librarian's Tasks)

@app.post("/register")
async def register(username: str, email: str, password: str, db: Session = Depends(get_db)):
    token = str(uuid.uuid4())
    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    new_user = User(
        username=username, 
        email=email, 
        password=hashed_password,
        verification_token=token,
        is_active=False 
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        print(e)
        return {"error": str(e)}

    try:
        verification_url = f"http://localhost:8000/verify/{token}"
        message = MessageSchema(
            subject="Verify your FinEase Account",
            recipients=[email], # FIXED: Changed from user.email to email
            body=f"Click here to verify: {verification_url}",
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        return {
        "status": "success",
        "message": "Check your email!",
        "id": new_user.id
    }

    except Exception as e:
        print(f"Email failed: {e}")
        return {"status": "partial_success", "message": "User created, but email failed."} 

@app.get("/verify/{token}")
        
async def verify_user(token: str, db: Session = Depends(get_db)):
    # Look for the user with this specific token
    user = db.query(User).filter(User.verification_token == token).first()
    
    if not user:
        return {"error": "Invalid or expired token."}
    
    # Update the user status
    user.is_active = True
    user.verification_token = None # Optional: Clear the token after use
    db.commit()
    
    return {"message": "Account verified! You can now log in."}

        
@app.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):

    email = email.strip()
    password = password.strip()

    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    user = db.query(User).filter(User.email == email).first()

    if not user:
        return {
            "status": "fail",
            "message": "Wrong email"
        }

    if user.password != hashed_password:
        return {"status": "fail", 
        "message": "Incorrect password"}

    # Email not verified
    if user.is_active == False:
        return {
            "status": "fail",
            "message": "Please verify your email before logging in."
        }
    return {
      "status": "success",
      "id": user.id,
      "email": user.email,
      "username": user.username
}
    

@app.get("/transactions")
def read_transactions(user_id: int, db: Session = Depends(get_db)):
    return db.query(Transaction).filter(Transaction.user_id == user_id).all()

@app.post("/transactions")
def create_transaction(tx: TransactionCreate, db: Session = Depends(get_db)):

    new_tx = Transaction(
        date=tx.date,
        type=tx.type,
        desc=tx.desc,
        amount=tx.amount,
        category=tx.category,
        account=tx.account,
        user_id=tx.user_id
    )

    db.add(new_tx)
    db.commit()

    db.refresh(new_tx)

    return {
    "message": "Success!",
    "transaction": {
        "id": new_tx.id,
        "date": new_tx.date,
        "type": new_tx.type,
        "desc": new_tx.desc,
        "amount": new_tx.amount,
        "category": new_tx.category,
        "account": new_tx.account,
        "user_id": new_tx.user_id
    }
}

@app.put("/transactions/{transaction_id}")
def update_transaction(
    transaction_id: int,
    tx: TransactionCreate,
    db: Session = Depends(get_db)
):

    existing_tx = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()

    if not existing_tx:
        return {"status": "fail", "message": "Transaction not found"}

    existing_tx.date = tx.date
    existing_tx.type = tx.type
    existing_tx.desc = tx.desc
    existing_tx.amount = tx.amount
    existing_tx.category = tx.category
    existing_tx.account = tx.account
    existing_tx.user_id = tx.user_id

    db.commit()

    return {
        "status": "success",
        "message": "Transaction updated"
    }

@app.delete("/transactions/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):

    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()

    if not transaction:
        return {
            "status": "fail",
            "message": "Transaction not found"
        }

    db.delete(transaction)
    db.commit()

    return {
        "status": "success",
        "message": "Transaction deleted"
    }

@app.get("/budgets")
def get_budgets(user_id: int, db: Session = Depends(get_db)):

    return db.query(Budget).filter(
        Budget.user_id == user_id
    ).all()


@app.post("/budgets")
def add_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(Budget).filter(
        Budget.category == budget.category,
        Budget.user_id == budget.user_id
    ).first()

    if existing:

        existing.limit = budget.limit
        db.commit()
        db.refresh(existing)

        return {
            "status": "updated",
            "budget": {
                "id": existing.id,
                "category": existing.category,
                "limit": existing.limit,
                "user_id": existing.user_id
            }
        }

    new_budget = Budget(
        category=budget.category,
        limit=budget.limit,
        user_id=budget.user_id
    )

    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)

    return {
        "status": "created",
        "budget": {
            "id": new_budget.id,
            "category": new_budget.category,
            "limit": new_budget.limit,
            "user_id": new_budget.user_id
        }
    }


@app.put("/budgets/{budget_id}")
def update_budget(
    budget_id: int,
    budget: BudgetCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(Budget).filter(
        Budget.id == budget_id
    ).first()

    if not existing:
        return {
            "status": "fail",
            "message": "Budget not found"
        }

    existing.category = budget.category
    existing.limit = budget.limit
    existing.user_id = budget.user_id

    db.commit()

    return {
        "status": "success",
        "message": "Budget updated"
    }


@app.delete("/budgets/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db)
):

    budget = db.query(Budget).filter(
        Budget.id == budget_id
    ).first()

    if not budget:
        return {
            "status": "fail",
            "message": "Budget not found"
        }

    db.delete(budget)
    db.commit()

    return {
        "status": "success",
        "message": "Budget deleted"
    }

@app.put("/users/{user_id}")
def update_user(
    user_id: int,
    profile: ProfileUpdate,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        return {
            "status": "fail",
            "message": "User not found"
        }

    user.username = profile.username
    user.email = profile.email

    db.commit()

    return {
        "status": "success",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    }

@app.get("/categories")
def get_categories(user_id: int, db: Session = Depends(get_db)):

    return db.query(UserCategory).filter(
        UserCategory.user_id == user_id
    ).all()

@app.post("/categories")
def add_category(
    category: CategoryCreate,
    db: Session = Depends(get_db)
):

    new_category = UserCategory(
        name=category.name,
        user_id=category.user_id
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category

@app.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db)
):

    category = db.query(UserCategory).filter(
        UserCategory.id == category_id
    ).first()

    if category:
        db.delete(category)
        db.commit()

    return {"status": "success"}

@app.get("/accounts")
def get_accounts(user_id: int, db: Session = Depends(get_db)):

    return db.query(UserAccount).filter(
        UserAccount.user_id == user_id
    ).all()

@app.post("/accounts")
def add_account(
    account: AccountCreate,
    db: Session = Depends(get_db)
):

    new_account = UserAccount(
        name=account.name,
        user_id=account.user_id
    )

    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return new_account

@app.delete("/accounts/{account_id}")
def delete_account(
    account_id: int,
    db: Session = Depends(get_db)
):

    account = db.query(UserAccount).filter(
        UserAccount.id == account_id
    ).first()

    if account:
        db.delete(account)
        db.commit()

    return {"status": "success"}