
import requests
import config.apiconfig as apiconfig
import data
import time
import datetime

def formatdate(value):
    return time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(value))



def main(): 

    while True:
        params = {'apiKey': apiconfig.apiKey, 'contract': apiconfig.contract}
        response = requests.get(apiconfig.apiURI, params=params)
        stations = response.json()
        print("data retrived successfully")

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


            data.add_or_update_station_data(station_data)
            data.add_availability_data(availability_data)
        print("Records pushed to db",datetime.datetime.now())
        print("Next load starts in 5 minutes")
        time.sleep(5 * 60)


if __name__ == '__main__':
    main()
