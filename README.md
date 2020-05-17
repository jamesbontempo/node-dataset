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
`select`
`join`
`filter` | `where`
`sort` | `orderby`
`aggregate`
`slice` | `limit`

## Input/Output methods
`fromFile`
`fromMySQL`
`fromMongoDB`
`fromArray`
`fromJSON`
