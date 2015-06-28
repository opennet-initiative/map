<html lang="de">
<head>
	<meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <meta http-equiv="X-UA-Compatible" content="chrome=1">
  <meta name="viewport" content="initial-scale=1.0, user-scalable=no, width=device-width">
	<title>Opennet Karte</title>
	<link rel="icon" type="image/png" href="/static/headquarter.png" />
	<link rel="stylesheet" href="/static/openlayers/ol.css" type="text/css">
	<script src="/static/openlayers/ol.js" type="text/javascript"></script>
	<script src="/static/jquery/jquery-2.1.4.min.js"></script>
	<script src="/static/bootstrap/js/bootstrap.min.js"></script>
	<link rel="stylesheet" href="/static/bootstrap/css/bootstrap.min.css">
	<script src="/static/layerswitcher/ol3-layerswitcher.js"></script>
	<link rel="stylesheet" href="/static/layerswitcher/ol3-layerswitcher.css" />
	<script type="text/javascript" src="/static/onimaps.js" charset="utf-8"></script>
	<style>
		.map {
		height: 100%;
		width: 100%;
		}

		.ol-popup {
		  position: absolute;
		  background-color: white;
		  -webkit-filter: drop-shadow(0 1px 4px rgba(0,0,0,0.2));
		  filter: drop-shadow(0 1px 4px rgba(0,0,0,0.2));
		  padding: 15px;
		  border-radius: 10px;
		  border: 1px solid #cccccc;
		  bottom: 12px;
		  left: -50px;
		}
		.ol-popup:after, .ol-popup:before {
		  top: 100%;
		  border: solid transparent;
		  content: " ";
		  height: 0;
		  width: 0;
		  position: absolute;
		  pointer-events: none;
		}
		.ol-popup:after {
		  border-top-color: white;
		  border-width: 10px;
		  left: 48px;
		  margin-left: -10px;
		}
		.ol-popup:before {
		  border-top-color: #cccccc;
		  border-width: 11px;
		  left: 48px;
		  margin-left: -11px;
		}
		.ol-popup-closer {
		  text-decoration: none;
		  position: absolute;
		  top: 2px;
		  right: 8px;
		}
		.ol-popup-closer:after {
		  content: "✖";
		}

		#info {
				position: absolute;
				height: 1px;
				width: 1px;
				z-index: 100;
			}
			
		.tooltip.in {
			opacity: 1;
			filter: alpha(opacity=100);
		}
		
		.tooltip.top .tooltip-arrow {
			border-top-color: white;
		}
		
		.tooltip-inner {
			border: 2px solid white;
		}
	</style>
</head>
	<body style="background-color: #B5D0D0">
		<div id="map" class="map"></div>
		<div id="popup" class="ol-popup">
			<a href="#" id="popup-closer" class="ol-popup-closer"></a>
			<div id="popup-content"></div>
		</div>
		<script type="text/javascript">
			setupMap();
			setupPermalinks();
			setupPopup();
			setupTooltip();
			setupGeolocation();
		</script>
	</body>
</html>
