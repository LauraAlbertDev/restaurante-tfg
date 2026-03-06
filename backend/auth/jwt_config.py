from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "super_secret_key_123456"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 2
