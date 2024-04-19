from flask import g, Flask, render_template, request
from sqlalchemy import text
import traceback
from flask_googlemaps import GoogleMaps
import data
import json
from flask import jsonify
import requests
app = Flask(__name__)

@app.route('/')
def index():
    return render_template("index.html")

    
@app.route('/stations')
def get_stations():
        try:
            stations = data.fetch_bikes_data()
            markers = []
            for station in stations:
                latitude = station.get('position', {}).get('lat', 0.0)
                longitude = station.get('position', {}).get('lng', 0.0)

                marker = {
                    'number': station['number'],
                    'lng':longitude,
                    'lat':latitude,
                    'position': {'lat': latitude,'lng':longitude},
                    'title': station['name'],
                    'status': station['status'],
                    'bike_stands': station['bike_stands'],
                    'available_bikes': station['available_bikes'],
                    'available_bike_stands': station['available_bike_stands']
                }

                markers.append(marker)
            # print(markers)
            return {'stations': markers}
        except:
            print(traceback.format_exc())
            return "error in index", 404  
        


@app.route('/predictions')
def get_predictions():
    # Load predictions data
    with open('Software-Engineering/DublinBikes/Flask/DublinBikes/predictions.json') as f:
        predictions_data = json.load(f)
    return {'predictions': predictions_data}

API_KEY = 'e5a7467f3b567b2e260e9bc3d40dd2b0'

@app.route('/weather', methods=['GET'])
def get_weather():
    city = request.args.get('city', '')
    country = request.args.get('country', '')
    
    if not city or not country:
        return jsonify({'error': 'Missing city or country parameter'}), 400

    url = f"https://api.openweathermap.org/data/2.5/weather?q={city},{country}&appid={API_KEY}"
    print(url)
    # https://api.openweathermap.org/data/2.5/weather?q=${city_name},${country_code}&appid=${appid}
    
    try:
        response = requests.get(url)
        data = response.json()
        if response.status_code == 200:
            return jsonify(data)
        else:
            return jsonify({'error': 'Failed to fetch data from OpenWeatherMap'}), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    

@app.route('/forecast', methods=['GET'])
def get_forecast():
    city = request.args.get('city', '')
    country = request.args.get('country', '')
    
    if not city or not country:
        return jsonify({'error': 'Missing city or country parameter'}), 400

    url = f"https://api.openweathermap.org/data/2.5/forecast/daily?q={city},{country}&cnt=5&appid={API_KEY}"
    
    try:
        response = requests.get(url)
        data = response.json()
        if response.status_code == 200:
            return jsonify(data)
        else:
            return jsonify({'error': 'Failed to fetch forecast data', 'details': data}), response.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)