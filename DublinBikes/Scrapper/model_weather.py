# coding: utf-8
from sqlalchemy import Column, DECIMAL, DateTime, String, Time
from sqlalchemy.dialects.mysql import BIGINT, INTEGER
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()
metadata = Base.metadata


class WeatherData(Base):
    __tablename__ = 'WeatherData'

    id = Column(BIGINT(20), primary_key=True)
    date = Column(DateTime)
    hour = Column(Time)
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    temperature = Column(DECIMAL(5, 2))
    humidity = Column(INTEGER(10))
    pressure = Column(INTEGER(10))
    description = Column(String(255, 'utf8mb4_bin'))
    wind_speed = Column(DECIMAL(5, 2))
    clouds = Column(INTEGER(10))
    rain = Column(DECIMAL(5, 2))