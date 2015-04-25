var map;

function setupMap() {
	var zoom = 9, center = [12.5876, 54.0118];
	if (window.location.hash !== '') {
	  var hash = window.location.hash.replace('#', '');
	  var parts = hash.split(';');
	  if (parts.length === 3) {
		zoom = parseInt(parts[0], 10);
		center = [
		  parseFloat(parts[1]),
		  parseFloat(parts[2])
		];
	  }
	}
	map = new ol.Map({
		target: document.getElementById('map'),
		controls: ol.control.defaults().extend([
			new ol.control.FullScreen(),
			new ol.control.ScaleLine()]),
		layers: [
			//Hintergrundkarten
			new ol.layer.Tile({
				source: new ol.source.MapQuest({layer: 'osm'})
			}),
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
			//ONI-Daten
			new ol.layer.Vector({
			title: 'accesspoints',
			source: new ol.source.GeoJSON({
				url: '/api/accesspoints',
				projection: 'EPSG:3857',
			}),
			}),
			getHeadquarter()
		],
		view: new ol.View({
			center: ol.proj.transform(center, 'EPSG:4326', 'EPSG:3857'),
			zoom: zoom,
			projection: 'EPSG:3857'
		})
	});
}

function getHeadquarter(){
	var hqFeature = new ol.Feature({
		geometry: new ol.geom.Point(ol.proj.transform([12.12311,54.09137], 'EPSG:4326', 'EPSG:3857')),
		name: 'Vereinsraum'
	});
	var hqStyle = new ol.style.Style({
	  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		opacity: 0.75,
		src: 'static/headquarter.png'
	  })),
	});
	hqFeature.setStyle(hqStyle);
	return new ol.layer.Vector({
		source: new ol.source.Vector({
			features: [hqFeature]
		})
	});
}

function setupPermalinks(){
	map.on('moveend', function() {
		var view = map.getView();
		var center = view.getCenter();
		center = ol.proj.transform(center, 'EPSG:3857', 'EPSG:4326'),
		window.location.hash = view.getZoom() + ';' + center[0] + ';' + center[1];
	});
}

function setupPopup(){
	//Popup Setup
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
}

function setupTooltip(){
	//Tooltip Setup	
	var info = $('#info');
	info.tooltip({
	  animation: false,
	  trigger: 'manual'
	});

	var displayFeatureInfo = function(pixel) {
	  info.css({
		left: pixel[0] + 'px',
		top: (pixel[1] - 15) + 'px'
	  });
	  var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
		return feature;
	  });
	  if (feature) {
		info.tooltip('hide')
			.attr('data-original-title', getApId(feature.get('main_ip')))
			.tooltip('fixTitle')
			.tooltip('show');
	  } else {
		info.tooltip('hide');
	  }
	};

	map.on('pointermove', function(evt) {
	  if (evt.dragging) {
		info.tooltip('hide');
		return;
	  }
	  displayFeatureInfo(map.getEventPixel(evt.originalEvent));
	});
}

function setupGeolocation(){
	//Geolocation Setup
	var geolocation = new ol.Geolocation({
		projection: 'EPSG:3857',
		tracking: true
	});

	geolocation.once('change', function(evt) {
	  console.log(geolocation.getPosition());
	  map.getView().setCenter(geolocation.getPosition());
	  map.getView().setZoom(16);
	});
}

function getApId(ip){
	return ip.replace("192.168.","");
}
