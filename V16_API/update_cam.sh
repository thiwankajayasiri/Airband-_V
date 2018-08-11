
# set 0x00[3:0] (without disturbing the other bits)
r0=$(i2cget -f -y 2 0x20 0x00)  # get current value
r0=$((r0&0xf0)) # mask out lower nibble
r0=$((r0|$INSEL)) # set lower nibble
i2cset -f -y 2 0x20 0x00 $r0

# restart Gstreamer feed
killall gst-launch-1.0
echo "Re-starting Gstreamer"
gst-launch-1.0 -v imxv4l2videosrc device=/dev/video0 ! imxvpuenc_h264 bitrate=500 ! rtph264pay config-interval=10 ! udpsink host=239.18.20.11 auto-multicast=true port=9722 sync=false > /root/gst.log 2>&1 & 
