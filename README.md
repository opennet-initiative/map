# Überblick
on-map ist das Kartenportal der Opennet Initiative


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
    ProxyPass               /api    https://api.on-i.de/api
    ProxyPassReverse        /api    https://api.on-i.de/api
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
* deb-Paket erstellen: `make dist-deb`
* deb-Paket auf einem entfernten Host installieren: `make deploy-deb-remote DEPLOY_TARGET=root@example.on`
