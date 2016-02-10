#!/usr/bin/env node

var turf = require('turf'),
    chalk = require('chalk'),
    fs = require('fs'),
    getStdin = require('get-stdin'),
    defs = require('./definitions.json'),
    argv = require('minimist')(process.argv.slice(2), {
        boolean: ['h', 'help']
    });

function isGeoJsonArgument(type) {
    return type.type === 'NameExpression' &&
        ['FeatureCollection', 'Feature', 'Point', 'GeoJSON', 'Geometry',
         'LineString', 'Polygon', 'MultiPolygon', 'MultiPoint']
         .indexOf(type.name) !== -1;
}

function isJsonArgument(type) {
    return (type.type === 'NameExpression' &&
                (type.name === 'Object' || type.name === 'boolean')) ||
            (type.type === 'TypeApplication' &&
                type.expression.name === 'Array');
}

function parseArguments(def, argv, stdin) {
    if ((argv._.length - 1) !== def.params.length) {
        console.log('Definition %s requires %s arguments, given %s',
                    def.name, def.params.length, argv._.length - 1);
        showParams(def.params);
        throw new Error('invalid argument length given');
    }
    var args = [];
    def.params.forEach(function(param, i) {
        var arg = argv._[i + 1];
        if (isGeoJsonArgument(param.type) || isJsonArgument(param.type)) {
            args.push(getJsonFromArg(arg, stdin));
        } else {
            args.push(arg);
        }
    });
    return args;
}

function  getJsonFromArg (arg, stdin) {
    var raw
    if (arg === '-') {
        raw = JSON.parse(stdin)
    }

    try {
        // throws for a nonexistent file
        raw = fs.readFileSync(arg)
    } catch (e) {
        // if `arg` doesn't point to a file, fall back to treating it as literal JSON
        raw = arg
    }

    return JSON.parse(raw)
}

function showParams(params) {
    params.forEach(function(p) {
        console.log('    %s\t%s', chalk.bold(p.name), p.description);
    });
}

function getDef(name) {
    return defs.filter(function(def) {
        return def.name === name;
    })[0];
}

function help() {
    console.log(chalk.green('turf'));
    defs.forEach(function(def) {
        console.log('');
        console.log(' ' + chalk.bold(def.name));
        console.log('   ' + def.description);
        console.log('');
        showParams(def.params);
    });
}

(function() {
    if (argv.h || argv.help || !argv._.length) {
        help();
        process.exit(0);
    }
    var op = argv._[0];
    if (!turf[op]) {
        help();
        throw new Error('turf operation ' + op + ' not found');
    }
    var def = getDef(argv._[0]);
    getStdin().then(function (stdin) {
        var args = parseArguments(def, argv, stdin);
        console.log(JSON.stringify(turf[op].apply(null, args), null, 2));
    });
})();
