from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import config.dbconfig as dbconfig
from sqlalchemy.engine.url import URL



Base = declarative_base()


class Station(Base):
    __tablename__ = 'station'

    number = Column(Integer, primary_key=True)
    contract_name = Column(String(256))
    name = Column(String(256))
    address = Column(String(256))
    position_lat = Column(Float)
    position_long = Column(Float)
    banking = Column(Boolean)
    bonus = Column(Boolean)
    bike_stands = Column(Integer)

    availability = relationship('Availability', back_populates='station')

    def __init__(self, number, contract_name, name, address, position_lat, position_long, banking, bonus, bike_stands):
        self.number = number
        self.contract_name = contract_name
        self.name = name
        self.address = address
        self.position_lat = position_lat
        self.position_long = position_long
        self.banking = banking
        self.bonus = bonus
        self.bike_stands = bike_stands
    def __str__(self):
        return (f"number = {self.number}, contract_name = {self.contract_name}, name = {self.name}, "
        f"address= {self.address}, position_lat= {self.position_lat}, position_long= {self.position_long}, "
        f"banking= {self.banking}, bonus= {self.bonus}, bike_stands= {self.bike_stands}")
              


class Availability(Base):
    __tablename__ = 'availability'
    id = Column(Integer, primary_key=True, autoincrement=True)
    number = Column(Integer, ForeignKey('station.number', ondelete='CASCADE'))
    available_bikes = Column(Integer)
    available_bike_stands = Column(Integer)
    last_update = Column(DateTime)
    status = Column(String(256))

    station = relationship('Station', back_populates='availability')

    def __init__(self, number, available_bikes, available_bike_stands, last_update, status):
        self.number = number
        self.available_bikes = available_bikes
        self.available_bike_stands = available_bike_stands
        self.last_update = last_update
        self.status = status
    def __str__(self):
        return (f"number= {self.number},  available_bikes= {self.available_bikes}, "
        f"available_bike_stands= {self.available_bike_stands}, last_update= {self.last_update}, status= {self.status}")


# Create a SQLite database engine
db_url = URL.create(
    drivername='mysql+pymysql',
    username=dbconfig.username,
    password=dbconfig.password,
    host=dbconfig.dbEndpoint,
    port=dbconfig.port,
    database=dbconfig.dbName
)

engine = create_engine(db_url, echo=False)

Base.metadata.create_all(engine)

# Create a session to interact with the database
Session = sessionmaker(bind=engine)


# Function to add or update a station
def add_or_update_station_data(data):
    try:
        with Session() as session:
            existing_station = session.query(Station).filter_by(number=data['number']).first()

            # if existing_station:
            #     # Update existing station
            #     for key, value in data.items():
            #         setattr(existing_station, key, value)

            if existing_station:
                # Update existing station
                keys_to_update = ['contract_name', 'name', 'address', 'position_lat', 'position_long', 'banking', 'bonus', 'bike_stands']
                for key in keys_to_update:
                    setattr(existing_station, key, data[key])
            else:
                # Add new station
                station = Station(**data)
                session.add(station)
                # print("Added new station - ", station)
            session.commit()
    except Exception as e:
        print(f"Error: {e}")


# Function to add availability data
def add_availability_data(data):
    try:
        with Session() as session:
            availability = Availability(**data)
            session.add(availability)
            session.commit()
            # print("Added new availability - ", availability)
    except Exception as e:
        print(f"Error: {e}")
