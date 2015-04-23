import logging
import requests
from primitives import Accesspoint

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
        return self.__parseAccesspoint(r.json())
        
        