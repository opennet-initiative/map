<html lang="de">
<head>
	<meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <meta http-equiv="X-UA-Compatible" content="chrome=1">
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no, width=device-width">
	<title>Opennet Karte</title>
	<style>
		.map {
		height: 100%;
		width: 100%;
		}
		#popup {
			padding-bottom: 45px;
		}
    	</style>
	<link rel="stylesheet" href="/static/openlayers/ol.css" type="text/css">
	<script src="/static/openlayers/ol.js" type="text/javascript"></script>
	<script src="https://code.jquery.com/jquery-2.1.3.min.js"></script>
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/js/bootstrap.min.js"></script>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css">
</head>
	<body style="background-color: #B5D0D0">
		<div id="map" class="map">
			<div id="popup"></div>
		</div>
		 <script type="text/javascript">
			 var container = document.getElementById('popup');
			var content = document.getElementById('popup-content');
			var closer = document.getElementById('popup-closer');
			var overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
			  element: container,
			  autoPan: true,
			  autoPanAnimation: {
				duration: 250
				}
			}));
		      var map = new ol.Map({
			target: document.getElementById('map'),
			controls: ol.control.defaults().extend([new ol.control.FullScreen()]),
			overlays: [overlay],
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
			  zoom: 9,
			  projection: 'EPSG:3857'
			})
		    });
		    
		    var element = document.getElementById('popup');

			var popup = new ol.Overlay({
			  element: element,
			  positioning: 'bottom-center',
			  stopEvent: false
			});
			map.addOverlay(popup);
		    
			map.on('singleclick', function(evt) {
			  var coordinate = evt.coordinate;
			  var feature = map.forEachFeatureAtPixel(evt.pixel,
			  function(feature, layer) {
				return feature;
			  });
			  if (feature) {
				var geometry = feature.getGeometry();
				var coord = geometry.getCoordinates();
				popup.setPosition(coord);
				$(element).popover({
				  'placement': 'top',
				  'html': true,
				  'content': feature.get('main_ip')
				});
				$(element).popover('show');
				  } else {
					$(element).popover('destroy');
				  }
				});
				
				$(map.getViewport()).on('mousemove', function(e) {
				  var pixel = map.getEventPixel(e.originalEvent);
				  var hit = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
					return true;
				  });
				  if (hit) {
					map.getTarget().style.cursor = 'pointer';
				  } else {
					map.getTarget().style.cursor = '';
				  }
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
