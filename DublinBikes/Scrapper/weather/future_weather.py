import requests
import json


apiKey = "5b103a5aa9cd52cd178d63c3c83ad6ec"
city = "Dublin,IE"

apiURL = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={apiKey}"


response = requests.get(apiURL)


if response.status_code == 200:

    data = response.json()


    with open('forecast_5days.json', 'w') as f:
        json.dump(data, f, indent=4)

    print("5 days/3 hours weather data saved to 'forecast_5days.json'")
else:
    print("Failed", response.status_code)
