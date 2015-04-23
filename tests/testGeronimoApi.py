import unittest
import geronimo_api


class Test(unittest.TestCase):


    def setUp(self):
        self.api = geronimo_api.Api()


    def testLive(self):
        aps = self.api.getAccesspoints()
        self.assertGreater(len(aps), 0)


if __name__ == "__main__":
    #import sys;sys.argv = ['', 'Test.testName']
    unittest.main()