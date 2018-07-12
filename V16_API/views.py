from V16_API import app, V16
from V16_API.QueueManager import command_ack
import time

from flask import render_template, flash, jsonify, request


@app.route('/', methods=('GET', 'POST'))
def index():
    return render_template('index.html')


@app.route('/status', methods=('GET', 'POST'))
def status():
    return V16.get_state()

@app.route('/commands', methods=('GET', 'POST'))
def commands():
    if request.method == 'POST':
        data = request.get_json(force=True)
        command = command_ack(JSON=data)
    return V16.put_command_get_ack(command)
