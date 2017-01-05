var ws = new OBSWebSocket();
var userip, port = 4444;

$(document).ready(function()
{	
	/* Get user ip, if IPv6 -> Check IPv6 box */
	$.getScript("https://l2.io/ip.js?var=userip", function() {
		$("#ip").val(userip);
		if(isIPv6(userip)){ $("#ipv6").prop("checked", true); }
	});
	
	/* When connection is established */
	ws.onConnectionOpened = function() {
		ws.getAuthRequired(function(err, data) {
			if(!data.authRequired) //If there is no auth required -> Load all the OBS stuff (if auth is required => onAuthenticationSuccess/Failure handles this)
			{
				loadOBS();
			}
		});
	};
	
	/* When connection is closed */
	ws.onConnectionClosed = function() {
		$("#statusbar #connectionStatus").html("OBS not connected! (connection closed)");	
		$("#statusbar #connectionStatus").css("color", "white");
		closeOBS();
	};
	
	/* When connection fails */
	ws.onConnectionFailed = function() {
		$("#statusbar #connectionStatus").html("OBS not connected! (connection failed)");	
		$("#statusbar #connectionStatus").css("color", "red");
	};
	
	/* When auth was required and succeeded */
	ws.onAuthenticationSuccess = function() {
		loadOBS();
	};
	
	/* When auth was required and failed */
	ws.onAuthenticationFailure = function() {
		$("#statusbar #connectionStatus").html("OBS not connected! (wrong password)");	
		$("#statusbar #connectionStatus").css("color", "red");
	};
	
	/* If scene gets changed in OBS */
	ws.onSceneSwitch = function(sceneName) {
		$("#scenes #list").find(".active").removeClass("active");				//Remove class 'active' from last selected scene			
		$("#scenes #list .scene:contains("+sceneName+")").addClass("active");	//Add class 'active' to new selected scene
		
		/* Call to get the new sources */
		ws.getCurrentScene(function(err, data) {
			$("#sources #list").html("");
			
			if(data.sources !== undefined)
			{
				var len = data.sources.length;
				for(var i=0; i<len; i++)
				{
					if(!isAscii(data.sources[i].name))
					{
						console.log("[ERROR] Source ('"+data.sources[i].name+"') deactivated! Please do not use non ASCII-characters as it will not work with the plugin!");
						$("#sources #list").append('<div class="source_error">'+data.sources[i].name+'</div>');
					}
					else
					{
						$("#sources #list").append('<div class="source">'+data.sources[i].name+'</div>');
					}
				}
			}
		});
	};

	/* If scene gets modified (created, removed, changed) in OBS */
	ws.onSceneListChanged(function(response) {
		// SO FAR BUGGED!!
		console.log(response);
	});
	
	/* If scene gets modified (created, removed, changed) in OBS */
	ws.onStreamStatus = function(data) {
		$("#obsbar #online").html("Online");
		$("#obsbar #online").css("color", "greenyellow");
		$("#obsbar #bps").html(([data.bytesPerSecond]*0.008).toFixed(2)+" kbit/s");
		$("#obsbar #droppedFrames").html([data.numberOfDroppedFrames]+" Frames dropped ("+([data.numberOfDroppedFrames]/[data.numberOfFrames]*100).toFixed(2)+"%)");
		$("#obsbar #totalFrames").html([data.numberOfFrames]+" Frames sent");
		$("#obsbar #fps").html([data.fps.toFixed(2)]+" FPS");
		$("#obsbar #streamTime").html(secondsTimeSpanToHMS([data.totalStreamTime]));
	};
	
	
	// STREAM START/STOP
	
	/* When the stream is starting */
	ws.onStreamStarting = function() {
		$("#obsbar #info").html("Stream starting...");
	};
	
	/* When the stream is completely started */
	ws.onStreamStarted = function() {
		$("#obsbar #info").html("Stream started");
	};
	
	/* When the stream is stopping */
	ws.onStreamStopping = function() {
		$("#obsbar #info").html("Stream stopping...");
	};
	
	/* When the stream is completely stopped */
	ws.onStreamStopped = function() {
		$("#obsbar #online").html("Offline");
		$("#obsbar #online").css("color", "white");
		$("#obsbar #bps").html("0.00 kbit/s");
		$("#obsbar #droppedFrames").html("0 Frames dropped (0.00%)");
		$("#obsbar #totalFrames").html("0 Frames sent");
		$("#obsbar #fps").html("0.00 FPS");
		$("#obsbar #streamTime").html("0:00:00");
		
		$("#obsbar #info").html("Stream stopped");
	};

	
	// RECORDING START/STOP
	
	/* When the recording is starting */
	ws.onRecordingStarting = function() {
		$("#obsbar #info").html("Recording starting...");
	};
	
	/* When the recording is completely started */
	ws.onRecordingStarted = function() {
		$("#obsbar #info").html("Recording started");
	};
	
	/* When the recording is stopping */
	ws.onRecordingStopping = function() {
		$("#obsbar #info").html("Recording stopping...");
	};
	
	/* When the recording is completely stopped */
	ws.onRecordingStopped = function() {
		$("#obsbar #info").html("Recording stopped");
	};
});

$(document).on("click", "#connect", function(e){
	e.preventDefault();
	
	var ip, pass;

	if($("#ipv6").is(':checked'))	//User wantes to connect over IPv6
	{
		ip = ($("#ip").val() === "") ? "[::1]:"+port : "["+($("#ip").val())+"]:"+port;
	}
	else							//User wants to connect over IPv4
	{
		ip = ($("#ip").val() === "") ? "127.0.0.1:"+port : ($("#ip").val())+":"+port;
	}

	pass = $("#pass").val();
	ws.connect(ip, pass);
	
	$("#statusbar #connectionStatus").html("Connecting to OBS...");	
	$("#statusbar #connectionStatus").css("color", "white");
});

$(document).on("click", "#scenes #list .scene", function(e){
	e.preventDefault();
	
	ws.setCurrentScene($(this).text());						//Set selected scene
	$(this).parent().find(".active").removeClass("active");	//Remove class 'active' from last selected scene
	$(this).addClass("active");								//Add class 'active' to new selected scene
});

$(document).on("click", "#sources #list .source", function(e){
	e.preventDefault();
	
	if(!$(this).hasClass("invisible")) //If class is not invisible, make it invisible
	{
		ws.setSourceVisbility($(this).text(), false);
		$(this).addClass("invisible");	
	}	
	else								//The other way around
	{
		ws.setSourceVisbility($(this).text(), true);
		$(this).removeClass("invisible");	
	}									
});

$(document).on("click", "#transitions #list .transition", function(e){
	e.preventDefault();
	
	ws.setCurrentTransition($(this).text());				//Set selected transition
	$(this).parent().find(".active").removeClass("active");	//Remove class 'active' from last selected transition
	$(this).addClass("active");								//Add class 'active' to new selected transition
});

function loadOBS(){
	closeOBS(); //Just to be sure that the interface is clear
	
	$("#statusbar #connectionStatus").html("OBS connected");	
	$("#statusbar #connectionStatus").css("color", "greenyellow");	
	$("#ipv6").prop("disabled", "disabled");
	$("#connect").prop("disabled", "disabled");
	$("#connect").html("Connected");

	/* Get obs-websocket version */
	ws.getVersion(function(err, data) {
		$("#statusbar #wsVersion").html("obs-websocket Version: "+data.obsWebSocketVersion);
	});

	/* Create scenes & sources list on startup */
	ws.getSceneList(function(err, data) {
		if(data.scenes !== undefined) //If there are no scenes, don't do anything
		{
			var len = data.scenes.length;
			for(var i=0; i<len; i++)
			{
				if(!isAscii(data.scenes[i].name))
				{
					console.log("[ERROR] Scene ('"+data.scenes[i].name+"') deactivated! Please do not use non ASCII-characters as it will not work with the plugin!");
					$("#scenes #list").append('<div class="scene_error">'+data.scenes[i].name+'</div>');
				}
				else
				{
					$("#scenes #list").append('<div class="scene">'+data.scenes[i].name+'</div>');
				}
			}

			$("#scenes #list .scene:contains("+data.currentScene+")").addClass("active"); //Add class 'active' to selected scene on startup
		}
	});

	/* Find active scene on startup */
	ws.getCurrentScene(function(err, data) {
		var scene = $("#scenes #list .scene:contains("+data.name+")");
		scene.addClass("active");

		/* Get all sources of scene on startup */
		if(data.sources !== undefined) //If there are no sources, don't do anything
		{
			var len = data.sources.length;
			for(var i=0; i<len; i++)
			{
				if(!isAscii(data.sources[i].name))
				{
					console.log("[ERROR] Source ('"+data.sources[i].name+"') deactivated! Please do not use non ASCII-characters as it will not work with the plugin!");
					$("#sources #list").append('<div class="source_error">'+data.sources[i].name+'</div>');
				}
				else
				{
					$("#sources #list").append('<div class="source">'+data.sources[i].name+'</div>');
				}
			}
		}
	});

	/* Create transitions list on startup */
	ws.getTransitionList(function(err, data) {
		if(data.transitions !== undefined) //If there are no transitions, don't do anything
		{
			var len = data.transitions.length;
			for(var i=0; i<len; i++)
			{
				if(!isAscii(data.transitions[i].name))
				{
					console.log("[ERROR] Transition ('"+data.transitions[i].name+"') deactivated! Please do not use non ASCII-characters as it will not work with the plugin!");
					$("#transitions #list").append('<div class="transition_error">'+data.transitions[i].name+'</div>');
				}
				else
				{
					$("#transitions #list").append('<div class="transition">'+data.transitions[i].name+'</div>');
				}
			}

			$("#transitions #list .transition:contains("+data.currentTransition+")").addClass("active"); //Add class 'active' to selected transition on startup
		}
	});
}

function closeOBS(){
	$("#scenes #list").html("");
	$("#sources #list").html("");
	$("#transitions #list").html("");
	$("#connect").html("Connect");
	$("#connect").prop("disabled", "");
	$("#ipv6").prop("disabled", "");
}

/* MISC FUNCTIONS */

function isAscii(str) {
    return  /^[\000-\177]*$/.test(str) ;
}

function secondsTimeSpanToHMS(s) {
    var h = Math.floor(s/3600); //Get whole hours
    s -= h*3600;
    var m = Math.floor(s/60); //Get remaining minutes
    s -= m*60;
    return h+":"+(m < 10 ? '0'+m : m)+":"+(s < 10 ? '0'+s : s); //zero padding on minutes and seconds
}

function isIPv6(str)
{
    return /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$|^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$/.test(str);
}