from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.exc import SQLAlchemyError
import config.dbconfig as dbconfig
from sqlalchemy.engine.url import URL
from sqlalchemy import inspect

Base = declarative_base()


class Weather(Base):
    __tablename__ = 'weather'

    number = Column(Integer, primary_key=True, autoincrement=True)
    weather_main = Column(String(256))
    weather_description = Column(String(256))
    weather_id = Column(Integer)
    weather_icon = Column(String(256))
    position_lat = Column(Float)
    position_long = Column(Float)
    temperature = Column(Float)
    feels_like = Column(Float)
    temp_min = Column(Float)
    temp_max = Column(Float)
    pressure = Column(Float)
    humidity = Column(Float)
    visibility = Column(Float)
    wind_speed = Column(Float)
    wind_deg = Column(Float)
    clouds_all = Column(Float)
    last_update = Column(DateTime)
    sys_type = Column(Float)
    sys_id = Column(Integer)
    sys_country = Column(String(256))
    sys_sunrise = Column(DateTime)
    sys_sunset = Column(DateTime)
    timezone = Column(Float)
    id = Column(Integer)
    name = Column(String(256))
    cod = Column(Integer)

    def __init__(self, weather_main, weather_description, weather_id, weather_icon, position_lat,
                 position_long, temperature, feels_like, temp_min, temp_max, pressure, humidity,
                 visibility, wind_speed, wind_deg, clouds_all, last_update, sys_type, sys_id, sys_country,
                 sys_sunrise, sys_sunset, timezone, id, name, cod):
        self.weather_main = weather_main
        self.weather_description = weather_description
        self.weather_id = weather_id
        self.weather_icon = weather_icon
        self.position_lat = position_lat
        self.position_long = position_long
        self.temperature = temperature
        self.feels_like = feels_like
        self.temp_min = temp_min
        self.temp_max = temp_max
        self.pressure = pressure
        self.humidity = humidity
        self.visibility = visibility
        self.wind_speed = wind_speed
        self.wind_deg = wind_deg
        self.clouds_all = clouds_all
        self.last_update = last_update
        self.sys_type = sys_type
        self.sys_id = sys_id
        self.sys_country = sys_country
        self.sys_sunrise = sys_sunrise
        self.sys_sunset = sys_sunset
        self.timezone = timezone
        self.id = id
        self.name = name
        self.cod = cod


# Create a SQLite database engine
db_url = URL.create(
    drivername='mysql+pymysql',
    username=dbconfig.username,
    password=dbconfig.password,
    host=dbconfig.dbEndpoint,
    port=dbconfig.port,
    database=dbconfig.dbName
)

# db_url = URL.create(
#     drivername='mysql+pymysql',
#     username="root",
#     password="Shachu@0203",
#     host="localhost",
#     port="3306",
#     database="dbikestest"


engine = create_engine(db_url, echo=False)

Base.metadata.create_all(engine)

# Create a session to interact with the database
Session = sessionmaker(bind=engine)


def create_tables():
    try:
        with Session() as session:
            inspector = inspect(engine)
            if not inspector.has_table('weather'):
                Base.metadata.create_all(engine)

    except Exception as e:
        print(f"Error: {e}")


create_tables()


# Function to add weather data
def add_weather_data(data):
    try:
        with Session() as session:
            weather = Weather(**data)
            session.add(weather)
            session.commit()
    except SQLAlchemyError as e:
        print(f"Error adding weather data to the database: {e}")