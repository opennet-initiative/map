from bottle import route, template, request, response, run, static_file

@route('/api/accesspoints')
def listAccesspoints():
    apiformat = request.query.format or 'json'
    if apiformat == "json":
        response.content_type = 'text/json; charset=UTF8'
        return "{text: 'hello world'}"

@route('/static/<filepath:path>')
def server_static(filepath):
    return static_file(filepath, root='/home/matthias/workspace/on_map/static/')

@route('/')
def hello(name='World'):
    return template('map', name=name)

run(host='localhost', port=8080, debug=True)