import unittest
import server
import geojson


class Test(unittest.TestCase):

    def testAccesspointList(self):
        response=server.listAccesspoints()
        coll = geojson.loads(response).features
        self.assertGreater(len(coll), 0)


if __name__ == "__main__":
    #import sys;sys.argv = ['', 'Test.testName']
    unittest.main()