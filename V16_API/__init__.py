from flask import Flask
from flask_bootstrap import Bootstrap
from multiprocessing import Process, Queue
from V16_API.nav import *
from V16_API.QueueManager import QueueManager
from V16_API.background import background_process
from V16_API.logsetup import logger
from werkzeug.serving import is_running_from_reloader


# Instantiate the inter-process Queues
commands = Queue()  # Commands queue - Flask->Background
results = Queue()  # Results queue - Background->Flask
state = Queue(maxsize=1)  # State queue - Background->Flask

# Setup the Background Process
background = Process(target=background_process, args=(commands, results, state))

# Instantiate the inter-process interfaces (flask side)
V16 = QueueManager(commands, results, state, background)

# Instantiate the Flask App
app = Flask(__name__)
import V16_API.views  # This has to be after the flask app is instantiated
app.config['SECRET_KEY'] = 'devkey'

# Setup flask-bootstrap
app.config['BOOTSTRAP_SERVE_LOCAL'] = True
Bootstrap(app)  # Enable Bootstrap magic

# Setup the nav bar (nav.py)
nav.init_app(app)


def return_app_and_start_background():
    if not is_running_from_reloader():
        background.start()
        logger.info('STARTING BACKGROUND PROCESS')
    return app
