import unittest
#import geojson
import server


class Test(unittest.TestCase):

    def testMap(self):
        resp=server.hello()
        print(resp)
        
    def testAccesspointList(self):
        response=server.listAccesspoints() #mocken um offline zu testen
        coll = geojson.loads(response).features
        self.assertGreater(len(coll), 0)


if __name__ == "__main__":
    #import sys;sys.argv = ['', 'Test.testName']
    unittest.main()