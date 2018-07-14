from __future__ import print_function
import serial, time, binascii


HOST = "198.18.15.41" 
PORT = "20202" # Wave Relay Default
URL = "rfc2217://" + HOST + ":" + PORT +"?logging=error"

HEADER = [0x02,0x05]


class V16_Protocol:
    def __init__(self):
        self.stream = serial.serial_for_url(URL, do_not_open=True)
        self.stream.baudrate = 9600
        
        # status fields from radio
        self.tx_active = False
        self.scan_active = False
        self.rx_active = False
        self.rx_stby = False
        self.stuck_ptt = False
        self.fault = False
        self.part_shutdown = False
        self.err_thermal = False
        self.err_voltage = False
        self.err_antenna = False
        self.rx_volume = 0
        self.int_volume = 0
        self.squelch = 0
        self.freq_active = 127.0
        self.freq_stdby = 127.0
        self.tx_powert = 0
        self.vswr = 0
        self.active_rx_db = 0
        self.stdby_rx_db = 0
        self.tx_mod = 0
        self.temp = 0
        self.volts = 0
        
        
        
    def connect(self):
        if self.stream.is_open:
            return True 
            
        try:
            self.stream.open()
        except Exception as e:
            print('Failed to connect\n', e)
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
        lrc ^= 0x55
        lrc = bytearray([lrc])
        msg = msg + lrc
        return msg
        
    def send_command(self,command, data):
        if not self.stream.is_open:
            return False
        msg = self.pack_message(command, data)
        if msg is None:
            return False
        #print(binascii.hexlify(msg).decode("ascii"))
        self.stream.write(msg)
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
        code_decimal = int(rounded_cents + quadracent_code)
        #print(code_decimal)
        code_bytes = int_to_bytes(code_decimal,4)
        code_bytes_little = list(reversed(code_bytes))
        return code_bytes_little
        
    def read_status(self):
        bufsize = self.stream.in_waiting
        if bufsize < 0:
            return False
            
        # clear out old status messages
        if bufsize > 48:
            # status message = 24 Bytes
            self.stream.read(bufsize-48)
            bufsize = self.stream.in_waiting
        
        # Look for start
        for i in range(0,bufsize-24):
            incoming = V16.stream.read(1)
            if incoming.encode("hex") == "02":
                incoming = V16.stream.read(2)
                if incoming.encode("hex") == "0504":
                    break
        # No header found in serial buffer
        else:
            return False
            
        # Read body and verify checksum
        incoming = V16.stream.read(20)
        data = bytearray(incoming)
        print(data)
        lrc = data[0]
        for b in data[1:]:
            lrc ^= b
        lrc ^= 0x55
        received_lrc = V16.stream.read(1)
        
        # Fail out if checksum was invalid
        if lrc != ord(received_lrc[0]):
            return False
            
        # Deserialize data
        print(bin(data[0]))
        status_bitmask = [bool((data[0] >> bit) & 1) for bit in range(0, 7)]
        #[self.tx_active,self.scan_active,self.rx_active,self.rx_stby,self.stuck_ptt] = status_bitmask
        print(status_bitmask)
            
        
        
def int_to_bytes(val, num_bytes):
    return [(val & (0xff << pos*8)) >> pos*8 for pos in reversed(range(num_bytes))]
        
    
if __name__ == "__main__":
    V16 = V16_Protocol()
    while not V16.connect():
        time.sleep(1)
        print("Attempting Connection")
    print("Connection Successful")
    while True:
        V16.send_command(0x08,[0x01])
        V16.set_frequency_MHz(127.0)
        time.sleep(1)
        V16.read_status()
        print('')
    
    
