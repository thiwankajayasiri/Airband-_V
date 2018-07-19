from V16_API.QueueManager import V16_State
from V16_API.logsetup import logger
from V16_API.V16_Protocol import V16_Protocol
from Queue import Full, Empty
from time import sleep, time
from threading import Thread
import subprocess, os


def background_process(commands, results, queries):
    logger.info('Starting Background Process')
    real_state = V16_State()
    scan_enabled = 127.0
    desired_standby_freq = 127000
    desired_primary_freq = 127000
    desired_squelch = 0
    ptt_enabled = False
    scan_enabled = False

    V16 = V16_Protocol()
    
    while True:
        start_time = time()
        
        #Parse commands from web API
        if not commands.empty():
            try:
                current_command = commands.get_nowait()
            except Empty:
                current_command = None 
                
            if current_command is not None:
                if current_command.parameter == "CAM":
                    set_camera(current_command.value)
                    current_command.success = True
                elif current_command.parameter == "PTT":
                    ptt_enabled = current_command.value
                    current_command.success = True
                elif current_command.parameter == "SCAN":
                    scan_enabled = current_command.value
                    current_command.success = V16.set_scan(scan_enabled)
                elif current_command.parameter == "PRIM_FREQ":
                    desired_primary_freq = current_command.value
                    current_command.success = V16.set_frequency_MHz(desired_primary_freq, primary=True)
                elif current_command.parameter == "STBY_FREQ":
                    desired_standby_freq = current_command.value
                    current_command.success = V16.set_frequency_MHz(desired_standby_freq)
                elif current_command.parameter == "PLAYBACK":
                    current_command.success = V16.request_playback()
                elif current_command.parameter == "SQUELCH":
                    desired_squelch = int(current_command.value)
                    current_command.success = V16.set_squelch(desired_squelch)
                try:
                    results.put_nowait(current_command)
                except Full:
                    pass

        # Make sure we're connected and update state from the radio
        if V16.connect():
            real_state = V16.update_real_state(real_state)

        # Fill in the state information for properties of the background task
        real_state.connected = V16.stream.is_open
        real_state.PTTEnabled = ptt_enabled
        #real_state.ScanE0nabled = scan_enabled


        # Put the updated state in the queue
        try:
            queries.put_nowait(real_state)
        except Full:
            pass
        

        # Sleep for reamining loop time
        wait = 0.1-(time()-start_time)
        if wait > 0:
            sleep(wait)
        else:
            logger.warning('Critical task time overrun:', -wait, 'seconds')



def set_camera(cam_id):
    try:
        if not isinstance(cam_id, int):
            return
        os.environ['INSEL'] = str(cam_id)
        subprocess.call('pwd')
        video_set_reg = subprocess.call(['sh','./V16_API/update_cam.sh'])
    except Exception as E:
        print("Camera Set Failed:", e)

