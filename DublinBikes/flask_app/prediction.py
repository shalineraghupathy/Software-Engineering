import pandas as pd
import json
import numpy as np
from sklearn.preprocessing import OneHotEncoder
import pickle

# Load pre-trained models
with open('../models/dt_bikes_model.pickle', 'rb') as bike_model_file:
    bike_model = pickle.load(bike_model_file)

with open('../models/dt_stands_model.pickle', 'rb') as stands_model_file:
    stands_model = pickle.load(stands_model_file)

# Load the OneHotEncoder
with open('../models/one_hot_encoder.pickle', 'rb') as file:
    one_hot = pickle.load(file)

# File path to the weather data JSON
file_path = '../Scrapper/weather/forecast_5days.json'
with open(file_path, 'r') as file:
    weather_data = json.load(file)

df_stations = pd.read_csv('station.csv')
print(df_stations.head())
# Convert the JSON data to a DataFrame
df_weather = pd.DataFrame({
    'dt_txt': [item['dt_txt'] for item in weather_data['list']],
    'temperature': [item['main']['temp'] for item in weather_data['list']],
    'feels_like': [item['main']['feels_like'] for item in weather_data['list']],
    'pressure': [item['main']['pressure'] for item in weather_data['list']],
    'humidity': [item['main']['humidity'] for item in weather_data['list']],
    'visibility': [item['visibility'] for item in weather_data['list']],
    'wind_speed': [item['wind']['speed'] for item in weather_data['list']],
    'wind_deg': [item['wind']['deg'] for item in weather_data['list']],
    'clouds_all': [item['clouds']['all'] for item in weather_data['list']],
    'weather_main': [item['weather'][0]['main'] for item in weather_data['list']]
})

# Adding time and weather main category processing
df_weather['date'] = pd.to_datetime(df_weather['dt_txt'])
df_weather['hour'] = df_weather['date'].dt.hour
df_weather['day_of_week'] = df_weather['date'].dt.dayofweek
df_weather['is_weekend'] = df_weather['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
df_weather['is_peak_hour'] = df_weather['hour'].apply(lambda x: 1 if 7 <= x <= 9 or 16 <= x <= 18 else 0)
df_weather['feels_like_temp'] = df_weather['temperature'] - ((100 - df_weather['humidity']) / 5.0)  # Adjusting formula for feels_like_temp

# OneHotEncode the weather_main category and add to DataFrame
weather_main_encoded = one_hot.transform(df_weather[['weather_main']]).toarray()
weather_columns = one_hot.get_feature_names_out(['weather_main'])

df_weather_encoded = pd.DataFrame(weather_main_encoded, columns=weather_columns)
df_weather.drop('weather_main', axis=1, inplace=True)
df_weather = pd.concat([df_weather, df_weather_encoded], axis=1)

# Add an index column for 'number' if it was a feature used in model training
df_weather['number'] = df_stations['number']

# Ensure DataFrame includes all required columns from training, with missing ones filled with zeros
columns_order = [
    'number', 'temperature', 'feels_like', 'pressure', 'humidity', 'visibility',
    'wind_speed', 'wind_deg', 'clouds_all', 'hour', 'day_of_week', 'is_weekend',
    'is_peak_hour'] + list(weather_columns) + ['feels_like_temp']

for column in columns_order:
    if column not in df_weather.columns:
        df_weather[column] = 0

# Reorder DataFrame to match training feature order
model_features = df_weather[columns_order]

if hasattr(bike_model, 'feature_names_in_'):
    print("Bike Model Training feature names:")
    print(bike_model.feature_names_in_)
else:
    print("Model does not have feature_names_in_ attribute.")
# Predict using the pre-trained models
def predict_from_features(features):
    pred_bikes = bike_model.predict(features)
    pred_stands = stands_model.predict(features)
    return pred_bikes, pred_stands
bike, stands = predict_from_features(model_features)
print(bike)
print(stands)