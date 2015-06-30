#!/usr/bin/env node

var turf = require('turf'),
    chalk = require('chalk'),
    fs = require('fs'),
    defs = require('./definitions.json'),
    argv = require('minimist')(process.argv.slice(2), {
        boolean: ['h', 'help']
    });

var geoJsonTypes = [
  'FeatureCollection',
  'Point',
  'GeoJSON',
  'Geometry',
  'LineString',
  'Polygon',
  'MultiPolygon',
  'MultiPoint'
];

function cast(type, value) {
    if (type.type === 'TypeApplication' &&
      type.expression.name === 'Array') {
      return value.slice(1, -1).split(',')
        .map(cast.bind(null, type.applications[0]))
    } else if (type.type === 'NameExpression' &&
      /number/i.test(type.name)) {
        return Number(value);
    } else if (type.type === 'NameExpression' &&
      geoJsonTypes.indexOf(type.name) !== -1) {
      return JSON.parse(fs.readFileSync(value));
    }
    else return value;
}

function parseArguments(def, argv) {
    if ((argv._.length - 1) !== def.params.length) {
        console.log('Definition %s requires %s arguments, given %s',
                    def.name, def.params.length, argv._.length - 1);
        showParams(def.params);
        throw new Error('invalid argument length given');
    }
    var args = [];
    def.params.forEach(function(param, i) {
        var arg = argv._[i + 1];
        args.push(cast(param.type, arg))
    });
    return args;
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
    var args = parseArguments(def, argv);
    console.log(JSON.stringify(turf[op].apply(null, args), null, 2));
})();
