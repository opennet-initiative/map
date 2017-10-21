var map;
var on_overlay_group;
var projection_visual = 'EPSG:3857';
var projection_latlon = 'EPSG:4326';
var headquarter_location = [12.12311, 54.09137];
var startup_map_center = [12.5876, 54.0118];
var startup_map_zoom = 9;


/* initialize all components */
function setupOpennetMap() {
    var args = parseQueryArguments();
    setupMap(args["zoom"], args["center"], args["test_for_special_link"]);
    if (!args["position_override"]) {
        setupGeolocation();
    }
    setupPermalinks();
    setupPopup();
    setupTooltip();
}


/* parse information from the requested URL (as query arguments or anchor link)
 *   - ?ip=192.168.1.120: center the map on the location of an accesspoint (used in the firmware)
 *   - ?route=192.168.1.120,192.168.1.96,192.168.2.36,192.168.1.79: visualize a route along
 *     multiple accesspoints
 *   - #17;12.122250;54.090832: center the map on this location with this zoom (used by permalinks)
 */
function parseQueryArguments() {
    var map_center = startup_map_center;
    var map_zoom = startup_map_zoom;
    var position_override = false;

    /* there really seems to be no better way to parse query arguments via jquery :(
     * Source: https://stackoverflow.com/a/901144
     */
    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    function getAccessPointPosition(ap_ip) {
        xhttp = new XMLHttpRequest();
        xhttp.open("GET", "/api/v1/accesspoint/" + ap_ip + "?data_format=geojson", false);
        xhttp.send();
        repl = JSON.parse(xhttp.responseText);
        return repl.position.coordinates;
    }

    // an (optional) "route" is a comma-separated list of IP addresses
    var query_route = getParameterByName("route");
    var special_links = [];
    if (query_route) {
        var main_ips = query_route.split(',');
        // Assemble a list of strings that will help us match links (given by 'endpoints') quickly.
	// Example: route='a,c,b,d' -> ['a c', 'b c', 'b d']
        // Each pair of hops is sorted alphabetically and separated by space.
	for (var i = 0; i + 1 < main_ips.length; i++) {
            special_links.push(main_ips.slice(i, i + 2).sort().join(' '));
        }
        // center the map on the first node (arbitrarily picked)
        if (main_ips) {
            map_zoom = 14;
            map_center = getAccessPointPosition(main_ips[0]);
            position_override = true;
        }
    }
    function test_for_special_link(link) {
        if (special_links && link) {
            var endpoints = link.get('endpoints');
            if (endpoints && (endpoints.length == 2) &&
                    (special_links.indexOf(endpoints.sort().join(' ')) >= 0)) {
                return true;
            }
        }
        return false;
    }

    // center map on given "ip"
    var query_ip = getParameterByName("ip");
    if (query_ip) {
        map_zoom = 17;
        map_center = getAccessPointPosition(query_ip);
        position_override = true;
    }

    // permalinks parsen
    if (window.location.hash !== '') {
        var hash = window.location.hash.replace('#', '');
        var parts = hash.split(';');
        if (parts.length === 3) {
            map_zoom = parseInt(parts[0], 10);
            map_center = [
                parseFloat(parts[1]),
                parseFloat(parts[2])
            ];
            position_override = true;
        }
    }
    return {zoom: map_zoom,
            center: map_center,
            test_for_special_link: test_for_special_link,
            position_override: position_override}
}


function setupMap(map_zoom, map_center, test_for_special_link) {
    // Karte
    on_overlay_group = new ol.layer.Group({
        title: 'Opennet',
        layers: []
    });
    map = new ol.Map({
        target: document.getElementById('map'),
        controls: ol.control.defaults().extend([
            new ol.control.FullScreen(),
            new ol.control.ScaleLine()
        ]),
        layers: [
            // Hintergrundkarten
            new ol.layer.Group({
                'title': 'Hintergrund',
                'layers': [
                    new ol.layer.Tile({
                        title: 'MapQuest',
                        type: 'base',
                        visible: true,
                        source: new ol.source.OSM(),
                    }),
                    new ol.layer.Image({
                        //extent: [-13884991, 2870341, -7455066, 6338219],
                        title: 'Luftbilder LAiV',
                        type: 'base',
                        visible: false,
                        source: new ol.source.ImageWMS({
                            url: 'https://www.geodaten-mv.de/dienste/adv_dop',
                            params: {
                                'LAYERS': 'adv_dop'
                            },
                            serverType: 'geoserver',
                            attributions: [
                                new ol.Attribution({
                                    html: '<img src="https://www.geoportal-mv.de/land-mv/GeoPortalMV_prod/de/_Bilder/favicon.ico">' + 'Luftbilder &copy; ' +
                                        '<a href="https://www.geoportal-mv.de/land-mv/GeoPortalMV_prod/de/Geowebdienste/index.jsp">Landesamt für innere Verwaltung Mecklenburg-Vorpommern - Amt für Geoinformation, Vermessungs- und Katasterwesen</a>'
                                })
                            ],
                        })
                    }),
                ]
            }),
            on_overlay_group
        ],
        view: new ol.View({
            center: ol.proj.transform(map_center, projection_latlon, projection_visual),
            zoom: map_zoom,
            projection: projection_visual
        })
    });
    var layerSwitcher = new ol.control.LayerSwitcher({
        tipLabel: 'Legende'
    })
    map.addControl(layerSwitcher);
    // ONI-Daten
    on_overlay_group.getLayers().extend([
        new ol.layer.Vector({
            title: 'Links',
            source: get_layer_vector_source('/api/v1/link/?'),
            style: createLinkStyle(test_for_special_link)
        }),
        new ol.layer.Vector({
            title: 'Accesspoints online',
            source: get_layer_vector_source('/api/v1/accesspoint/?status=online&'),
            style: createNodeStyle()
        }),
        new ol.layer.Vector({
            title: 'Accesspoints instabil',
            source: get_layer_vector_source('/api/v1/accesspoint/?status=flapping&'),
            style: createNodeStyle()
        }),
        new ol.layer.Vector({
            title: 'Accesspoints offline',
            source: get_layer_vector_source('/api/v1/accesspoint/?status=offline&'),
            style: createNodeStyle(),
            visible: false
        }),
        new ol.layer.Vector({
            title: 'Standorte',
            source: get_layer_vector_source('/api/v1/site/?'),
            style: createStateStyle(),
            visible: false
        }),
        getHeadquarter()
    ]);
}


/* generate a vector (with data) for a layer
 * The 'api_prefix' should end in a question mark (?) or an ampersand (&). This function adds
 * more details to the query string (requesting geojson data and restricting the requested data to
 * the bounding box of the currently visible area).
 */
function get_layer_vector_source(api_prefix) {
    var formatter = new ol.format.GeoJSON();
    var vectorSource = new ol.source.Vector({
        loader: function(extent, resolution, projection) {
            var latlon_extent = ol.geom.Polygon.fromExtent(extent).transform(
                projection, projection_latlon).getExtent();
            var url = api_prefix + 'data_format=geojson&in_bbox=' + latlon_extent.join(',');
            jQuery.ajax(url, {
                dataType: 'json',
                success: function(data) {
                    vectorSource.addFeatures(formatter.readFeatures(
                        data, {featureProjection: projection_visual}));
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    window.console.log("Failed to load layer (" + url + "): " + errorThrown);
                }
            });
        },
        strategy: ol.loadingstrategy.bbox,
        format: new ol.format.GeoJSON({projection: projection_latlon})
    });
    return vectorSource;
}


/* this function is periodically called to update the data sources of all layers */
function updateLayerDataSources() {
    var formatter = new ol.format.GeoJSON();
    on_overlay_group.getLayers().forEach(function (layer) {
        var source = layer.getSource();
        var url = source.getUrl();
        // refresh only layers with a source URL (i.e. not the headquarter)
        if (url) {
            jQuery.ajax(url, {
                dataType: 'json',
                success: function (data) {
                    source.clear();
                    source.addFeatures(formatter.readFeatures(
			    data, {featureProjection: projection_visual}));
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    window.console.log("Failed to update layer (" + url + "): " + errorThrown);
                }
            });
        }
    });
}


function createNodeStyle() {
    // online|offline|flapping
    // normal|UGW|Wifidog
    var onlineStyle = [new ol.style.Style({
        image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({
                color: '#1588eb',
                width: 2,
                opacity: 0.8
            }),
            stroke: new ol.style.Stroke({
                color: '2004dd',
                width: 1,
                opacity: 0.8
            })
        }),
    })];
    var offlineStyle = [new ol.style.Style({
        image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({
                color: 'grey',
                width: 2,
                opacity: 0.5
            }),
            stroke: new ol.style.Stroke({
                color: 'black',
                width: 1,
                opacity: 0.5
            })
        }),
    })];
    var flappingStyle = [new ol.style.Style({
        image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({
                color: 'rgba(255,0,0,0.8)',
                width: 2
            }),
            stroke: new ol.style.Stroke({
                color: 'red',
                width: 1
            })
        }),
    })];
    var ugwStyle = [new ol.style.Style({
        image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({
                color: '#1588eb',
                width: 2,
                opacity: 0.8
            }),
            stroke: new ol.style.Stroke({
                color: 'yellow',
                width: 3,
                opacity: 0.9
            })
        }),
    })];
    var hotspotStyle = [new ol.style.Style({
        image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({
                color: '#1588eb',
                width: 2,
                opacity: 0.8
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(0,128,0,0.8)',
                width: 16,
                opacity: 0.9
            })
        }),
    })];
    return function(feature, resolution) {
        if (feature.get('opennet_captive_portal_enabled')) {
            return hotspotStyle;
        }
        if (feature.get('opennet_service_relay_enabled')) {
            return ugwStyle;
        }
        var lastseen_age_minutes = ((new Date() - new Date(feature.get('lastseen_timestamp')))
                                    / 1000 / 60);
        if (lastseen_age_minutes > 30 * 24 * 60) {
            return offlineStyle;
        } else if (lastseen_age_minutes > 30) {
            return flappingStyle;
        } else {
            return onlineStyle;
        }
    };
}

function createStateStyle() {
    return function(feature, resolution) {
        return [new ol.style.Style({
            image: new ol.style.Circle({
                radius: 50,
                fill: new ol.style.Fill({
                    color: 'rgba(255,200,0,0.8)'
                }),
            }),
            text: new ol.style.Text({
                text: feature.getId(),
                fill: new ol.style.Fill({
                    color: 'black'
                }),
            })
        })];
    };
}

function createLinkStyle(test_for_special_link) {
    return function(feature, resolution) {
        var cableStyle = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'rgba(21,136,235,0.2)',
                width: 1,
                lineDash: [1, 4]
            }),
        });
        var specialStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.6)'
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(255,255,0,0.8)',
                width: 5,
                lineDash: [4, 8]
            }),
        });
        if (test_for_special_link(feature)) {
            // "special" links can be defined via the "route" query argument
            return [specialStyle];
	} else if (!feature.get('is_wireless')) {
            return [cableStyle];
        } else {
            quality = feature.get('quality');
            if (quality) {
                if (quality >= 1.0) {
                    aircolor = '#1588eb';
                } else if (quality > 0.95) {
                    aircolor = '#8015EB';
                } else if (quality > 0.9) {
                    aircolor = '#D915EB';
                } else {
                    aircolor = 'red';
                }
            } else {
                aircolor = 'yellow';
            }
            var airStyle = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: aircolor,
                    width: 2
                }),
            });
            return [airStyle];
        }
    }
}

function getHeadquarter() {
    var hqFeature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.transform(
            headquarter_location, projection_latlon, projection_visual)),
        name: 'Vereinsraum'
    });
    var hqStyle = new ol.style.Style({
        image: new ol.style.Icon( /** @type {olx.style.IconOptions} */ ({
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

function setupGeolocation() {
    var geolocation = new ol.Geolocation({
        projection: map.getView().getProjection(),
        tracking: true,
    });
    /* center the map on the current position, if the position of the user
     * (as reported by its browser) changed.
     */
    geolocation.on('change', function(evt) {
        if (evt.type == "change:position") {
            map.getView().setCenter(geolocation.getPosition());
            map.getView().setZoom(18);
        };
    });


}

function setupPermalinks() {
    if (!location.search) {
        map.on('moveend', function() {
            var view = map.getView();
            var center = view.getCenter();
            center = ol.proj.transform(center, projection_visual, projection_latlon),
                window.location.hash = view.getZoom() + ';' + center[0] + ';' + center[1];
        });
    }
}

function setupPopup() {
    // Popup Setup
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
    var popoverlay = new ol.Overlay( /** @type {olx.OverlayOptions} */ ({
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
            if (feature.get('main_ip')) {
                var coord = feature.getGeometry().getCoordinates();
                content.innerHTML = getAccessPointPopupContent(feature);
                header = document.getElementById('popup-header');
                header.innerHTML = "<h1>" + feature.get('main_ip') + "</h1>" + "<small>" + feature.get('post_address') + "</small>";
                popoverlay.setPosition(coord);
                // enable gauge switch (here DOM is populated)
                $('#buttonday').on('click', function(e) {
                    $("#gaugelq").attr("src", getGaugeImg(ip, "day"));
                });
                $('#buttonweek').on('click', function(e) {
                    $("#gaugelq").attr("src", getGaugeImg(ip, "week"));
                });
                $('#buttonmonth').on('click', function(e) {
                    $("#gaugelq").attr("src", getGaugeImg(ip, "month"));
                });
                $('#buttonyear').on('click', function(e) {
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
            if (feature.get('main_ip') || feature.get('quality')) {
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


function getAccessPointPopupContent(feature) {
    function toTimeString(totalNumberOfSeconds) {
        var d = new Date();
        var t = d.getTime();
        past = t - (totalNumberOfSeconds * 1000);
        return (new Date(past)).toLocaleDateString();
    }

    function checkEmpty(val) {
        if ((val == undefined) || (val == null)) {
            return "?";
        }
        return val;
    }

    function checkEmptyNum(val) {
        if ((val == undefined) || isNaN(val) || (val == null)) {
            return "?";
        }
        return val;
    }

    ip = feature.get('main_ip');
    gauge = "<p><img id='gaugelq' width='247' height='137px' src='" + getGaugeImg(ip, "day") + "'/>";
    gauge = gauge +
        '<div class="btn-group btn-group-xs" role="group" aria-label="...">\
		  <button type="button" class="btn btn-default" id="buttonday">24h</button> \
		  <button type="button" class="btn btn-default" id="buttonweek">Woche</button> \
		  <button type="button" class="btn btn-default" id="buttonmonth">Monat</button> \
		  <button type="button" class="btn btn-default" id="buttonyear">Jahr</button> \
		</div></p>';
    device = checkEmpty(feature.get('device_model'));
    board = checkEmpty(feature.get('device_board'));
    os_type = checkEmpty(feature.get('firmware_type'));
    os_ver = checkEmpty(feature.get('firmware_release_name'));
    cpuload = feature.get('system_load_15min');
    romload = 100.0 - parseFloat(feature.get('device_memory_free')) / parseFloat(feature.get('device_memory_available'))
    romload = checkEmptyNum(romload.toFixed(2));
    lastseen = new Date(checkEmpty(feature.get('lastseen_timestamp')));
    uptime = checkEmpty(feature.get('system_uptime'));
    installtime = checkEmpty(feature.get('firmware_install_timestamp'));
    operator = checkEmpty(feature.get('owner'));
    links = "<a href=https://wiki.opennet-initiative.de/wiki/AP" + getApId(ip) + ">Wiki</a> ";
    links = links + "<a href='http://" + ip + "'>Webinterface</a> ";
    links = links + "<a href='http://" + ip + ":8080'>OLSRd</a> ";
    links = links + '<a href="https://map.on-i.de/?ip=' + ip + '">teilen</a>';
    var lastseen_minutes_ago = (new Date() - lastseen) / 1000 / 60;
    var lastseen_string;
    if (lastseen_minutes_ago < 100) {
        lastseen_string = "vor " + lastseen_minutes_ago.toFixed(0) + " Minuten";
    } else if (lastseen_minutes_ago < 24 * 60) {
        lastseen_string = "vor " + (lastseen_minutes_ago / 60).toFixed(0) + " Stunden";
    } else {
        lastseen_string = lastseen.toLocaleDateString() + " " + lastseen.toLocaleTimeString();
    }
    return gauge +
        "<p>" +
        device + "<br>" +
        " <small>(" + os_type + ", " + os_ver + ")</small><br>" +
        "CPU: " + cpuload + "% " + "ROM: " + romload + "%<br>" +
        "Betreut von: <a>" + operator + "</a>" +
        "</p>" + "<p>" +
        "Zuletzt gesehen: " + lastseen_string + "<br>" +
        "Letzter Neustart: " + toTimeString(parseFloat(uptime)) + "<br>" +
        "Erstinstallation: " + (new Date(installtime)).toLocaleDateString() + "<br>" +
        "</p>" +
        links;
    // ["opennet_version"]
    // UGW
}

function setupTooltip() {
    // Tooltip Setup
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
            if (feature.get('main_ip')) {
                info.tooltip('hide')
                    .attr('data-original-title', getApId(feature.get('main_ip')))
                    .tooltip('fixTitle')
                    .tooltip('show');
            } else if (feature.get('quality')) {
                info.tooltip('hide')
                    .attr('data-original-title', getLinkDescription(feature))
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


/* assemble a descriptive string for a link
 * Sadly we cannot force linebreaks - thus the output is not really nicely formatted.
 */
function getLinkDescription(feature) {
    var quality_details = [];
    // display the quality in percent
    quality_details.push('Quality: ' + (feature.get('quality') * 100).toFixed(0) + '%');
    if (feature.get('wifi_ssid')) {
        quality_details.push('SSID: ' + feature.get('wifi_ssid'));
    }
    if (feature.get('endpoints')) {
        quality_details.push('Peers: ' + feature.get('endpoints').join(' - '));
    }
    return quality_details.join(' / ')
}


function getApId(ip) {
    return ip.replace("192.168.", "AP");
}

function getGaugeImg(ip, rangeStr) {
    return "https://www.opennet-initiative.de/graph/ap.php?ap=" + getApId(ip) + "&width=150&height=50&color=001eff&low_color=ff1e00&medium_color=00ff1e&style=AREA&low_style=AREA&medium_style=AREA&lowerlimit=1&range=" + rangeStr
}
