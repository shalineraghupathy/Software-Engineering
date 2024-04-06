from flask import Flask
from flask_cors import CORS

from DublinBikes.flask_app.config.extensions import db, migrate
from DublinBikes.flask_app.config.setting import config


# 在init文件中做完一切初始化
def create_app(config_name='development'):
    # 注册名称
    app = Flask('app')
    app.config.from_object(config[config_name])
    # 蓝图接口
    register_db(app)
    # register_shell_context(app)
    # register_request_handlers(app)
    # register_commands(app)
    # enable CORS
    CORS(app, resources={r'/*': {'origins': '*'}})

    return app


def register_db(app):
    db.init_app(app)
    migrate.init_app(app)

