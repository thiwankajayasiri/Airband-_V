#!/bin/bash
rm "V16_Log_Debug"
sudo gunicorn -b 0.0.0.0:80 -w 1 V16_API:app
