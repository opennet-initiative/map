<html lang="de">
<head>
	<meta http-equiv="content-type" content="text/html; charset=UTF-8">
  <meta http-equiv="X-UA-Compatible" content="chrome=1">
  <meta name="viewport" content="initial-scale=1.0, user-scalable=no, width=device-width">
	<title>Opennet Karte</title>
	<link rel="stylesheet" href="/static/openlayers/ol.css" type="text/css">
	<script src="/static/openlayers/ol.js" type="text/javascript"></script>
	<script src="https://code.jquery.com/jquery-2.1.3.min.js"></script>
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js"></script>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css">
	<script type="text/javascript" src="/static/onimaps.js" charset="utf-8"></script>
	<style>
		.map {
		height: 100%;
		width: 100%;
		}

		#popup {
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
		<div id="map" class="map">
			<div id="popup"></div>
			<div id="info"></div>
		</div>
		<script type="text/javascript">
			setupMap();
			setupPopup();
			setupTooltip();
			setupGeolocation();
		</script>
	</body>
</html>
