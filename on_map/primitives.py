# -*- coding: utf-8 -*-

from __future__ import division
from shapely import geometry


class Accesspoint(object):
    ''' Minimale AP Informationen '''

    def __init__(self, main_ip, lat, lon):
        self.main_ip = main_ip
        self.lat = lat
        self.lon = lon
        self.properties = {}


class Link(object):
    ''' Minimale Link Informationen '''

    def __init__(self, ap1, ap2, lq, nlq):
        self.ap1 = ap1
        self.ap2 = ap2
        self.lq = lq
        self.nlq = nlq
        self.etx = self._get_etx(lq, nlq)

    def _get_etx(self, lq, nlq):
        try:
            return (1.0 / (float(lq) * float(nlq)))
        except ZeroDivisionError:
            return 0.0


class Site(object):
    ''' Minimal Site Information '''

    def __init__(self, name, aps):
        self.name = name
        self.aps = aps

    def get_center(self):
        points = []
        for ap in self.aps:
            points.append(geometry.Point((ap.lat, ap.lon)))
        points = geometry.MultiPoint(points)
        return points.centroid
