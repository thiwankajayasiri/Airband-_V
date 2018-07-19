from __future__ import print_function
from V16_API.QueueManager import V16_State
import serial, time, binascii, os, struct


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
        self.rx_on_active = False
        self.rx_on_stby = False
        self.stuck_ptt = False
        self.fault = False
        self.part_shutdown = False
        self.err_thermal = False
        self.err_voltage = False
        self.err_antenna = False
        self.rx_volume = 0
        self.int_volume = 0
        self.squelch = 0
        self.freq_active = 0.0
        self.freq_stdby = 0.0
        self.tx_power = 0
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
        if self.stream.is_open:
            self.configure

        return self.stream.is_open

    def configure(self):
        self.set_scan(False)
        self.set_ptt(False)

    
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
        
    def send_command(self, command, data):
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
        try:
            freq_MHz = float(freq_MHz)
        except Exception as e:
            print(e)
            return False
        freq_kHz = int(freq_MHz*1000)
        freq_code = self.encode_frequency_khz(int(freq_kHz))
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
        # print(code_decimal)
        code_bytes = int_to_bytes(code_decimal,4)
        code_bytes_little = list(reversed(code_bytes))
        return code_bytes_little

    def decode_frequency_khz(self, freq_code):
        rounded_cents = int(freq_code/100)*100
        quadracent_code = (freq_code - rounded_cents)
        khz = rounded_cents + (quadracent_code / 4 * 25)
        return khz

        
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
            incoming = self.stream.read(1)
            if incoming.encode("hex") == "02":
                incoming = self.stream.read(2)
                if incoming.encode("hex") == "0504":
                    break
        # No header found in serial buffer
        else:
            return False
            
        # Read body and verify checksum
        incoming = self.stream.read(20)
        data = bytearray(incoming)
        lrc = data[0]
        for b in data[1:]:
            lrc ^= b
        lrc ^= 0x55
        received_lrc = self.stream.read(1)
        
        # Fail out if checksum was invalid
        if lrc != ord(received_lrc[0]):
            return False
            
        '''
        Deserialize Status
        '''

        # Flags

        flags_bitmask = [bool((data[0] >> bit) & 1) for bit in range(0, 5)]
        [self.tx_active,self.scan_active,self.rx_on_active,self.rx_on_stby,self.stuck_ptt] = flags_bitmask

        #Status Bitmask
        tx_status_bitmask = [bool((data[0] >> bit) & 1) for bit in range(0, 5)]
        [self.fault,self.part_shutdown,self.err_thermal,self.err_voltage,self.err_antenna] = tx_status_bitmask

        #RX Volume
        self.rx_volume = int(data[2])

        #Intercom Volume
        self.int_volume = int(data[3])

        #Squelch
        self.squelch = int(data[4])

        #Primary Frequency
        primary_freq_bytes = data[5:8]
        primary_freq_bytes.reverse()
        self.freq_active = self.decode_frequency_khz(int(binascii.hexlify(primary_freq_bytes),16))

        #standby Frequency
        stdby_freq_bytes = data[9:12]
        stdby_freq_bytes.reverse()
        self.freq_stdby = self.decode_frequency_khz(int(binascii.hexlify(stdby_freq_bytes),16))

        self.tx_power = int(data[13]) * 10.0
        self.vswr = int(data[14]) / 10.0
        self.active_rx_db = int(data[15]) - 140
        self.stdby_rx_db = int(data[16]) - 140
        self.tx_mod = int(data[17])
        self.temp = int(data[18]) - 50
        self.volts = int(data[19]) / 10.0 + 5.0
        


    def update_real_state(self, state):

        if not self.stream.is_open:
            return state

        self.read_status()
        state.ScanEnabled = self.scan_active
        state.PrimaryFreq = self.freq_active/1000.0
        state.StandbyFreq = self.freq_stdby/1000.0
        state.Squelch = self.squelch
        return state

    def set_scan(self, enabled=False):
        if self.stream.is_open:
            return self.send_command(0x08,[enabled])
        return False


    def set_ptt(self, enabled=False):
        if self.stream.is_open:
            return self.send_command(0x11,[enabled,0x00])
        return False

    def set_squelch(self, squelch):
        if self.stream.is_open:
            squelch = int(squelch % 255)
            return self.send_command(0x07,[squelch])
        return False

    def request_playback(self):
        if self.stream.is_open:
            return self.send_command(0x09,[0x00])
        return False

            
        
        
def int_to_bytes(val, num_bytes):
    return [(val & (0xff << pos*8)) >> pos*8 for pos in reversed(range(num_bytes))]
        
    
if __name__ == "__main__":
    V16 = V16_Protocol()
    while not V16.connect():
        time.sleep(1)
        print("Attempting Connection")
    print("Connection Successful")
    
    V16.send_command(0x08,[0x01])
    V16.set_scan(False)
    V16.set_squelch(16)
    V16.set_frequency_MHz(135.0, primary=True)
    V16.set_frequency_MHz(119.9)

    while True:
       
        time.sleep(0.1)
        V16.set_ptt(True)
        V16.read_status()
        print(V16.tx_active)
        print(V16.rx_volume)
        print(V16.int_volume)
        print(V16.squelch)
        print(V16.freq_active)
        print(V16.freq_stdby)
        print(V16.tx_power)
        print(V16.vswr)
        print(V16.active_rx_db)
        print(V16.stdby_rx_db)
        print(V16.tx_mod)
        print(V16.temp)
        print(V16.volts)
        print('')

    
    
