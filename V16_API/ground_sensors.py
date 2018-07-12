from gps3 import agps3
from datetime import datetime, timedelta
from AntennaTracker.util import is_valid_ipv4_address, url, time_plus, time_minus
from AntennaTracker.logsetup import logger
from AntennaTracker.magnetometer import HMC6343


class ground_sensors:
    def __init__(self):
        self.ip = '127.0.0.1'
        self.port = 2947
        self.stream = None
        self.streamReader = None
        self.lat = 0
        self.lon = 0
        self.alt = 0
        self.heading = 0
        self.pitch = 0
        self.roll = 0
        self.heartbeat = None
        self.fix = False
        self.connected = False
        self.stay_disconnected = False
        self.system_time_offset = None
        self.compass = HMC6343()
        self.compass_calibrated = False

    def connect(self, ip=None, port=None):
        try:
            if ip is not None:
                if is_valid_ipv4_address(ip):
                    self.ip = ip
            if port is not None:
                if port in range(0, 65536):
                    self.port = int(port)

            self.gps_type = 'GPSD'
            self.stream = agps3.GPSDSocket()
            self.streamReader = agps3.DataStream()
            self.stream.connect(host=self.ip, port=self.port)
            self.stream.watch()

            self.connected = True
            self.stay_disconnected = False
            return True

        except Exception:
            logger.exception('Ground GPS Connection Failed:')
            self.connected = False
            return False

    def disconnect(self, reconnect=False):
        if self.connected:
            self.stream.close()
            self.connected = False
            self.fix = False
            if reconnect is False: # If reconnect is false, self.update will not attempt to reconnect after self.disconnect is called
                self.stay_disconnected = True

    def heartbeat_valid(self):
        if (self.heartbeat is not None) and (self.system_time_offset is not None):
            now = datetime.now()
            threshold = timedelta(seconds=5)  # Mark GPS as bad if we haven't received a message in 2 seconds
            if time_plus(now.time(), self.system_time_offset) <= time_plus(self.heartbeat, threshold):  # If we have not yet reached the timeout
                return True
        self.system_time_offset = None # Force update method to update timestamp offset if we have lost the connection for any period of time
        return False

    def position_valid_and_current(self):
        return self.heartbeat_valid() and self.fix

    def update(self):
        # Update with all available new messages
        if self.connected:
            # Get GPS Data
            self.parse_GPSD()
            # Calibrate Magnetic Declination if we haven't already
            if self.fix is True and not self.compass_calibrated:
                try:
                    self.compass.set_declinination(self.lat, self.lon, self.alt)
                except OSError:
                    logger.error('Failed to Set Mag Declination ')
                self.compass_calibrated = True
        # Update Compass Data
        try:
            [self.heading, self.pitch, self.roll] = self.compass.get_angles()
        except OSError:
            logger.exception('Failed to Read Compass')

        # Attempt to reconnect to GPS if we were previously getting data and now aren't
        if not self.heartbeat_valid() and not self.stay_disconnected:
            self.disconnect(reconnect=True)
            logger.info('Ground GPS Connection Lost, Attempting to Reconnect')
            self.fix = False
            self.connect()

    def parse_GPSD(self):
        count = 0
        try:
            for new_data in self.stream:
                if new_data and count < 10:
                    count += 1
                    self.streamReader.unpack(new_data)
                    if self.streamReader.time != 'n/a':

                        logger.info('Updating Ground GPS from GPSD')
                        self.heartbeat = datetime.strptime(self.streamReader.time, '%Y-%m-%dT%H:%M:%S.000Z')
                        self.lat = self.streamReader.lat
                        self.lon = self.streamReader.lon
                        self.alt = self.streamReader.alt

                        if self.streamReader.mode > 1:
                            self.fix = True
                        else:
                            self.fix = False

                        # Reset the time offset (If we've gotten this far then we mus be getting new data, including heartbeat)
                        now = datetime.now()
                        self.system_time_offset = time_minus(self.heartbeat, now.time())

                        return True
        except OSError:
            logger.error('Failed to Read from GPSD (Ground)')
        except TypeError:
            logger.error('GPSD Data invalid (Ground)')

        return False


if __name__ == '__main__':

    gps = ground_sensors()
    gps.connect()

    while 1:
        print('Ground GPS attempting update')
        gps.update()

        if gps.position_valid_and_current():
            print(gps.lat, gps.lon, gps.alt)
        else:
            print('Ground GPS data not Current or no Fix')

        #input('Press Enter to continue')



