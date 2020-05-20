const expect = require("chai").expect;
const ds = require("../index.js");
const fs = require("fs");

describe("Constructor", function() {

    it("empty", function() {
        const d = new ds.DataSet();
        expect(d.name).to.equal(null);
        expect(d.fields).to.eql([]);
        expect(d.data).to.eql([]);
    });

    it("name", function() {
        const d = new ds.DataSet("test");
        expect(d.name).to.equal("test");
        expect(d.fields).to.eql([]);
        expect(d.data).to.eql([]);
    });

    describe("name and fields", function() {

        it("fields string", function() {
            const d = new ds.DataSet("test", "id, code, name");
            expect(d.name).to.equal("test");
            expect(d.fields).to.eql(["id", "code", "name"]);
            expect(d.data).to.eql([]);
        });

        it("fields array", function() {
            const d = new ds.DataSet("test", ["id", "code", "name"]);
            expect(d.name).to.equal("test");
            expect(d.fields).to.eql(["id", "code", "name"]);
            expect(d.data).to.eql([]);
        });

    });

    describe("name, fields, and data", function() {

        it("fields string", function() {
            const d = new ds.DataSet("test", "id, code, name", [[1, "a", "Product A"], [2, "b", "Product B"]]);
            expect(d.name).to.equal("test");
            expect(d.fields).to.eql(["id", "code", "name"]);
            expect(d.data).to.eql([[1, "a", "Product A"], [2, "b", "Product B"]]);
        });

        it("fields array", function() {
            const d = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
            expect(d.name).to.equal("test");
            expect(d.fields).to.eql(["id", "code", "name"]);
            expect(d.data).to.eql([[1, "a", "Product A"], [2, "b", "Product B"]]);
        });

    });

});

describe("Get/Set methods and count", function() {

    const d = new ds.DataSet(
        "test",
        ["id", "code", "name"],
        [
            [1, "a", "Product A"],
            [2, "b", "Product B"]
        ]
    );

    describe("name", function() {

        it("get", function() {
            expect(d.getName()).to.equal("test");
        });

        it("set", function() {
            d.setName("test")
            expect(d.name).to.equal("test");
        });
        
    });

    describe("fields", function() {

        it("get", function() {
            expect(d.getFields()).to.eql(["id", "code", "name"]);
        });

        it("set (string)", function() {
            d.setFields("new_id, new_code, new_name");
            expect(d.fields).to.eql(["new_id", "new_code", "new_name"]);
        });

        it("set (array)", function() {
            d.setFields(["newer_id", "newer_code", "newer_name"]);
            expect(d.fields).to.eql(["newer_id", "newer_code", "newer_name"]);
        });

    });

    describe("data", function() {

        it("get", function() {
            expect(d.getData()).to.eql([[1, "a", "Product A"], [2, "b", "Product B"]]);
        });

        it("set", function() {
            d.setData([[3, "c", "Product C"], [4, "d", "Product D"]]);
            expect(d.data).to.eql([[3, "c", "Product C"], [4, "d", "Product D"]]);
        });

    });

    it("count", function() {
        expect(d.count()).to.equal(2);
    });

});

describe("Data manipulation methods", function() {

    const a = new ds.DataSet(
        "a",
        "id, code, name, date",
        [
            [1, "a", "Product A", "2019-12-01"],
            [2, "b", "Product B", "2020-01-01"],
            [3, "c", "Product C", "2020-04-01"],
            [4, "d", "Product D", "2020-03-01"]
        ]
    );

    const b = new ds.DataSet(
        "b",
        "id, code, name, date",
        [
            [1, "e", "Product E", "2019-11-01"],
            [2, "f", "Product F", "2020-02-01"],
            [3, "g", "Product G", "2020-05-01"]
        ]
    );

    const c = new ds.DataSet(
        "c",
        "id, code, name, date",
        [
            [1, "h", "Product H", "2019-10-01"],
            [2, "x", null, "2019-09-01"]
        ]
    );

    it("select", function() {
        const d = a.select("id, code as new_code");
        expect(d.name).to.equal("a");
        expect(d.fields).to.eql(["id", "new_code"]);
        expect(d.data).to.eql([[1, "a"], [2, "b"], [3, "c"], [4, "d"]]);
    });

    describe("join", function() {

        it("inner (a, b, c)", function() {
            const d = a.join(b, "inner", "id", "id").join(c, "inner", "a.id", "id");
            expect(d.name).to.equal(null);
            expect(d.fields).to.eql(["a.id", "a.code", "a.name", "a.date", "b.id", "b.code", "b.name", "b.date", "c.id", "c.code", "c.name", "c.date"]);
            expect(d.data).to.eql(
                [
                    [1, "a", "Product A", "2019-12-01", 1, "e", "Product E", "2019-11-01", 1, "h", "Product H", "2019-10-01"],
                    [2, "b", "Product B", "2020-01-01", 2, "f", "Product F", "2020-02-01", 2, "x", null, "2019-09-01"]
                ]
            );
        });

        it("left (a, b)", function() {
            const d = a.join(b, "left", "id", "id");
            expect(d.name).to.equal(null);
            expect(d.fields).to.eql(["a.id", "a.code", "a.name", "a.date", "b.id", "b.code", "b.name", "b.date"]);
            expect(d.data).to.eql(
                [
                    [1, "a", "Product A", "2019-12-01", 1, "e", "Product E", "2019-11-01"],
                    [2, "b", "Product B", "2020-01-01", 2, "f", "Product F", "2020-02-01"],
                    [3, "c", "Product C", "2020-04-01", 3, "g", "Product G", "2020-05-01"],
                    [4, "d", "Product D", "2020-03-01", null, null, null, null]
                ]
            );
        });

        it("right (b, a)", function() {
            const d = b.join(a, "right", "id", "id");
            expect(d.name).to.equal(null);
            expect(d.fields).to.eql(["a.id", "a.code", "a.name", "a.date", "b.id", "b.code", "b.name", "b.date"]);
            expect(d.data).to.eql(
                [
                    [1, "a", "Product A", "2019-12-01", 1, "e", "Product E", "2019-11-01"],
                    [2, "b", "Product B", "2020-01-01", 2, "f", "Product F", "2020-02-01"],
                    [3, "c", "Product C", "2020-04-01", 3, "g", "Product G", "2020-05-01"],
                    [4, "d", "Product D", "2020-03-01", null, null, null, null]
                ]
            );
        });

        it("cross", function() {
            const d = a.join(b, "cross");
            expect(d.name).to.equal(null);
            expect(d.fields).to.eql(["a.id", "a.code", "a.name", "a.date", "b.id", "b.code", "b.name", "b.date"]);
            expect(d.data).to.eql(
                [
                    [1, "a", "Product A", "2019-12-01", 1, "e", "Product E", "2019-11-01"],
                    [1, "a", "Product A", "2019-12-01", 2, "f", "Product F", "2020-02-01"],
                    [1, "a", "Product A", "2019-12-01", 3, "g", "Product G", "2020-05-01"],
                    [2, "b", "Product B", "2020-01-01", 1, "e", "Product E", "2019-11-01"],
                    [2, "b", "Product B", "2020-01-01", 2, "f", "Product F", "2020-02-01"],
                    [2, "b", "Product B", "2020-01-01", 3, "g", "Product G", "2020-05-01"],
                    [3, "c", "Product C", "2020-04-01", 1, "e", "Product E", "2019-11-01"],
                    [3, "c", "Product C", "2020-04-01", 2, "f", "Product F", "2020-02-01"],
                    [3, "c", "Product C", "2020-04-01", 3, "g", "Product G", "2020-05-01"],
                    [4, "d", "Product D", "2020-03-01", 1, "e", "Product E", "2019-11-01"],
                    [4, "d", "Product D", "2020-03-01", 2, "f", "Product F", "2020-02-01"],
                    [4, "d", "Product D", "2020-03-01", 3, "g", "Product G", "2020-05-01"]
                ]
            );
        });

    });

    describe("filter", function() {

        describe("=", function() {

            it("number", function() {
                const d = a.filter("id = 1");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql([[1, "a", "Product A", "2019-12-01"]])
            });

            it("string", function() {
                const d = a.filter("code = 'a'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql([[1, "a", "Product A", "2019-12-01"]])
            });

            it("date", function() {
                const d = a.filter("date = '2020-04-01'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql([[3, "c", "Product C", "2020-04-01"]]);
            });

        });

        describe(">", function() {

            it("number", function() {
                const d = a.filter("id > 1");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [2, "b", "Product B", "2020-01-01"],
                        [3, "c", "Product C", "2020-04-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

            it("date", function() {
                const d = a.filter("date > '2020-01-01'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [3, "c", "Product C", "2020-04-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });
        });

        describe("<", function() {

            it("number", function() {
                const d = a.filter("id < 2");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql([[1, "a", "Product A", "2019-12-01"]])
            });

            it("date", function() {
                const d = a.filter("date < '2020-01-01'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql([[1, "a", "Product A", "2019-12-01"]]);
            });

        });

        describe(">=", function() {

            it("number", function() {
                const d = a.filter("id >= 2");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [2, "b", "Product B", "2020-01-01"],
                        [3, "c", "Product C", "2020-04-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

            it("date", function() {
                const d = a.filter("date >= '2020-01-01'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [2, "b", "Product B", "2020-01-01"],
                        [3, "c", "Product C", "2020-04-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

        });

        describe("<=", function() {

            it("number", function() {
                const d = a.filter("id <= 2");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [1, "a", "Product A", "2019-12-01"],
                        [2, "b", "Product B", "2020-01-01"]
                    ]
                );
            });

            it("date", function() {
                const d = a.filter("date <= '2020-01-01'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [1, "a", "Product A", "2019-12-01"],
                        [2, "b", "Product B", "2020-01-01"]
                    ]
                );
            });

        });

        describe("!=", function() {

            it("number", function() {
                const d = a.filter("id != 2");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [1, "a", "Product A", "2019-12-01"],
                        [3, "c", "Product C", "2020-04-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

            it("string", function() {
                const d = a.filter("code != 'b'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [1, "a", "Product A", "2019-12-01"],
                        [3, "c", "Product C", "2020-04-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

            it("date", function() {
                const d = a.filter("date != '2020-01-01'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [1, "a", "Product A", "2019-12-01"],
                        [3, "c", "Product C", "2020-04-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

        });

        describe("<>", function() {

            it("number", function() {
                const d = a.filter("id <> 2");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [1, "a", "Product A", "2019-12-01"],
                        [3, "c", "Product C", "2020-04-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

            it("string", function() {
                const d = a.filter("code <> 'b'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [1, "a", "Product A", "2019-12-01"],
                        [3, "c", "Product C", "2020-04-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

            it("date", function() {
                const d = a.filter("date <> '2020-01-01'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [1, "a", "Product A", "2019-12-01"],
                        [3, "c", "Product C", "2020-04-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

        });

        describe("in", function() {

            it("number", function() {
                const d = a.filter("id in (1, 3)");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [1, "a", "Product A", "2019-12-01"],
                        [3, "c", "Product C", "2020-04-01"]
                    ]
                );
            });

            it("string", function() {
                const d = a.filter("code in ('a', 'c')");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [1, "a", "Product A", "2019-12-01"],
                        [3, "c", "Product C", "2020-04-01"]
                    ]
                );
            });

            it("date", function() {
                const d = a.filter("date in ('2019-12-01', '2020-04-01')");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [1, "a", "Product A", "2019-12-01"],
                        [3, "c", "Product C", "2020-04-01"]
                    ]
                );
            });

        });

        describe("not in", function() {

            it("number", function() {
                const d = a.filter("id not in (1, 3)");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [2, "b", "Product B", "2020-01-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

            it("string", function() {
                const d = a.filter("code not in ('a', 'c')");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [2, "b", "Product B", "2020-01-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

            it("date", function() {
                const d = a.filter("date not in ('2019-12-01','2020-04-01')");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [2, "b", "Product B", "2020-01-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

        });

        describe("like", function() {

            it("string", function() {
                const d = a.filter("code like '%B'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [2, "b", "Product B", "2020-01-01"]
                    ]
                );
            });

        });

        describe("not like", function() {

            it("string", function() {
                const d = a.filter("code not like '%A'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [2, "b", "Product B", "2020-01-01"],
                        [3, "c", "Product C", "2020-04-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

        });

        describe("between", function() {

            it("number", function() {
                const d = a.filter("id between 2 and 4");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [2, "b", "Product B", "2020-01-01"],
                        [3, "c", "Product C", "2020-04-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

            it("date", function() {
                const d = a.filter("date between '2020-01-01' and '2020-03-01'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [2, "b", "Product B", "2020-01-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

        });

        describe("not between", function() {

            it("number", function() {
                const d = a.filter("id not between 2 and 3");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [1, "a", "Product A", "2019-12-01"],
                        [4, "d", "Product D", "2020-03-01"]
                    ]
                );
            });

            it("date", function() {
                const d = a.filter("date not between '2020-01-01' and '2020-03-01'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [1, "a", "Product A", "2019-12-01"],
                        [3, "c", "Product C", "2020-04-01"]
                    ]
                );
            });

        });

        describe("null", function() {

            it("is", function() {
                const d = c.filter("name is null");
                expect(d.name).to.equal("c");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql([[2, "x", null, "2019-09-01"]]);
            });

            it("is not", function() {
                const d = c.filter("name is not null");
                expect(d.name).to.equal("c");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql([[1, "h", "Product H", "2019-10-01"]]);
            });

        });

        describe("boolean", function() {

            it("and", function() {
                const d = a.filter("name like '%B' and id between 2 and 4");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql([[2, "b", "Product B", "2020-01-01"]]);
            });

            it("or", function() {
                const d = a.filter("date > '2020-03-01' or name = 'Product B'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql(
                    [
                        [2, "b", "Product B", "2020-01-01"],
                        [3, "c", "Product C", "2020-04-01"]
                    ]
                );
            });

            it("and/or", function() {
                const d = a.filter("(id >= 3 or name like '%b') and date between '2019-12-01' and '2020-02-01'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql([[2, "b", "Product B", "2020-01-01"]]);
            });

            it("and/or (0 results)", function() {
                const d = a.filter("(id >= 3 or name like '%b') and date < '2020-01-01'");
                expect(d.name).to.equal("a");
                expect(d.fields).to.eql(["id", "code", "name", "date"]);
                expect(d.data).to.eql([]);
            });

        });

        it("where", function() {
            const d = a.where("id = 1");
            expect(d.name).to.equal("a");
            expect(d.fields).to.eql(["id", "code", "name", "date"]);
            expect(d.data).to.eql([[1, "a", "Product A", "2019-12-01"]])
        });

    });

    describe("sort", function() {

        it("asc", function () {
            const d = a.sort("date asc");
            expect(d.name).to.equal("a");
            expect(d.fields).to.eql(["id", "code", "name", "date"]);
            expect(d.data).to.eql(
                [
                    [1, "a", "Product A", "2019-12-01"],
                    [2, "b", "Product B", "2020-01-01"],
                    [4, "d", "Product D", "2020-03-01"],
                    [3, "c", "Product C", "2020-04-01"]
                ]
            );
        });

        it("desc", function() {
            const d = a.sort("id desc");
            expect(d.name).to.equal("a");
            expect(d.fields).to.eql(["id", "code", "name", "date"]);
            expect(d.data).to.eql(
                [
                    [4, "d", "Product D", "2020-03-01"],
                    [3, "c", "Product C", "2020-04-01"],
                    [2, "b", "Product B", "2020-01-01"],
                    [1, "a", "Product A", "2019-12-01"]
                ]
            );
        });

        it("asc/desc", function() {
            const d = a.join(b, "cross").sort("b.name desc, a.date");
            expect(d.name).to.equal(null);
            expect(d.fields).to.eql(["a.id", "a.code", "a.name", "a.date", "b.id", "b.code", "b.name", "b.date"]);
            expect(d.data).to.eql(
                [
                    [1, "a", "Product A", "2019-12-01", 3, "g", "Product G", "2020-05-01"],
                    [2, "b", "Product B", "2020-01-01", 3, "g", "Product G", "2020-05-01"],
                    [4, "d", "Product D", "2020-03-01", 3, "g", "Product G", "2020-05-01"],
                    [3, "c", "Product C", "2020-04-01", 3, "g", "Product G", "2020-05-01"],
                    [1, "a", "Product A", "2019-12-01", 2, "f", "Product F", "2020-02-01"],
                    [2, "b", "Product B", "2020-01-01", 2, "f", "Product F", "2020-02-01"],
                    [4, "d", "Product D", "2020-03-01", 2, "f", "Product F", "2020-02-01"],
                    [3, "c", "Product C", "2020-04-01", 2, "f", "Product F", "2020-02-01"],
                    [1, "a", "Product A", "2019-12-01", 1, "e", "Product E", "2019-11-01"],
                    [2, "b", "Product B", "2020-01-01", 1, "e", "Product E", "2019-11-01"],
                    [4, "d", "Product D", "2020-03-01", 1, "e", "Product E", "2019-11-01"],
                    [3, "c", "Product C", "2020-04-01", 1, "e", "Product E", "2019-11-01"]
                ]
            );
        });

        it("orderby", function() {
            const d = a.orderby("date asc");
            expect(d.name).to.equal("a");
            expect(d.fields).to.eql(["id", "code", "name", "date"]);
            expect(d.data).to.eql(
                [
                    [1, "a", "Product A", "2019-12-01"],
                    [2, "b", "Product B", "2020-01-01"],
                    [4, "d", "Product D", "2020-03-01"],
                    [3, "c", "Product C", "2020-04-01"]
                ]
            );
        });

    });

    describe("aggregate", function () {

        const a = new ds.DataSet("aggregate", "id, number", [[1, 1], [1, 2], [1, 3], [2,2], [2, 4], [2, 6], [2, 8]]);

        it("count", function() {
            const b = a.aggregate("id, count(id)", "id");
            expect(b.name).to.equal("aggregate");
            expect(b.fields).to.eql(["id", "count(id)"]);
            expect(b.data).to.eql([[1, 3], [2, 4]]);
        })

        it("min", function() {
            const b = a.aggregate("id, min(number)", "id");
            expect(b.name).to.equal("aggregate");
            expect(b.fields).to.eql(["id", "min(number)"]);
            expect(b.data).to.eql([[1, 1], [2, 2]]);
        })

        it("max", function() {
            const b = a.aggregate("id, max(number)", "id");
            expect(b.name).to.equal("aggregate");
            expect(b.fields).to.eql(["id", "max(number)"]);
            expect(b.data).to.eql([[1, 3], [2, 8]]);
        })

        it("avg", function() {
            const b = a.aggregate("id, avg(number)", "id");
            expect(b.name).to.equal("aggregate");
            expect(b.fields).to.eql(["id", "avg(number)"]);
            expect(b.data).to.eql([[1, 2], [2, 5]]);
        })

        it("var", function() {
            const b = a.aggregate("id, var(number)", "id");
            expect(b.name).to.equal("aggregate");
            expect(b.fields).to.eql(["id", "var(number)"]);
            expect(b.data).to.eql([[1, 2/3], [2, 20/4]]);
        })

        it("std", function() {
            const b = a.aggregate("id, std(number)", "id");
            expect(b.name).to.equal("aggregate");
            expect(b.fields).to.eql(["id", "std(number)"]);
            expect(b.data).to.eql([[1, Math.sqrt(2/3)], [2, Math.sqrt(20/4)]]);
        })

        it("multiple (count, std)", function() {
            const b = a.aggregate("id, count(id), std(number)", "id");
            expect(b.name).to.equal("aggregate");
            expect(b.fields).to.eql(["id", "count(id)", "std(number)"]);
            expect(b.data).to.eql([[1, 3, Math.sqrt(2/3)], [2, 4, Math.sqrt(20/4)]]);
        })

    });

    describe("slice", function() {

        it("slice", function() {

            const d = a.slice(1, 3);
            expect(d.name).to.equal("a");
            expect(d.fields).to.eql(["id", "code", "name", "date"]);
            expect(d.data).to.eql(
                [
                    [2, "b", "Product B", "2020-01-01"],
                    [3, "c", "Product C", "2020-04-01"]
                ]
            );
        });

        it("limit", function() {
            const d = a.limit(2);
            expect(d.name).to.equal("a");
            expect(d.fields).to.eql(["id", "code", "name", "date"]);
            expect(d.data).to.eql(
                [
                    [1, "a", "Product A", "2019-12-01"],
                    [2, "b", "Product B", "2020-01-01"]
                ]
            );
        });

    });

});

describe("Input/Output functions", function() {

    describe("from", function() {

        it("array", function () {
            const d = new ds.DataSet().fromArray(["test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]]);
            expect(d.name).to.equal("test");
            expect(d.fields).to.eql(["id", "code", "name"]);
            expect(d.data).to.eql([[1, "a", "Product A"], [2, "b", "Product B"]]);
        });

        it("fromJSON", function () {
            const d = new ds.DataSet().fromJSON([{id: 1, code: "a", name: "Product A"}, {id: 2, code: "b", name: "Product B"}]);
            expect(d.name).to.equal(null);
            expect(d.fields).to.eql(["id", "code", "name"]);
            expect(d.data).to.eql([[1, "a", "Product A"], [2, "b", "Product B"]]);
        });

        describe("file", function() {

            it("CSV", async function() {
                const d = await new ds.DataSet().fromFile("test.csv", "csv");
                expect(d.name).to.equal("test");
                expect(d.fields).to.eql(["id", "code", "name"]);
                expect(d.data).to.eql([[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
            });

            it("JSON", async function() {
                const d = await new ds.DataSet().fromFile("test.json", "json");
                expect(d.name).to.equal("test");
                expect(d.fields).to.eql(["id", "code", "name"]);
                expect(d.data).to.eql([[1, "a", "Product A"], [2, "b", "Product B"]]);
            });

        });

        describe("database", function() {

            it("MySQL", async function() {
                const d = await new ds.DataSet().fromMySQL({host: "localhost", user: "foo", password: "bar", database: "test"}, "select * from test");
                expect(d.name).to.equal(null);
                expect(d.fields).to.eql(["id", "code", "name"]);
                expect(d.data.sort((a, b) => { if (a[0] < b[0]) return -1; if (a[0] > b[0]) return 1; return 0; })).to.eql([[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
            });

            it("MongoDB", async function() {
                const d = await new ds.DataSet().fromMongoDB("mongodb://localhost:27017", "test", "test", {}, {"_id": 0});
                expect(d.name).to.equal(null);
                expect(d.fields).to.eql(["id", "code", "name"]);
                expect(d.data.sort((a, b) => { if (a[0] < b[0]) return -1; if (a[0] > b[0]) return 1; return 0; })).to.eql([[1, "a", "Product A"], [2, "b", "Product B"]]);
            });

        });

    });

    describe("to", function() {

        it("JSON", function () {
            const d = new ds.DataSet().fromArray(["test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]]);
            expect(d.toJSON()).to.eql([{id: 1, code: "a", name: "Product A"}, {id: 2, code: "b", name: "Product B"}]);
        });

        describe("file", function() {

            it("CSV", async function () {
                const d = new ds.DataSet("test", "id, code, name", [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
                await d.toFile("out.csv", "csv");
                const e = await new ds.DataSet().fromFile("out.csv", "csv");
                expect(e.name).to.equal("out");
                expect(e.fields).to.eql(["id", "code", "name"]);
                expect(e.data).to.eql([[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);

            });

            it("JSON", async function () {
                const d = new ds.DataSet("test", "id, code, name", [[1, "a", "Product A"], [2, "b", "Product B"]]);
                await d.toFile("out.json", "json");
                const e = await new ds.DataSet().fromFile("out.json", "json");
                expect(e.name).to.equal("out");
                expect(e.fields).to.eql(["id", "code", "name"]);
                expect(e.data).to.eql([[1, "a", "Product A"], [2, "b", "Product B"]]);
            });

        });

    });

});
