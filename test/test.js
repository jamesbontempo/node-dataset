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
    describe("name", function() {
        it("get", function() {
            const d = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
            expect(d.getName()).to.equal("test");
        });
        it("set", function() {
            const d = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
            d.setName("test")
            expect(d.name).to.equal("test");
        });
    });
    describe("fields", function() {
        it("get", function() {
            const d = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
            expect(d.getFields()).to.eql(["id", "code", "name"]);
        });
        it("set (string)", function() {
            const d = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
            d.setFields("new_id, new_code, new_name");
            expect(d.fields).to.eql(["new_id", "new_code", "new_name"]);
        });
        it("set (array)", function() {
            const d = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
            d.setFields(["new_id", "new_code", "new_name"]);
            expect(d.fields).to.eql(["new_id", "new_code", "new_name"]);
        });
    });
    describe("data", function() {
        it("get", function() {
            const d = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
            expect(d.getData()).to.eql([[1, "a", "Product A"], [2, "b", "Product B"]]);
        });
        it("set", function() {
            const d = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
            d.setData([[3, "c", "Product C"], [4, "d", "Product D"]]);
            expect(d.data).to.eql([[3, "c", "Product C"], [4, "d", "Product D"]]);
        });
    });
    it("count", function() {
        const d = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
        expect(d.count()).to.equal(2);
    });
});

describe("Data manipulation methods", function() {
    it("select", function() {
        const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
        const b = a.select("id, code as new_code");
        expect(b.name).to.equal("test");
        expect(b.fields).to.eql(["id", "new_code"]);
        expect(b.data).to.eql([[1, "a"], [2, "b"]])
    });
    describe("join", function() {
        it("inner", function() {
            const a = new ds.DataSet("a", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
            const b = new ds.DataSet("b", ["id", "code", "name"], [[1, "c", "Product C"], [2, "d", "Product D"]]);
            const c = a.join(b, "inner", "id", "id");
            expect(c.name).to.equal(null);
            expect(c.fields).to.eql(["a.id", "a.code", "a.name", "b.id", "b.code", "b.name"]);
            expect(c.data).to.eql([[1, "a", "Product A", 1, "c", "Product C"],[2, "b", "Product B", 2, "d", "Product D"]]);
        });
        it("left (a, b)", function() {
            const a = new ds.DataSet("a", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "x", "Product X"]]);
            const b = new ds.DataSet("b", ["id", "code", "name"], [[1, "c", "Product C"], [2, "d", "Product D"]]);
            const c = a.join(b, "left", "id", "id");
            expect(c.name).to.equal(null);
            expect(c.fields).to.eql(["a.id", "a.code", "a.name", "b.id", "b.code", "b.name"]);
            expect(c.data).to.eql([[1, "a", "Product A", 1, "c", "Product C"],[2, "b", "Product B", 2, "d", "Product D"], [3, "x", "Product X", null, null, null]]);
        });
        it("right (b, a)", function() {
            const a = new ds.DataSet("a", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "x", "Product X"]]);
            const b = new ds.DataSet("b", ["id", "code", "name"], [[1, "c", "Product C"], [2, "d", "Product D"]]);
            const c = b.join(a, "right", "id", "id");
            expect(c.name).to.equal(null);
            expect(c.fields).to.eql(["a.id", "a.code", "a.name", "b.id", "b.code", "b.name"]);
            expect(c.data).to.eql([[1, "a", "Product A", 1, "c", "Product C"],[2, "b", "Product B", 2, "d", "Product D"], [3, "x", "Product X", null, null, null]]);
        });
        it("cross", function() {
            const a = new ds.DataSet("a", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
            const b = new ds.DataSet("b", ["id", "code", "name"], [[1, "c", "Product C"], [2, "d", "Product D"]]);
            const c = a.join(b, "cross");
            expect(c.name).to.equal(null);
            expect(c.fields).to.eql(["a.id", "a.code", "a.name", "b.id", "b.code", "b.name"]);
            expect(c.data).to.eql([[1, "a", "Product A", 1, "c", "Product C"], [1, "a", "Product A", 2, "d", "Product D"], [2, "b", "Product B", 1, "c", "Product C"], [2, "b", "Product B", 2, "d", "Product D"]]);
        });
    });
    describe("filter", function() {
        describe("=", function() {
            it("number", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
                const b = a.filter("id = 1");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[1, "a", "Product A"]])
            });
            it("string", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
                const b = a.filter("code = 'a'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[1, "a", "Product A"]])
            });
            it("date", function() {
                const a = new ds.DataSet("test", ["id", "code", "date"], [[1, "a", "2020-01-01"], [2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
                const b = a.filter("date = '2020-04-01'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "date"]);
                expect(b.data).to.eql([[3, "c", "2020-04-01"]]);
            });
        });
        describe(">", function() {
            it("number", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
                const b = a.filter("id > 1");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[2, "b", "Product B"]])
            });
            it("date", function() {
                const a = new ds.DataSet("test", ["id", "code", "date"], [[1, "a", "2020-01-01"], [2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
                const b = a.filter("date > '2020-01-01'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "date"]);
                expect(b.data).to.eql([[3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
            });
        });
        describe("<", function() {
            it("number", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
                const b = a.filter("id < 2");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[1, "a", "Product A"]])
            });
            it("date", function() {
                const a = new ds.DataSet("test", ["id", "code", "date"], [[1, "a", "2020-01-01"], [2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
                const b = a.filter("date < '2020-01-01'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "date"]);
                expect(b.data).to.eql([[2, "b", "2019-12-31"]]);
            });
        });
        describe(">=", function() {
            it("number", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
                const b = a.filter("id >= 2");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[2, "b", "Product B"], [3, "c", "Product C"]])
            });
            it("date", function() {
                const a = new ds.DataSet("test", ["id", "code", "date"], [[1, "a", "2020-01-01"], [2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
                const b = a.filter("date >= '2020-01-01'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "date"]);
                expect(b.data).to.eql([[1, "a", "2020-01-01"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
            });
        });
        describe("<=", function() {
            it("number", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
                const b = a.filter("id <= 2");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[1, "a", "Product A"], [2, "b", "Product B"]])
            });
            it("date", function() {
                const a = new ds.DataSet("test", ["id", "code", "date"], [[1, "a", "2020-01-01"], [2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
                const b = a.filter("date <= '2020-01-01'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "date"]);
                expect(b.data).to.eql([[1, "a", "2020-01-01"], [2, "b", "2019-12-31"]]);
            });
        });
        describe("!=", function() {
            it("number", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
                const b = a.filter("id != 2");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[1, "a", "Product A"], [3, "c", "Product C"]])
            });
            it("string", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
                const b = a.filter("code != 'b'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[1, "a", "Product A"], [3, "c", "Product C"]])
            });
            it("date", function() {
                const a = new ds.DataSet("test", ["id", "code", "date"], [[1, "a", "2020-01-01"], [2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
                const b = a.filter("date != '2020-01-01'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "date"]);
                expect(b.data).to.eql([[2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
            });
        });
        describe("<>", function() {
            it("number", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
                const b = a.filter("id <> 2");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[1, "a", "Product A"], [3, "c", "Product C"]])
            });
            it("string", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
                const b = a.filter("code <> 'b'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[1, "a", "Product A"], [3, "c", "Product C"]])
            });
            it("date", function() {
                const a = new ds.DataSet("test", ["id", "code", "date"], [[1, "a", "2020-01-01"], [2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
                const b = a.filter("date <> '2020-01-01'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "date"]);
                expect(b.data).to.eql([[2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
            });
        });
        describe("in", function() {
            it("number", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
                const b = a.filter("id in (1, 3)");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[1, "a", "Product A"], [3, "c", "Product C"]])
            });
            it("string", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
                const b = a.filter("code in ('a', 'c')");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[1, "a", "Product A"], [3, "c", "Product C"]])
            });
            it("date", function() {
                const a = new ds.DataSet("test", ["id", "code", "date"], [[1, "a", "2020-01-01"], [2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
                const b = a.filter("date in ('2019-12-31', '2020-04-01', '2020-02-01')");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "date"]);
                expect(b.data).to.eql([[2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
            });
        });
        describe("not in", function() {
            it("number", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
                const b = a.filter("id not in (1, 3)");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[2, "b", "Product B"]]);
            });
            it("string", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
                const b = a.filter("code not in ('a', 'c')");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[2, "b", "Product B"]]);
            });
            it("date", function() {
                const a = new ds.DataSet("test", ["id", "code", "date"], [[1, "a", "2020-01-01"], [2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
                const b = a.filter("date not in ('2020-01-01')");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "date"]);
                expect(b.data).to.eql([[2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
            });
        });
        describe("like", function() {
            it("string", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
                const b = a.filter("code like '%A'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[1, "a", "Product A"]]);
            });
        });
        describe("not like", function() {
            it("string", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"]]);
                const b = a.filter("code not like '%A'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[2, "b", "Product B"], [3, "c", "Product C"]]);
            });
        });
        describe("between", function() {
            it("number", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"], [4, "d", "Product D"]]);
                const b = a.filter("id between 2 and 4");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[2, "b", "Product B"], [3, "c", "Product C"], [4, "d", "Product D"]]);
            });
            it("date", function() {
                const a = new ds.DataSet("test", ["id", "code", "date"], [[1, "a", "2020-01-01"], [2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
                const b = a.filter("date between '2020-01-01' and '2020-03-01'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "date"]);
                expect(b.data).to.eql([[1, "a", "2020-01-01"], [4, "d", "2020-02-01"]]);
            });
        });
        describe("not between", function() {
            it("number", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", "Product C"], [4, "d", "Product D"]]);
                const b = a.filter("id not between 2 and 3");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[1, "a", "Product A"], [4, "d", "Product D"]]);
            });
            it("date", function() {
                const a = new ds.DataSet("test", ["id", "code", "date"], [[1, "a", "2020-01-01"], [2, "b", "2019-12-31"], [3, "c", "2020-04-01"], [4, "d", "2020-02-01"]]);
                const b = a.filter("date not between '2020-01-01' and '2020-03-01'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "date"]);
                expect(b.data).to.eql([[2, "b", "2019-12-31"], [3, "c", "2020-04-01"]]);
            });
        });
        describe("null", function() {
            it("is", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", null], [4, "d", "Product D"]]);
                const b = a.filter("name is null");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[3, "c", null]]);
            });
            it("is not", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", null], [4, "d", "Product D"]]);
                const b = a.filter("name is not null");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[1, "a", "Product A"], [2, "b", "Product B"], [4, "d", "Product D"]]);
            });
        });
        describe("boolean", function() {
            it("and", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", null], [4, "d", "Product D"]]);
                const b = a.filter("name is not null and id between 2 and 4");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[2, "b", "Product B"], [4, "d", "Product D"]]);
            });
            it("or", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", null], [4, "d", "Product D"]]);
                const b = a.filter("id > 3 or name like '%B'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[2, "b", "Product B"], [4, "d", "Product D"]]);
            });
            it("and/or", function() {
                const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", null], [4, "d", "Product D"]]);
                const b = a.filter("(id > 3 or name like '%B') and code = 'd'");
                expect(b.name).to.equal("test");
                expect(b.fields).to.eql(["id", "code", "name"]);
                expect(b.data).to.eql([[4, "d", "Product D"]]);
            });
        });
        it("where", function() {
            const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"]]);
            const b = a.where("id = 1");
            expect(b.name).to.equal("test");
            expect(b.fields).to.eql(["id", "code", "name"]);
            expect(b.data).to.eql([[1, "a", "Product A"]])
        });
    });
    describe("sort", function() {
        it("asc", function () {
            const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [3, "c", null], [4, "d", "Product D"], [2, "b", "Product B"]]);
            const b = a.sort("id asc");
            expect(b.name).to.equal("test");
            expect(b.fields).to.eql(["id", "code", "name"]);
            expect(b.data).to.eql([[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", null], [4, "d", "Product D"]]);
        });
        it("desc", function() {
            const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [3, "c", null], [4, "d", "Product D"], [2, "b", "Product B"]]);
            const b = a.sort("id desc");
            expect(b.name).to.equal("test");
            expect(b.fields).to.eql(["id", "code", "name"]);
            expect(b.data).to.eql([[4, "d", "Product D"], [3, "c", null], [2, "b", "Product B"], [1, "a", "Product A"]]);
        });
        it("asc/desc", function() {
            const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [3, "c", null], [1, "d", "Product D"], [2, "b", "Product B"]]);
            const b = a.sort("id asc, name desc");
            expect(b.name).to.equal("test");
            expect(b.fields).to.eql(["id", "code", "name"]);
            expect(b.data).to.eql([[1, "d", "Product D"], [1, "a", "Product A"], [2, "b", "Product B"], [3, "c", null]]);
        });
        it("orderby", function() {
            const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [3, "c", null], [4, "d", "Product D"], [2, "b", "Product B"]]);
            const b = a.orderby("id asc");
            expect(b.name).to.equal("test");
            expect(b.fields).to.eql(["id", "code", "name"]);
            expect(b.data).to.eql([[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", null], [4, "d", "Product D"]]);
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
    });
    describe("slice", function() {
        it("slice", function() {
            const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", null], [4, "d", "Product D"]]);
            const b = a.slice(1, 3);
            expect(b.name).to.equal("test");
            expect(b.fields).to.eql(["id", "code", "name"]);
            expect(b.data).to.eql([[2, "b", "Product B"], [3, "c", null]]);
        });
        it("limit", function() {
            const a = new ds.DataSet("test", ["id", "code", "name"], [[1, "a", "Product A"], [2, "b", "Product B"], [3, "c", null], [4, "d", "Product D"]]);
            const b = a.limit(2);
            expect(b.name).to.equal("test");
            expect(b.fields).to.eql(["id", "code", "name"]);
            expect(b.data).to.eql([[1, "a", "Product A"], [2, "b", "Product B"]]);
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
                d.toFile("out.json", "json");
                const e = await new ds.DataSet().fromFile("out.json", "json");
                expect(e.name).to.equal("out");
                expect(e.fields).to.eql(["id", "code", "name"]);
                expect(e.data).to.eql([[1, "a", "Product A"], [2, "b", "Product B"]]);
            });
        });
    });
});
