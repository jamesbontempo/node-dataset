const booleanParser = require("boolean-parser");
const functions = require("./functions");

const select = (dataset, fieldList) => {
    const name = dataset.name;
    fieldList = _splitList(fieldList);
    var i, j;
    var fields = [], as = [], aliases = [];
    var data = [], record = [];
    for (i = 0; i < fieldList.length; i++) {
        as = fieldList[i].split(/\s+as\s+/);
        if (dataset.fields.indexOf(as[0]) < 0) throw "Unknown field '" + as[0] + "'";
        fields.push(as[0]);
        if (as.length > 1) {
            aliases.push(as[1]);
        } else {
            aliases.push(as[0]);
        }
    }
    for (i = 0; i < dataset.data.length; i++) {
        record = [];
        for (j = 0; j < fields.length; j++) {
            record.push(dataset.data[i][dataset.fields.indexOf(fields[j])]);
        }
        data.push(record);
    }
    return [name, aliases, data];
};

const join = (dataset1, dataset2, type, fieldList1, fieldList2) => {
    switch(type) {
        case "left":
            return _outerJoin(dataset1, dataset2, fieldList1, fieldList2);
        case "right":
            return _outerJoin(dataset2, dataset1, fieldList2, fieldList1);
        case "inner":
            return _innerJoin(dataset1, dataset2, fieldList1, fieldList2);
        default:
            return _crossJoin(dataset1, dataset2);
    }
};

const _crossJoin = (dataset1, dataset2) => {
    const name = null;
    const fields = dataset1.fields.map(f => (dataset1.name) ? dataset1.name + "." + f : f).concat(dataset2.fields.map(f => (dataset2.name) ? dataset2.name + "." + f : f));
    var data = [];
    var i, j;
    for (i = 0; i < dataset1.data.length; i++) {
        for (j = 0; j < dataset2.data.length; j++) {
            data.push(dataset1.data[i].concat(dataset2.data[j]));
        }
    }
    return [name, fields, data];
};

const _innerJoin = (dataset1, dataset2, fieldList1, fieldList2) => {
    fieldList1 = _splitList(fieldList1);
    fieldList2 = _splitList(fieldList2);
    const name = null;
    const fields = dataset1.fields.map(f => (dataset1.name) ? dataset1.name + "." + f : f).concat(dataset2.fields.map(f => (dataset2.name) ? dataset2.name + "." + f : f));
    var data = [];
    var index = {}, key = [];
    var i, j, k;
    for (i = 0; i < dataset1.data.length; i++) {
        key = [];
        for (j = 0; j < fieldList1.length; j++) {
            key.push(dataset1.data[i][dataset1.fields.indexOf(fieldList1[j])]);
        }
        if (index[key]) {
            index[key].push(dataset1.data[i]);
        } else {
            index[key] = [dataset1.data[i]];
        }
    }
    for (i = 0; i < dataset2.data.length; i++) {
        key = [];
        for (j = 0; j < fieldList2.length; j++) {
            key.push(dataset2.data[i][dataset2.fields.indexOf(fieldList2[j])]);
        }
        if (index[key]) {
            for (k = 0; k < index[key].length; k++) {
                data.push(index[key][k].concat(dataset2.data[i]));
            }
        }
    }
    return [name, fields, data];
};

const _outerJoin = (dataset1, dataset2, fieldList1, fieldList2) => {
    fieldList1 = _splitList(fieldList1);
    fieldList2 = _splitList(fieldList2);
    const name = null;
    const fields = dataset1.fields.map(f => (dataset1.name) ? dataset1.name + "." + f : f).concat(dataset2.fields.map(f => (dataset2.name) ? dataset2.name + "." + f : f));
    var data = [];
    var index = {}, key = [];
    var i, j;
    for (i = 0; i < dataset1.data.length; i++) {
        key = [];
        for (j = 0; j < fieldList1.length; j++) {
            key.push(dataset1.data[i][dataset1.fields.indexOf(fieldList1[j])]);
        }
        if (index[key]) {
            index[key].push(dataset1.data[i].concat(new Array(dataset2.fields.length).fill(null)));
        } else {
            index[key] = [dataset1.data[i].concat(new Array(dataset2.fields.length).fill(null))];
        }
    }
    for (i = 0; i < dataset2.data.length; i++) {
        key = [];
        for (j = 0; j < fieldList2.length; j++) {
            key.push(dataset2.data[i][dataset2.fields.indexOf(fieldList2[j])]);
        }
        if (index[key]) {
            if (index[key][0].slice(dataset1.fields.length).every(e => e === null)) {
                index[key][0].splice(dataset1.fields.length, dataset2.fields.length);
                index[key][0] = index[key][0].concat(dataset2.data[i]);
            } else {
                index[key].push(index[key][0].slice(0, dataset1.fields.length).concat(dataset2.data[i]));
            }
        }
    }
    data = Object.values(index).flat();
    return [name, fields, data];
};

const filter = (dataset, filterStatement, useEval) => {
    const name = dataset.name;
    const fields = dataset.fields;
    var data = [];

    const fieldRE = "\\w+(?:\\.\\w+){0,1}";
    const numberRE = "-{0,1}\\d+\\.{0,1}\\d+";
    const stringRE = "'[^'\\\\]*(?:\\\\.[^'\\\\]*)*'";
    const valueRE = [fieldRE, numberRE, stringRE].join("|");

    const operatorRE = new RegExp("^\\s*(" + valueRE + ")\\s*(=|<|>|<=|>=|!=|<>)\\s*(" + valueRE + ")", "i");
    const likeRE = new RegExp("^\\s*(" + valueRE + ")\\s((?:not\\s+){0,1}like)\\s+(" + stringRE + ")", "i");
    const inRE = new RegExp("^\\s*(" + valueRE + ")\\s((?:not\\s+){0,1}in)\\s+(?:\\()([^)]+)(?:\\))", "i");
    const betweenRE = new RegExp("^\\s*(" + valueRE + ")\\s+((?:not\\s+){0,1}between)\\s+((?:" + valueRE + ")\\s+and\\s+(?:" + valueRE + "))", "i");
    const nullRE = new RegExp("^\\s*(" + valueRE + ")\\s+(is(?:\\s+not){0,1})\\s+(null)", "i");
    const comparisonREs = [operatorRE, likeRE, inRE, betweenRE, nullRE]

    const andRE = new RegExp("^\\s+and\\s+", "i");
    const orRE = new RegExp("^\\s+or\\s+", "i");

    var validExpression, expression = "", match, comparisons = [];
    var i, j, k;

    while (filterStatement.length > 0) {
        if (/\(|\)/.test(filterStatement.charAt(0))) {
            expression += filterStatement.charAt(0);
            filterStatement = filterStatement.substring(1)
        } else if (andRE.test(filterStatement)) {
            match = filterStatement.match(andRE)
            expression += (useEval) ? " && " : " AND ";
            filterStatement = filterStatement.substring(match[0].length);
        } else if (orRE.test(filterStatement)) {
            match = filterStatement.match(orRE)
            expression += (useEval) ? " || " : " OR ";
            filterStatement = filterStatement.substring(match[0].length);
        } else {
            validExpression = false;
            for (i = 0; i < comparisonREs.length; i++) {
                if (comparisonREs[i].test(filterStatement)) {
                    match = filterStatement.match(comparisonREs[i])
                    comparisons.push([match[1], match[2].toLowerCase(), match[3]]);
                    expression += "[" + comparisons.length + "]"
                    filterStatement = filterStatement.substring(match[0].length);
                    validExpression = true;
                }
            }
            if (!validExpression) throw "Unmatched expresion in statement starting at '" + filterStatement + "'";
        }
    }

    if ([...expression.matchAll(/\(/g)].length !== [...expression.matchAll(/\)/g)].length) throw "Mismatched number of parentheses in statement";

    var tempExpression = "", tempComparison = [], is0FieldReference, is2FieldReference;

    for (i = 0; i < dataset.data.length; i++) {
        tempExpression = expression;
        for (j = 0; j < comparisons.length; j++) {
            tempComparison = Array.from(comparisons[j]);

            is0FieldReference = (dataset.fields.indexOf(comparisons[j][0]) >= 0) ? true : false;
            is2FieldReference = (dataset.fields.indexOf(comparisons[j][2]) >= 0) ? true : false;

            if (is0FieldReference) {
                tempComparison[0] = dataset.data[i][dataset.fields.indexOf(comparisons[j][0])];
            } else {
                if (!Number.isNaN(parseInt(tempComparison[0]))) {
                    tempComparison[0] = parseInt(tempComparison[0]);
                } else {
                    tempComparison[0] = tempComparison[0].replace(/^'|'$/g, "");
                }
            }

            if (is2FieldReference) {
                tempComparison[2] = dataset.data[i][dataset.fields.indexOf(comparisons[j][2])];
            } else {
                switch(tempComparison[1]) {
                    case "in":
                    case "not in":
                        if (tempComparison[2].match(stringRE)) {
                            tempComparison[2] = tempComparison[2].replace(/^'|'$/g, "");
                            tempComparison[2] = tempComparison[2].split(/'\s*,\s*'/);
                        } else {
                            tempComparison[2] = tempComparison[2].split(",");
                            for (k = 0; k < tempComparison[2].length; k++) {
                                tempComparison[2][k] = parseFloat(tempComparison[2][k]);
                            }
                        }
                        break;
                    case "between":
                    case "not between":
                        tempComparison[2] = tempComparison[2].split(/\s+and\s+/);
                        for (k = 0; k < tempComparison[2].length; k++) {
                            tempComparison[2][k] = (tempComparison[2][k].match(stringRE)) ? tempComparison[2][k].replace(/^'|'$/g, "") : parseFloat(tempComparison[2][k]);
                        }
                        break;
                    default:
                        if (!Number.isNaN(parseInt(tempComparison[2]))) {
                            tempComparison[2] = parseInt(tempComparison[2]);
                        } else {
                            tempComparison[2] = tempComparison[2].replace(/^'|'$/g, "");
                        }
                }
            }

            tempExpression = tempExpression.replace("[" + (j+1) + "]", functions.compare(tempComparison));
        }

        if (useEval) {
            if (_eval(tempExpression)) data.push(dataset.data[i]);
        } else {
            if (booleanParser.parseBooleanQuery(tempExpression).some(a => a.every(e => e === "true"))) data.push(dataset.data[i]); // to-do: loop instead of array functions to make faster?
        }
    }

    return [name, fields, data];
};

const sort = (dataset, sortStatement) => {
    const name = dataset.name;
    const fields = dataset.fields;
    var data = Array.from(dataset.data);
    const sorts = _splitList(sortStatement);
    for (var i = 0; i < sorts.length; i++) {
        sorts[i] = sorts[i].split(/\s+/);
        if (sorts[i].length == 2) {
            if (sorts[i][1] === "desc") {
                sorts[i][1] = ">";
                sorts[i].push("<");
            } else {
                sorts[i][1] = "<";
                sorts[i].push(">");
            }
        } else {
            sorts[i].push("<");
            sorts[i].push(">");
        }
    }
    data.sort((a, b) => {
        for (var i = 0; i < sorts.length; i++) {
            if (functions.compare([a[dataset.fields.indexOf(sorts[i][0])], sorts[i][1], b[dataset.fields.indexOf(sorts[i][0])]])) return -1;
            if (functions.compare([a[dataset.fields.indexOf(sorts[i][0])], sorts[i][2], b[dataset.fields.indexOf(sorts[i][0])]])) return 1;
        }
        return 0;
    });
    return [name, fields, data];
};

const aggregate = (dataset, aggregationList, groupList) => {
    const name = dataset.name;
    const fields = _splitList(aggregationList);
    var data = [];

    var as = [], aliases = [];
    for (i = 0; i < fields.length; i++) {
        as = fields[i].split(/\s+as\s+/);
        //if (dataset.fields.indexOf(as[0]) < 0) throw "Unknown field '" + as[0] + "'";
        if (as.length > 1) {
            aliases.push(as[1]);
        } else {
            aliases.push(as[0]);
        }
    }

    var i, j, k;
    var index = {}, key = [];

    groupList = _splitList(groupList);
    aggregationList = _splitList(aggregationList);
    var aggregationFields = [];

    var aggregation, aggregations = [];
    const aggregateRE = /(count|min|max|sum|avg|var|std)\((.+)\)/;

    for (i = 0; i < aggregationList.length; i++) {
        if (!aggregateRE.test(aggregationList[i]) && groupList.indexOf(aggregationList[i]) < 0) {
            throw "Invalid aggregate function or field not in group by list '" + aggregationList[i] + "'";
        } else if (groupList.indexOf(aggregationList[i]) >= 0) {
            aggregations.push([groupList.indexOf(aggregationList[i]), aggregationList[i]]);
        } else {
            aggregation = aggregationList[i].match(aggregateRE);
            aggregations.push([aggregation[1], aggregation[2]]);
            aggregationFields.push(aggregation[2]);
        }
    }

    for (i = 0; i < dataset.data.length; i++) {
        key = [];
        for (j = 0; j < groupList.length; j++) {
            key.push(dataset.data[i][dataset.fields.indexOf(groupList[j])]);
        }
        if (index[key]) {
            for (k = 0; k < aggregationFields.length; k++) {
                index[key][aggregationFields[k]].push(dataset.data[i][dataset.fields.indexOf(aggregationFields[k])]);
            }
        } else {
            index[key] = {};
            for (k = 0; k < aggregationFields.length; k++) {
                index[key].data = key;
                index[key][aggregationFields[k]] = [dataset.data[i][dataset.fields.indexOf(aggregationFields[k])]];
            }
        }
    }

    const indices = Object.keys(index);
    var record;

    for (i = 0; i < indices.length; i++) {
        record = [];
        for (j = 0; j < aggregations.length; j++) {
            if (!Number.isNaN(parseInt(aggregations[j][0]))) {
                record.push(index[indices[i]].data[aggregations[j][0]]);
            } else {
                record.push(functions.aggregate(index[indices[i]][aggregations[j][1]], aggregations[j][0]));
            }
        }
        data.push(record);
    }

    return [name, aliases, data];
};

const slice = (dataset, begin, end) => {
    const name = dataset.name;
    const fields = dataset.fields;
    const data = dataset.data.slice(begin, end);
    return [name, fields, data];
};

const _eval = (expression) => {
    return Function("\"use strict\"; return(" + expression + ")")();
};

const _splitList = (list) => {
    return list.split(/\s*,\s*/);
};

exports.select = select;
exports.join = join;
exports.filter = filter;
exports.sort = sort;
exports.aggregate = aggregate;
exports.slice = slice;
