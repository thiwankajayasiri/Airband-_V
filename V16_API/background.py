from V16_API.QueueManager import V16_State
from V16_API.logsetup import logger
from Queue import Full, Empty
from time import sleep, time
from threading import Thread
import subprocess, os


def background_process(commands, results, queries):
    logger.info('Starting Background Process')
    real_state = V16_State()
    desired_state = V16_State()
    
    while True:
        start_time = time()
        
        #Parse commands
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
                    desired_state.PTTEnabled = current_command.value 
                    current_command.success = True
                elif current_command.parameter == "SCAN":
                    desired_state.ScanEnabled = current_command.value 
                    current_command.success = True
                
                try:
                    results.put_nowait(current_command)
                except Full:
                    pass
            
        
        real_state = desired_state

        try:
            queries.put_nowait(real_state)
        except Full:
            pass
        
        wait = 0.1-(time()-start_time)
        if wait > 0:
            sleep(wait)
        else:
            print(wait)
            logger.warning('Critical task time overrun')

def set_camera(cam_id):
    if not isinstance(cam_id, int):
        return
    os.environ['INSEL'] = str(cam_id)
    subprocess.call('pwd')
    video_set_reg = subprocess.call(['sh','./V16_API/update_cam.sh'])

    
        
