const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { parse } = require("node-html-parser")
const mysql = require("mysql");
const mongo = require("mongodb");

const fromCSV = (csv, options) => {
    options = Object.assign({ header: true, delimiter: ",", quote: "\"", coerce: true }, options)
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
    return [_getSafeFields(fields), data];
};

const fromJSON = (json) => {
    var fields = [];
    var data = [];
    for (var i = 0; i < json.length; i++) {
        var record = [];
        for (var key of Object.keys(json[i])) {
            if (fields.indexOf(key) < 0) fields.push(key.toString());
            record[fields.indexOf(key)] = json[i][key];
        }
        data.push(record);
    }
    for (let record of data) {
        for (var j = 0; j < fields.length; j++) {
            if (!record[j]) record[j] = null;
        }
    }
    return [_getSafeFields(fields), data];
};

const fromXLSX = (buffer, options) => {
    options = Object.assign({ header: true, worksheet: 1 }, options)

    var fields = [];
    var data = [];

    let workbook = xlsx.read(buffer, {cellDates: true});
    let sheet = workbook.Sheets[workbook.SheetNames[options.worksheet - 1]];

    let [start, end] = (options.range) ? options.range.split(":") : [null, null];
    if (!start) start = sheet["!ref"].split(":")[0];
    if (!end) end = sheet["!ref"].split(":")[1];

    let range = xlsx.utils.decode_range([start, end].join(":"));

    for (let row = range.s.r; row <= range.e.r; row++) {
        let record = [];
        for (let column = range.s.c; column <= range.e.c; column++) {
            let cell = xlsx.utils.encode_cell({c: column, r: row});
            record.push((sheet[cell]) ? (sheet[cell].t === "d") ? sheet[cell].v.toISOString() : sheet[cell].v : null);
        }
        data.push(record);
    }

    if (options.header === undefined || options.header) {
        fields = data.shift();
    } else {
        for (let index = 1; index <= range.e.c - range.s.c + 1; index++) {
            fields.push(index.toString());
        }
    }

    return [_getSafeFields(fields), data];
}

const fromHTML = (html, options) => {
    options = Object.assign({ header: true, coerce: true }, options)

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
                let value = (cell.lastChild) ? cell.lastChild.text : cell.text;
                for (let i = 0; i < (cell.getAttribute("colspan") || 1); i++) {
                    record.push((options.coerce) ? _coerceValue(value) : value);
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

    return [_getSafeFields(fields), data];
}

const fromFile = (file, type, options) => {
    options = Object.assign({}, options);
    return new Promise((res, rej) => {
        const name = path.parse(file).name;
        var fields = [];
        var data = [];
        fs.readFile(file, (err, buf) => {
            if (err) rej(err)
            switch(type) {
                case "json":
                    [fields, data] = fromJSON(JSON.parse(buf.toString()));
                    break;
                case "xlsx":
                    [fields, data] = fromXLSX(buf, options);
                    break;
                default:
                    [fields, data] = fromCSV(buf.toString(), options);
                }
            res([name, _getSafeFields(fields), data]);
        })
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
                res([_getSafeFields(fields), data]);
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
            r[fields[j]] = data[i][j] || null;
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
            xml += ["<" + field + ">", _xmlEncode(data[i][j]), "</" + field + ">"].join("");
        }
        xml += "</record>"
    }
    xml += "</dataset>";
    return xml;
};

const toFile = (dataset, file, type, options) => {
    options = Object.assign({}, options);
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
    options = Object.assign({ delimiter: ",", quote: "\"", coerce: true }, options);
    var array = [];
    line = line.replace(/\r/g, "");
    if ((new RegExp("^" + options.delimiter)).test(line)) array.push(null);
    const re = new RegExp("(?:" + options.delimiter + "|\n|^)(" + options.quote + "(?:(?:" + options.quote + "" + options.quote + ")*[^" + options.quote + "]*)*" + options.quote + "|[^" + options.quote + "" + options.delimiter + "\n]*|(?:\n|$))", "g");
    for (const match of line.matchAll(re)) {
        if (match[1] && !/^\s*$/.test(match[1])) {
            let value = match[1].replace(new RegExp("^" + options.quote + "|" + options.quote + "$", "g"), "");
            if (options.coerce) {
                array.push(_coerceValue(value));
            } else {
                array.push(value);
            }
        } else {
            array.push(null);
        }
    }
    return array;
};

const _getSafeFields = (fields) => {
    return fields.map(field => { return field.replace(/[^A-Za-z0-9_.]+/g, "_"); } );
}

const _coerceValue = (value) => {
    if (value === undefined) return null;

    if (typeof value === "string") {
        value = value.trim();

        if (/^$/.test(value) || /^N\/{0,1}A$/i.test(value)) return null;

        let date = value.match(/^((?<yeara>\d{4})[-/.]{1}(?<montha>\d{1,2})[-/.]{1}(?<daya>\d{1,2})|(?<monthb>\d{1,2})[-/.]{1}(?<dayb>\d{1,2})[-/.]{1}(?<yearb>\d{4})){1}([ T]{1}(?<hour>\d{1,2})[:]{1}(?<minute>\d{2})([:]{1}(?<seconds>\d{2}(.\d+){0,1})){0,1}){0,1}$/);
        if (date) {
            let year = (date.groups.yeara || date.groups.yearb);
            let month = (date.groups.montha || date.groups.monthb).padStart(2, "0");
            let day = (date.groups.daya || date.groups.dayb).padStart(2, "0");
            let hour = (date.groups.hour || "00").padStart(2, "0");
            let minute = (date.groups.minute || "00");
            let seconds = (date.groups.seconds || "00");
            return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + seconds;
        }

        let number = value.match(/^(?<sign>[+-]{0,1})(?<integer>((\d{1,3}[,_ ])+\d{1,3}|\d)*)([.,]{1}(?<fractional>\d*)){0,1}$/);
        if (number) {
            let sign = number.groups.sign;
            let integer = (number.groups.integer.replace(/[,_ ]/g, "") || "0");
            let fractional = (number.groups.fractional || "0")
            return (new Number(sign + integer + "." + fractional)).valueOf();
        }
    }

    return value;
}

const _xmlEncode = (xml) => {
    return (new String(xml)).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

exports.fromCSV = fromCSV;
exports.fromJSON = fromJSON;
exports.fromHTML = fromHTML;
exports.fromXLSX = fromXLSX;
exports.fromFile = fromFile;
exports.fromMongoDB = fromMongoDB;
exports.fromMySQL = fromMySQL;
exports.toJSON = toJSON;
exports.toCSV = toCSV;
exports.toHTML = toHTML;
exports.toXML = toXML;
exports.toFile = toFile;