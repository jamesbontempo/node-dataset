const aggregate = (values, type) => {
    var i, sum, mean, diff;
    switch (type) {
        case "count":
            return values.length;
        case "min":
            var min = values[0];
            for (i = 1; i < values.length; i++) {
                if (values[i] < min) min = values[i];
            }
            return min;
        case "max":
            var max = values[0];
            for (i = 1; i < values.length; i++) {
                if (values[i] > max) max = values[i];
            }
            return max;
        case "sum":
            sum = 0;
            for (i = 0; i < values.length; i++) {
                sum += values[i];
            }
            return sum;
        case "avg":
            sum = 0;
            for (i = 0; i < values.length; i++) {
                sum += values[i];
            }
            return sum / values.length;
        case "var":
            sum = 0;
            diff = 0;
            for (i = 0; i < values.length; i++) {
                sum += values[i];
            }
            mean = sum / values.length;
            for (i = 0; i < values.length; i++) {
                diff += (values[i] - mean) ** 2;
            }
            return diff / values.length;
        case "std":
            sum = 0;
            diff = 0;
            for (i = 0; i < values.length; i++) {
                sum += values[i];
            }
            mean = sum / values.length;
            for (i = 0; i < values.length; i++) {
                diff += (values[i] - mean) ** 2;
            }
            return Math.sqrt(diff / values.length);
    }
}

const _isNull = (value) => {
    return (value === null || value === undefined);
}

const _stringifyObjects = (comparison) => {
    for (let i = 0; i < comparison.length; i++) {
        if (Array.isArray(comparison[i])) {
            _stringifyObjects(comparison[i]);
        } else {
            if (typeof comparison[i] === "object" && comparison[i] != null) {
                comparison[i] = comparison[i].toISOString()
            }
        }
    }
}

const compare = (comparison) => {
    _stringifyObjects(comparison);
    switch(comparison[1]) {
        case "=":
            return (comparison[0] === comparison[2]);
        case ">":
            return((_isNull(comparison[2]) && !_isNull(comparison[0])) || comparison[0] > comparison[2]);
        case "<":
            return((_isNull(comparison[0]) && !_isNull(comparison[2])) || comparison[0] < comparison[2]);
        case ">=":
            return((_isNull(comparison[2]) && !_isNull(comparison[0])) || comparison[0] >= comparison[2]);
        case "<=":
            return((_isNull(comparison[0]) && !_isNull(comparison[2])) || comparison[0] <= comparison[2]);
        case "!=":
        case "<>":
            return ((comparison[0] || comparison[2]) && comparison[0] !== comparison[2]);
        case "in":
            return (comparison[0] && comparison[2].indexOf(comparison[0]) >= 0);
        case "not in":
            return (comparison[0] && comparison[2].indexOf(comparison[0]) < 0);
        case "like":
            return (new RegExp("^" + comparison[2].replace(/%/g, ".*") + "$", "i").test(comparison[0]));
        case "not like":
            comparison[2] = new RegExp("^" + comparison[2].replace(/%/g, ".*") + "$", "i");
            return (!comparison[2].test(comparison[0]));
        case "between":
            return (comparison[0] >= comparison[2][0] && comparison[0] <= comparison[2][1]);
        case "not between":
            return (comparison[0] < comparison[2][0] || comparison[0] > comparison[2][1]);
        case "is":
            return (_isNull(comparison[0]));
        case "is not":
            return (!_isNull(comparison[0]));
    }
};

/*

// To-do: support basic arithmetic operations in methods

const operate = (operation) => {
    switch (operation[1]) {
        case "+":
            return operation[0] + operation[2];
        case "-":
            return operation[0] - operation[2];
        case "*":
            return operation[0] * operation[2];
        case "/":
            return operation[0] / operation[2];
        case "^":
            return operation[0] ** operation[2];
        case "%":
            return operation[0] % operation[2];
    }
}
*/

exports.aggregate = aggregate;
exports.compare = compare;
//exports.operate = operate;
