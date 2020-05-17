# node-dataset

## Background
This is a node module for working with data sets. It's design is largely inspired by work with SQL databases, and a desire to be able to manipulate data using some of the same features and functions; including the ability to join multiple sets of data. It also aims to provide a way to pull data from multiple types of sources and work with all of that data together in one simple, unified manner.

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
## Data manipulation methods
The `select` method returns a new DataSet containing the data for a set of fields from the orginal DataSet.

Parameters:
* `fieldList` (string) - a comma-separated list of fields to select, which can be renamed using the "as" keyword.

Example:
```js
const new_d = d.select("field1 as one, field2 as two, field3 as three");
```
The `join` method returns a new DataSet created by joining the current DataSet with another DataSet.

Parameters:
* `dataset` (DataSet) - the DataSet to join with the current DataSet with
* `type` (string) - the type of join to perform; options are "inner", "left", "right" and "cross".
* `fieldList1` (string) - a comma-separated list of fields from the current DataSet to use to for the join
* `fieldList2` (string) - a comma-separated list of fields from the joined to DataSet to use for the join

Example:
```js
const new_d = d1.join(d2, "left", "d1_field1, d1_field2", "d2_field1, d2_field2");
```
The `filter` method returns a new DataSet created by filter the current DataSet for a subset of data.

Parameters:
* `filterStatement` (string) - a statement describing the filter to be applied
* `useEval` (boolean) - whether to use the `new Function()` constructor (similar to eval) to evaluate the `filterStatement`

Example:
```js
const new_d = d.filter("field1 > 100 and field2 like '%something%' and field3 is not null");
```
Supported comparison operators and functions include: `=`, `<`, `>`, `<=`, `>=`, `!=`, `<>`, `(not) in` (e.g. `in (1, 2, 3)` or `not in ('a', 'b, 'c')`), `(not) like` (e.g., `like 'cali%'` or `not like '%york'`), `(not) between` (e.g., `between 0 and 10` or `not between 1000 and 2000`), `is (not) null` (e.g., `field1 is null` or `field2 is not null`).

A note about `useEval`: All filter conditions, when matched against data, are ultimately reduced to a boolean statement; for example `(true || (false && true))`. At this point, if `useEval` is `true`, the boolean statment will be evaluated using the `new Function()` constructor, which is safer than using `eval` directly. However, if this is concerning, when `useEval` is set to `false` the "boolean-parser" module will be used to evaluate the statement. In testing, setting `useEval` to true regularly cuts execution time in half.

For those who prefer SQL-style naming, the `where` method is a direct replacement for `filter`:
```js
const new_d = d.where("field1 > 100 and field2 like '%something%' and field3 is not null");
```

The `sort` method returns a new DataSet with the data sorted.

Parameters:
* `sortStatement` (string) - a statement describing how to sort the DataSet

Example:
```js
const new_d = d.sort("field1 desc, field 2");
```
If no sort order ("asc" or "desc") is supplied, the default is "asc".

For those who prefer SQL-style naming, the `orderby` method is a direct replacement for `sort`:
```js
const new_d = d.where("field1 > 100 and field2 like '%something%' and field3 is not null");
```

The `aggregate` method returns a new DataSet with aggregate functions performed on fields in the current DataSet.

Parameters:
* `aggregationList` (string) - a comma-separated list of aggregate functions to perform on fields
* `groupList` (string) - a comma-separated list of fields to group by

Example:
```js
const new_d = d.aggregate("field1, field2, min(field3), max(field4)", "field1, field2");
```
Supported aggregate functions include: `count`, `min` (minimum), `max` (maximum), `sum`, `avg` (average), `var` (variance), `std` (standard deviation).

The `slice` method returns a new DataSet from a slice of the data in the current DataSet (using zero-based array indexing)

Parameters:
* `begin` - the array index indicating where the slice should begin
* `end` - the array index indicating where the slice should end (not included in the results)

Example:
```js
const new_d = d.slice(100, 125);
```
For those who prefer SQL-style naming, the `limit` method is a replacement for `slice` for which `begin` is always `0`:
```js
const new_d = d.limit(25);
```

## Input/Output methods
