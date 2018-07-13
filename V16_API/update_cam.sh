# set 0x00[3:0] (without disturbing the other bits)
r0=$(i2cget -f -y 2 0x20 0x00)  # get current value
r0=$((r0&0xf0)) # mask out lower nibble
r0=$((r0|$INSEL)) # set lower nibble
i2cset -f -y 2 0x20 0x00 $r0
