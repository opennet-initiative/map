# -*- coding: utf-8 -*-

import datetime
import logging
import requests

import dateutil.parser

from on_map.primitives import Accesspoint, Link, Site


API_URL = "http://api.opennet-initiative.de/api/v1/"


# TODO: parsen als Klassenmethode bzw. Objekte auslagern
class Api:
    ''' Client to access the main Opennet API (geronimo) '''

    MINUTES_FLAPPING = 30
    DAYS_OFFLINE = 30

    def __init__(self):
        logging.info("init API")
        self.links = []
        self.aps = []
        self.update()

    def update(self):
        logging.info("pulling ONI-API...")
        self.update_accesspoints()
        self.update_links()
        self.calculate_sites()

    def _add_accesspoint_properties(self, ap, item, properties):
        '''copy properties fields'''
        for prop in properties:
            ap.properties[prop] = item[prop]

    def _set_accesspoint_online_status(self, ap):
        '''detect if online|flapping|offline'''
        try:
            lastseen = dateutil.parser.parse(ap.properties["lastseen_timestamp"])
            state = self._calc_online_status(lastseen)
        except AttributeError:
            state = "offline"
            logging.warning("state error ("+str(lastseen)+")")
        ap.properties["state"] = state

    def _calc_online_status(self, lastseen):
        now = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
        diff = (now - lastseen).total_seconds()
        state = "online"
        if diff >= 60 * self.MINUTES_FLAPPING:
            state = "flapping"
        if diff >= 60 * 30 * 24 * self.DAYS_OFFLINE:
            state = "offline"
        return state

    def _parse_point(self, coordinates):
            lat = float(coordinates[0])
            lon = float(coordinates[1])
            return lat, lon

    def _parse_accesspoint(self, json):
        ls = []
        for item in json:
            # nur wenn Position verfügbar aufnehmen
            pos = item["position"]
            if pos is not None:
                try:
                    lat, lon = self._parse_point(pos["coordinates"])
                    ap = Accesspoint(item["main_ip"], lat, lon)
                    self._add_accesspoint_properties(ap, item, [
                        "main_ip", "device_model", "device_board", "system_uptime",
                        "lastseen_timestamp", "owner", "system_load_15min",
                        "device_memory_available", "device_memory_free", "firmware_type",
                        "firmware_release_name", "opennet_version", "firmware_install_timestamp",
                        "opennet_captive_portal_enabled", "post_address",
                        "opennet_service_relay_enabled"])
                    self._set_accesspoint_online_status(ap)
                    ls.append(ap)
                except ValueError:
                    logging.warning("AP ungültige Position (%s - %s)" % item["main_ip"], pos)
            else:
                logging.info("AP ohne Position (%s)" % item["main_ip"])
        return ls

    def update_accesspoints(self):
        ''' returns all Accesspoints as objects '''
        r = requests.get(API_URL + "accesspoint/?format=json")
        if r.status_code == requests.codes.ok:
            self.aps = self._parse_accesspoint(r.json())  # TODO: Externalise
        else:
            logging.error("API Fehler (accesspoint) %s", r.status_code)

    def get_accesspoints(self):
        return self.aps

    def get_accesspoints_as_dict(self):
        return self._get_ap_as_dict(self.aps)

    def _parse_links(self, json, aps):
        ls = []
        for item in json:
            try:
                ep1 = item["endpoints"][0]
                ep2 = item["endpoints"][1]
                ip1 = ep1["interface"]["ip_address"]
                ip2 = ep2["interface"]["ip_address"]
                lq = ep1["quality"]
                nlq = ep1["quality"]
                link = Link(aps[ip1], aps[ip2], lq, nlq)
                try:
                    timestamp = item["timestamp"]
                    lastseen = dateutil.parser.parse(timestamp)
                    state = self._calc_online_status(lastseen)
                except AttributeError:
                    state = "offline"
                link.state = state
                ls.append(link)
            except KeyError:
                logging.info("Link zu unbekanntem AP (%s - %s)" % (ip1, ip2))
            except IndexError:
                logging.info("Link mit fehlenden APs " % item)
        return ls

    def _get_ap_as_dict(self, ap_list):
        dic = {}
        for ap in ap_list:
            dic[ap.main_ip] = ap
        return dic

    def update_links(self):
        ''' returns all links between Accesspoints as objects '''
        r = requests.get(API_URL + "link/?format=json")
        if r.status_code == requests.codes.ok:
            if not hasattr(self, "aps"):
                self.get_accesspoints()
            ap_dict = self._get_ap_as_dict(self.aps)
            self.links = self._parse_links(r.json(), ap_dict)
        else:
            logging.error("API Fehler (link) %s", r.status_code)

    def get_links(self):
        return self.links

    def calculate_sites(self):
        ''' calculates cluster of nodes within same building '''
        aps = self.get_accesspoints()
        sites = {}
        for ap in aps:
            addr = ap.properties["post_address"]
            if addr != '':
                try:
                    sites[addr].append(ap)
                except KeyError:
                    sites[addr] = [ap]
        self.sites = []
        for site in sites:
            aps = sites[site]
            self.sites.append(Site(site, aps))
        logging.info("found %d accesspoint sites" % (len(self.sites)))
        # detect cables between sites
        # TODO: allg. sites ausgeben und als primitiver Datentyp
        university = [u"Ulmenstraße 69",
                      u"August-Bebel-Straße 28",
                      u"Albert-Einstein-Straße 22",
                      u"Server/tamago",
                      u"Server/aqua",
                      u"Philosophische Fakultät"]
        government = [u"HWBR", u"Holbeinplatz 14, Bauamt", u"Industriestraße 12"]
        cablesites = []
        for site in self.sites:
            if site.name in university:
                cablesites.append(site)
        for link in self.links:
            link.cable = False
            loc1 = link.ap1.properties["post_address"]
            loc2 = link.ap2.properties["post_address"]
            if (loc1 in university) and (loc2 in university):
                if loc1 != loc2:
                    link.cable = True
            if (loc1 in government) and (loc2 in government):
                if loc1 != loc2:
                    link.cable = True

    # TODO: method is not in use
    def get_site(self):
        return self.sites

        # links durchgehen
        # - beide Enden in Universität?

        # Kabel ausblenden (hardgecodete Liste)
        # Backbones erkennen
        # Links in Gebäuden uninteressant
