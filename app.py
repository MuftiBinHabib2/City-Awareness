from flask import Flask, render_template
import webbrowser
from threading import Timer

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

def open_browser():
    webbrowser.open("http://127.0.0.1:5000/")

if __name__ == '__main__':
    # Open the browser after a short delay to give the server time to start
    Timer(1.25, open_browser).start()
    app.run(debug=False, port=5000)
