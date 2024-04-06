# 从环境变量中读取敏感信息
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL
from DublinBikes.flask_app.config import dbconfig
# 设置 Flask 应用和数据库
basedir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))  # 当前文件所在文件夹的父文件夹

db_url = URL.create(
    drivername='mysql+pymysql',
    username=dbconfig.username,
    password=dbconfig.password,
    host=dbconfig.dbEndpoint,
    port=dbconfig.port,
    database=dbconfig.dbName
)

engine = create_engine(db_url, echo=False)


class DevelopmentConfig(object):
    SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{dbconfig.username}:{dbconfig.password}@{dbconfig.dbEndpoint}:{dbconfig.port}/{dbconfig.dbName}?'


# 本地和上线(因为你就一个服务器，就不用多不同的路由连接)
config = {
    'development': DevelopmentConfig,
}

