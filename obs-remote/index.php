<!doctype html>
<html>
	<head>
       <!-- JQUERY -->
        <script src="src/js/jquery/jquery-2.1.4.min.js"></script>
        <script src="src/js/jquery/jquery-ui.min.js"></script>
        
        <!-- OBS API -->
        <script type="text/javascript" src="src/js/obs-websocket-js/dist/obs-websocket.js"></script>
        
        <!-- MAIN (l2.io fot getting users IP) -->
        <script src="src/js/main.js"></script>
        
        <!-- CSS -->
    	<link href="src/css/style.css" rel="stylesheet" />

		<!-- META -->
		<meta charset="utf-8">
		<title>Unbenanntes Dokument</title>
	</head>

	<body>
		<div id="main">
			<div id="statusbar">
				<div id="connectionStatus" style="color:white;">Connect with:</div>
				<input id="ip" type="text" placeholder="Loading your ip..."/>
				<input id="pass" type="text" placeholder="password (optional)"/>
				<button id="connect" type="button">Connect</button>
				<input id="ipv6" type="checkbox"> use IPv6
				<div id="wsVersion"></div>
			</div>
			
			<div id="scenes">
				<div id="title">Scenes</div>
				<div id="list"></div>
			</div>
			
			<div id="sources">
				<div id="title">Sources</div>
				<div id="list"></div>
			</div>
			
			<div id="transitions">
				<div id="title">Transitions</div>
				<div id="list"></div>
			</div>
			
			<div id="obsbar">
				<div id="info"></div>
			
				<div id="online">Offline</div>
					<span>|</span>
				<div id="bps">0.00 kbit/s</div>
					<span>|</span>
				<div id="droppedFrames">0 Frames dropped (0.00%)</div>
					<span>|</span>
				<div id="totalFrames">0 Frames sent</div>
					<span>|</span>
				<div id="fps">0.00 FPS</div>
					<span>|</span>
				<div id="streamTime">0:00:00</div>
			</div>
		</div>
	</body>
</html>