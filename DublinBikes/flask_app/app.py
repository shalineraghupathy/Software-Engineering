import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
import requests
from flask import Flask, render_template
from flask_cors import CORS
from DublinBikes.Scrapper.bike.bike_models import Station, Availability
# 从环境变量中读取敏感信息
api_key = os.getenv('OPENWEATHERMAP_API_KEY', "5b103a5aa9cd52cd178d63c3c83ad6ec")
db_username = os.getenv('DB_USERNAME', 'evanSE')
db_password = os.getenv('DB_PASSWORD', '2686336654lyh')
db_name = os.getenv('DB_NAME', 'DublinBike')
db_endpoint = os.getenv('DB_ENDPOINT', 'dublinbike-database.cx6eqc4uyqzi.eu-north-1.rds.amazonaws.com')
db_port = os.getenv('DB_PORT', '3306')

# 设置 Flask 应用和数据库
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{db_username}:{db_password}@{db_endpoint}:{db_port}/{db_name}?'
db = SQLAlchemy(app)
CORS(app)
# 导入模型
from DublinBikes.Scrapper.bike.bike_models import Station, Availability
from DublinBikes.Scrapper.weather.weather_model import Weather

# 后端路由
@app.route('/Overall.html')
def index():
    # 使用 render_template 渲染并返回 index.html
    return render_template('Overall.html')
@app.route('/')
def overall():
    # 使用 render_template 渲染并返回 index.html
    return render_template('index.html')
@app.route('/api/search-stations', methods=['GET'])
def search_stations():
    search_term = request.args.get('term', '')
    session = db.session

    if search_term == 'free-bikes':
        stations = session.query(Station).join(Availability).filter(Availability.available_bikes > 0).all()
    elif search_term == 'free-stands':
        stations = session.query(Station).join(Availability).filter(Availability.available_bike_stands > 0).all()
    else:
        stations = session.query(Station).filter(Station.name.like(f'%{search_term}%')).all()

    station_data = [{
        'number': station.number,
        'name': station.name,
        'address': station.address,
        'position_lat': station.position_lat,
        'position_long': station.position_long,
        'bike_stands': station.bike_stands,
        'available_bikes': station.availability[0].available_bikes if station.availability else 0,
        'available_bike_stands': station.availability[0].available_bike_stands if station.availability else 0
    } for station in stations]

    session.close()
    return jsonify({'stations': station_data})


@app.route('/api/stations', methods=['GET'])
def get_stations():
    # 获取所有站点的静态信息
    session = db.session
    stations = session.query(Station).all()
    station_data = [
        {
            'number': station.number,
            'name': station.name,
            'address': station.address,
            'position_lat': station.position_lat,
            'position_long': station.position_long,
            'bike_stands': station.bike_stands,
            # 不包括动态数据，如available_bikes和available_bike_stands
        }
        for station in stations
    ]
    session.close()
    return jsonify({'stations': station_data})

@app.route('/api/availabilities', methods=['GET'])
def get_availabilities():
    # 获取所有站点的动态可用性信息
    session = db.session
    availabilities = session.query(Availability).all()
    availability_data = [
        {
            'number': availability.number,
            'available_bikes': availability.available_bikes,
            'available_bike_stands': availability.available_bike_stands,
            'last_update': availability.last_update,
            'status': availability.status
        }
        for availability in availabilities
    ]
    session.close()
    return jsonify({'availabilities': availability_data})

@app.route('/api/weather', methods=['GET'])
def get_weather():
    api_key = '5b103a5aa9cd52cd178d63c3c83ad6ec'
    city = "Dublin"  # 假设查询的城市
    countrycode = "IE"  # 和国家代码
    url = f'https://api.openweathermap.org/data/2.5/weather?q={city},{countrycode}&appid={api_key}&units=metric'
    response = requests.get(url)

    if response.status_code == 200:
        weather_data = response.json()
        # 包括天气主要状况和描述，以及其他你希望展示的信息
        return jsonify({
            'temperature': weather_data['main']['temp'],
            'humidity': weather_data['main']['humidity'],
            'weather_main': weather_data['weather'][0]['main'],
            'weather_description': weather_data['weather'][0]['description'],
            'weather_icon': weather_data['weather'][0]['icon'],
            # 可以继续添加需要的字段...
        })
    else:
        return jsonify({'error': 'Failed to fetch weather data'}), response.status_code


@app.route('/api/free-bikes', methods=['GET'])
def free_bikes():
    stations_with_free_bikes = db.session.query(Station).join(Availability).filter(Availability.available_bikes > 0).all()
    station_data = [
        {
            'number': station.number,
            'name': station.name,
            'address': station.address,
            'position_lat': station.position_lat,
            'position_long': station.position_long,
            'available_bikes': [availability.available_bikes for availability in station.availability]  # 假设每个站点可能有多条availability记录
        } for station in stations_with_free_bikes
    ]
    return jsonify({'stations': station_data})

@app.route('/api/free-stations', methods=['GET'])
def free_stands():
    stations_with_free_stands = db.session.query(Station).join(Availability).filter(Availability.available_bike_stands > 0).all()
    station_data = [
        {
            'number': station.number,
            'name': station.name,
            'address': station.address,
            'position_lat': station.position_lat,
            'position_long': station.position_long,
            'available_bike_stands': [availability.available_bike_stands for availability in station.availability]  # 假设每个站点可能有多条availability记录
        } for station in stations_with_free_stands
    ]
    return jsonify({'stations': station_data})

if __name__ == '__main__':
    app.run(debug=True)