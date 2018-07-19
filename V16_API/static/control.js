$(document).ready(function() {
    var global_status;
    setInterval(function(){
        $.ajax({
            async: true,
            url: "/status",
            success: function(data) {
                        global_status = JSON.parse(data)
                    }
        });
    }, 250);
    
    setInterval(function(){
        if (global_status.PTTEnabled) {
            $("#PTT").addClass("active").addClass("btn-success");
        } else {
            $("#PTT").removeClass("active").removeClass("btn-success");
        }
        if (global_status.ScanEnabled) {
            $("#scan").addClass("active").addClass("btn-success");
        } else {
            $("#scan").removeClass("active").removeClass("btn-success");
        }
        if (global_status.PrimaryFreq != $("#primary_input").val()) {
          $("#primary_refresh").addClass("btn-danger");
        } else {
          $("#primary_refresh").removeClass("btn-danger");
        } 
        if (global_status.StandbyFreq != $("#standby_input").val()) {
          $("#standby_refresh").addClass("btn-danger");
        } else {
          $("#standby_refresh").removeClass("btn-danger");
        } 
        $("#squelch").val(global_status.Squelch)

    }, 250);

    $("#PTT").click(function (event) {
        $.post(
            "commands",
            JSON.stringify({
                            parameter: "PTT",
                            value: !global_status.PTTEnabled
                           })
        );
     });
     
     $("#scan").click(function (event) {
         $.post(
             "commands",
             JSON.stringify({
                             parameter: "SCAN",
                             value: !global_status.ScanEnabled
                            })
         );
      });
      
      $("#replay").click(function (event) {
          $.post(
              "commands",
              JSON.stringify({
                              parameter: "PLAYBACK",
                              value: 0
                             })
          );
       });
       
      $("#swap").click(function (event) {
         $.post(
             "commands",
             JSON.stringify({
                             parameter: "SWAP",
                             value: 0
                            })
         );
      });
      $("#nose").click(function (event) {
          $("#nose").addClass("active");
          $("#down").removeClass("active");
          $.post(
              "commands",
              JSON.stringify({
                              parameter: "CAM",
                              value: 0
                             })
          );
      });
      $("#down").click(function (event) {
         $("#down").addClass("active");
         $("#nose").removeClass("active");
         $.post(
             "commands",
             JSON.stringify({
                             parameter: "CAM",
                             value: 3
                            })
         );
      });
      $("#primary_submit").click(function (event) {
         $.post(
             "commands",
             JSON.stringify({
                             parameter: "PRIM_FREQ",
                             value: $("#primary_input").val()
                            })
         );
      });
      $("#standby_submit").click(function (event) {
         $.post(
             "commands",
             JSON.stringify({
                             parameter: "STBY_FREQ",
                             value: $("#standby_input").val()
                            })
         );
      });
      $("#squelch_up").click(function (event) {
         $.post(
             "commands",
             JSON.stringify({
                             parameter: "SQUELCH",
                             value: parseInt($("#squelch").val()) + 1
                            })
         );
      });
      $("#squelch_dn").click(function (event) {
         $.post(
             "commands",
             JSON.stringify({
                             parameter: "SQUELCH",
                             value: parseInt($("#squelch").val()) - 1
                            })
         );
      });
      $("#primary_refresh").click(function (event) {
         $("#primary_input").val(global_status.PrimaryFreq.toFixed(3));
      });
      $("#standby_refresh").click(function (event) {
         $("#standby_input").val(global_status.StandbyFreq.toFixed(3));
      });

})