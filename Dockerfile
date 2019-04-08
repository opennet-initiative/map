FROM debian:8

RUN set -eux; \
 apt-get update; \
 apt-get install -y --no-install-recommends \
   apache2 \
   libjs-bootstrap \
   libjs-jquery \
   javascript-common \
 ;

COPY ./examples/apache2-docker/on-map-macro.conf /etc/apache2/conf-available/
COPY ./examples/apache2-docker/on-map.conf /etc/apache2/sites-available/

COPY ./html/ /usr/share/on-map/

RUN set -eux; \
 a2enmod macro; \
 a2enmod proxy; \
 a2enmod proxy_http; \
 a2enmod headers; \
 a2enmod ssl; \
 a2enconf javascript-common.conf; \
 a2enconf on-map-macro.conf; \
 a2ensite on-map.conf; \
 a2dissite 000-default;

CMD apachectl -D FOREGROUND


#
# For starting the docker container do the following:
#
# Build docker container:
#   sudo docker build -t on-map-debian .
# Start docker container:
#   sudo docker run -dit --name on-map-app -p 8080:80 on-map-debian
# Open website:
#   open in browser: http://localhost:8080/