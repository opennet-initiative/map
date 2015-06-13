onimap ist das Kartenportal des Opennet.

# Administration 

* apt-get install python3 virtualenvwrapper
* `virtualenv --distribute -p /usr/bin/python3.2 ~/.virtualenvs/on-map`
* `workon on-map`
* git repo clonen und reinwechseln
* `pip install -r requiements.txt`
* Lokal testen: `python server.py`
* Webserver-Konfiguration für WSGI anpassen ([siehe bottlepy docs](http://bottlepy.org/docs/dev/deployment.html))

# Entwicklung

* Python 3 mit virtualenv
* bottlepy webframework
* Openlayers 3
* greift auf api.oni.de zu, cached und transformiert für geojson