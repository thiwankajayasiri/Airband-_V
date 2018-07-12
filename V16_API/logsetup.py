import logging

# Logger instance
logger = logging.getLogger('V16-API-LOG')
logger.setLevel(logging.DEBUG)

# Console Logging Handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# File Logging Handler
file_handler = logging.FileHandler('V16_Log_Debug')
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)
