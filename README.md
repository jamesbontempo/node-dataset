# node-dataset

`node-dataset` is a Node.js module for working with data sets created in code, loaded from files, or retrieved from a database. Its design is largely inspired by work with SQL databases, and its development was motivated by a desire to be able to manipulate data within a JavaScript application using similar features and functions, including the ability to join multiple sets of data together. It aims to provide an easy way to retrieve data of multiple types from multiple sources, and work with all of that data in a unified manner.

## Table of contents
- [Introduction](#introduction)
- [Constructor](#constructor)
- [Basic methods](#basic-methods)
  - [getName](#getname)
  - [setName](#setname)
  - [getFields](#getfields)
  - [setFields](#setfields)
  - [getData](#getdata)
  - [setData](#setdata)
  - [count](#count)
- [Data manipulation methods](#data-manipulation-methods)
  - [select](#select)
  - [join](#join)
  - [filter | where](#filter--where)
  - [sort | orderby](#sort--orderby)
  - [aggregate](#aggregate)
  - [slice | limit](#slice--limit)
- [Input/Output methods](#inputoutput-methods)
  - [fromFile](#fromfile)
  - [fromMySQL](#frommysql)
  - [fromMongoDB](#frommongodb)
  - [fromJSON](#fromjson)
  - [fromCSV](#fromcsv)
  - [fromArray](#fromarray)
  - [toFile](#tofile)
  - [toJSON](#tojson)
  - [toCSV](#tocsv)
- [SQL examples](#sql-examples)
- [A note about (multiple) joins](#a-note-about-multiple-joins)

## Introduction
Logically, a `DataSet` is analogous to a table in a database or a data file (e.g., a CSV file). A `DataSet` has a name, a set of fields, and data. You can create a new `DataSet` by supplying these three elements:

```js
const ds = require("node-dataset");

const dataset = new ds.DataSet(
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

`console.log(dataset)` will produce the following:

```js
DataSet {
  name: 'test',
  fields: [ 'fips', 'county', 'state' ],
  data: [
    [ 45001, 'Abbeville', 'South Carolina' ],
    [ 22001, 'Acadia', 'Louisiana' ],
    [ 51001, 'Accomack', 'Virginia' ],
    [ 16001, 'Ada', 'Idaho' ]
  ]
}
```

You can also create a `DataSet` from a file (CSV, JSON) or a database (MySQL, MongoDB):
```js
const education = await new ds.DataSet().fromFile("./data/education.csv", "csv");

const population = await new ds.DataSet().fromFile("./data/population.json", "json");

const age = await new ds.DataSet("age").fromMySQL(
  {host: "localhost", user: "foo", password: "bar", database: "datasets"},
  "select convert(fips, double) as fips, age_group, total, male, female from age")
);

const fips = await new ds.DataSet("fips").fromMongoDB(
  "mongodb://localhost:27017", "test", "fips", {}, {"_id": 0}
 );
```
These examples also demonstrate a few important things:
* Many methods return a `DataSet` allowing for "chainable" statements.
* File and database retrieval is asynchronous.

Once a `DataSet` has been created, there are many ways that it can be manipulated.

Note: A `DataSet` is largely immutable and calling its data manipulation methods will return a new `DataSet` rather than change its underlying data.

For example, using a `DataSet` from the examples above, you could select just the data for a specified set of fields from one `DataSet` into a new `DataSet`, and rename the fields using the "as" keyword:

```js
const college = education.select("fips as fips_code, college_or_higher as percent_college");
```

Or you could filter the data from one `DataSet` into a new `DataSet`:

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

A `DataSet` can also be joined with another `DataSet` to create new a `DataSet`:

 ```js
 const fips_education_ = fips
  .join("education", "inner", "fips", "fips")
  .join("population", "inner", "fips", "fips.fips");
 ```

This example demonstrates another important thing: when a `DataSet` is joined with another `DataSet`, the fields in the resulting `DataSet` are named by combining the name of each underlying `DataSet` and its fields (that's why the second join refers to `fips.fips` in the example above). This ensures that there aren't any problems if the same field name is used in more than one `DataSet`.

Aggregations can also be performed on a `DataSet`:

```js
const ten_most_educated = fips
  .join("education", "inner", "fips", "fips")
  .aggregate("fips.state, count(fips.state), avg(education.college_or_higher), std(education.college_or_higher)", "fips.state")
  .sort("avg(education.college_or_higher) desc")
  .slice(0, 10)
);
```

## Constructor
The `DataSet` constructor creates a new instance of a `DataSet`.

Parameters:

Name|Type|Description
----|----|-----------
`name`|string|the name of the DataSet
`fields`|string \| array| a comma-separated list, or array, of fields in the DataSet (if a string is supplied, it will be split using `/\s*,\s*/`)
`data`|array|an array of arrays containing the data in the DataSet (each subarray is essentially a record)

Example:
```js
const dataset = new ds.DataSet(); // name will be null, fields will be [], and data will be []

const dataset = new ds.DataSet("test", "field1, field2", [[1, "a"], [2, "b"]]);

const dataset = new ds.DataSet("test", ["field1", "field2"], [[1, "a"], [2, "b"]]);
```

## Basic methods

### getName
The `getName` method returns a string containing the name of the current `DataSet`.

Example:
```js
const name = dataset.getName();
```

### setName
The `setName` method sets the name of the current `DataSet` and returns the `DataSet`.

Parameters:

Name|Type|Description
----|----|-----------
`name`|string|the name

Example:
```js
dataset.setName("new_name");
```

### getFields
The `getFields` method returns an array containing the fields of the current `DataSet`.

Example:
```js
const fields = dataset.getFields();
```

### setFields
The `setFields` method sets the fields of the current `DataSet` and returns the `DataSet`.

Parameters:

Name|Type|Description
----|----|-----------
`fields`|string \| array|a comma-separated list, or array, of fields

Example:
```js
dataset.setFields("field1, field2");

dataset.setFields(["field1", "field2"]);
```

### getData
The `getData` method returns an array of arrays containing the data of the current `DataSet`.

Example:
```js
const data = dataset.getData();
```

### setData
The `setData` method sets the data of the current `DataSet` and returns the `DataSet`.

Parameters:

Name|Type|Description
----|----|-----------
`data`|array|an array of arrays of the data

Example:
```js
dataset.setData([[1, "a"], [2, "b"]]);
```

### count
The `count` method returns the number of records in the current `DataSet`.

Example:
```js
const count = dataset.count();
```

## Data manipulation methods

### select
The `select` method returns a new `DataSet` containing the data for a subset of fields from the original `DataSet`.

Parameters:

Name|Type|Description
----|----|-----------
`fieldList`|string|a comma-separated list of fields to select, which can be renamed using the "as" keyword

Example:
```js
const new_dataset = dataset.select("field1, field2, field3 as three");
```

Note: There is no equivalent to the SQL `select *` statement. If you wanted to create a new `DataSet` with all the same data as another `DataSet` you could do something like this:

```js
const new_dataset = new ds.DataSet("clone", dataset.getFields(), dataset.getData());
```

### join
The `join` method returns a new `DataSet` created by joining the current `DataSet` with another `DataSet`.

Parameters:

Name|Type|Description
----|----|-----------
`dataset`|DataSet|the `DataSet` to join with the current `DataSet` with
`type`|string|the type of join to perform: "inner", "left", "right" or "cross".
`fieldList1`|string|a comma-separated list of fields from the current `DataSet` to use for the join
`fieldList2`|string|a comma-separated list of fields from the joined to `DataSet` to use for the join

Example:
```js
const new_dataset = dataset.join(d2, "left", "d1_field1, d1_field2", "d2_field1, d2_field2");
```

### filter | where
The `filter` method returns a new `DataSet` created by filtering the current `DataSet` for a subset of data.

Parameters:

Name|Type|Description
----|----|-----------
`filterStatement`|string|a statement describing the filter to be applied
`useEval`|boolean|whether to use the `new Function()` constructor (similar to eval) to evaluate the `filterStatement`

Example:
```js
const new_dataset = dataset.filter("field1 > 100 and field2 like '%something%' and field3 is not null", true);
```
Supported comparison operators and functions include: `=`, `<`, `>`, `<=`, `>=`, `!=`, `<>`, `(not) in` (e.g. `id in (1, 2, 3)` or `code not in ('a', 'b, 'c')`), `(not) like` (e.g., `state like 'cali%'` or `state not like '*york'`), `(not) between` (e.g., `id between 0 and 10` or `number not between 1000 and 2000`), `is (not) null` (e.g., `field1 is null` or `field2 is not null`).

A note about `useEval`: All filter conditions, when matched against data, are ultimately reduced to a boolean statement; for example `(true || (false && true))`. At this point, if `useEval` is `true`, the boolean statment will be evaluated using the `new Function()` constructor, which is actually safer than using `eval` directly. However, if this is concerning, when `useEval` is set to `false` the "boolean-parser" module will be used to evaluate the statement. In testing, setting `useEval` to true regularly cuts the execution time in half.

For those who prefer SQL-style naming, the `where` method is a direct replacement for `filter`:
```js
const new_dataset = dataset.where("field1 > 100 and field2 like '%something%' and field3 is not null");
```

### sort | orderby
The `sort` method returns a new `DataSet` with the data sorted.

Parameters:

Name|Type|Description
----|----|-----------
`sortStatement`|string|a statement describing how to sort the `DataSet`

Example:
```js
const new_dataset = dataset.sort("field1 desc, field 2");
```
If no sort order&mdash;`asc` for ascending, `desc` for descending&mdash;is supplied, the default is `asc`.

For those who prefer SQL-style naming, the `orderby` method is a direct replacement for `sort`:
```js
const new_dataset = dataset.orderby("field1 desc, field 2");
```

### aggregate
The `aggregate` method returns a new `DataSet` with aggregate functions performed on fields in the current `DataSet`.

Parameters:

Name|Type|Description
----|----|-----------
`aggregationList`|string|a comma-separated list of aggregate functions to perform on fields, which can be aliased using the "as" keyword
`groupList`|string|a comma-separated list of fields to group by

Example:
```js
const new_dataset = dataset.aggregate("field1, field2, min(field3) as min, max(field4)", "field1, field2");
```
Supported aggregate functions include: `count`, `min` (minimum), `max` (maximum), `sum`, `avg` (average), `var` (variance), and `std` (standard deviation).

### slice | limit
The `slice` method returns a new `DataSet` using a slice of the data in the current `DataSet` (using zero-based array indexing).

Parameters:

Name|Type|Description
----|----|-----------
`begin`|number|the array index indicating where the slice should begin
`end`|number|the array index indicating up to where the slice should extend (the item at this index is not actually included in the results)

Example:
```js
const new_dataset = dataset.slice(100, 125);
```
For those who prefer SQL-style naming, the `limit` method is a replacement for `slice` for which `begin` is always `0`:
```js
const new_dataset = dataset.limit(25);
```

## Input/Output methods

### fromFile
The asnynchronous `fromFile` method returns a `Promise` to populate the current `DataSet` using data from a file and returns the current `DataSet` when it's fulfilled.

Parameters:

Name|Type|Description
----|----|-----------
`filePath`|string|the path to the file containing the data
`type`|string|the type of file/format of the data ("json" or "csv")
`options`|object|for CSV files, whether the first line contains the fields as a header, and the quote and delimiter characters (default is `{ header:true, quote: "\"", delimiter: "," }`)

Example:
```js
const dataset = await new ds.DataSet().fromFile("./data/test.json", "json");

new ds.DataSet().fromFile("./data/test.json", "json").then( ...do something with the DataSet... );
```

Note: the `name` of the new `DataSet` will be set to the name of the data file without its extension.

### fromMySQL
The asynchronous `fromMySQL` method returns a `Promise` to populate the current `DataSet` using the results from a MySQL query and returns the current `DataSet` when it's fulfilled.

Paramters:

Name|Type|Description
----|----|-----------
`options`|object|the options for the MySQL connection
`query`|string|the query to retrieve the data

Example:
```js
const dataset = await new ds.DataSet("test")
  .fromMySQL({host: "localhost", user: "foo", password: "bar", database: "test"}, "select * from table")

new ds.DataSet("test")
  .fromMySQL({host: "localhost", user: "foo", password: "bar", database: "test"}, "select * from table")
  .then( ...do something with the DataSet... );
```

Note: Unless set earlier, as in the example above, the `name` of a new `DataSet` created using the `fromMySQL` method will be `null`. The `fields` of the new DataSet will be set to the fields returned by the query.

### fromMongoDB
The `fromMongoDB` method returns a `Promise` to populate the current `DataSet` using the results from a MongoDB query and returns the current `DataSet` when it's fulfilled.

Parameters:

Name|Type|Description
----|----|-----------
`url`|string|the url of the database
`database`|string|the name of the database
`collection`|string|the name of the collection
`query`|object|the query to execute to retrieve results
`projection`|object|the projection to execute on the results

Example:
```js
const dataset = await new ds.DataSet("test")
  .fromMongoDB("mongodb://localhost:27017", "test", "test", {}, {"_id": 0});

new ds.DataSet("test")
  .fromMongoDB("mongodb://localhost:27017", "test", "test", {}, {"_id": 0})
   .then( ...do something with the DataSet... );
```

Note: Unless set earlier, as in the example above, the `name` of a new `DataSet` created using the `fromMongoDB` method will be `null`.

### fromJSON
The `fromJSON` method populates the current `DataSet` from an array of JSON objects.

Parameters:

Name|Type|Description
----|----|-----------
`json`|array|an array of JSON objects where the keys are the fields and the values are the data

Example:
```js
const dataset = new ds.DataSet("test").fromJSON([{field1: 1, field2: "a"}, {field1: 2, field2: "b"}]);
```

Note: Unless set earlier, as in the example above, the `name` of a new `DataSet` created using the `fromJSON` method will be `null`.

### fromCSV
The `fromCSV` method populates the current `DataSet` from a CSV-formatted string.

Parameters:

Name|Type|Description
----|----|-----------
`csv`|string|a CSV-formatted string where the first line contains the fields and the rest are the data
`options`|object|whether the first line contains the fields as a header, and the quote and delimiter characters (default is `{ header: true, quote: "\"", delimiter: "," }`)

Example:
```js
const dataset = new ds.DataSet("test").fromCSV("field1,field2\n1,'a'\n2,'b'", { quote: "'" });
```

Note: Unless set earlier, as in the example above, the `name` of a new `DataSet` created using the `fromCSV` method will be `null`.

### fromArray
The `fromArray` method populates the current `DataSet` from an array.

Parameters:

Name|Type|Description
----|----|-----------
`array`|array|an array containing the name, fields and data for the DataSet

Example:
```js
const dataset = new ds.DataSet().fromArray(["test", "field1, field2", [[1, "a"], [2, "b"]]);
```

Note: this method is used extensively internally when creating a new `DataSet`, but may not be of significant use in an application.

### toFile
The `toFile` method writes the current `DataSet` to a file.

Parameters:

Name|Type|Description
----|----|-----------
`filePath`|string|the path to the output file
`type`|string|the type of file/format of the data ("json" or "csv")
`options`|object|options for the file (default for JSON `{ pretty: true, space: 2 }`, for CSV `{ header: true, delimiter: ",", quote: "\"" }`

Example:
```js
dataset.toFile("./data/test.json", "json", { pretty: true, space: 2 });

dataset.toFile("./data/test.csv", "csv", { delimiter: "\t", quote: "'" });
```

### toJSON

The `toJSON` method converts the current `DataSet` to an array of JSON objects where the `fields` are the keys and the `data` are the values.

Example:
```js
const json = dataset.toJSON();
```

### toCSV

The `toCSV` method converts the current `DataSet` to a CSV-style, multi-line string where the first line contains the `fields` and the remaining lines comprise the `data`.

Name|Type|Description
----|----|-----------
`options`|object|whether to print the fields as a header, and the quote and delimiter characters (default is `{ header: true, quote: "\"", delimiter: "," }`)

Example:
```js
const csv = dataset.toCSV({ header: false, delimiter: "\t" });
```
### toHTML

The `toHTML` method converts the current `DataSet` to an HTML table where the `fields` are the headers and the `data` are the rows.

Example:
```js
const json = dataset.toHTML();
```

### toXML

The `toXML` method converts the current `DataSet` to an XML document.

Example:
```js
const json = dataset.toXML();
```

## SQL examples
For those used to working with SQL, it might be helpful to see some examples of how to map SQL queries to a series of `DataSet` calls.

Let's suppose you had this query:
```sql
select employee.id, employee.name, employee.department_id, department.id, department.name as department_name
from employee
    inner join department on department.id = employee.department_id
```

Assuming you have a `DataSet` named "employee" and another named "department," you could do this:

```js
const joined_dataset = employee
    .join(department, "inner", "department_id", "id")
    .select("employee.id, employee.name, employee.department_id, department.id, department.name as department_name");
```

You'll notice that I've placed the `select` call after the `join`. I have to do this because the "employee" `DataSet` has to be joined to the "department" `DataSet` before I can select fields from across both of them. This will likely become a pattern as you use `node-dataset`&mdash;the last thing you specify is a `select`, whereas in SQL it's the first thing.

Similarly, `aggregate` will often be a final operation. Let's look at another SQL example, this time one using "group by," and see how it would be achieved with `node-dataset`.

```sql
select department.department_name, count(employee.id), avg(employee.age)
from department
    inner join employee on employee.department_id = department.id
group by department.department_name
```

```js
const aggregate_dataset = department
    .join(employee, "inner", "id", "department_id")
    .aggregate("department.department_name, count(employee.id), avg(employee.age)", "department.department_name");
```

## A note about (multiple) joins

As noted earlier, the names of the `fields` in a `DataSet` returned by a `join` always include their base `DataSet` `name` to ensure uniqueness, in case the joined `DataSet` objects have `fields` with the same name. However, the resulting `DataSet` from the join has its own name set to `null`. The simple explanation for this is that it's not clear what to name the new `DataSet` given that it is created from two distinct objects. The upside to setting the name to `null` is that `fields` will not be renamed, over and over, when multiple joins are "chained" together.

Imagine we have three `DataSet` objects, each with the `fields` "id" and "name". We could join all of them like this:

```js
const triple_join = a
    .join(b, "inner", "id", "id")
    .join(c, "inner", "a.id", "id");
```

I have to specify "a.id" in the second `join` because the first `join` will rename the field in the `DataSet` passed to the second `join`. But in the end, the `triple_join` `DataSet` would have the `fields` "a.id", "a.name", "b.id", "b.name", "c.id", and "c.name." In particular, it's important to point out that the additional join with `c` would not prepend the `a` and `b` `fields` with anything because the `DataSet` from the first `join` that is passed to the second `join` has its name set to `null`. The end result of all of this is that successive joins in a chain will not do anything too funny with any `fields` other then prepend them with their respective `DataSet` `name` along the way.

Of course, that wouldn't keep me from doing something like this:

```js
const triple_join = a
    .join(b, "inner", "id", "id")
    .select(a.id as id, a.name, b.id, b.name)
    .join(c, "inner", "id", "id");
```

By putting the `select` in between the first and second `join` and using the `as` keyword, I've renamed "a.id" as simply "id" so that I can refer to it as such in the next `join`. I'm not sure that makes anything easier to understand, but when performing a long `join` chain, renaming `fields` along the way, and maybe even using `select` to "whittle down" the `DataSet`, might make sense.