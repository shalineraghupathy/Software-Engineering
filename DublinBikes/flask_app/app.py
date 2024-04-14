from flask import g, Flask, render_template
from sqlalchemy import text
import traceback
from flask_googlemaps import GoogleMaps
import data
import json

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
                'lng': longitude,
                'lat': latitude,
                'position': {'lat': latitude, 'lng': longitude},
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

# Load predictions data
with open('predictions.json') as f:
    predictions_data = json.load(f)

@app.route('/predictions')
def get_predictions():
    return {'predictions': predictions_data}

if __name__ == '__main__':
    app.run(debug=True)