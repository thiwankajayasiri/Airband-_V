#!/bin/bash

sudo kill -9 `ps aux |grep gunicorn |grep app | awk '{ print $2 }'`  # will kill all of the workers