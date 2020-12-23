# Überblick
on-map ist das Kartenportal der Opennet Initiative


# Besondere Abfragen

* https://map.opennet-initiative.de/?ip=192.168.1.120
* https://map.opennet-initiative.de/?route=192.168.1.120,192.168.1.96,192.168.2.36
* https://map.opennet-initiative.de/?bbox=12.0;54.0;12.2;54.4
* https://map.opennet-initiative.de/#12;12.1837;54.3217


# Architektur

Die Karte besteht lediglich aus statischen Dateien (javascript + css).
Daten werden von der Geronimo-API (v2) bezogen.

Folgende externe Daten sind (leider) eingebettet:
* openlayers3: in Debian wird leider nur Openlayers v2 ausgeliefert
  Quelle: http://openlayers.org/
* ol3-layerswitcher: leider nicht für Debian paketiert
  Quelle (wahrscheinlich): https://github.com/walkermatt/ol3-layerswitcher


# Beispiel-Konfiguration für lokale Tests (apache2)

<VirtualHost *>
    DocumentRoot /home/foo/opennet/on_map/html/
    SSLProxyEngine On
    SSLProxyCheckPeerCN off
    SSLProxyCheckPeerExpire off
    ProxyPass               /api    https://api.opennet-initiative.de/api
    ProxyPassReverse        /api    https://api.opennet-initiative.de/api
    <Directory /home/foo/opennet/on_map/html>
        Require all granted
    </Directory>
    <Directory /usr/share/javascript>
        Require all granted
    </Directory>
</VirtualHost>

Die notwendigen javascript-Bibliotheken (siehe "Depends" in debian/control) müssen zuvor installiert werden.


# Entwicklung

* die Logik der Web-Anwendung befindet sich in `html/static/onimaps.js`
* neues Path-Release erstellen: `make release-patch"
* deb-Paket erstellen: `make dist-deb`
* deb-Paket auf einem entfernten Host installieren: `make deploy-deb-remote DEPLOY_TARGET=root@example.on`
* deb-Paket auf einem entfernten Host installieren ohne das Paket zu signieren: `make deploy-deb-remote DEPLOY_TARGET=root@example.on DEBIAN_BUILDPACKAGE_COMMAND="dpkg-buildpackage --no-sign"`

# Testen mit Docker

Das Einrichten einer lokalen Entwicklungsumgebung ist relativ komplex.
Für einen einfachen und schnellen Einstieg kann der Docker Container genutzt werden.
Hierfür bitte den Anweisungen am Ende von `Dockerfile` folgen.
