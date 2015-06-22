var runtime = require('runtime-documentation'),
    queue = require('queue-async'),
    path = require('path'),
    camelcase = require('camelcase'),
    glob = require('glob');

var q = queue(1);

glob.sync('./node_modules/turf/node_modules/turf-*').forEach(function(t) {
    q.defer(runtime.require, t, __dirname, { shallow: true });
});

q.awaitAll(function(err, res) {
    var functions = [];
    res.forEach(function(docs) {
        docs.forEach(function(doc) {
            var dir = path.dirname(doc.context.file).split('/');
            var name = camelcase(dir[dir.length - 1].replace('turf-', ''));
            functions.push({
                name: name,
                description: doc.description,
                params: doc.params
            });
        });
    });
    console.log(JSON.stringify(functions, null, 2));
});
