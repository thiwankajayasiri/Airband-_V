import serial, time
from serial import SerialException

HOST = "198.18.15.41" 
PORT = "20202" # Wave Relay Default
URL = "rfc2217://" + HOST + ":" + PORT +"[?logging=debug]"

HEADER = [0x02,0x05]


class V16_Protocol:
    def __init__(self):
        self.stream = serial.serial_for_url(URL, do_not_open=True)
        self.stream.baudrate = 115200
        
    def connect(self):
        if self.stream.is_open:
            return True 
            
        try:
            self.stream.open()
        except Exception:
            print('Failed to connect')
            return False
        
        return self.stream.is_open
    
    def pack_message(self, command, data):
        '''
        Packs a command in the V16 Protocol 
        Command - Integer command code 
        Data - 1-N bytes of data associated with the command        
        '''
        if not (isinstance(command, int) and isinstance(data, list)):
            print('Message Pack Failed')
            return None 
        msg = HEADER + [command] + data
        msg = bytearray(msg)
        lrc = msg[2]
        for b in msg[3:]:
            lrc ^= b
        #lrc ^= 0x55
        lrc = bytearray([lrc])
        msg = msg + lrc
        return msg
        
    def send_command(self,command, data):
        if not self.stream.is_open:
            return False
        msg = self.pack_message(command, data)
        if msg is None:
            return False
        #self.stream.write(msg)
        return True
        
    def receive_ack(self):
        return True
        
    def set_frequency_MHz(self, freq_MHz, primary=False):
        '''
        Changes standby frequency (or priamry if primary=True)
        '''
        if not isinstance(freq_MHz, (int, float, long)):
            return False
        freq_code = self.encode_frequency_khz(freq_MHz*1000)
        if freq_code is None:
            return False
        command = 0x01
        if primary:
            command =0x00
        return self.send_command(command,freq_code)
        
        
    def encode_frequency_khz(self, freq):
        if (108000 > freq > 137000):
            return None 
        # Round to 25kHz
        freq = int(int(freq/25)*25)
        rounded_cents = int(freq/100) * 100
        quadracent_code = int(float(freq % 100) / 25 * 4)
        code_decimal = rounded_cents + quadracent_code
        code_bytes = int_to_bytes(code_decimal,4)
        return code_bytes
        
        
def int_to_bytes(val, num_bytes):
    return [(val & (0xff << pos*8)) >> pos*8 for pos in reversed(range(num_bytes))]
        
    
if __name__ == "__main__":
    print(URL)
    V16 = V16_Protocol()
    while not V16.connect():
        time.sleep(1)
        print("Connecting")
    V16.set_frequency_MHz(127.0)
    print(V16.stream.read(1))
    #V16.pack_message(0x01,[0x18,0xF0,0x01,0x00])
    
    
