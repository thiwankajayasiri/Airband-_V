import json


class QueueManager:
    def __init__(self, command_queue, results_queue, state_queue, hw_process):
        self.command_queue = command_queue
        self.results = results_queue
        self.state = state_queue
        self.p = hw_process  # Handle for process we are communicating with
    
    def get_state(self):
        returned_state = self.state.get()
        if isinstance(returned_state, V16_State) and returned_state.is_valid_state():
            return returned_state.json();
        else:
            raise ValueError('Invalid State Received')
        
    def put_command(self, command):
        if isinstance(command, command_ack) and command.is_valid_command():
            self.command_queue.put(command)
        else:
            raise ValueError('Invalid Command Received')
    
    def put_command_get_ack(self, command):
        self.put_command(command)
        result = self.results.get()
        return result.json()
        
          
    
class V16_State:
    def __init__(self):
        self.success = "Hello World"
        self.PTTEnabled = False
        self.ScanEnabled = False
        self.PrimaryFreq = 128.0
        pass 

    def is_valid_state(self):
        # Need to implement this
        return True
        
    def json(self):
        if self.is_valid_state():
            return json.dumps(self.__dict__)
        else:
            raise ValueError('Invalid State Recieve from backend')
            
class command_ack:
    def __init__(self, parameter = None, value = None, JSON = None):
        if parameter is not None and value is not None:
            self.parameter = parameter
            self.value = value
        elif JSON is not None:
            self.parameter = JSON['parameter']
            self.value = JSON['value']
        self.success = False
        
    def is_valid_command(self):
        return self.parameter is not None and self.value is not None
        
    def json(self):
        if self.is_valid_command():
            return json.dumps(self.__dict__)
        else:
            raise ValueError('Invalid Command Recived')
        
