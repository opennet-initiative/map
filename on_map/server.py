# -*- coding: utf-8 -*-
import logging
import threading
import time

from bottle import template, request, response, run, static_file, Bottle, error
from geojson import FeatureCollection, Feature, Point, LineString
from shapely import geometry
import geojson

import on_map.geronimo_api


API_UPDATE_INTERVAL = 60


# global variable for all functions
api = on_map.geronimo_api.Api()
def update_api():
    while True:
        api.update()
        print("API Update finished: %d APs / %d Links"
              .format(len(api.getAccesspoints()), len(api.getLinks())))
        time.sleep(API_UPDATE_INTERVAL)
threading.Thread(target=update_api, daemon=False).start()


if __name__ == '__main__':
    from bottle import route
else:
    # used by wsgi servers (e.g. uwsgi)
    app = application = Bottle()
    route = app.route


@route('/api/accesspoints')
@route('/api/accesspoints/<state>')
def listAccesspoints(state="online"):
    try:
        return _get_accesspoints_with_state(state)
    except Exception as exc:
        print(exc)
        return None

def _get_accesspoints_with_state(state):
    apiformat = request.query.format or 'json'
    bbox = request.query.bbox
    if apiformat == "json":
        response.content_type = 'text/json; charset=UTF8'
        features = []
        if bbox == "":
            #return all online APs
            for ap in api.getAccesspoints():
                if ap.properties["state"]==state:
                    feature = Feature(ap.main_ip, Point((ap.lat, ap.lon)), ap.properties)
                    features.append(feature)
            collection = FeatureCollection(features)
            return geojson.dumps(collection)
        else:
            #only online APs within the bbox
            bbox = bbox.split(",")
            bbox = geometry.geo.box(float(bbox[0]),float(bbox[1]),float(bbox[2]),float(bbox[3]))
            for ap in api.getAccesspoints():
                p = geometry.Point((ap.lat, ap.lon))
                if bbox.contains(p):
                    if ap.properties["state"]==state:
                        feature = Feature(ap.main_ip, p, ap.__dict__)
                        features.append(feature)
            collection = FeatureCollection(features)
            return geojson.dumps(collection)


@route('/api/accesspoint/<ip>')
def bboxAccesspoint(ip=None):
    if ip:
        apiformat = request.query.format or 'json'
        if apiformat == "json":
            response.content_type = 'text/json; charset=UTF8'
            ap = None
            for apx in api.getAccesspoints(): #TODO: Use aps as dict later
                if apx.main_ip == ip:
                    ap = apx
            if ap:
                p = geometry.Point((ap.lat, ap.lon))
                feature = Feature(ap.main_ip, p, ap.__dict__)
                return geojson.dumps(feature)
            else:
                raise abort(404, "AP not found")


@route('/api/links')
def listLinks():
    apiformat = request.query.format or 'json'
    bbox = request.query.bbox
    route = request.query.route
    if apiformat == "json":
        response.content_type = 'text/json; charset=UTF8'
        features = []
        if bbox == "":
            if route == "":
                #return all links
                for link in api.getLinks():
                    if link.state=="online":
                        geom=LineString([(link.ap1.lat, link.ap1.lon), (link.ap2.lat, link.ap2.lon)])
                        feature = Feature(link.ap1.main_ip+"-"+link.ap2.main_ip, geom, {"etx":link.etx,"cable":link.cable})
                        features.append(feature)
            else:
                #return links within traceroute
                ips=route.split(",")
                #TOOD: Lookup real links instead
                aps=api.getAccesspointsAsDict()
                points=[]
                try:
                    for ip in ips:
                        points.append( (aps[ip].lat,aps[ip].lon) )
                    geom=LineString(points)
                    feature = Feature(ips[0]+"-"+ips[-1], geom, {})
                    features.append(feature)
                except KeyError:
                    raise abort(422, "Unknown")
        else:
            #only links touching the bbox
            bbox = bbox.split(",")
            bbox = geometry.geo.box(float(bbox[0]),float(bbox[1]),float(bbox[2]),float(bbox[3]))
            for link in api.getLinks():
                geom=geometry.LineString([(link.ap1.lat, link.ap1.lon), (link.ap2.lat, link.ap2.lon)])
                if bbox.contains(geom):
                    feature = Feature(link.ap1.main_ip+"-"+link.ap2.main_ip, geom, {"lq":link.lq,"rlq":link.rlq,"cable":link.cable})
                    features.append(feature)
        collection = FeatureCollection(features)
        return geojson.dumps(collection)


@route('/api/')
@route('/api/sites')
def listSites():
    apiformat = request.query.format or 'json'
    if apiformat == "json":
        response.content_type = 'text/json; charset=UTF8'
        features = []
        for site in api.sites:
            if len(site.aps) > 1:
                geom=site.getCenter()
                feature = Feature(site.name,geom)
                features.append(feature)
        collection = FeatureCollection(features)
        return geojson.dumps(collection)


@route('/static/<filepath:path>')
def server_static(filepath):
    return static_file(filepath, root='./static/')


@route('/')
def hello():
    return template('map')


def main_func():
    logging.basicConfig(filename='server.log', level=logging.DEBUG, format = '%(levelname)s %(asctime)-15s - %(message)s')
    logging.info("karten server gestartet")
    run(host='localhost', port=8081, debug=True)


if __name__ == '__main__':
    main_func()
