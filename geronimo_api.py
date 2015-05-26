import logging
import requests
from primitives import Accesspoint, Link

class Api(object):
    '''
    Client to access the main Opennet API (geronimo)
    '''


    def __init__(self):
        pass
    
    def __parsePoint(self, wkt):
        if wkt.find("POINT")>-1:
            src = wkt.replace("POINT (", "").replace(")", "")
            lat = float(src.split(" ")[0])
            lon = float(src.split(" ")[1])
            return lat, lon
        else:
            raise ValueError(wkt)
               
    def __parseAccesspoint(self,json):
        ls =[]
        for item in json:
            #nur wenn Position verfügbar aufnehmen
            pos=item["position"]
            if pos is not None:
                try:
                    lat, lon = self.__parsePoint(pos)
                    ap = Accesspoint(item["main_ip"], lat, lon)
                    ls.append(ap)
                except ValueError:
                    logging.info("AP ungültige Position (%s - %s)" % item["main_ip"], pos)
            else: logging.info("AP ohne Position (%s)" % item["main_ip"])
        return ls
    
    def getAccesspoints(self):
        ''''returns all Accesspoints as objects'''
        r = requests.get("http://api.opennet-initiative.de/api/v1/accesspoint/?format=json")
        self.aps=self.__parseAccesspoint(r.json()) #TODO: Externalise
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
    
    def getLinks(self):
        ''''returns all links between Accesspoints as objects'''
        r = requests.get("http://api.opennet-initiative.de/api/v1/link/?format=json")
        if not hasattr(self,"aps"):
            self.getAccesspoints()
        apDict = self.__getAPasDict(self.aps)
        return self.__parseLinks(r.json(),apDict)
        
        