from __future__ import division

class Accesspoint(object):
    '''
    Minimale AP Informationen
    '''
    def __init__(self, main_ip, lat, lon):
        self.main_ip=main_ip
        self.lat=lat
        self.lon=lon
        self.properties={}

class Link(object):
    '''
    Minimale Link Informationen
    '''
    def __init__(self,ap1,ap2,lq,nlq):
        self.ap1 = ap1
        self.ap2 = ap2
        self.lq = lq
        self.nlq = nlq
        self.etx = self.__getEtx(lq,nlq)
    
    def __getEtx(self,lq,nlq):
        try:
            return (1.0 / (float(lq) * float(nlq)))           
        except ZeroDivisionError:
            return 0.0