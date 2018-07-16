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
        console.log(global_status);
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
         $("#primary_refresh").click(function (event) {
             $("#primary_input").val(global_status.PrimaryFreq)
          });

})