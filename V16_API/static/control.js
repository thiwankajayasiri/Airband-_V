
var ArrowIntervalId;
var bWaitForHome = false;	      
var bUseDegrees = true;
var fPanResolution = 1;
var fTiltResolution = 1;
var bWaitForArrow = false;
var bMonitorWaiting = false;
var bMonitorUpdating = false;
var iLastPanSpeed;
var iLastTiltSpeed;
var eLastMode = '';
var PanUpperSpeed=0;
var TiltUpperSpeed=0;
var PanLowerSpeed=0;
var TiltLowerSpeed;
var PanMax= 0;
var PanMin = 0;
var TiltMax = 0;
var TiltMin = 0;

var PP='PP';
var TP='TP';
var PS='PS';
var TS='TS';
var PD='PD';
var TD='TD';
var PO='PO';
var TO='TO';
var bArrowDown = false;
var have_touch_events = false;

var DownArrow_Pressed = false;
var UpArrow_Pressed = false;
var LeftArrow_Pressed = false;
var RightArrow_Pressed = false;

var url = '192.168.0.102/api/'

$(document).ready(function() {
    clientSideInclude('topmenu', 'header.html');
    clientSideInclude('footer', 'footer.html');
    CommonAjaxSetup();

    PTCmd("pu&tu&pl&tl&pr&tr&px&pn&tx&tn",
	   function(data) {
	       $.each(data, function (key, val)
		      {
			  if(key == "PU")
			  {
			      PanUpperSpeed = parseInt(val);
			      $("#PanSpeedInput").val(val);
			  }
			  else if(key == "TU")
			  {
			      TiltUpperSpeed = parseInt(val);
			      $("#TiltSpeedInput").val(val);
			  }
			  if(key == "PL")
			  {
			      PanLowerSpeed = parseInt(val);
			  }
			  else if(key == "TL")
			  {
			      TiltLowerSpeed = parseInt(val);
			  }
			  else if(key == "PR")
			  {
			      fPanResolution = parseFloat(val);
			  }
			  else if(key == "TR")
			  {
			      fTiltResolution = parseFloat(val);
			  }
			  else if(key == "PX")
			  {
			      PanMax = val;
			  }
			  else if(key == "TX")
			  {
			      TiltMax = val;
			  }
			  else if(key == "PN")
			  {
			      PanMin = val;
			  }
			  else if(key == "TN")
			  {
			      TiltMin = val;
			  }
		      });
	       var smallspeed = 0;
	       if(PanUpperSpeed < TiltUpperSpeed)
	       {
		   $("#bigspeed").val(PanUpperSpeed);
		   smallspeed = Math.round(PanUpperSpeed / 10);
	       }
	       else
	       {
		   $("#bigspeed").val(TiltUpperSpeed);
		   smallspeed = Math.round(TiltUpperSpeed / 10);
	       }

	       if(smallspeed < PanLowerSpeed) {
		   smallspeed = PanLowerSpeed;
	       }
	       if(smallspeed < TiltLowerSpeed) {
		   smallspeed = TiltLowerSpeed;
	       }

	       $("#smallspeed").val(smallspeed);
	       
	   },
	  function () {
	      showError();
	  });
    

    $("#halt").click( function()
		      {
			  bWaitForHome = false;
			  PTCmd('H', UpdatePosSpeed);
		      });

    $(".controltype").click(function() 
			    {
				if($("#stabstatus").html() != "Running")
				{
				    
				    if($(this).val() == 'position')
				    {
					PTCmd("C=I");
				    }
				    else if($(this).val() == 'speed')
				    {
					PTCmd("C=V");
				    }
				}
				if($(this).val() == 'position')
				{
				    $("#setarrowtext").html("Step Size");
				}
				else if($(this).val() == 'speed')
				{
				    $("#setarrowtext").html("Speed");
				}
				
				if($("#StepExpandImg").attr('src') == 'graphics/dexarrow11.png')
				    ShowControls($(this).val());
				
			    });
    $(".coordtype").click(function() 
			  {
			      SetCommands($(this).val());
			      
			  });

    $("#stabstart").click(function()
			  {
			      if($(this).val() == "Start")
			      {
				  PTCmd('SE', function(){ PTCmd('SS', HandleStabState)});
			      }
			      else
			      {
				  PTCmd('SD', function(){ PTCmd('SS', HandleStabState)});
			      }
			  });
    
    
    $("#SendPos").click(function()
			{
			    strCmd = '';
			    
			    /* if we are running, we don't want to send the C=I */
			    if($("#stabstatus").html() != "Running")
			    {
				strCmd += "C=I&";
			    }
			    strCmd += PP + '=' + $("#PanPosInput").val() + '&';
			    strCmd += TP + '=' + $("#TiltPosInput").val() + '&';
			    /* also don't want to send a speed */
			    if($("#stabstatus").html() != "Running")
			    {
				strCmd += PS + '=' + $("#PanSpeedInput").val() + '&';
				strCmd += TS + '=' + $("#TiltSpeedInput").val();
			    }
			    PTCmd(strCmd);
			    $("#controlpos").attr("checked", "true");
			    
			});

    

    $("#SendString").click(function() 
			   {
			       PTCmd($("#cmd").val());
			   });
    
    
    $(document).keydown(function(event)
			{
			    var KeyPressed = event.keyCode;
			    
			    //Prevents scrolling for arrow key down
			    switch(KeyPressed)
			    {
			    case 37:
			    case 38:
			    case 39:
			    case 40:
				event.preventDefault();
			    }
			    
			    //Only allows arrow press to move PTU if no other arrow keys are pressed
			    if ((LeftArrow_Pressed==false)&&(RightArrow_Pressed==false)
				&&(UpArrow_Pressed==false)&&(DownArrow_Pressed==false))
			    {
				
				//arrows equate to large arrow buttons
				switch (KeyPressed)
				{
				case 37:
				    LeftArrow_Pressed = true;
				    MouseDownFunc("leftleft");
				    break;
				case 38:
				    UpArrow_Pressed = true;
				    MouseDownFunc("upup");
				    break;
				case 39:
				    RightArrow_Pressed = true;
				    MouseDownFunc("rightright");
				    break;
				case 40:
				    DownArrow_Pressed = true;
				    MouseDownFunc("downdown");
				    break;
				}
			    }
			});
    
    
    
    $(document).keyup(function(event)
		      {
			  
			  var KeyPressed = event.keyCode;
			  
			  //Checks which key went up
			  //and if the keydown function registered it (i.e. LeftArrow_Pressed)
			  switch (KeyPressed)
			  {
			  case 37:
			      if (LeftArrow_Pressed==true)
			      {
				  MouseUpFunc();
			      }
			      LeftArrow_Pressed = false;
			      break;
			  case 38:
			      if (UpArrow_Pressed==true)
			      {
				  MouseUpFunc();
			      }
			      UpArrow_Pressed = false;
			      break;
			  case 39:
			      if (RightArrow_Pressed==true)
			      {
				  MouseUpFunc();
			      }
			      RightArrow_Pressed = false;
			      break;
			  case 40:
			      if (DownArrow_Pressed==true)
			      {
				  MouseUpFunc();
			      }
			      DownArrow_Pressed = false;
			      break;
			  }
			  

			  
		      });
    
    $(".controlbutton").mousedown(function()
				  {
				      MouseDownFunc($(this).attr("id"));
				  });
    
    $(".controlbutton").mouseup(function()
				{
				    MouseUpFunc();
				});
    
    

    $(".controlbutton").mouseleave(function()
				   {
				       MouseUpFunc();
				   });


    /* iPod/iPhone/iPad support */
    $(".controlbutton").bind('touchstart',
                             function(){
                                 /* Ignore synthesized mouse events since we get
                                  * touch events.
                                  */
                                 if(!have_touch_events){
                                     $(".controlbutton").unbind('mousedown');
                                     $(".controlbutton").unbind('mouseup');
                                     have_touch_events = 1;
                                 }
                                 MouseDownFunc($(this).attr("id"));
                             });
    $(".controlbutton").bind('touchend', function(){
        MouseUpFunc();
    });

    /* prevent control labels from being clickable */
    $(".ptu-control-label").bind(
        'mousedown mouseup mouseleave touchstart touchend',
        function(e){
            e.stopPropagation();
        });


    $("#monitor").toggle(
        function()
        {
            $(this).val('Stop');
            $(this).everyTime(250, UpdatePosSpeed);
            bMonitorWaiting = false;
            bMonitorUpdating = true;
        },
        function()
        {
            bMonitorWaiting = false;
            bMonitorUpdating = false;
            $(this).val('Start');
            $(this).stopTime();
            ClearPosSpeedReport();
        }
    );

    

    $("#cmd").keypress(function(event)
		       {
			   //alert("keypress : " + event.keyCode);
			   if(event.keyCode == 13)
			       $("#SendString").click();

		       });
    
    
    
    
    $("#PosExpand").toggle( function() {
	
	$("#PositionControls").show();
	$("#SpeedControls").show();
	$("#PosExpandImg").attr("src", "graphics/dexarrow11.png");
    },
			    function() {
				
				$("#PositionControls").hide();
				$("#SpeedControls").hide();
				$("#PosExpandImg").attr("src", "graphics/dblexarrow11.png");
			    });

    
    $(".StepExpand").toggle( showStep,
			     hideStep);

    $("#POSTExpand").toggle( function() {
	$("#StringControls").show();
	$("#POSTExpandImg").attr("src", "graphics/dexarrow11.png");
	
    },
			     function() {
				 $("#StringControls").hide();
				 $("#POSTExpandImg").attr("src", "graphics/dblexarrow11.png");
				 
			     });
    
    
    $("#posdisplay").click( function() {
	
	PosClickHandler();
	
    });
    $("#degdisplay").click( function() {
	DegClickHandler();
    });
    
    $(".smalllink").hover( function() {
	$(this).css('text-decoration', "underline");
    },
			   function () {
			       $(this).css('text-decoration', "none");
			   });
    
    DegClickHandler();
    ShowControls("none");
    
    $.ajax({data: 'SS', 
	    success: HandleStabState,
	    complete: function() {
		if(bGyroPresent)
		{
		    SetCommands($("input[name='coordtype']:checked").val());
		    $("#stabcontrols").show();
		}
		else
		{
		    SetCommands('P');
		    $("#stabcontrols").hide();
		}
	    },
	    error: function() {
		showError();
	    }
	   });

    UpdatePosSpeed();
});

function PosClickHandler()
{
    $("#posdisplay").css('color', "#000000");
    $("#degdisplay").css('color', "#888888");
    bUseDegrees = false;
    UpdatePosSpeed();

}

function DegClickHandler()
{
    $("#degdisplay").css('color', "#000000");
    $("#posdisplay").css('color', "#888888");
    bUseDegrees = true;
    UpdatePosSpeed();
}


function UpdatePosSpeed()
{
    if(bMonitorWaiting == false)
    {
	bMonitorWaiting=true;
	var cmd = '' ;
	if(bGyroPresent)
	    cmd = 'SS&';
	cmd += PP+'&'+TP+'&'+PD+'&'+TD+'&C'
	$.ajax({data: cmd,
		success: UpdatePosSpeedFromJson,
		complete: function() { bMonitorWaiting=false;},
		error: function() { showError(); }
	       });
    }
}

function SetDataUnits(handle, val, conv)
{
    /* don't update status if it's disabled */
    if(!bMonitorUpdating)
	return;
    if(bUseDegrees)
    {
	var fVal = parseInt(val) * conv;
	handle.html(fVal.toFixed(3));
    }
    else
    {
	handle.html(val);
    }

}


/* ClearPosSpeedReport - reset monitor box to unknown values */
function ClearPosSpeedReport(){
    $("#panpos").html('?');
    $("#tiltpos").html('?');
    $("#panspeed").html('?');
    $("#tiltspeed").html('?');
}


function UpdatePosSpeedFromJson(data)
{
    $.each(data, function(key,val) 
	   {
	       
	       switch(key)
	       {
	       case PP:
		   SetDataUnits($("#panpos"), val, fPanResolution);
		   break;
	       case TP:
		   SetDataUnits($("#tiltpos"), val, fTiltResolution);
		   break;
	       case PD:
		   iLastPanSpeed = val;
		   SetDataUnits($("#panspeed"), val, fPanResolution);
		   break;
	       case TD:
		   iLastTiltSpeed = val;
		   SetDataUnits($("#tiltspeed"), val, fTiltResolution);
		   break;
	       case 'C':
		   eLastMode = val;
		   break;
	       case 'SS':
		   UpdateStabState(val);
		   break;
	       default:
		   break;

	       }
	   });
}


function ShowControls(which)
{
    
    if(which == 'position')
    {
	//PUT ALL THE hide/show up here so it looks nice
	$("#bigsteprow").show();
	$("#smallsteprow").show();
	$("#bigspeedrow").hide();
	$("#smallspeedrow").hide();
    }
    else if(which == 'speed')
    {
	$("#bigsteprow").hide();
	$("#smallsteprow").hide();
	$("#bigspeedrow").show();
	$("#smallspeedrow").show();
	
    }
    else
    {
	$("#bigsteprow").hide();
	$("#smallsteprow").hide();
	$("#bigspeedrow").hide();
	$("#smallspeedrow").hide();
	

    }
}


function WaitForHome(iTries)
{

    if(iTries > 100)
	bWaitForHome = false;


    var pp = "";
    var tp = "";
    
    $.ajax( {
	data: PP+'&'+TP,
	
	success: function(data)
	{
	    $.each(data, function(key,val)
		   {
		       if(key == PP)
			   pp = val;
		       if(key == TP)
			   tp = val;
		   });
	    
	    if(pp == '0' && tp == '0')
		bWaitForHome = false;
	},
	complete: function(xmlReq, textRes)
	{
	    if(bWaitForHome == false)
	    {
		$.post("/API/PTCmd", 
		       "C=V",
		       GenericJson,
		       "json");
	    }
	    else
	    {
		iTries++;
		var cmd = "WaitForHome(" + iTries + ");";
		setTimeout(cmd, 250);
	    }
	    
	},
	error: function() {
	    showError();
	}
    });
    
}

function sign(x)
{
    if(x >= 0)
	return 1;
    return -1;
}

function SetCommands(which)
{
    if(which == 'S') //stabilized commands
    {
	PP='SPP';
	TP='STP';
	PS='SPS';
	TS='STS';
	PD='SPD';
	TD='STD';
	PO='SPO';
	TO='STO';

    }
    if(which == 'P') //ptu commands
    {
	PP='PP';
	TP='TP';
	PS='PS';
	TS='TS';
	PD='PD';
	TD='TD';
	PO='PO';
	TO='TO';
	$("input[name='SPS']").each(function()
				    {
					//$(this).name('PS');
				    });
    }

}


function HandleStabState(data)
{
    $.each(data, function(key, val)
	   {
	       switch(key)
	       {
	       case 'SS':
		   UpdateStabState(val);
	       }
	   });
}

function UpdateStabState(val)
{
    var status = SSToString(val);
    switch(val)
    {
    case '1': //error
    case '5':
	$("#stabstart").val("Start");
	$("#stabstatus").html(status);
	bGyroPresent = true;
	break;
    case '2': //running
	$("#stabstart").val("Stop");
	$("#stabstatus").html(status);
	bGyroPresent = true;
	break;
    case '3': //calib
	$("#stabstart").val("N/A");
	$("#stabstatus").html(status);
	bGyroPresent = true;
	break;
    case '0': //not present
    case '4': //error
    case '6': //busy
	$("#stabstart").val("N/A");
	$("#stabstatus").html(status);
	bGyroPresent = false;
	break;
    }

}


function MouseDownFunc(id)
{
    var mode;
    if(bWaitForHome)
	return;
    
    
    
    if( $("input[name='controltype']:checked").val() == 'speed')
    {
	mode = 1;
	// get the speeds
	UpdatePosSpeed();
	bArrowDown = true;
    }
    else
    {
	mode = 0;
	bArrowDown = false;
    }
    
    var iBigStep = 0;
    var iSmallStep = 0;
    if(mode == 1)
    {
	iBigStep = $("#bigspeed").val();
	iSmallStep = $("#smallspeed").val();
    } 
    else
    {
	iBigStep = $("#bigstep").val();
	iSmallStep = $("#smallstep").val();
	
	
    }
    var cmd;
    var val;
    
    switch(id)
    {
    case "upup":
	{
	    val = parseInt(iBigStep);
	    
	    if(mode == 1)
	    {
		cmd = TS;
		val = boundSpeed(val, $("#bigspeed"), TiltUpperSpeed, TiltLowerSpeed);
	    }
	    else
		cmd = TO;
	    
	    break;
	}
    case "up":
	{
	    val = parseInt(iSmallStep);
	    if(mode == 1)
	    {
		cmd = TS;
		val = boundSpeed(val, $("#smallspeed"), TiltUpperSpeed, TiltLowerSpeed);
	    }
	    else
		cmd = TO;
	    
	    break;
	}
    case "downdown":
	{
	    val = parseInt(iBigStep) * -1;
	    
	    if(mode == 1)
	    {
		cmd = TS;
		val = boundSpeed(val, $("#bigspeed"), TiltUpperSpeed, TiltLowerSpeed);
	    }
	    else
		cmd = TO;
	    
	    break;
	}
	
    case "down":
	{
	    val = parseInt(iSmallStep) * -1;
	    
	    if(mode == 1)
	    {
		cmd = TS;
		val = boundSpeed(val, $("#smallspeed"), TiltUpperSpeed, TiltLowerSpeed);
	    }
	    else
		cmd = TO;
	    
	    break;
	}
    case "leftleft":
	{
	    val = parseInt(iBigStep) * -1;
	    
	    if(mode == 1)
	    {
		cmd = PS;
		val = boundSpeed(val, $("#bigspeed"), PanUpperSpeed, PanLowerSpeed);
	    }
	    else
		cmd = PO;
	    
	    break;
	}
    case "left":
	{
	    val = parseInt(iSmallStep) * -1;
	    
	    if(mode == 1)
	    {
		cmd = PS;
		val = boundSpeed(val, $("#smallspeed"), PanUpperSpeed, PanLowerSpeed);
	    }
	    else
		cmd = PO;
	    
	    break;
	}
    case "rightright":
	{
	    val = parseInt(iBigStep);
	    
	    if(mode == 1)
	    {
		cmd = PS;
		val = boundSpeed(val, $("#bigspeed"), PanUpperSpeed, PanLowerSpeed);
	    }
	    else
		cmd = PO;
	    
	    break;
	}
    case "right":
	{
	    val = parseInt(iSmallStep);
	    
	    if(mode == 1)
	    {
		cmd = PS;
		val = boundSpeed(val, $("#smallspeed"), PanUpperSpeed, PanLowerSpeed);
	    }
	    else
		cmd = PO;
	    
	    break;
	}
    case "home":
	{
	    /* special case, doesn't go through to the bottom */
	    $.ajax({
		data: 'SS',
		success: HandleStabState,
		complete: function() {
		    if($("#stabstatus").html() == "Running")
		    {
			/* in this case, just send the position, don't wait */
			cmd = PS + "=0&" + TS + "=0&" + PP + "=0&" + TP + "=0";
			$.post("/API/PTCmd",
			       cmd,
			       GenericJson,
			       "json");
			
		    }
		    else
		    {
			
			
			bWaitForHome = true;
			bArrowDown = false;
			//special case, have to send two commands
			cmd = "C=I&" + PS + "=" + PanUpperSpeed + "&" + TS + "=" + TiltUpperSpeed + "&" + PP+ "=0&" + TP + "=0";
			
			$.post("/API/PTCmd", 
			       cmd,
			       GenericJson,
			       "json");
		     	
			var iTries = 0;
			cmd = "WaitForHome(" + iTries + ");";
			setTimeout(cmd, 250);
			
			return;
		    }
		},
		error: function() {
		    showError();
		}
	    });
	    return;

	}

    }
    
    var fullcmd = cmd;
    var contcmd = '';
    
    if(mode == 1)
    {
	if(cmd == PS)
	{
	    if(sign(parseInt(val)) == sign(parseInt(iLastPanSpeed)))
		contcmd = PS+ '=' + iLastPanSpeed + '&' + TS + '=0&';
	    else
		contcmd = PS + '=0&' + TS + '=0&';
	}
	if(cmd == TS)
	{
	    if(sign(parseInt(val)) == sign(parseInt(iLastTiltSpeed)))
		contcmd = TS + '=' + iLastTiltSpeed + '&'+PS+'=0&';
	    else
		contcmd = PS+'=0&'+TS+ '=0&';
	}
	if(eLastMode == 'I' && $("#stabstatus").html() != "Running")
	    contcmd = "C=V&" + contcmd;

	fullcmd =contcmd + cmd;
    }
    else if(mode == 0)
    {
	if($("#stabstatus").html() == "Running")
	{
	    fullcmd = cmd;
	}
	else
	{
	    fullcmd = "C=I&" + PS+ "=" + PanUpperSpeed + "&" + TS+ "=" + TiltUpperSpeed + "&" + cmd;
	}
    }


    
    var xmlRes = $.ajax( {
	data: fullcmd + "=" + parseInt(val),
	complete: function (xmlReq, textRes)
	{
	    /* if we are in position mode, and the last offset was off the edge of the world */
	    if(textRes == "error" && mode == 0)
	    {
		var ncmd = "";
		var nval = "";
		clearInterval(ArrowIntervalId);
		
		//ok, now set to max
		//these commmands intentionally do not work on stabilized
		if(cmd == "PO")
		{
		    ncmd = "PP";
		    if(val > 0)
			nval = PanMax;
		    else
			nval = PanMin;
		}
		else if(cmd == "TO")
		{
		    ncmd = "TP";
		    if(val > 0)
			nval = TiltMax;
		    else
			nval = TiltMin;
		}
		$.post("/API/PTCmd", 
		       ncmd + "=" + nval,
		       GenericJson,
		       "json");
	    }
	},
	error: function(xhr, textStatus, errorThrown) {
	    showError(textStatus);
	}
    });
}

function MouseUpFunc ()
{
    if(bArrowDown)
    {
	if( $("input[name='controltype']:checked").val() == 'position')
	{
	    return;
	}
	
	$.post("/API/PTCmd",
	       PS+ "=0&" + TS + "=0",
	       GenericJson,
	       "json");
	$("#bigspeed").removeClass("yellowbackground");
	$("#smallspeed").removeClass("yellowbackground");
	$("#bigspeed").addClass("whitebackground");
	$("#smallspeed").addClass("whitebackground");
	bArrowDown = false;
    }
}

function UpdateData()
{
    //This function doesn't do anything, but needs to be here for GPM stuff
}

function boundSpeed(speed, obj, max, min)
{
    sgn = sign(speed);
    if(Math.abs(speed) > max)
    {
	speed = sgn * max;
	showSpeedError(obj);
    }
    if(Math.abs(speed) < min)
    {
	speed = sgn * min;
	showSpeedError(obj);
    }
    return speed;
}

function showSpeedError(obj)
{
    showStep();
    obj.removeClass("whitebackground");
    obj.addClass("yellowbackground");
}

function showStep()
{
    ShowControls($("input[name='controltype']:checked").val());
    $("#StepExpandImg").attr("src", "graphics/dexarrow11.png");
}

function hideStep()
{
    ShowControls('');					      
    $("#StepExpandImg").attr("src", "graphics/dblexarrow11.png");
}