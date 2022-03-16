const fs = require("fs");
const path = require("path");
const rl = require("readline");
const { parse } = require("node-html-parser")
const mysql = require("mysql");
const mongo = require("mongodb");

const fromCSV = (csv, options) => {
    options = Object.assign({ header: true, delimiter: ",", quote: "\"" }, options)
    csv = csv.split("\n");
    const fields = (options.header) ? _lineToArray(csv.shift(), options) : [];
    var data = [];
    for (var i = 0; i < csv.length; i++) {
        if (!/^$/.test(csv[i])) data.push(_lineToArray(csv[i], options));
    }
    if (!options.header && data.length > 0) {
        for (let i = 0; i < data[0].length; i++) {
            fields.push((i + 1).toString());
        }
    }
    return [fields, data];
};

const fromJSON = (json) => {
    var fields = [];
    var data = [];
    for (var i = 0; i < json.length; i++) {
        var record = [];
        for (var key of Object.keys(json[i])) {
            if (fields.indexOf(key) < 0) fields.push(key);
            record[fields.indexOf(key)] = json[i][key];
        }
        data.push(record);
    }
    return [fields, data];
};

const fromHTML = (html, options) => {
    options = Object.assign({ header: true }, options)
    
    let fields = [];
    let data = [];

    const table = parse(html);
    const rows = table.getElementsByTagName("tr");

    for (let row of rows) {
        const headers = row.getElementsByTagName("th");
        if (headers.length > 0 && options.header) {
            for (let header of headers) {
                fields.push(header.text);
            }
        }

        const cells = row.getElementsByTagName("td");
        if (cells.length > 0) {
            let record = [];
            for (let cell of cells) {
                for (let i = 0; i < (cell.getAttribute("colspan") || 1); i++) {
                    record.push((/^\s*$/.test(cell.text)) ? null : cell.text);
                }
            }
            data.push(record)
        }
    }

    if (options.headers) {
        fields = options.headers;
    } else if (!options.header && data.length > 0) {
        for (let i = 0; i < data[0].length; i++) {
            fields.push((i + 1).toString());
        }
    }

    return [fields, data];
}

const fromFile = (file, type, options) => {
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
                        [fields, data] = fromCSV(lines, options);
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
    options = Object.assign({ pretty: true, space: 2}, options);
    var json = [];
    for (var i = 0; i < data.length; i++) {
        var r = {};
        for (var j = 0; j < fields.length; j++) {
            r[fields[j]] = data[i][j];
        }
        json.push(r);
    }
    return JSON.stringify(json, null, (options.pretty) ? options.space : 0);
};

const toCSV = (fields, data, options) => {
    options = Object.assign({ header: true, delimiter: ",", quote: "\"" }, options)
    var csv = (options.header) ? fields.join(options.delimiter) : "";
    for (var i = 0; i < data.length; i++) {
        if (i > 0 || options.header) csv += "\n";
        csv += _arrayToLine(data[i], options);
    }
    return csv;
};

const toHTML = (fields, data) => {
    let html = "<table><tr>";
    for (let field of fields) {
        html += ["<th>", field, "</th>"].join("");
    }
    html += "</tr>";
    for (var i = 0; i < data.length; i++) {
        html += "<tr>";
        for (let datum of data[i]) {
            html += ["<td>", datum, "</td>"].join("");
        }
        html += "</tr>";
    }
    html += "</table>";
    return html;
};

const toXML = (fields, data) => {
    var xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><dataset>";
    for (var i = 0; i < data.length; i++) {
        xml += "<record>";
        for (var j = 0; j < fields.length; j++) {
            let field = (!/^([A-Za-z]|_|:)/.test(fields[j])) ? "_" + fields[j] : fields[j];
            xml += ["<" + field + ">", data[i][j], "</" + field + ">"].join("");
        }
        xml += "</record>"
    }
    xml += "</dataset>";
    return xml;
};

const toFile = (dataset, file, type, options) => {
    if (!options) options = {};
    return new Promise((res, rej) => {
        var data = "";
        switch(type) {
            case "json":
                data = toJSON(dataset.fields, dataset.data, options);
                break;
            default:
                data = toCSV(dataset.fields, dataset.data, options);
                break;
        }
        fs.writeFile(file, data, (err) => {
            if (err) rej(err);
            res();
        });
    });
};

const _arrayToLine = (array, options) => {
    options = Object.assign({ delimiter: ",", quote: "\"" }, options)
    var l = [];
    for (var i = 0; i < array.length; i++) {
        if (array[i] || array[i] === 0) {
            if (typeof array[i] === "string" || Number.isNaN(parseFloat(array[i]))) {
                l.push(options.quote + array[i] + options.quote);
            } else {
                l.push(array[i]);
            }
        } else {
            if (array[i] === "") {
                l.push(options.quote + options.quote);
            } else {
                l.push(null);
            }
        }
    }
    return l.join(options.delimiter);
};

const _lineToArray = (line, options) => {
    options = Object.assign({ delimiter: ",", quote: "\"" }, options);
    var array = [];
    line = line.replace(/\r/g, "");
    if ((new RegExp("^" + options.delimiter)).test(line)) array.push(null);
    const re = new RegExp("(?:" + options.delimiter + "|\n|^)(" + options.quote + "(?:(?:" + options.quote + "" + options.quote + ")*[^" + options.quote + "]*)*" + options.quote + "|[^" + options.quote + "" + options.delimiter + "\n]*|(?:\n|$))", "g");
    for (const match of line.matchAll(re)) {
        if (match[1] && !/^\s*$/.test(match[1])) {
            if (Number.isNaN(parseFloat(match[1]))) {
                array.push(match[1].replace(new RegExp("^" + options.quote + "|" + options.quote + "$", "g"), ""));
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
exports.fromJSON = fromJSON;
exports.fromHTML = fromHTML;
exports.fromFile = fromFile;
exports.fromMongoDB = fromMongoDB;
exports.fromMySQL = fromMySQL;
exports.toJSON = toJSON;
exports.toCSV = toCSV;
exports.toHTML = toHTML;
exports.toXML = toXML;
exports.toFile = toFile;