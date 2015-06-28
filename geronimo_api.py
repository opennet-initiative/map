import logging
import requests
import threading
import time
from primitives import Accesspoint, Link

class Api(threading.Thread):
    '''
    Client to access the main Opennet API (geronimo)
    '''
    
    API_INTERVALL=60


    def __init__(self):
        threading.Thread.__init__(self)
        self.start()
    
    def run(self):
        '''Update cache minloop'''
        while(True):
            logging.info("pulling ONI-API...")
            self.updateAccesspoints()
            self.updateLinks()
            time.sleep(self.API_INTERVALL)
    
    def __AddAccesspointProperties(self,ap,item,properties):
        for prop in properties:
            ap.properties[prop]=item[prop]
        
    
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
                    self.__AddAccesspointProperties(ap,item,["main_ip","device_model","device_board","system_uptime","owner","system_load_15min","firmware_type","firmware_release_name","opennet_version","firmware_install_timestamp","opennet_wifidog_enabled","post_address"])
                    ls.append(ap)
                except ValueError:
                    logging.info("AP ungültige Position (%s - %s)" % item["main_ip"], pos)
            else: logging.info("AP ohne Position (%s)" % item["main_ip"])
        return ls
    
    def updateAccesspoints(self):
        ''''returns all Accesspoints as objects'''
        r = requests.get("http://api.opennet-initiative.de/api/v1/accesspoint/?format=json")
        self.aps=self.__parseAccesspoint(r.json()) #TODO: Externalise
    
    def getAccesspoints(self):
        return self.aps
    
    def __parseLinks(self,json,aps):
        ls =[]
        for item in json:
            ep1=item["endpoints"][0]
            ep2=item["endpoints"][1]
            ip1= ep1["interface"]["ip_address"]
            ip2= ep2["interface"]["ip_address"]
            lq = ep1["quality"]
            rlq = ep1["quality"]
            try:
                link = Link(aps[ip1],aps[ip2],lq,rlq)
                ls.append(link)
            except KeyError:
                logging.info("Link zu unbekanntem AP (%s - %s)" % (ip1,ip2))
        return ls
    
    def __getAPasDict(self,apList):
        dic={}
        for ap in apList:
            dic[ap.main_ip]=ap
        return dic
    
    def updateLinks(self):
        ''''returns all links between Accesspoints as objects'''
        r = requests.get("http://api.opennet-initiative.de/api/v1/link/?format=json")
        if not hasattr(self,"aps"):
            self.getAccesspoints()
        apDict = self.__getAPasDict(self.aps)
        self.links=self.__parseLinks(r.json(),apDict)
    
    def getLinks(self):
        return self.links
        
        