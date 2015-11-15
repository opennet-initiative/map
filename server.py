# -*- coding: utf-8 -*-
from bottle import route, template, request, response, run, static_file
from geojson import FeatureCollection, Feature, Point, LineString
from shapely import geometry
import geojson
import logging
import geronimo_api

@route('/api/accesspoints')
@route('/api/accesspoints/<state>')
def listAccesspoints(state="online"):
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
                raise httperror(status = 404)

@route('/api/links')
def listLinks():
    apiformat = request.query.format or 'json'
    bbox = request.query.bbox
    if apiformat == "json":
        response.content_type = 'text/json; charset=UTF8'
        features = []
        if bbox == "":
            #return all links
            for link in api.getLinks():
                if link.state=="online":
                    geom=LineString([(link.ap1.lat, link.ap1.lon), (link.ap2.lat, link.ap2.lon)])
                    feature = Feature(link.ap1.main_ip+"-"+link.ap2.main_ip, geom, {"etx":link.etx,"cable":link.cable})
                    features.append(feature)
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

if __name__ == '__main__':
    logging.basicConfig(filename='server.log', level=logging.DEBUG, format = '%(levelname)s %(asctime)-15s - %(message)s')
    logging.info("karten server gestartet")
    api=geronimo_api.Api()
    run(host='localhost', port=8081, debug=True)