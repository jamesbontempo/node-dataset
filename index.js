const methods = require("./lib/methods");
const io = require("./lib/io");

/**
 * The DataSet class
 * @class DataSet
 */

class DataSet {

    /**
     * Construct a new DataSet
     * @constructs DataSet
     * @param {string} name - name of the DataSet
     * @param {string|object} fields - comma separated list, or array, of fields in the DataSet
     * @param {array} data - array of arrays comprising the data of the DataSet
     */
    constructor(name, fields, data) {
        this.name = (name && typeof(name) === "string" && name.length > 0) ? name : null;
        this.fields = (fields && fields.length > 0)
            ? (typeof fields === "string")
                ? fields.split(/\s*,\s*/)
                : fields
            : [];
        this.data = (data && Array.isArray(data)) ? data : [];
    }

    /**
     * Get the name of the DataSet
     */
    getName() {
        return this.name;
    }

    /**
     * Set the name of the DataSet
     * @param {string} name - name of the DataSet
     */
    setName(name) {
        this.name = (name && typeof(name) === "string" && name.length > 0) ? name : null;
        return this;
    }

    /**
     * Get the fields of the DataSet
     */
    getFields() {
        return this.fields;
    }

    /**
     * Set the fields of the DataSet
     * @param {string|object} fields - comma separated list, or array, of fields in the DataSet
     */
    setFields(fields) {
        const newFields = (fields && fields.length > 0)
            ? (typeof fields === "string")
                ? fields.split(/\s*,\s*/)
                : fields
            : [];
        if (this.fields.length === newFields.length) this.fields = newFields;
        return this;
    }

    /**
     * Get the data of the DataSet
     */
    getData() {
        return this.data;
    }

    /**
     * Set the data of the DataSet
     * @param {object} data - array of arrays comprising the data of the DataSet
     */
    setData(data) {
        if (data && Array.isArray(data)) {
            if (data.length === 0 || data[0].length === this.fields.length) this.data = data;
        }
        return this;
    }

    /**
     * Get the number of records in the DataSet
     */
    count() {
        return this.data.length;
    }

    /**
     * Select the data for a set of fields from the DataSet
     * @param {string} fieldList - comma separated list of fields to return
     */
    select(fieldList) {
        return new DataSet().fromArray(methods.select(this, fieldList));
    }

    /**
     * Join the DataSet with another DataSet
     * @param {Object} dataset - the DataSet to join this DataSet with
     * @param {string} type - the type of join to construct (cross, inner, left, or right)
     * @param {string} fieldList1 - comma separated list of fields from this DataSet to use to for the join
     * @param {string} fieldList2 - comma separated list of fields from the joined to DataSet to use for the join
     */
    join(dataset, type, fieldList1, fieldList2) {
        return new DataSet().fromArray(methods.join(this, dataset, type, fieldList1, fieldList2));
    }

    /**
     * Filter the DataSet for a subset of data
     * @param {string} filterStatement - statement describing the filter to be applied
     * @param {boolean} useEval - whether to use the new Function constructor (similar to eval) to evaluate against filterStatement
     */
    filter(filterStatement, useEval) {
        return new DataSet().fromArray(methods.filter(this, filterStatement, useEval));
    }
    
    /**
     * Filter the DataSet for a subset of data
     * @param {string} filterStatement - statement describing the filter to be applied
     * @param {boolean} useEval - whether to use the new Function constructor (similar to eval) to evaluate against filterStatement
     */
    where(filterStatement, useEval) {
        return this.filter(filterStatement, useEval);
    }

    /**
     * Sort the data in the DataSet
     * @param {string} sortStatement - statement describing how to sort the DataSet
     */
    sort(sortStatement) {
        return new DataSet().fromArray(methods.sort(this, sortStatement));
    }

    /**
     * Sort the data in the DataSet
     * @param {string} sortStatement - statement describing how to sort the DataSet
     */
    orderby(sortStatement) {
        return this.sort(sortStatement);
    }

    /**
     * Perform aggregate functions on fields in the DataSet
     * @param {string} aggregationList - comma separated list of aggregate functions to perform
     * @param {string} groupList - comma separated list of fields to group by
     */
    aggregate(aggregationList, groupList) {
        return new DataSet().fromArray(methods.aggregate(this, aggregationList, groupList));
    }

    /**
     * Retrieve a slice of the data in the DataSet (using zero-based array indexing)
     * @param {number} begin - the array index indicating where the slice should begin
     * @param {number} end - the array index indicating where the slice should end (not included in the results)
     */
    slice(begin, end) {
        return new DataSet().fromArray(methods.slice(this, begin, end));
    }

    /**
     * Retrieve a slice of the data in the DataSet starting with the first element
     * @param {number} number - the number of elements to return
     */
    limit(number) {
        return this.slice(0, number);
    }

    /**
     * Populate the DataSet from an array
     * @param {array} array - an array containing the name, fields and data for the DataSet
     */
    fromArray(array) {
        this.name = array[0];
        this.fields = array[1];
        this.data = array[2];
        return this;
    }

    /**
     * Populate the DataSet from an array of JSON objects
     * @param {array} json - an array of JSON objects where the keys are the fields and the values are the data
     */
    fromJSON(json) {
        this.fromArray([this.name].concat(io.fromJSON(json)));
        return this;
    }

    /**
     * Populate the DataSet from a CSV-formatted string
     * @param {string} csv - a CSV-formatted string where the first line contains the fields and the rest are the data
     * @param {object} options - options for the file (header, delimiter and quote)
     */
    fromCSV(csv, options) {
        this.fromArray([this.name].concat(io.fromCSV(csv, options)));
        return this;
    }

    /**
     * Populate the DataSet from an Excel file buffer
     * @param {object} xlsx - an Excel file buffer
     * @param {object} options - options for the file (header, worksheet, range)
     */
    fromXLSX(xlsx, options) {
        this.fromArray([this.name].concat(io.fromXLSX(xlsx, options)));
        return this;
    }

    /**
     * Populate the DataSet from an HTML table
     * @param {string} csv - a HTML table
     * @param {object} options - options for the table (header)
     */
    fromHTML(html, options) {
        this.fromArray([this.name].concat(io.fromHTML(html, options)));
        return this;
    }

    /**
     * Populate the DataSet using data in a file
     * @param {string} filePath - the path to the file containing the data from which to construct the DataSet
     * @param {string} type - the type of file/format of the data (json or csv)
     * @param {object} options - options for the file (delimiter and quote character for csv)
     */
    async fromFile(filePath, type, options) {
        this.fromArray(await io.fromFile(filePath, type, options));
        return this;
    }

    /**
     * Populate the DataSet using MySQL query results
     * @param {Object} options - options for the MySQL connection
     * @param {string} query - query to retrieve the data for the DataSet
     */
    async fromMySQL(options, query) {
        this.fromArray([this.name].concat(await io.fromMySQL(options, query)));
        return this;
    }

    /**
     * Populate the DataSet using MongoDB query results
     * @param {string} url - url of the database
     * @param {string} database - name of the database
     * @param {string} collection - name of the connection
     * @param {object} query - the query to execute to retrieve results
     * @param {object} project - the projection to execute on the results
     */
    async fromMongoDB(url, database, collection, query, projection) {
        this.fromArray([this.name].concat(await io.fromMongoDB(url, database, collection, query, projection)));
        return this;
    }

    /**
     * Convert the DataSet to JSON format
     */
    toJSON() {
        return JSON.parse(io.toJSON(this.fields, this.data, {}));
    }

    /**
     * Convert the DataSet to CSV format
     * @param {object} options - options for the file (header, delimiter and quote)
     */
    toCSV(options) {
        return io.toCSV(this.fields, this.data, options);
    }

    /**
     * Convert the DataSet to HTML format
     */
    toHTML() {
        return io.toHTML(this.fields, this.data);
    }

    /**
     * Convert the DataSet to XML format
     */
    toXML() {
        return io.toXML(this.fields, this.data);
    }

    /**
     * Write the DataSet to a file
     * @param {string} filePath - the path to the output file
     * @param {string} type - the type of file/format of the data (json or csv)
     * @param {object} options - options for the file (csv: header, delimiter and quote; json: pretty and space)
     */
    async toFile(filePath, type, options) {
        await io.toFile(this, filePath, type, options);
    }
}

exports.DataSet = DataSet;
