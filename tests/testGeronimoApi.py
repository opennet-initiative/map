import unittest

import geronimo_api


class Test(unittest.TestCase):

    def setUp(self):
        self.api = geronimo_api.Api()

    def test_live(self):
        aps = self.api.getAccesspoints()
        self.assertGreater(len(aps), 0)

    def test_parse_ap(self):
        pass

    def test_parse_links(self):
        pass


if __name__ == "__main__":
    unittest.main()
