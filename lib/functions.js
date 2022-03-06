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

const compare = (comparison) => {
    switch(comparison[1]) {
        case "=":
            if (comparison[0] === comparison[2]) return true;
            return false;
        case ">":
            if ((comparison[0] && comparison[2]) && comparison[0] > comparison[2]) return true;
            return false;
        case "<":
            if ((comparison[0] && comparison[2]) && comparison[0] < comparison[2]) return true;
            return false;
        case ">=":
            if ((comparison[0] && comparison[2]) && comparison[0] >= comparison[2]) return true;
            return false;
        case "<=":
            if ((comparison[0] && comparison[2]) && comparison[0] <= comparison[2]) return true;
            return false;
        case "!=":
        case "<>":
            if ((comparison[0] || comparison[2]) && comparison[0] !== comparison[2]) return true;
            return false;
        case "in":
            if (comparison[0] && comparison[2].indexOf(comparison[0]) >= 0) return true;
            return false;
        case "not in":
            if (comparison[0] && comparison[2].indexOf(comparison[0]) < 0) return true;
            return false;
        case "like":
            if (new RegExp("^" + comparison[2].replace(/%/g, ".*") + "$", "i").test(comparison[0])) return true;
            return false;
        case "not like":
            comparison[2] = new RegExp("^" + comparison[2].replace(/%/g, ".*") + "$", "i");
            if (!comparison[2].test(comparison[0])) return true;
            return false;
        case "between":
            if (comparison[0] >= comparison[2][0] && comparison[0] <= comparison[2][1]) return true;
            return false;
        case "not between":
            if (comparison[0] < comparison[2][0] || comparison[0] > comparison[2][1]) return true;
            return false;
        case "is":
            if (comparison[0] === null) return true;
            return false;
        case "is not":
            if (comparison[0] !== null) return true;
            return false;
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
