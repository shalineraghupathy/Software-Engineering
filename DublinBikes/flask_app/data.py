import requests
import config
import db
import time
import datetime
import threading


def formatdate(value):
    return time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(value))


def fetch_bikes_data():
    params = {'apiKey': config.apiKey_b, 'contract': config.contract}
    response = requests.get(config.apiURI_b, params=params)
    if response.status_code == 200:
        stations = response.json()
        return stations
    else:
        print(f"Error: {response.status_code}")
        return None


def fetch_weather_data():
    params = {'q': f'{config.city},{config.countrycode}', 'appid': config.apiKey_w}
    response = requests.get(config.apiURI_w, params=params)

    if response.status_code == 200:
        data = response.json()
        return data
    else:
        print(f"Error: {response.status_code}")
        return None


def scrape_bikes_data():
    while True:
        stations = fetch_bikes_data()

        for station in stations:
            latitude = station.get('position', {}).get('lat', 0.0)
            longitude = station.get('position', {}).get('lng', 0.0)

            # Create a dictionary with the station data
            station_data = {
                'number': station['number'],
                'contract_name': station['contract_name'],
                'name': station['name'],
                'address': station['address'],
                'position_lat': latitude,
                'position_long': longitude,
                'banking': station['banking'],
                'bonus': station['bonus'],
                'bike_stands': station['bike_stands']
            }

            update_datetime = formatdate(station['last_update'] // 1000)

            # Create a dictionary with the availability data
            availability_data = {
                'number': station['number'],
                'available_bikes': station['available_bikes'],
                'available_bike_stands': station['available_bike_stands'],
                'last_update': update_datetime,
                'status': station['status']
            }

            db.add_or_update_station_data(station_data)
            db.add_availability_data(availability_data)
        print("Records pushed to db", datetime.datetime.now())
        print("Next load starts in 5 minutes")
        time.sleep(1 * 60)


def scrape_weather_data():
    while True:
        data = fetch_weather_data()
        # Check if 'weather' is a list and get the first element
        weather_info = data.get('weather', [{}])[0]

        position_lat = data.get('coord', {}).get('lat', 0.0)
        position_long = data.get('coord', {}).get('lon', 0.0)
        weather_id = weather_info.get('id', 0.0)
        weather_main = weather_info.get('main', "")
        weather_description = weather_info.get('description', "")
        weather_icon = weather_info.get('icon', 0.0)

        temperature = data.get('main', {}).get('temp', 0.0)
        feels_like = data.get('main', {}).get('feels_like', 0.0)
        temp_min = data.get('main', {}).get('temp_min', 0.0)
        temp_max = data.get('main', {}).get('temp_max', 0.0)
        pressure = data.get('main', {}).get('pressure', 0.0)
        humidity = data.get('main', {}).get('humidity', 0.0)
        visibility = data.get('visibility', 0.0)
        wind_speed = data.get('wind', {}).get('speed', 0.0)
        wind_deg = data.get('wind', {}).get('deg', 0.0)
        clouds_all = data.get('clouds', {}).get('all', 0.0)
        last_update = formatdate(data.get('dt', 0))
        sys_type = data.get('sys', {}).get('type', 0.0)
        sys_id = data.get('sys', {}).get('id', 0.0)
        sys_country = data.get('sys', {}).get('country', "")
        sys_sunrise = formatdate(data.get('sys', {}).get('sunrise', 0))
        sys_sunset = formatdate(data.get('sys', {}).get('sunset', 0))
        timezone = data.get('timezone', 0)
        city_id = data.get('id', 0)
        city_name = data.get('name', "")
        cod = data.get('cod', 0)

        # Create a dictionary with the weather data
        weather_data = {
            'weather_main': weather_main,
            'weather_description': weather_description,
            'weather_id': weather_id,
            'weather_icon': weather_icon,
            'position_lat': position_lat,
            'position_long': position_long,
            'temperature': temperature,
            'feels_like': feels_like,
            'temp_min': temp_min,
            'temp_max': temp_max,
            'pressure': pressure,
            'humidity': humidity,
            'visibility': visibility,
            'wind_speed': wind_speed,
            'wind_deg': wind_deg,
            'clouds_all': clouds_all,
            'last_update': last_update,
            'sys_type': sys_type,
            'sys_id': sys_id,
            'sys_country': sys_country,
            'sys_sunrise': sys_sunrise,
            'sys_sunset': sys_sunset,
            'timezone': timezone,
            'id': city_id,
            'name': city_name,
            'cod': cod
        }

        db.add_weather_data(weather_data)
        time.sleep(1 * 60)

def main():
    thread1 = threading.Thread(target=scrape_bikes_data)
    thread1.start()
    thread2 = threading.Thread(target=scrape_weather_data)
    thread2.start()


if __name__ == '__main__':
    main()