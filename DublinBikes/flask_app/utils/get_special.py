from DublinBikes.flask_app.config.extensions import db
from DublinBikes.flask_app.model.bike_models import Availability
from sqlalchemy import func


def cascade_query_station_availability(stations_query, station_columns, availability_columns):
    """
    仅仅需要availability的第一个数据，就不用联级查询，直接first查询即可
    :param stations_query:
    :param station_columns:
    :param availability_columns:
    :return:
    """
    # 收集所有站点编号
    station_numbers = [getattr(station, 'number') for station in stations_query if getattr(station, 'number')]

    # 一次性查询所有站点的可用性数据
    # 使用 GROUP BY 和 func.min() 获取每个站点编号的第一条数据
    availability_data = db.session.query(Availability). \
        filter(Availability.number.in_(station_numbers)). \
        group_by(Availability.number). \
        having(func.min(Availability.id)). \
        all()

    # 创建一个字典，按站点编号映射可用性数据
    availability_dict = {availability.number: {column: getattr(availability, column) for column in availability_columns} for availability in availability_data}

    # 填充站点数据
    station_data = []
    for station in stations_query:
        k_dict = dict(zip(station_columns, [getattr(station, column) for column in station_columns]))
        number = k_dict.get('number')
        if number:
            availability_info = availability_dict.get(number, {special: 0 for special in availability_columns})
            k_dict.update(availability_info)
        else:
            k_dict.update({special: 0 for special in availability_columns})
        station_data.append(k_dict)

    return station_data

