from flask import Flask, render_template
import simplejson as json

app = Flask(__name__)



@app.route('/')
def hello_world():  # put application's code her
    json_file_path="./stations.json"
    with open(json_file_path, "r") as file:
        data=json.load(file)
        print(data)
    return render_template("index.html")




if __name__ == '__main__':
    app.run()
