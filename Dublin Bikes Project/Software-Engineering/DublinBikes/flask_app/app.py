from flask import Flask, render_template, g
from sqlalchemy import create_engine
import os 
import pandas as pd
import Scrapper.config.dbconfig as dbconfig


app = Flask(__name__)

@app.route("/")
def main():
    return render_template("index.html")
    

def get_engine():
    if g.get("engine", None)is None:
        uri = f"mysql+pymysql://{dbconfig.username}:{dbconfig.password}@127.0.0.1:{dbconfig.port}/{dbconfig.dbName}"
        print(uri)
        g.engine=create_engine(uri)
    return g.engine

@app.route("/stations_data")
def get_station_data():
    engine = get_engine()
    df = pd.read_sql_table("station", engine)
    return df.to_json(orient="records")

if __name__ == '__main__':
    uri = f"mysql+pymysql://{dbconfig.username}:{dbconfig.password}@127.0.0.1:{dbconfig.port}/{dbconfig.dbName}"
    print(uri)
    app.run(port=5000, host='127.0.0.1', debug=True)
