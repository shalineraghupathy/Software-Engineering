import time

import flask
import requests
from flask import request, jsonify
from DublinBikes.flask_app.config.extensions import db
from DublinBikes.flask_app.model.bike_models import Station, Availability
from DublinBikes.flask_app.utils.get_special import cascade_query_station_availability

bp_api = flask.Blueprint("bp_api", __name__, url_prefix="/api")


@bp_api.get('/search-stations')
def search_stations():
    search_term = request.args.get('term', '')

    if search_term == 'free-bikes':
        stations = db.session.query(Station).join(Availability).filter(Availability.available_bikes > 0).all()
    elif search_term == 'free-stands':
        stations = db.session.query(Station).join(Availability).filter(Availability.available_bike_stands > 0).all()
    else:
        stations = db.session.query(Station).filter(Station.name.like(f'%{search_term}%')).all()
    station_columns = ['number', 'name', 'address', 'position_lat', 'position_long', 'bike_stands']
    availability_columns = ['available_bikes', 'available_bike_stands']
    station_data = cascade_query_station_availability(stations, station_columns, availability_columns)

    return jsonify({'stations': station_data})


@bp_api.get('/stations')
def get_stations():
    # 获取所有站点的静态信息
    stations = db.session.query(Station).all()
    station_data = [
        {
            'number': station.number,
            'name': station.name,
            'address': station.address,
            'position_lat': station.position_lat,
            'position_long': station.position_long,
            'bike_stands': station.bike_stands,
        }
        for station in stations
    ]
    return jsonify({'stations': station_data})


@bp_api.get('/weather')
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
            # 'weather_description': weather_data['weather'][0]['description'],
            # 'weather_icon': weather_data['weather'][0]['icon'],
            # 可以继续添加需要的字段...
        })
    else:
        return jsonify({'error': 'Failed to fetch weather data'}), response.status_code


@bp_api.get('/free-bikes')
def free_bikes():
    # 构建子查询以找到每个站点最新的可用性记录ID
    subquery = db.session.query(
        Availability.number,
        db.func.max(Availability.id).label('latest_id')
    ).group_by(Availability.number).subquery()

    # 使用子查询结果，只查询与最新记录匹配的站点和可用性信息
    stations_with_free_bikes = db.session.query(Station).join(
        Availability, Station.number == Availability.number
    ).join(
        subquery, Availability.id == subquery.c.latest_id
    ).filter(Availability.available_bikes > 0).all()
    station_columns = ['number', 'name', 'address', 'position_lat', 'position_long']
    availability_columns = ['available_bikes']
    station_data = cascade_query_station_availability(stations_with_free_bikes, station_columns, availability_columns)

    return jsonify({'stations': station_data})


@bp_api.get('/free-stands')
def free_stands():
    # 构建子查询以找到每个站点最新的可用性记录ID
    subquery = db.session.query(
        Availability.number,
        db.func.max(Availability.id).label('latest_id')
    ).group_by(Availability.number).subquery()

    # 使用子查询结果，只查询与最新记录匹配的站点和可用性信息
    stations_with_free_stands = db.session.query(Station).join(
        Availability, Station.number == Availability.number
    ).join(
        subquery, Availability.id == subquery.c.latest_id
    ).filter(Availability.available_bike_stands > 0).all()
    # 构造响应数据
    station_columns = ['number', 'name', 'address', 'position_lat', 'position_long']
    availability_columns = ['available_bike_stands']
    station_data = cascade_query_station_availability(stations_with_free_stands, station_columns, availability_columns)
    return jsonify({'stations': station_data})
