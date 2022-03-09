const fs = require("fs");
const path = require("path");
const rl = require("readline");
const mysql = require("mysql");
const mongo = require("mongodb");

const fromCSV = (csv) => {
    csv = csv.split("\n");
    const fields = _lineToArray(csv.shift());
    var data = [];
    for (var i = 0; i < csv.length; i++) {
        if (!/^$/.test(csv[i])) data.push(_lineToArray(csv[i]));
    }
    return [fields, data];
};

const fromJSON = (json) => {
    const fields = Object.keys(json[0]);
    var data = [];
    for (var i = 0; i < json.length; i++) {
        data.push(Object.values(json[i]));
    }
    return [fields, data];
};

const fromFile = (file, type) => {
    return new Promise((res, rej) => {
        const name = path.parse(file).name;
        var fields = [];
        var data = [];
        var lines = "";
        var datareader;
        try {
            datareader = rl.createInterface({input: fs.createReadStream(file), crlfDelay: Infinity});
            datareader.on("line", (line) => { lines += line + "\n"; });
            datareader.on("close", () =>{
                switch(type) {
                    case "json":
                        [fields, data] = fromJSON(JSON.parse(lines));
                        break;
                    default:
                        [fields, data] = fromCSV(lines);
                    }
                res([name, fields, data]);
            });
        } catch(err) {
            rej(err);
        }
    });
};

const fromMongoDB = (url, database, collection, query, projection) => {
    return new Promise((res, rej) => {
        const client = new mongo.MongoClient(url, { useUnifiedTopology: true });
        const p = new Promise((res, rej) => {
            client.connect(function(err) {
                if (err) rej(err);
                client.db(database).collection(collection).find(query).project(projection).toArray(function(err, data) { if (err) rej(err); res(data);});
            });
        });
        p.then(results => {
            try {
                client.close();
            } catch(err) {
                rej(err);
            } finally {
                res(fromJSON(results));
            }
        });
    });
};

const fromMySQL = (options, query) => {
    return new Promise((res, rej) => {
        var fields = [];
        var data = [];
        var connection = mysql.createConnection(options);
        const p = new Promise((res, rej) => {
            connection.query(query, function(e, r, f) {
            if (e) rej(e);
            res([f, r]);
            });
        });
        p.then(results => {
            try {
                connection.end();
            } catch(err) {
                rej(err);
            } finally {
                for (var i = 0; i < results[0].length; i++) {
                    fields.push(results[0][i].name);
                }
                for (var j = 0; j < results[1].length; j++) {
                    data.push(Object.values(results[1][j]));
                }
                res([fields, data]);
            }
        });
    });
};

const toJSON = (fields, data, options) => {
    const space = (options.pretty && options.pretty == true) ? (options.space) ? options.space : 2 : 0;
    var json = [];
    for (var i = 0; i < data.length; i++) {
        var r = {};
        for (var j = 0; j < fields.length; j++) {
            r[fields[j]] = data[i][j];
        }
        json.push(r);
    }
    return JSON.stringify(json, null, space);
};

const toCSV = (fields, data, options) => {
    const delimiter = (options.delimiter) ? options.delimiter : ",";
    const quote = (options.quote) ? options.quote : "\"";
    var csv = fields.join(delimiter);
    for (var i = 0; i < data.length; i++) {
        csv += "\n" + _arrayToLine(data[i], quote, delimiter);
    }
    return csv;
};

const toHTML = (fields, data) => {
    let html = "<table><tr>";
    for (let field of fields) {
        html += "<th>" + field + "</th>"
    }
    html += "</tr>";
    for (var i = 0; i < data.length; i++) {
        html += "<tr>";
        for (let datum of data[i]) {
            html += "<td>" + datum + "</td>"
        }
        html += "</tr>";
    }
    html += "</table>";
    return html;
};

const toFile = (ds, file, type, options) => {
    if (!options) options = {};
    return new Promise((res, rej) => {
        var data = "";
        switch(type) {
            case "json":
                data = toJSON(ds.fields, ds.data, options);
                break;
            default:
                data = toCSV(ds.fields, ds.data, options);
                break;
        }
        fs.writeFile(file, data, (err) => {
            if (err) rej(err);
            res();
        });
    });
};

const _arrayToLine = (array, quote, delimiter) => {
    var l = [];
    for (var i = 0; i < array.length; i++) {
        if (array[i] || array[i] === 0) {
            if (typeof array[i] === "string" || Number.isNaN(parseFloat(array[i]))) {
                l.push(quote + array[i] + quote);
            } else {
                l.push(array[i]);
            }
        } else {
            if (array[i] === "") {
                l.push(quote + quote);
            } else {
                l.push(null);
            }
        }
    }
    return l.join(delimiter);
};

const _lineToArray = (line) => {
    var array = [];
    line = line.replace(/\r/g, "");
    if (/^,/.test(line)) array.push(null);
    const re = new RegExp(/(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/, "g");
    for (const match of line.matchAll(re)) {
        if (match[1] && !/^\s*$/.test(match[1])) {
            if (Number.isNaN(parseFloat(match[1]))) {
                array.push(match[1].replace(/^"|"$/g, ""));
            } else {
                array.push(parseFloat(match[1]));
            }
        } else {
            array.push(null);
        }
    }
    return array;
};

exports.fromCSV = fromCSV;
exports.fromFile = fromFile;
exports.fromJSON = fromJSON;
exports.fromMongoDB = fromMongoDB;
exports.fromMySQL = fromMySQL;
exports.toJSON = toJSON;
exports.toCSV = toCSV;
exports.toHTML = toHTML;
exports.toFile = toFile;