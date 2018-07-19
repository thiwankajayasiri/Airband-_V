from V16_API import app, background_interface
from V16_API.QueueManager import command_ack
import time

from flask import render_template, flash, jsonify, request


@app.route('/', methods=('GET', 'POST'))
def index():
    return render_template('index.html')


@app.route('/status', methods=('GET', 'POST'))
def status():
    return background_interface.get_state()

@app.route('/commands', methods=('GET', 'POST'))
def commands():
    if request.method == 'POST':
        data = request.get_json(force=True)
        command = command_ack(JSON=data)
    return background_interface.put_command_get_ack(command)
