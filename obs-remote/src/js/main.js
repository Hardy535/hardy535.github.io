var ws = new OBSWebSocket();

$(document).ready(function()
{	
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
		$("#connect").html("Connect");
		closeOBS();
	};
	
	/* When connection fails */
	ws.onConnectionFailed = function() {
		$("#statusbar #connectionStatus").html("OBS not connected! (connection failed)");	
		$("#statusbar #connectionStatus").css("color", "red");
		$("#statusbar #connect").html("Connect");
	};
	
	/* When auth was required and succeeded */
	ws.onAuthenticationSuccess = function() {
		loadOBS();
	};
	
	/* When auth was required and failed */
	ws.onAuthenticationFailure = function() {
		$("#statusbar #connectionStatus").html("OBS not connected! (wrong password)");	
		$("#statusbar #connectionStatus").css("color", "red");
		$("#statusbar #connect").html("Connect");
	};
	
	/* If scene gets changed in OBS */
	ws.onSceneSwitch = function(sceneName) {
		$("#scenes .list").find(".active").removeClass("active");				//Remove class 'active' from last selected scene
		
		sceneName = sceneName.replace(":", "\\:");
		
		$("#scenes .list .scene:contains("+sceneName+")").addClass("active");	//Add class 'active' to new selected scene
		
		/* Call to get the new sources */
		ws.getCurrentScene(function(err, data) {
			$("#sources .list").html("");
			
			if(data.sources !== undefined)
			{
				var len = data.sources.length;
				for(var i=0; i<len; i++)
				{
					var source_name = data.sources[i].name;
					source_name = source_name.replace(":", "\\:");
					
					if(!isAscii(data.sources[i].name))
					{
						console.log("[ERROR] Source ('"+data.sources[i].name+"') deactivated! Please do not use non ASCII-characters as it will not work with the plugin!");
						$("#sources .list").append('<div class="error">'+data.sources[i].name+'</div>');
					}
					else
					{
						$("#sources .list").append('<div class="source">'+data.sources[i].name+'</div>');
					}
					
					/* If source is set to invisible */
					if(!data.sources[i].visible)
					{
						$("#sources .list .source:contains("+source_name+")").addClass("invisible");
					}
				}
			}
		});
	};

	/* If scene gets modified (created, removed, renamed or reordered) in OBS 
	NOTE: REMOVING, RENAMING, OR CHANGING ORDER OF SCENES DOESN'T TRIGGER THIS AT THE MOMENT! (BUG) */
	ws.onSceneListChanged  = function(response) {
		/* Clear scene list */
		$("#scenes .list").html("");
		
		/* If there are no scenes, don't do anything */
		if(response.scenes !== undefined)
		{
			var len = response.scenes.length;
			for(var i=0; i<len; i++)
			{
				var scene_name = response.scenes[i].name;
				scene_name = scene_name.replace(":", "\\:");
				
				if(!isAscii(response.scenes[i].name))
				{
					console.log("[ERROR] Scene ('"+response.scenes[i].name+"') deactivated! Please do not use non ASCII-characters as it will not work with the plugin!");
					$("#scenes .list").append('<div class="error">'+response.scenes[i].name+'</div>');
				}
				else
				{
					$("#scenes .list").append('<div class="scene">'+response.scenes[i].name+'</div>');
				}
			}

			var cscene_name = response.currentScene;
			cscene_name = cscene_name.replace(":", "\\:");

			$("#scenes .list .scene:contains("+cscene_name+")").addClass("active"); //Add class 'active' to new selected scene
			
		}
	};
	
	/* If stream statusinfo in OBS updates */
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

$(document).on("click", "#statusbar #connect", function(e){
	e.preventDefault();
	
	if($(this).html() === "Disconnect")	//User wants to disconnect
	{
		ws.disconnect();
		$(this).html("Connect");
	}
	else								//User wants to connect
	{
		var ip, pass, port = $("#port").val();

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
		
		$(this).html("Disconnect");
	}
});

$(document).on("click", "#statusbar #ichat", function(e){
	e.preventDefault();
	
	var twitchChannel = $("#settings #s_content #twitch_name #twitchname").val().toLowerCase();
	
	//If chat doesn't exist && Twitch Username in settings is set => Create chat
	if($("#content #chat_embed").length === 0 && twitchChannel !== "")
	{
		$("#content").append("<iframe frameborder='0' scrolling='no' id='chat_embed' src='http://www.twitch.tv/"+twitchChannel+"/chat' height='100%' width='25%'></iframe>");
	}
	else //Chat exists => Destroy chat
	{
		$("#content #chat_embed").remove();
	}
});

$(document).on("click", "#scenes .list .scene", function(e){
	e.preventDefault();
	
	ws.setCurrentScene($(this).text());						//Set selected scene
	$(this).parent().find(".active").removeClass("active");	//Remove class 'active' from last selected scene
	$(this).addClass("active");								//Add class 'active' to new selected scene
});

$(document).on("click", "#sources .list .source", function(e){
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

$(document).on("click", "#transitions .list .transition", function(e){
	e.preventDefault();
	
	ws.setCurrentTransition($(this).text());				//Set selected transition
	$(this).parent().find(".active").removeClass("active");	//Remove class 'active' from last selected transition
	$(this).addClass("active");								//Add class 'active' to new selected transition
});

/* SETTINGS */

$(document).on("click", "#statusbar #isettings", function(e){
	e.preventDefault();
	
	$("#settings").css("visibility", "visible");
});

$(document).on("click", "#settings #background", function(e){
	e.preventDefault();
	
	$("#settings").css("visibility", "hidden");
});

$(document).on("input change", "#settings #font-size input[type=range]", function(e) {
	e.preventDefault();
	
    $(this).prev().html("Font size: "+$(this).val());
	$("*:not(.font-size)").css("font-size", $(this).val()+"px");
});

$(document).on("click", "#settings #change-layout button", function(e) {
    e.preventDefault();
	
	$("#settings").css("visibility", "hidden");
	$(".column").append("<div class='position'> <div class='pos-left font-size'><</div> <div class='pos-right font-size'>></div> </div>");
	$(".column .position .pos-left").first().addClass("deactivated"); //Deactivate "move-left" for the left element
	$(".column .position .pos-right").last().addClass("deactivated"); //Deactivate "move-right" for the right element
});

/* FUNCTIONS */

function loadOBS(){
	closeOBS(); //Just to be sure that the interface is clear
	
	$("#statusbar #connectionStatus").html("OBS connected");	
	$("#statusbar #connectionStatus").css("color", "greenyellow");	
	$("#ipv6").prop("disabled", "disabled");

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
				var scene_name = data.scenes[i].name;
				scene_name = scene_name.replace(":", "\\:");
				
				if(!isAscii(data.scenes[i].name))
				{
					console.log("[ERROR] Scene ('"+data.scenes[i].name+"') deactivated! Please do not use non ASCII-characters as it will not work with the plugin!");
					$("#scenes .list").append('<div class="error">'+data.scenes[i].name+'</div>');
				}
				else
				{
					$("#scenes .list").append('<div class="scene">'+data.scenes[i].name+'</div>');
				}
			}

			var cscene_name = data.currentScene;
			cscene_name = cscene_name.replace(":", "\\:");

			$("#scenes .list .scene:contains("+cscene_name+")").addClass("active"); //Add class 'active' to selected scene on startup
		}
	});

	/* Find active scene on startup */
	ws.getCurrentScene(function(err, data) {
		var scene_name = data.name;
		scene_name = scene_name.replace(":", "\\:");
		
		$("#scenes .list .scene:contains("+scene_name+")").addClass("active");

		/* Get all sources of scene on startup */
		if(data.sources !== undefined) //If there are no sources, don't do anything
		{
			var len = data.sources.length;
			for(var i=0; i<len; i++)
			{
				var source_name = data.sources[i].name;
				source_name = source_name.replace(":", "\\:");
				
				if(!isAscii(data.sources[i].name))
				{
					console.log("[ERROR] Source ('"+data.sources[i].name+"') deactivated! Please do not use non ASCII-characters as it will not work with the plugin!");
					$("#sources .list").append('<div class="error">'+data.sources[i].name+'</div>');
				}
				else
				{
					$("#sources .list").append('<div class="source">'+data.sources[i].name+'</div>');
				}
				
				/* If source is set to invisible */
				if(!data.sources[i].visible)
				{
					$("#sources .list .source:contains("+source_name+")").addClass("invisible");
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
					$("#transitions .list").append('<div class="error">'+data.transitions[i].name+'</div>');
				}
				else
				{
					$("#transitions .list").append('<div class="transition">'+data.transitions[i].name+'</div>');
				}
			}

			$("#transitions .list .transition:contains("+data.currentTransition+")").addClass("active"); //Add class 'active' to selected transition on startup
		}
	});
}

function closeOBS(){
	$("#scenes .list").html("");
	$("#sources .list").html("");
	$("#transitions .list").html("");
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
