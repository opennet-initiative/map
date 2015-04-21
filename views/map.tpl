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
	<script src="/static/openlayers/ol.js" type="text/javascript"></script>
</head>
	<body style="background-color: #B5D0D0">
		<div id="map" class="map"></div>
		 <script type="text/javascript">
		      var map = new ol.Map({
			target: 'map',
			controls: ol.control.defaults().extend([new ol.control.FullScreen()]),
			layers: [
			  new ol.layer.Tile({
			    source: new ol.source.MapQuest({layer: 'osm'})
			  }),
			  new ol.layer.Vector({
				title: 'accesspoints',
				source: new ol.source.GeoJSON({
				  url: '/api/accesspoints',
				  projection: 'EPSG:3857',
				}),
			  })
			  /* #TODO: wir müssen wohl manuell einen layerswitcher nachrüsten
			new ol.layer.Image({
			    //extent: [-13884991, 2870341, -7455066, 6338219],
			    source: new ol.source.ImageWMS({
			      url: 'http://www.geodaten-mv.de/dienste/adv_dop',
			      params: {'LAYERS': 'adv_dop'},
			      serverType: 'geoserver'
			    })
			  }),
			  */
			],
			view: new ol.View({
			  center: ol.proj.transform([12.5876, 54.0118], 'EPSG:4326', 'EPSG:3857'),
			  zoom: 09,
			  projection: 'EPSG:3857'
			})
		      });

			var geolocation = new ol.Geolocation({
			    projection: 'EPSG:3857',
			    tracking: true
			});

			geolocation.once('change', function(evt) {
			  console.log(geolocation.getPosition());
			  map.getView().setCenter(geolocation.getPosition());
			  map.getView().setZoom(16);
			});
		</script>
	</body>
</html>
