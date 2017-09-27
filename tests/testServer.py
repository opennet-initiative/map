import unittest

import geojson

import on_map.server


class Test(unittest.TestCase):

    def test_map(self):
        resp = on_map.server.hello()
        print(resp)

    def test_accesspoint_list(self):
        response = on_map.server.list_accesspoints()  # mocken um offline zu testen
        coll = geojson.loads(response).features
        self.assertGreater(len(coll), 0)


if __name__ == "__main__":
    unittest.main()
