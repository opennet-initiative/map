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
			title: 'Links',
			source: new ol.source.Vector({
				url: '/api/links',
				format: new ol.format.GeoJSON({
					//defaultDataProjection :'EPSG:4326', 
					projection: 'EPSG:3857'
				})
			}),
		style: createLinkStyle(), 
		}),
		new ol.layer.Vector({
		title: 'Accesspoints online',
		source: new ol.source.Vector({
			url: '/api/accesspoints/online',
			format: new ol.format.GeoJSON({
				//defaultDataProjection :'EPSG:4326', 
				projection: 'EPSG:3857'
			})
		}),
		style: (createNodeStyle())
		}),
		new ol.layer.Vector({
		title: 'Accesspoints instabil',
		source: new ol.source.Vector({
			url: '/api/accesspoints/flapping',
			format: new ol.format.GeoJSON({
				//defaultDataProjection :'EPSG:4326', 
				projection: 'EPSG:3857'
			})
		}),
		style: (createNodeStyle())
		}),
		new ol.layer.Vector({
		title: 'Accesspoints offline',
		source: new ol.source.Vector({
			url: '/api/accesspoints/offline',
			format: new ol.format.GeoJSON({
				//defaultDataProjection :'EPSG:4326', 
				projection: 'EPSG:3857'
			})
		}),
		style: (createNodeStyle()),
		visible: false
		}),
		getHeadquarter()]
    );
    //refresh strategies
    window.setInterval(function() {
	  //TODO: hier karte aktualisieren
	}, 5000);
}

function createNodeStyle(){
	//online|offline|flapping
	//normal|UGW|Wifidog
	var onlineStyle = [new ol.style.Style({
		image: new ol.style.Circle({
				radius: 5,
			  fill: new ol.style.Fill({color: '#1588eb', width: 2, opacity: 0.8}),
			  stroke: new ol.style.Stroke({color: '2004dd', width: 1, opacity: 0.8})
			}),
	  })];
	  var offlineStyle = [new ol.style.Style({
		image: new ol.style.Circle({
				radius: 5,
			  fill: new ol.style.Fill({color: 'grey', width: 2, opacity: 0.5}),
			  stroke: new ol.style.Stroke({color: 'black', width: 1, opacity: 0.5})
			}),
	  })];
	  var flappingStyle = [new ol.style.Style({
		image: new ol.style.Circle({
				radius: 5,
			  fill: new ol.style.Fill({color: 'red', width: 2, opacity: 0.8}),
			  stroke: new ol.style.Stroke({color: 'red', width: 1, opacity: 0.5})
			}),
	  })];
	  var ugwStyle = [new ol.style.Style({
		image: new ol.style.Circle({
				radius: 5,
			  fill: new ol.style.Fill({color: '#1588eb', width: 2, opacity: 0.8}),
			  stroke: new ol.style.Stroke({color: 'yellow', width: 3, opacity: 0.9})
			}),
	  })];
	  var hotspotStyle = [new ol.style.Style({
		image: new ol.style.Circle({
				radius: 5,
			  stroke: new ol.style.Stroke({color: 'rgba(0,128,0,0.8)', width: 30, opacity: 0.5})
			}),
	  })];
	  return function(feature, resolution) {
		  if (feature.get('opennet_captive_portal_enabled')){
			  return hotspotStyle;
		  }
		  if (feature.get('opennet_service_relay_enabled')){
			  return ugwStyle;
		  }
		if (feature.get('state') == "offline") {
		  return offlineStyle;
		} else {
			if (feature.get('state') == "online"){
				return onlineStyle;
			}
			else{
				return flappingStyle;
			}
		}
	  };
}

function createLinkStyle(){
	return function(feature, resolution) {
		var cableStyle = new ol.style.Style({
			stroke: new ol.style.Stroke({color: 'rgba(21,136,235,0.2)', width: 1, lineDash: [1,4]}),
		  });
		  if (feature.get('cable')){
			  return [cableStyle];
		  }
		  else{
			  etx=feature.get('etx');
			  if (etx){
				  if (etx>1.0) {
					  if (etx >=3.0){
						  aircolor='red'; 
					  }
					  if (etx >=1.5){
						  aircolor='green'; 
					  }
					  if (etx >=1.1){
						  aircolor='aqua'; 
					  }
				  }
				  else aircolor = '#1588eb';
			  }
			  var airStyle = new ol.style.Style({
				stroke: new ol.style.Stroke({color: aircolor, width: 2}),
			  });
			  return [airStyle];
		  }
	  }
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
	/**
	 * Add a click handler to hide the popup.
	 * @return {boolean} Don't follow the href.
	 */
	 var closer = document.getElementById('popup-closer');
	 var container = document.getElementById('popup');
	var content = document.getElementById('popup-content');
	closer.onclick = function() {
	  popoverlay.setPosition(undefined);
	  closer.blur();
	  return false;
	};
	/**
	 * Create an overlay to anchor the popup to the map.
	 */
	var popoverlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
	  element: container,
	  autoPan: true,
	  autoPanAnimation: {
		duration: 250
	  }
	}));
	map.addOverlay(popoverlay);

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
				var ip = feature.get('main_ip');
				content.innerHTML =getPopupContent(feature)
				header = document.getElementById('popup-header');
				header.innerHTML = "<h1>"+ip+"</h1>"+ "<small>"+feature.get('post_address')+"</small>",
			  popoverlay.setPosition(coord);
				//enable gauge switch (here DOM is populated)
				$('#buttonday').on('click', function (e) {
					$("#gaugelq").attr("src", getGaugeImg(ip,"day"));
				});
				$('#buttonweek').on('click', function (e) {
					$("#gaugelq").attr("src", getGaugeImg(ip, "week"));
				});
				$('#buttonmonth').on('click', function (e) {
					$("#gaugelq").attr("src", getGaugeImg(ip, "month"));
				});
				$('#buttonyear').on('click', function (e) {
					$("#gaugelq").attr("src", getGaugeImg(ip, "year"));
				});
			}
		} else {
			/*if(typeof $(e.target).data('title') == 'undefined') {
				$(element).popover('destroy'); 
		}*/
			//$(element).popover('destroy');
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
		var d = new Date();
		var t = d.getTime();
		past = t-(totalNumberOfSeconds*1000);
		return (new Date(past)).toLocaleDateString();
	}
	
	function checkEmpty(val){
		if ((val == undefined) || (val == null)){
			return "?";
		}
		return val;
	}
	
	function checkEmptyNum(val){
		if ((val == undefined) || isNaN(val) || (val == null)){
			return "?";
		}
		return val;
	}
	
	ip=feature.get('main_ip');
	gauge="<p><img id='gaugelq' width='247' height='137px' src='"+getGaugeImg(ip,"day")+"'/>";
	gauge=gauge+
		  '<div class="btn-group btn-group-xs" role="group" aria-label="...">\
		  <button type="button" class="btn btn-default" id="buttonday">24h</button> \
		  <button type="button" class="btn btn-default" id="buttonweek">Woche</button> \
		  <button type="button" class="btn btn-default" id="buttonmonth">Monat</button> \
		  <button type="button" class="btn btn-default" id="buttonyear">Jahr</button> \
		</div></p>';
	device=checkEmpty(feature.get('device_model'));
	board=checkEmpty(feature.get('device_board'));
	os_type = checkEmpty(feature.get('firmware_type'));
	os_ver = checkEmpty(feature.get('firmware_release_name'));
	cpuload = feature.get('system_load_15min');
	romload=100.0 - parseFloat(feature.get('device_memory_free')) / parseFloat(feature.get('device_memory_available'))
	romload = checkEmptyNum(romload.toFixed(2));
	lastseen = checkEmpty(feature.get('lastseen_timestamp'));
	uptime = checkEmpty(feature.get('system_uptime'));
	installtime = checkEmpty(feature.get('firmware_install_timestamp'));
	operator = checkEmpty(feature.get('owner'));
	links = "<a href=http://wiki.opennet-initiative.de/wiki/AP"+getApId(ip)+">Wiki</a> ";
	links = links +"<a href='http://"+ip+"'>Webinterface</a> ";
	links = links +"<a href='http://"+ip+":8080'>OLSRd</a> ";
	return gauge
			+"<p>"
			+device+"<br>"
			+" <small>("+os_type+", "+os_ver+")</small><br>"
			+"CPU: "+cpuload+ "% "+"ROM: "+romload+ "%<br>"
			+ "Betreut von: <a>"+operator+"</a>"
			+"</p>"+"<p>"
			+"Zuletzt gesehen: "+(new Date(lastseen)).toLocaleDateString()+"<br>"
			+"Letzter Neustart: "+toTimeString(parseFloat(uptime))+"<br>"
			+"Erstinstallation: "+(new Date(installtime)).toLocaleDateString()+"<br>"
			+"</p>"
			+links;
	// ["opennet_version"]
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
        top: (pixel[1] - 3) + 'px'
    });
    var feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
        return feature;
    });
    if (feature) {
		if (feature.get('main_ip')){
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

function getApId(ip){
	return ip.replace("192.168.","");
}

function getGaugeImg(ip,rangeStr){
	return "http://www.opennet-initiative.de/graph/ap.php?ap="+getApId(ip)+"&width=150&height=50&color=001eff&low_color=ff1e00&medium_color=00ff1e&style=AREA&low_style=AREA&medium_style=AREA&lowerlimit=1&range="+rangeStr
}
