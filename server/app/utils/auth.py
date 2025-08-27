from passlib.context import CryptContext
from typing import Optional

# 创建密码上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """对密码进行哈希加密"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码是否正确"""
    return pwd_context.verify(plain_password, hashed_password)


def authenticate_user(username: str, password: str, user_password_hash: str) -> bool:
    """验证用户身份"""
    if not verify_password(password, user_password_hash):
        return False
    return True