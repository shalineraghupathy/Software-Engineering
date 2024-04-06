from flask import render_template, Flask
from config import create_app
from bike.bike_route import bp_api


def register_blueprint(flask_app: Flask):
    """
    注册蓝图用的（模板路由）
    :param flask_app:
    :return:
    """
    flask_app.register_blueprint(bp_api)


# 初始化
app = create_app()
register_blueprint(app)


@app.route('/Overall.html')
def index():
    # 使用 render_template 渲染并返回 index.html
    return render_template('Overall.html')


@app.route('/')
def overall():
    # 使用 render_template 渲染并返回 index.html
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0')
