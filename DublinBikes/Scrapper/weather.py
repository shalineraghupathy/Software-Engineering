from sqlalchemy import create_engine, Column, Integer, DECIMAL, String, Date, Time, UniqueConstraint
from sqlalchemy.orm import sessionmaker
import requests
from datetime import datetime, timedelta
import schedule
import time
import pymysql
from model_weather import WeatherData

# # 创建表格（如果尚不存在）
# Base.metadata.create_all(engine)
def fetch_and_store_weather():
    # 设定经纬度
    lat = "53.3498006"
    lon = "-6.2602964"
    api_key = "5b103a5aa9cd52cd178d63c3c83ad6ec"
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
    print("经纬度ok")
    # 发起请求
    response = requests.get(url)
    data = response.json()
    print("Request Over!")
    # 解析数据
    weather = WeatherData(
        date=datetime.utcfromtimestamp(data['dt']).date(),
        hour=datetime.utcfromtimestamp(data['dt']).strftime('%H:%M:%S'),
        latitude=data['coord']['lat'],
        longitude=data['coord']['lon'],
        temperature=data['main']['temp'],
        humidity=data['main']['humidity'],
        pressure=data['main']['pressure'],
        description=data['weather'][0]['description'],
        wind_speed=data['wind']['speed'],
        clouds=data['clouds']['all'],
        rain=data.get('rain', {}).get('1h', 0.0)
    )
    # 插入数据库
    session.add(weather)
    try:
        session.commit()
        print(f"Weather data for {weather.date} {weather.hour} saved successfully.")
    except Exception as e:
        session.rollback()
        print("Data already exists or error occurred:", e)

# 确保每小时调
def job():
    fetch_and_store_weather()

def run():
    schedule.every(1).hour.do(job)

    while True:
        schedule.run_pending()
        print("-----,i am running")
        time.sleep(1)

if __name__=="__main__":
    # 连接到数据库
    db_url = (
        "mysql+pymysql://evanSE:2686336654lyh"
        "@dublinbike-database.cx6eqc4uyqzi.eu-north-1.rds.amazonaws.com:3306/DublinBike"
    )
    # db_url = "mysql+mysqldb://root:123456@{}:3305/bike_learn?charset=utf8mb4&local_infile=1".format("127.0.0.1")

    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    print("Connect Successfully!")
    run()