# node-dataset

## Table of contents
- [Background](#background)
- [Introduction](#introduction)
- [Constructor](#constructor)
- [Basic methods](#basic-methods)
- [Data manipulation methods](#data-manipulation-methods)
- [Input and output methods](#input-and-output-methods)

## Background
This is a node module for working with data sets. Its design is largely inspired by work with SQL databases, and a desire to be able to manipulate data using similar features and functions; including the ability to join multiple sets of data. It also aims to provide a way to pull data of multiple types from multiple sources and work with all of that data together in one simple, unified manner.

## Introduction
Logically, a DataSet is analogous to a table in a database, or a data file (e.g., a CSV or Excel file), with a name, a set of fields, and data. You can create a new DataSet by supplying these three elements:

```js
const ds = require("node-dataset");

var d = new ds.DataSet(
  "test",
  "fips, county, state",
  [
    [45001, "Abbeville", "South Carolina"],
    [22001, "Acadia", "Louisiana"],
    [51001, "Accomack", "Virginia"],
    [16001, "Ada", "Idaho"]
  ]
);
```
When creating a new DataSet you can choose to supply all three elements, some of them, or nome of them.

You can also create a DataSet from a file (CSV, JSON) or a database (MySQL, MongoDB):
```js
const education = await new ds.DataSet("education").fromFile("./data/education.csv", "csv");

const population = await new ds.DataSet("population").fromFile("./data/population.json", "json");

const age = await new ds.DataSet("age").fromMySQL(
  {host: "localhost", user: "foo", password: "bar", database: "datasets"},
  "select convert(fips, double) as fips, age_group, total, male, female from age")
);

const fips = await new ds.DataSet("fips").fromMongoDB(
  "mongodb://localhost:27017", "test", "fips", {}, {"_id": 0}
 );
```
These examples also demonstrate a few important things:
* Almost all methods return a DataSet allowing for "chainable" statements.
* File and database retrieval is asynchronous and the related methods return a Promise.

Also, with the exception of some basic `set` methods, DataSets are immutable: calling their data manipulation methods will return a new DataSet rather than changing their underlying data.

Once a DataSet has been created, there are many ways that it can be manipulated.

For example, using the base DataSets created above, you could select just the data for a specified set of fields from one DataSet into a new DataSet, and rename the fields using the "as" keyword:
```js
const college = education.select("fips as fips_code, college_or_higher as percent_college");
```

Or you could filter the data into a new DataSet:
```js
const some_states = fips.filter("state = 'Maryland' or state like 'Cali%' or state in ('New York','Texas')");
```

Using chained methods, you could also perform the select and filter methods in sequence:
```js
const some_other_states = fips
  .select("fips as fips_code, state, county")
  .filter("state in ('Illinois','Kentucky','Colorado')")
 );
 ```
 
A DataSet can also be joined with other DataSets to create new a DataSet:
 ```js
 const fips_education_ = fips
  .join("education", "inner", "fips", "fips")
  .join("population", "inner", "fips", "fips.fips");
 ```
 
This example demonstrates another important thing: when DataSets are joined, the fields in the resulting DataSet are named by combining the name of the underlying DataSets and their fields ("fips.fips" in the example above). This ensures that there aren't any problems if the same field name is used in multiple DataSets.

Aggregations can also be performed on a DataSet:
```js
const ten_most_educated = fips
  .join("education", "inner", "fips", "fips")
  .aggregate("fips.state, count(fips.state), avg(education.college_or_higher), std(education.college_or_higher)", "fips.state")
  .sort("avg(education.college_or_higher) desc")
  .slice(0, 10)
);
```

## Constructor
The DataSet constructor creates a new instace of a DataSet.

Parameters:
* `name` (string) - the name of the DataSet
* `fields` (string|array) - a comma-separated list, or array, of fields in the DataSet (if a string is supplied, it will be split using `/\s*,\s*/`) 
* `data` (array) - the data in the DataSet

Example:
```js
const dataset = new ds.DataSet(); // name will be null, fields will be [], data will be []

const dataset = new ds.DataSet("test", "field1, field2", [[1, "a"], [2, "b"]]);

const dataset = new ds.DataSet("test", ["field1", "field2"], [[1, "a"], [2, "b"]]);
```

## Basic methods

### getName
The `getName` method returns a string containing the name of the current DataSet.

Example:
```js
const name = dataset.getName();
```

### setName
The `setName` method sets the name of the current DataSet.

Parameters:
* `name` (string) - the new name of the DataSet

Example:
```js
dataset.setName("new_name");
```

### getFields
The `getFields` method returns an array containing the fields of the current DataSet.

Example:
```js
const fields = dataset.getFields();
```

### setFields
The `setFields` method sets the fields of the current DataSet.

Parameters:
* `fields` (string|array) - a comma-separated list, or array, of fields in the DataSet

Example:
```js
dataset.setFields("field1, field2");

dataset.setFields(["field1", "field2"]);
```

### getData
The `getData` method returns an array of arrays containing the data of the current DataSet.

Example:
```js
const data = dataset.getData();
```

### setData
The `setData` method sets the data of the current DataSet.

Example:
```js
dataset.setData([[1, "a"], [2, "b"]]);
```

### count
The `count` method returns the number of records in the current DataSet

Example:
```js
const count = dataset.count();
```

## Data manipulation methods

### select
The `select` method returns a new DataSet containing the data for a set of fields from the orginal DataSet.

Parameters:
* `fieldList` (string) - a comma-separated list of fields to select, which can be renamed using the "as" keyword.

Example:
```js
const new_dataset = dataset.select("field1 as one, field2 as two, field3 as three");
```

### join
The `join` method returns a new DataSet created by joining the current DataSet with another DataSet.

Parameters:
* `dataset` (DataSet) - the DataSet to join with the current DataSet with
* `type` (string) - the type of join to perform; options are "inner", "left", "right" and "cross".
* `fieldList1` (string) - a comma-separated list of fields from the current DataSet to use to for the join
* `fieldList2` (string) - a comma-separated list of fields from the joined to DataSet to use for the join

Example:
```js
const new_dataset = dataset.join(d2, "left", "d1_field1, d1_field2", "d2_field1, d2_field2");
```

### filter | where
The `filter` method returns a new DataSet created by filter the current DataSet for a subset of data.

Parameters:
* `filterStatement` (string) - a statement describing the filter to be applied
* `useEval` (boolean) - whether to use the `new Function()` constructor (similar to eval) to evaluate the `filterStatement`

Example:
```js
const new_dataset = dataset.filter("field1 > 100 and field2 like '%something%' and field3 is not null");
```
Supported comparison operators and functions include: `=`, `<`, `>`, `<=`, `>=`, `!=`, `<>`, `(not) in` (e.g. `in (1, 2, 3)` or `not in ('a', 'b, 'c')`), `(not) like` (e.g., `like 'cali%'` or `not like '%york'`), `(not) between` (e.g., `between 0 and 10` or `not between 1000 and 2000`), `is (not) null` (e.g., `field1 is null` or `field2 is not null`).

A note about `useEval`: All filter conditions, when matched against data, are ultimately reduced to a boolean statement; for example `(true || (false && true))`. At this point, if `useEval` is `true`, the boolean statment will be evaluated using the `new Function()` constructor, which is safer than using `eval` directly. However, if this is concerning, when `useEval` is set to `false` the "boolean-parser" module will be used to evaluate the statement. In testing, setting `useEval` to true regularly cuts execution time in half.

For those who prefer SQL-style naming, the `where` method is a direct replacement for `filter`:
```js
const new_dataset = dataset.where("field1 > 100 and field2 like '%something%' and field3 is not null");
```

### sort | orderby
The `sort` method returns a new DataSet with the data sorted.

Parameters:
* `sortStatement` (string) - a statement describing how to sort the DataSet

Example:
```js
const new_dataset = dataset.sort("field1 desc, field 2");
```
If no sort order ("asc" or "desc") is supplied, the default is "asc".

For those who prefer SQL-style naming, the `orderby` method is a direct replacement for `sort`:
```js
const new_dataset = dataset.orderby("field1 desc, field 2");
```

### aggregate
The `aggregate` method returns a new DataSet with aggregate functions performed on fields in the current DataSet.

Parameters:
* `aggregationList` (string) - a comma-separated list of aggregate functions to perform on fields
* `groupList` (string) - a comma-separated list of fields to group by

Example:
```js
const new_dataset = dataset.aggregate("field1, field2, min(field3), max(field4)", "field1, field2");
```
Supported aggregate functions include: `count`, `min` (minimum), `max` (maximum), `sum`, `avg` (average), `var` (variance), `std` (standard deviation).

### slice | limit
The `slice` method returns a new DataSet from a slice of the data in the current DataSet (using zero-based array indexing)

Parameters:
* `begin` - the array index indicating where the slice should begin
* `end` - the array index indicating where the slice should end (not included in the results)

Example:
```js
const new_dataset = dataset.slice(100, 125);
```
For those who prefer SQL-style naming, the `limit` method is a replacement for `slice` for which `begin` is always `0`:
```js
const new_dataset = dataset.limit(25);
```

## Input and output methods

### fromFile
The `fromFile` method populates a new DataSet using data in a file.

Parameters:
* `filePath` (string) - the path to the file containing the data from which to construct the DataSet
* `type` (string) - the type of file/format of the data ("json" or "csv")

Example:
```js
const dataset = await new ds.DataSet().fromFile("./data/test.json", "json");
```

Note: the `name` of the new DataSet will be set to the name of the data file without its extension.

### fromMySQL
The `fromMySQL` method populates a new DataSet using MySQL query results.

Paramters:
* `options` (object) - the options for the MySQL connection
* `query` (string) - the query to retrieve the data for the DataSet

Example:
```js
const dataset = await new ds.DataSet("test").fromMySQL({host: "localhost", user: "foo", password: "bar", database: "test"}, "select * from table")
```

Note: Unless set earlier, as in the example above, the `name` of a new DataSet created using the `fromMySQL` method will be `null`. The `fields` of the new DataSet will be set to the fields returned by the query.

### fromMongoDB
The `fromMongoDB` method populates a new DataSet using MongoDB query results.

Parameters:
* `url` (string) - the url of the database
* `database` (string) - the name of the database
* `collection` (string) - the name of the collection
* `query` (object) - the query to execute to retrieve results
* `projection` (object) - the projection to execute on the results

Example:
```js
const dataset = await new ds.DataSet("test").fromMongoDB("mongodb://localhost:27017", "test", "test", {}, {"_id": 0});
```

Note: Unless set earlier, as in the example above, the `name` of a new DataSet created using the `fromMongoDB` method will be `null`.

### fromArray
The `fromArray` method populates a new DataSet from an array.

Parameters:
* `array` (array) - an array containing the name, fields and data for the DataSet

Example:
```js
const dataset = new ds.DataSet().fromArray(["test", "field1, field2", [[1, "a"], [2, "b"]]);
```

Note: this method is used exstensively internally to create new DataSets, but may not be of significant use in an application.

### fromJSON
The `fromJSON` method populates a new DataSet from an array of JSON objects.

Parameters:
* `json` (object) - an array of JSON objects where the keys are the fields and the values are the data

Example:
```js
const dataset = new ds.DataSet("test").fromJSON([{field1: 1, field2: "a"}, {field1: 2, field2: "b"}]);
```

Note: Unless set earlier, as in the example above, the `name` of a new DataSet created using the `fromJSON` method will be `null`.

### toFile
The `toFile` method writes the current DataSet to a file.

Parameters:
* `filePath` (string) - the path to the output file
* `type` (string) - the type of file/format of the data ("json" or "csv")
* `options` (object) - options for the file; for JSON `{pretty: (boolean), space: (integer)}` to make JSON pretty (e.g., `{pretty: true, space: 2}`), or for a CSV file `{delimiter: (string), quote: (string)}` (e.g., `{delimiter: "\t", quote: "'"}`).

Example:
```js
dataset.toFile("./data/test.json", "json", {pretty: false});
```
### toJSON

The `toJSON` method converts the current DataSet to JSON format

Example:
```js
const json = dataset.toJSON();
```
