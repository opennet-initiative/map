from bottle import route, template, request, response, run, static_file
from geojson import FeatureCollection, Feature, Point, LineString
from shapely import geometry
import geojson
import logging
import geronimo_api

@route('/api/accesspoints')
def listAccesspoints():
    apiformat = request.query.format or 'json'
    bbox = request.query.bbox
    if apiformat == "json":
        response.content_type = 'text/json; charset=UTF8'
        features = []
        if bbox == "":
            #return all APs
            for ap in api.getAccesspoints():
                feature = Feature(ap.main_ip, Point((ap.lat, ap.lon)), ap.__dict__)
                features.append(feature) 
            collection = FeatureCollection(features)
            return geojson.dumps(collection)
        else:
            #only APs within the bbox
            bbox = bbox.split(",")
            bbox = geometry.geo.box(float(bbox[0]),float(bbox[1]),float(bbox[2]),float(bbox[3]))
            for ap in api.getAccesspoints():
                p = geometry.Point((ap.lat, ap.lon))
                if bbox.contains(p):
                    feature = Feature(ap.main_ip, p, ap.__dict__)
                    features.append(feature) 
            collection = FeatureCollection(features)
            return geojson.dumps(collection)
            
            

@route('/api/links')
def listLinks():
    apiformat = request.query.format or 'json'
    bbox = request.query.bbox
    if apiformat == "json":
        response.content_type = 'text/json; charset=UTF8'
        features = []
        if bbox is None:
            #return all links
            for link in api.getLinks():
                geom=LineString([(link.ap1.lat, link.ap1.lon), (link.ap2.lat, link.ap2.lon)])
                feature = Feature('link', geom, {"lq":link.lq,"rlq":link.rlq})
                features.append(feature) 
            collection = FeatureCollection(features)
        else:
            #only links touching the bbox
            pass
        return geojson.dumps(collection)

@route('/static/<filepath:path>')
def server_static(filepath):
    return static_file(filepath, root='./static/')

@route('/')
def hello():
    return template('map')

if __name__ == '__main__':
    logging.basicConfig(filename='server.log', format=logging.BASIC_FORMAT)
    logging.info("karten server gestartet")
    api=geronimo_api.Api()
    run(host='localhost', port=8080, debug=True)