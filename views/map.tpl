<html lang="de">
<head>
	<meta http-equiv="content-type" content="text/html; charset=UTF-8">
	<title>Opennet Karte</title>
	<style>
		.map {
		height: 100%;
		width: 100%;
		}
    	</style>
	<link rel="stylesheet" href="/static/openlayers/ol.css" type="text/css">
	<script src="http://openlayers.org/en/v3.4.0/build/ol.js" type="text/javascript"></script>
</head>
	<body onload="init();" style="background-color: #B5D0D0">
		<div id="map" class="map"></div>
		 <script type="text/javascript">
		      var map = new ol.Map({
			target: 'map',
			controls: ol.control.defaults().extend([new ol.control.FullScreen()]),
			layers: [
			  new ol.layer.Tile({
			    source: new ol.source.MapQuest({layer: 'osm'})
			  }),
			new ol.layer.Image({
			    //extent: [-13884991, 2870341, -7455066, 6338219],
			    source: new ol.source.ImageWMS({
			      url: 'http://www.geodaten-mv.de/dienste/adv_dop',
			      params: {'LAYERS': 'adv_dop'},
			      serverType: 'geoserver'
			    })
			  })
			],
			view: new ol.View({
			  center: ol.proj.transform([52, 12], 'EPSG:4326', 'EPSG:3857'),
			  zoom: 4
			})
		      });
			var geolocation = new ol.Geolocation({
			    projection: 'EPSG:3857',
			    tracking: true
			});

			geolocation.on('change', function(evt) {
			  console.log(geolocation.getPosition());
			  map.getView().setCenter(geolocation.getPosition());
			  map.getView().setZoom(16);
			});
		</script>
	</body>
</html>
