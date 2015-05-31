var map;

function setupMap() {
	//permalinks parsen
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
	//Karte
	var overlayGroup = new ol.layer.Group({
        title: 'Opennet',
        layers: [
        ]
    });
	map = new ol.Map({
		target: document.getElementById('map'),
		controls: ol.control.defaults().extend([
			new ol.control.FullScreen(),
			new ol.control.ScaleLine()]),
		layers: [
			//Hintergrundkarten
			new ol.layer.Group({
				'title': 'Hintergrund',
				'layers': [
					new ol.layer.Tile({
						title: 'MapQuest',
						type: 'base',
						visible: true,
						source: new ol.source.MapQuest({layer: 'osm'})
					}),
					new ol.layer.Image({
						//extent: [-13884991, 2870341, -7455066, 6338219],
						title: 'Luftbilder LAiV',
						type: 'base',
						visible: false,						
						source: new ol.source.ImageWMS({
							url: 'http://www.geodaten-mv.de/dienste/adv_dop',
							params: {'LAYERS': 'adv_dop'},
							serverType: 'geoserver',
							attributions: [
								new ol.Attribution({
								html: '<img src="http://www.geoportal-mv.de/land-mv/GeoPortalMV_prod/de/_Bilder/favicon.ico">'+'Luftbilder &copy; ' +
									'<a href="http://www.geoportal-mv.de/land-mv/GeoPortalMV_prod/de/Geowebdienste/index.jsp">Landesamt für innere Verwaltung Mecklenburg-Vorpommern - Amt für Geoinformation, Vermessungs- und Katasterwesen</a>'
								})],
						})
					}),
				]
			}),
			overlayGroup
		],
		view: new ol.View({
			center: ol.proj.transform(center, 'EPSG:4326', 'EPSG:3857'),
			zoom: zoom,
			projection: 'EPSG:3857'
		})
	});
	var layerSwitcher = new ol.control.LayerSwitcher({tipLabel: 'Legende'})
    map.addControl(layerSwitcher);
    //ONI-Daten
	overlayGroup.getLayers().extend([
		new ol.layer.Vector({
		title: 'Accesspoints',
		source: new ol.source.GeoJSON({
			url: '/api/accesspoints',
			projection: 'EPSG:3857',
			}),
		style: createNodeStyle(),
		}),
		new ol.layer.Vector({
		title: 'Links',
		source: new ol.source.GeoJSON({
			url: '/api/links',
			projection: 'EPSG:3857',
			}),
		}),
		getHeadquarter()]
    );
}

function createNodeStyle(){
  return new ol.style.Style({
				image: new ol.style.Circle({
					radius: 5,
				  fill: new ol.style.Fill({color: '#1588eb', width: 2, opacity: 0.8}),
				  stroke: new ol.style.Stroke({color: '2004dd', width: 1, opacity: 0.8})
				}),
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
		title: 'Vereinsraum',
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
		  if(feature.get('main_ip')){
				var geometry = feature.getGeometry();
				var coord = geometry.getCoordinates();
				popup.setPosition(coord);
				$(element).popover({
					'placement': 'top',
					'html': true,
					'title': "<h1>"+feature.get('main_ip')+"</h1><small>"+feature.get('post_address')+"</small>"
							+'<button type="button" id="close" class="close" onclick="">&times;</button>',
					'content': getPopupContent(feature)
				});
				$(element).popover('show');
			}
		} else {
			$(element).popover('destroy');
		}
	});

	$(map.getViewport()).on('mousemove', function(e) {
		var pixel = map.getEventPixel(e.originalEvent);
		var hit = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
			if (feature.get('main_ip')){
				return true;
			}
		});
		if (hit) {
			map.getTarget().style.cursor = 'pointer';
		} else {
			map.getTarget().style.cursor = '';
		}
	});
}

function getPopupContent(feature){
	function toTimeString(totalNumberOfSeconds) {
	 var days = parseInt( totalNumberOfSeconds / (3600*24) );
	 var hours = parseInt( totalNumberOfSeconds / 3600 );
	 var minutes = parseInt( (totalNumberOfSeconds - (hours * 3600)) / 60 );
	 var seconds = Math.floor((totalNumberOfSeconds - ((hours * 3600) + (minutes * 60))));
	 return (days < 10 ? "0" + days : days) + ":" + (hours < 10 ? "0" + hours : hours) + ":";
	}
	
	ip=feature.get('main_ip');
	gauge="<p><img width='247' height='137px' src='http://www.opennet-initiative.de/graph/ap.php?ap="+getApId(ip)+"&width=150&height=50&color=001eff&low_color=ff1e00&medium_color=00ff1e&style=AREA&low_style=AREA&medium_style=AREA&lowerlimit=1&range=day'/></p>";
	device=feature.get('device_model');
	board=feature.get('device_board');
	os_type = feature.get('firmware_type');
	os_ver = feature.get('firmware_release_name');
	load = feature.get('system_load_15min');
	lastseen = feature.get('timestamp');
	uptime = feature.get('system_uptime');
	installtime = feature.get('firmware_install_timestamp');
	operator = "Betreut von: <a>"+feature.get('owner')+"</a>"
	links = "<a href='"+getApId(ip)+"'>Wiki</a> ";
	links = links +"<a href='"+ip+"'>Webinterface</a> ";
	links = links +"<a href='"+ip+":8080'>OLSRd</a> ";
	return gauge+
			+"<p>"
			+device+" <small>("+board+")</small><br>"
			+os_type+" <small>("+os_ver+")</small><br>"
			+"CPU-Auslastung: "+load+ "<br>"
			+ operator
			+"</p>"+
			+"<p>"+'<dl class="dl-horizontal">'
			+"<dt>Zuletzt gesehen</dt><dd>"+lastseen+"</dd>"
			+"<dt>Neustart am </dt><dd>"+toTimeString(parseFloat(uptime))+"</dd>"
			+"<dt>Installation vom</dt><dd>"+installtime+"</dd>"
			+'</dl>'+"</p>"
			+"<br>"+links;
	// ["opennet_version","opennet_wifidog_enabled"]
	//UGW
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
		  if(feature.get('main_ip')){
			info.tooltip('hide')
				.attr('data-original-title', getApId(feature.get('main_ip')))
				.tooltip('fixTitle')
				.tooltip('show');
		}
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
