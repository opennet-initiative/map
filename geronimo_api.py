# -*- coding: utf-8 -*-

import logging
import requests
import threading
import time
import datetime
import dateutil.parser
from primitives import Accesspoint, Link, Site

class Api(threading.Thread):
    '''
    Client to access the main Opennet API (geronimo)
    '''
    
    API_INTERVALL=60
    MINUTES_FLAPPING=30
    DAYS_OFFLINE=30


    def __init__(self):
        logging.info("init API")
        threading.Thread.__init__(self)
        self.start()
    
    def run(self):
        '''Update cache mainloop'''
        while(True):
            logging.info("pulling ONI-API...")
            self.updateAccesspoints()
            self.updateLinks()
            self.calculateSites()        
            time.sleep(self.API_INTERVALL)
    
    def __AddAccesspointProperties(self,ap,item,properties):
        '''copy properties fields'''
        for prop in properties:
            ap.properties[prop]=item[prop]
    
    def __setAccesspointOnlineStatus(self,ap):
        '''detect if online|flapping|offline'''
        try:
            lastseen=dateutil.parser.parse(ap.properties["lastseen_timestamp"])
            state=self.__calcOnlineStatus(lastseen)
        except AttributeError:
            state="offline"
        ap.properties["state"]=state
        
    def __calcOnlineStatus(self,lastseen):
        now=datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
        diff=(now-lastseen).total_seconds()
        state="online"
        if diff>=60*self.MINUTES_FLAPPING:
            state="flapping"
        if diff>=60*30*24*self.DAYS_OFFLINE:
            state="offline"
        return state
    
    def __parsePoint(self, coordinates):
            lat = float(coordinates[0])
            lon = float(coordinates[1])
            return lat, lon
               
    def __parseAccesspoint(self,json):
        ls =[]
        for item in json:
            #nur wenn Position verfügbar aufnehmen
            pos=item["position"]
            if pos is not None:
                try:
                    lat, lon = self.__parsePoint(pos["coordinates"])
                    ap = Accesspoint(item["main_ip"], lat, lon)
                    self.__AddAccesspointProperties(ap,item,["main_ip","device_model","device_board","system_uptime","lastseen_timestamp","owner","system_load_15min","device_memory_available","device_memory_free","firmware_type","firmware_release_name","opennet_version","firmware_install_timestamp","opennet_captive_portal_enabled","post_address","opennet_service_relay_enabled"])
                    self.__setAccesspointOnlineStatus(ap)
                    ls.append(ap)
                except ValueError:
                    logging.warning("AP ungültige Position (%s - %s)" % item["main_ip"], pos)
            else: logging.warning("AP ohne Position (%s)" % item["main_ip"])
        return ls
    
    def updateAccesspoints(self):
        ''''returns all Accesspoints as objects'''
        r = requests.get("http://api.opennet-initiative.de/api/v1/accesspoint/?format=json")
        if r.status_code == requests.codes.ok:
            self.aps=self.__parseAccesspoint(r.json()) #TODO: Externalise
        else:
            logging.error("API Fehler %s", r.status_code)
    
    def getAccesspoints(self):
        return self.aps
    
    def getAccesspointsAsDict(self):
        return self.__getAPasDict(self.aps)
    
    def __parseLinks(self,json,aps):
        ls =[]
        for item in json:
            try:
                ep1=item["endpoints"][0]
                ep2=item["endpoints"][1]
                ip1= ep1["interface"]["ip_address"]
                ip2= ep2["interface"]["ip_address"]
                lq = ep1["quality"]
                nlq = ep1["quality"]
                link = Link(aps[ip1],aps[ip2],lq,nlq)
                try:
                    timestamp=item["timestamp"]
                    lastseen=dateutil.parser.parse(timestamp)
                    state=self.__calcOnlineStatus(lastseen)
                except AttributeError:
                    state="offline"
                link.state=state
                ls.append(link)
            except KeyError:
                logging.warning("Link zu unbekanntem AP (%s - %s)" % (ip1,ip2))
            except IndexError:
                logging.warning("Link mit fehlenden APs " % item)
        return ls
    
    def __getAPasDict(self,apList):
        dic={}
        for ap in apList:
            dic[ap.main_ip]=ap
        return dic
    
    def updateLinks(self):
        ''''returns all links between Accesspoints as objects'''
        r = requests.get("http://api.opennet-initiative.de/api/v1/link/?format=json")
        if r.status_code == requests.codes.ok:
            if not hasattr(self,"aps"):
                self.getAccesspoints()
            apDict = self.__getAPasDict(self.aps)
            self.links=self.__parseLinks(r.json(),apDict)
    
    def getLinks(self):
        return self.links
        
    def calculateSites(self):
        '''calculates cluster of nodes within same building'''
        aps=self.getAccesspoints()
        sites={}
        for ap in aps:
            addr=ap.properties["post_address"]
            if addr != '':
                try:
                    sites[addr].append(ap)
                except KeyError:
                    sites[addr]=[ap]
        self.sites=[]
        for site in sites:
            aps = sites[site]
            self.sites.append(Site(site,aps))
        logging.info("found %d accesspoint sites" % (len(self.sites)))
        #detect cables between sites
        #TODO: allg. sites ausgeben und als primitiver Datentyp
        university=["Ulmenstraße 69","August-Bebel-Straße 28","Albert Einsteinstraße 22"]
        government=["HWBR","Holbeinplatz 14, Bauamt", "Industriestraße 12"]
        cablesites=[]
        for site in self.sites:
            if site.name in university:
                cablesites.append(site)
        for link in self.links:
            link.cable = False
            loc1=link.ap1.properties["post_address"]
            loc2=link.ap2.properties["post_address"]
            if (loc1 in university) and (loc2 in university):
                if loc1 != loc2:
                    link.cable = True
            if (loc1 in government) and (loc2 in government):
                if loc1 != loc2:
                    link.cable = True
        
    def getSite(self):
        return self.sites
                    
                
        #links durchgehen
        # - beide Enden in Universität?
                
        #Kabel ausblenden (hardgecodete Liste)
        #Backbones erkennen
        #Links in Gebäuden uninteressant
