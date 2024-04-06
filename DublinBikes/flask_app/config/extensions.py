from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from flask_migrate import Migrate

db = SQLAlchemy()
metadata_obj = MetaData()
migrate = Migrate(db=db)
