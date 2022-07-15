import os

from dotenv import load_dotenv
from peewee import MySQLDatabase, Model
from peewee import CharField


load_dotenv()

db = MySQLDatabase(
    os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PW"),
    host=os.getenv("DB_HOST"),
    port=int(os.getenv("DB_PORT"))
)


class BaseModel(Model):
    """Base Model class used for creating new tables."""

    class Meta:
        database = db


class Login(BaseModel):
    user = CharField(primary_key=True)
    pw = CharField()
