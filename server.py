from bottle import route, template, request, response, run, static_file

@route('/api/accesspoints')
def listAccesspoints():
    apiformat = request.query.format or 'json'
    if apiformat == "json":
        response.content_type = 'text/json; charset=UTF8'
        f = open('./tests/dump_accesspoints_legacy.json', 'r')
        return f.read()

@route('/static/<filepath:path>')
def server_static(filepath):
    return static_file(filepath, root='./static/')

@route('/')
def hello():
    return template('map')

run(host='localhost', port=8080, debug=True)