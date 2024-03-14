from flask import g, Flask, render_template
from sqlalchemy import text
import traceback
from flask_googlemaps import GoogleMaps
import data

app = Flask(__name__)

stations = data.fetch_bikes_data()


@app.route('/')
def index():

    try:

        # Set up the markers
        markers = []
        for station in stations:
            latitude = station.get('position', {}).get('lat', 0.0)
            longitude = station.get('position', {}).get('lng', 0.0)

            marker = {
                'number': station['number'],
                'postion': {'lat': latitude,'lng':longitude},
                'title': station[' name'],
                'status': station['status'],
                'bike_stands': station['bike_stands'],
                'available_bikes': station['available_bikes'],
            }

            markers.append(marker)
        # print(markers)

        # Render the template with API key, markers, and specified lat and lng
        return render_template("index.html",data=markers)
    except:
        print(traceback.format_exc())
        return "error in index", 404  


if __name__ == '__main__':
    app.run(debug=True)