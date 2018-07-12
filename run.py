from V16_API import return_app_and_start_background

app = return_app_and_start_background()

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=False, use_reloader=False, threaded=True)
