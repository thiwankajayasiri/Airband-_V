// PTCmd - Generic asyncronous PTCmd call.
// cmd: formatted command (ex: "PP&TP")
// cb (optional): AJAX callback on command success.
// err (optional): AJAX callback on error
// com (optional): AJAX callback on complete
function PTCmd(cmd, cb, err, com){
    if(cmd == undefined){
        throw("PTCmd: cmd is undefined.");
    }
    cb = cb || NOP;
    err = err || NOP;
    com = com || NOP;

    $.ajax({data: cmd,
	    success: cb,
	    error: err,
	    complete: com,
	    dataType: "json",
	    url: "/API/PTCmd"
	   });

}

function PTCmdLong(cmd, cb, err, com, timeoutms){
    if(cmd == undefined){
        throw("PTCmd: cmd is undefined.");
    }
    cb = cb || NOP;
    err = err || NOP;
    com = com || NOP;

    $.ajax({data: cmd,
	    success: cb,
	    error: err,
	    complete: com,
	    dataType: "json",
	    url: "/API/PTCmd",
	    timeout: timeoutms
	   });

}

function NOP() {

}


// PTCmdSync - Generic syncronous PTCmd call.
// cmd: formatted command (ex: "PP&TP")
// cb (optional): AJAX callback on command completion. defaults to GenericJson
// YOU HAD BETTER BE SURE YOU REALLY WANT TO USE THIS
// SYNC CALLS CAUSE PROBLEMS
// IF YOU ARE USING THIS, PERHAPS YOU SHOULD LEARN HOW CALLBACKS WORK
function PTCmdSync(cmd, cb){
    cb = cb || GenericJson;
    $.ajax({url:"/API/PTCmd",
            type: "POST",
            data: cmd,
            success: cb,
            async: false});
}


function GenericJson(data)
{
    var string = '';

    $.each(data, function(key, val)
	   {
	       string = string + key + " : " + val + "\n";
	   });

    $("#dialogue").text(string);
}

function GenericError()
{
    showError();
}


var bGyroPresent = false;

function CheckGyroPresent()
{
    $.post("/API/PTCmd",
	   "SS",
	   function(data)
	   {
	       $.each(data, function(key, val)
		      {
			  switch(key)
			  {
			  case 'SS':
			      if(val == '0')
			      {
				  bGyroPresent = false;
			      }
			      else
			      {
				  bGyroPresent = true;
				  $("#header-nav-row").append("<td><a href='ismconfig.html' class='header-nav-link'>ISM Config</a></td><td><img src='graphics/nav_vertline.gif'></td>");
			      }
			      break;
			  }
		      });
	   },
	   "json");
}

function CheckGPMPresent(json){
    if(json['GPM'] && json['GPM'] != 0){
        $("#header-nav-row").append("<td><a href='gpmconfig.html' class='header-nav-link'>GPM Config</a></td><td><img src='graphics/nav_vertline.gif'></td>");
    }
}

function CheckConfigIOPresent()
{
    $.post("/API/PTCmd", "IO",
           function(data)
	   {
	       $.each(data, function(key, val)
	       {
		   switch(key)
		   {
		   case 'IO':
		       if(val != '0')
		       {
			   $("#header-nav-row").append("<td><a href='ioconfig.html' class='header-nav-link'>IO Config</a></td><td><img src='graphics/nav_vertline.gif'></td>");
		       }
		   }
	       });
	   },
	   "json");
}

function CommonAjaxSetup()
{
    /* setup ajax for everything else */
    $.ajaxSetup({
	url: "/API/PTCmd",
	timeout: 10000,
	type: "POST",
	dataType: "json",
	cache: false
    });

    CheckGyroPresent();
    PTCmd('GPM', CheckGPMPresent);
    CheckConfigIOPresent();
    LoadHorizontalDividers();
    LoadLoadingDiv();
}

function LoadLoadingDiv()
{
    $("body").append('<div id="loading"> <p><img src="graphics/ajax-loader.gif" /> Please Wait</p></div>');
    $("body").append('<div id="loadingback"> <p><img src="" /></p></div>');
    //$("#loading").center();
}

function showLoading()
{
    $("#loading").show();
    $("#loadingback").show();
}

function hideLoading()
{
    $("#loading").hide();
    $("#loadingback").hide();
}

function showError(err)
{
    /* only one error */
    if($("#errornotify").length)
    {
	return;
    }

    errtop = '<div id="errornotify">'

    if(!err || (err == "timeout" )) {
        errbottom = '<input id="refresh" type="button" value="Refresh" /> </div>';
	err = 'This page did not load correctly.  Please refresh. ';
    } else {
        errbottom = '<input id="resetaxes" type="button" value="Reset Axes" title="Reset Axes"/>';
	err = 'Command failed. Please Reset Axes. ';
    }

    $("body").append(errtop + err + errbottom);

    $("#refresh").click( function() {
	location.reload();
    });

    $("#resetaxes").click(
        function(){
	    showLoading();
            PTCmdLong("R",
		  function(){
		      $("#errornotify").remove();
                  },
		  function() {
        	      alert('Reset Failed');
   		  }, '', 75000 );
	    CBWhenResponding("UpdateData(); hideLoading();");
        });

}

function SSToString(val)
{
    switch(val)
    {
    case '0':
	return "N/A";
    case '1':
	return "Ready";
    case '2':
	return "Running";
    case '3':
	return "Calibrating";
    case '4':
	return "Error";
    case '5':
	return "Calibration<BR>Failed";
    case '6':
	return "Busy";
    default:
	return "Unknown";
    }
}

function LoadHorizontalDividers()
{
    if($(".hordivider").length)
    {
	$(".hordivider").each(function() {
	    $(this).removeClass("hordivider");
	    $(this).load('hordivider.html');
	});
    }
}

var bWaiting = false;
var iTries = 0;
/* tries 100 times at timeout 250ms for the PTU to be responding */
/* at the end, or when the unit responds, run the callback */
function CBWhenResponding(cb)
{
    bWaiting = true;
    iTries = 0;
    cmd =  'CBWhenRespondingPoll("' + cb + '")';
    setTimeout(cmd, 250);
}

function CBWhenRespondingPoll(cb)
{
    if(iTries > 100)
    {
        eval(cb);
	return -1;
    }
    if(!bWaiting)
	return 0;

    $.ajax({
	data: "V",
	success: function()
	{
	    eval(cb);
	    bWaiting = false;
	    return 0;
	},
	error: function(jqXHR, textStatus, errorThrown)
	{
	    iTries++;
	    cmd = 'CBWhenRespondingPoll("' + cb + '")';
	    setTimeout(cmd, 250);
	}
    });


}
