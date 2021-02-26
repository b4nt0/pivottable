/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const fixtureData = [
    ["name",    "gender",   "colour",    "birthday",     "trials",   "successes"],
    ["Nick",    "male",     "blue",      "1982-11-07",   103,        12],
    ["Jane",    "female",   "red",       "1982-11-08",   95,         25],
    ["John",    "male",     "blue",      "1982-12-08",   112,        30],
    ["Carol",   "female",   "yellow",    "1983-12-08",   102,        14]
];

const raggedFixtureData = [
    {name: "Nick", "colour": "red", "age": 34},
    {name: "Jane", "gender": "female"},
    {name: "John", "gender": "male", "age": 12},
    {name: "Jim", "gender": null, "age": 12}
];

describe("$.pivotUI()", function() {
    describe("with no rows/cols, default count aggregator, default TableRenderer",  function() {
        let table = null;

        beforeEach(done => table = $("<div>").pivotUI(fixtureData, {onRefresh: done}));
        it("has all the basic UI elements", function(done) {
            expect(table.find("td.pvtAxisContainer").length)
            .toBe(3);
            expect(table.find("td.pvtRendererArea").length)
            .toBe(1);
            expect(table.find("td.pvtVals").length)
            .toBe(1);
            expect(table.find("select.pvtRenderer").length)
            .toBe(1);
            expect(table.find("select.pvtAggregator").length)
            .toBe(1);
            expect(table.find("span.pvtAttr").length)
            .toBe(6);
            return done();
        });

        it("reflects its inputs", function(done) {
            expect(table.find("td.pvtUnused span.pvtAttr").length)
            .toBe(6);
            expect(table.find("select.pvtRenderer").val())
            .toBe("Table");
            expect(table.find("select.pvtAggregator").val())
            .toBe("Count");
            return done();
        });

        it("renders a table", function(done) {
            expect(table.find("table.pvtTable").length)
            .toBe(1);
            return done();
        });


        return describe("its renderer output", function() {
            it("has the correct type and number of cells", function(done) {
                expect(table.find("th.pvtTotalLabel").length)
                .toBe(1);
                expect(table.find("td.pvtGrandTotal").length)
                .toBe(1);
                return done();
            });

            it("has the correct textual representation", function(done) {
                expect(table.find("table.pvtTable").text())
                .toBe(["Totals", "4"].join(""));
                return done();
            });

            return it("has a correct grand total with data value", function(done) {
                expect(table.find("td.pvtGrandTotal").text())
                .toBe("4");
                expect(table.find("td.pvtGrandTotal").data("value"))
                .toBe(4);
                return done();
            });
        });
    });

    describe("with rows/cols, sum-over-sum aggregator, Heatmap renderer",  function() {
        let table = null;

        beforeEach(done => table = $("<div>").pivotUI(fixtureData, {
            rows: ["gender"], cols: ["colour"],
            aggregatorName: "Sum over Sum",
            vals: ["successes", "trials"],
            rendererName: "Heatmap",
            onRefresh: done
        }
        ));

        it("has all the basic UI elements", function(done) {
            expect(table.find("td.pvtAxisContainer").length)
            .toBe(3);
            expect(table.find("td.pvtRendererArea").length)
            .toBe(1);
            expect(table.find("td.pvtVals").length)
            .toBe(1);
            expect(table.find("select.pvtRenderer").length)
            .toBe(1);
            expect(table.find("select.pvtAggregator").length)
            .toBe(1);
            expect(table.find("span.pvtAttr").length)
            .toBe(6);
            return done();
        });

        it("reflects its inputs", function(done) {
            expect(table.find("td.pvtUnused span.pvtAttr").length)
            .toBe(4);
            expect(table.find("td.pvtRows span.pvtAttr").length)
            .toBe(1);
            expect(table.find("td.pvtCols span.pvtAttr").length)
            .toBe(1);
            expect(table.find("select.pvtRenderer").val())
            .toBe("Heatmap");
            expect(table.find("select.pvtAggregator").val())
            .toBe("Sum over Sum");
            return done();
        });

        it("renders a table", function(done) {
            expect(table.find("table.pvtTable").length)
            .toBe(1);
            return done();
        });

        return describe("its renderer output", function() {
            it("has the correct type and number of cells", function(done) {
                expect(table.find("th.pvtAxisLabel").length)
                .toBe(2);
                expect(table.find("th.pvtRowLabel").length)
                .toBe(2);
                expect(table.find("th.pvtColLabel").length)
                .toBe(3);
                expect(table.find("th.pvtTotalLabel").length)
                .toBe(2);
                expect(table.find("td.pvtVal").length)
                .toBe(6);
                expect(table.find("td.pvtTotal").length)
                .toBe(5);
                expect(table.find("td.pvtGrandTotal").length)
                .toBe(1);
                return done();
            });

            it("has the correct textual representation", function(done) {
                expect(table.find("table.pvtTable").text())
                .toBe([
                    "colour",   "blue", "red",  "yellow",   "Totals",
                    "gender",
                    "female",           "0.26", "0.14",     "0.20",
                    "male",     "0.20",                     "0.20",
                    "Totals",   "0.20", "0.26", "0.14",     "0.20"
                    ].join("")
                );
                return done();
            });

            return it("has a correct spot-checked cell with data value", function(done) {
                expect(table.find("td.col0.row1").text())
                .toBe("0.20");
                expect(table.find("td.col0.row1").data("value"))
                .toBe((12+30)/(103+112));
                return done();
            });
        });
    });

    return describe("with ragged input",  function() {
        const table = $("<div>").pivotUI(raggedFixtureData, {rows: ["gender"], cols: ["age"]});

        return it("renders a table with the correct textual representation", () => expect(table.find("table.pvtTable").text())
        .toBe([
            "age",     "12",  "34",  "null",  "Totals",
            "gender",
            "female",                 "1",    "1",
            "male",    "1",                   "1",
            "null",    "1",    "1",           "2",
            "Totals",  "2",    "1",   "1",    "4"
            ].join("")
        ));
    });
});

describe("$.pivot()", function() {

    describe("with no rows/cols, default count aggregator, default TableRenderer",  function() {
        const table = $("<div>").pivot(fixtureData);

        it("renders a table", () => expect(table.find("table.pvtTable").length)
        .toBe(1));

        return describe("its renderer output", function() {

            it("has the correct textual representation", () => expect(table.find("table.pvtTable").text())
            .toBe(["Totals", "4"].join("")));

            return it("has a correct grand total with data value", function() {
                expect(table.find("td.pvtGrandTotal").text())
                .toBe("4");
                return expect(table.find("td.pvtGrandTotal").data("value"))
                .toBe(4);
            });
        });
    });

    describe("with rows/cols, sum aggregator, derivedAttributes, filter and sorters",  function() {
        const {sortAs, derivers, aggregators} = $.pivotUtilities;
        const table = $("<div>").pivot(fixtureData, {
            rows: ["gender"], cols: ["birthyear"], aggregator: aggregators["Sum"](["trialbins"]),
            filter(record) { return record.name !== "Nick"; },
            derivedAttributes: {
                birthyear: derivers.dateFormat("birthday", "%y"),
                trialbins: derivers.bin("trials", 10)
            },
            sorters(attr) {
                if (attr === "gender") { return sortAs(["male", "female"]); }
            }
        }
        );

        return it("renders a table with the correct textual representation", () => expect(table.find("table.pvtTable").text())
        .toBe([
            "birthyear",    "1982",     "1983",     "Totals",
            "gender",
            "male",         "110.00",               "110.00",
            "female",       "90.00",    "100.00",   "190.00",
            "Totals",       "200.00",   "100.00",   "300.00"
            ].join("")
        ));
    });

    describe("with rows/cols, fraction-of aggregator",  function() {
        const {aggregators} = $.pivotUtilities;
        const table = $("<div>").pivot(fixtureData, {
            rows: ["gender"],
            aggregator: aggregators["Sum as Fraction of Total"](["trials"])
        }
        );

        return it("renders a table with the correct textual representation", () => expect(table.find("table.pvtTable").text())
        .toBe([
            "gender",  "Totals",
            "female",  "47.8%",
            "male",    "52.2%",
            "Totals",  "100.0%"
            ].join("")
        ));
    });

    describe("with rows/cols, custom aggregator, custom renderer with options",  function() {
        let received_PivotData = null;
        let received_rendererOptions = null;

        const table = $("<div>").pivot(fixtureData, {
            rows: ["name", "colour"], cols: ["trials", "successes"],
            aggregator() {
                return {
                    count2x: 0,
                    push() { return this.count2x +=2; },
                    value() { return this.count2x; },
                    format(x) { return "formatted " + x; }
                };
            },
            renderer(a,b) {
                received_PivotData = a;
                received_rendererOptions = b;
                return $("<div>").addClass(b.greeting).text("world");
            },
            rendererOptions: {greeting:"hithere"}
        });

        it("renders the custom renderer as per options", () => expect(table.find("div.hithere").length)
        .toBe(1));

        return describe("its received PivotData object", () => it("has a correct grand total value and format for custom aggregator", function() {
            const agg = received_PivotData.getAggregator([],[]);
            const val = agg.value();
            expect(val).toBe(8);
            return expect(agg.format(val)).toBe("formatted 8");
        }));
    });


    return describe("with ragged input",  function() {
        const table = $("<div>").pivot(raggedFixtureData, {rows: ["gender"], cols: ["age"]});

        return it("renders a table with the correct textual representation", () => expect(table.find("table.pvtTable").text())
        .toBe([
            "age",     "12",  "34",  "null",  "Totals",
            "gender",
            "female",                 "1",    "1",
            "male",    "1",                   "1",
            "null",    "1",    "1",           "2",
            "Totals",  "2",    "1",   "1",    "4"
            ].join("")
        ));
    });
});

describe("$.pivotUtilities", function() {

    describe(".PivotData()", function() {
        const sumOverSumOpts =
            {aggregator: $.pivotUtilities.aggregators["Sum over Sum"](["a","b"])};

        describe("with no options", function() {
            const aoaInput =  [ ["a","b"], [1,2], [3,4] ];
            const pd = new $.pivotUtilities.PivotData(aoaInput);

            return it("has the correct grand total value", () => expect(pd.getAggregator([],[]).value())
            .toBe(2));
        });

        describe("with array-of-array input", function() {
            const aoaInput =  [ ["a","b"], [1,2], [3,4] ];
            const pd = new $.pivotUtilities.PivotData(aoaInput, sumOverSumOpts);

            return it("has the correct grand total value", () => expect(pd.getAggregator([],[]).value())
            .toBe((1+3)/(2+4)));
        });

        describe("with array-of-object input", function() {
            const aosInput =  [ {a:1, b:2}, {a:3, b:4} ];
            const pd = new $.pivotUtilities.PivotData(aosInput, sumOverSumOpts);

            return it("has the correct grand total value", () => expect(pd.getAggregator([],[]).value())
            .toBe((1+3)/(2+4)));
        });

        describe("with ragged array-of-object input", function() {
            const raggedAosInput =  [ {a:1}, {b:4}, {a: 3, b: 2} ];
            const pd = new $.pivotUtilities.PivotData(raggedAosInput, sumOverSumOpts);

            return it("has the correct grand total value", () => expect(pd.getAggregator([],[]).value())
            .toBe((1+3)/(2+4)));
        });

        describe("with function input", function() {
            const functionInput = function(record) {
                record({a:1, b:2});
                return record({a:3, b:4});
            };
            const pd = new $.pivotUtilities.PivotData(functionInput, sumOverSumOpts);

            return it("has the correct grand total value", () => expect(pd.getAggregator([],[]).value())
            .toBe((1+3)/(2+4)));
        });

        describe("with jQuery table element input", function() {
            const tableInput = $(`\
<table>
    <thead>
        <tr> <th>a</th><th>b</th> </tr>
    </thead>
    <tbody>
        <tr> <td>1</td> <td>2</td> </tr>
        <tr> <td>3</td> <td>4</td> </tr>
    </tbody>
</table>\
`
            );
            const pd = new $.pivotUtilities.PivotData(tableInput, sumOverSumOpts);

            return it("has the correct grand total value", () => expect(pd.getAggregator([],[]).value())
            .toBe((1+3)/(2+4)));
        });


        return describe("with rows/cols", function() {
            const pd = new $.pivotUtilities.PivotData(fixtureData, {
                rows: ["name", "colour"],
                cols: ["trials", "successes"]
            });

            it("has correctly-ordered row keys", () => expect(pd.getRowKeys())
            .toEqual([ [ 'Carol', 'yellow' ], [ 'Jane', 'red' ], [ 'John', 'blue' ], [ 'Nick', 'blue' ] ]));

            it("has correctly-ordered col keys", () => expect(pd.getColKeys())
            .toEqual([ [ 95, 25 ], [ 102, 14 ], [ 103, 12 ], [ 112, 30 ] ]));

            it("can be iterated over", function() {
                let numNotNull = 0;
                let numNull = 0;
                for (let r of Array.from(pd.getRowKeys())) {
                    for (let c of Array.from(pd.getColKeys())) {
                        if (pd.getAggregator(r, c).value() != null) {
                            numNotNull++;
                        } else {
                            numNull++;
                        }
                    }
                }
                expect(numNotNull)
                .toBe(4);
                return expect(numNull)
                .toBe(12);
            });

            it("returns matching records", function() {
                const records = [];
                pd.forEachMatchingRecord({gender: "male"}, x => records.push(x.name));
                return expect(records)
                .toEqual(["Nick", "John"]);
        });

            it("has a correct spot-checked aggregator", function() {
                const agg = pd.getAggregator([ 'Carol', 'yellow' ],[ 102, 14 ]);
                const val = agg.value();
                expect(val).toBe(1);
                return expect(agg.format(val)).toBe("1");
            });

            return it("has a correct grand total aggregator", function() {
                const agg = pd.getAggregator([],[]);
                const val = agg.value();
                expect(val).toBe(4);
                return expect(agg.format(val)).toBe("4");
            });
        });
    });

    describe(".aggregatorTemplates", function() {

        const getVal = function(aggregator) {
            const pd = new $.pivotUtilities.PivotData(fixtureData, {aggregator});
            return pd.getAggregator([],[]).value();
        };
        const tpl = $.pivotUtilities.aggregatorTemplates;

        describe(".count", () => it("works", () => expect(getVal(tpl.count()()))
        .toBe(4)));

        describe(".countUnique", () => it("works", () => expect(getVal(tpl.countUnique()(['gender'])))
        .toBe(2)));

        describe(".listUnique", () => it("works", () => expect(getVal(tpl.listUnique()(['gender'])))
        .toBe('female,male')));

        describe(".average", () => it("works", () => expect(getVal(tpl.average()(['trials'])))
        .toBe(103)));

        describe(".sum", () => it("works", () => expect(getVal(tpl.sum()(['trials'])))
        .toBe(412)));

        describe(".min", () => it("works", () => expect(getVal(tpl.min()(['trials'])))
        .toBe(95)));

        describe(".max", () => it("works", () => expect(getVal(tpl.max()(['trials'])))
        .toBe(112)));

        describe(".first", () => it("works", () => expect(getVal(tpl.first()(['name'])))
        .toBe('Carol')));

        describe(".last", () => it("works", () => expect(getVal(tpl.last()(['name'])))
        .toBe('Nick')));

        describe(".average", () => it("works", () => expect(getVal(tpl.average()(['trials'])))
        .toBe(103)));

        describe(".median", () => it("works", () => expect(getVal(tpl.median()(['trials'])))
        .toBe(102.5)));

        describe(".quantile", () => it("works", function() {
            expect(getVal(tpl.quantile(0)(['trials'])))
            .toBe(95);
            expect(getVal(tpl.quantile(0.1)(['trials'])))
            .toBe(98.5);
            expect(getVal(tpl.quantile(0.25)(['trials'])))
            .toBe(98.5);
            expect(getVal(tpl.quantile(1/3)(['trials'])))
            .toBe(102);
            return expect(getVal(tpl.quantile(1)(['trials'])))
            .toBe(112);
        }));

        describe(".var", () => it("works", () => expect(getVal(tpl.var()(['trials'])))
        .toBe(48.666666666666686)));

        describe(".stdev", () => it("works", () => expect(getVal(tpl.stdev()(['trials'])))
        .toBe(6.976149845485451)));

        return describe(".sumOverSum", () => it("works", () => expect(getVal(tpl.sumOverSum()(['successes', 'trials'])))
        .toBe((12+25+30+14)/(95+102+103+112))));
    });

    describe(".naturalSort()", function() {
        const {
            naturalSort
        } = $.pivotUtilities;

        const sortedArr = [
            null, NaN,
            -Infinity, '-Infinity', -3, '-3', -2, '-2', -1, '-1',
            0, '2e-1', 1, '01', '1', 2, '002', '002e0', '02', '2', '2e-0',
            3, 10, '10', '11', '12', '1e2', '112', Infinity, 'Infinity',
            '1a', '2a','12a','20a',
            'A', 'A', 'NaN', 'a', 'a',
            'a01', 'a012', 'a02', 'a1', 'a2', 'a12', 'a12', 'a21', 'a21',
            'b', 'c', 'd', 'null'
        ];

        return it("sorts naturally (null, NaN, numbers & numbery strings, Alphanum for text strings)", () => expect(sortedArr.slice().sort(naturalSort))
        .toEqual(sortedArr));
    });

    describe(".sortAs()", function() {
        const {
            sortAs
        } = $.pivotUtilities;

        it("sorts with unknown values sorted at the end", () => expect([5,2,3,4,1].sort(sortAs([4,3,2])))
        .toEqual([4,3,2,1,5]));

        return it("sorts lowercase after uppercase", () => expect(["Ab","aA","aa","ab"].sort(sortAs(["Ab","Aa"])))
        .toEqual(["Ab","ab","aa","aA"]));
});

    describe(".numberFormat()", function() {
        const {
            numberFormat
        } = $.pivotUtilities;

        it("formats numbers", function() {
            const nf = numberFormat();
            return expect(nf(1234567.89123456))
            .toEqual("1,234,567.89");
        });

        it("formats booleans", function() {
            const nf = numberFormat();
            return expect(nf(true))
            .toEqual("1.00");
        });

        it("formats numbers in strings", function() {
            const nf = numberFormat();
            return expect(nf("1234567.89123456"))
            .toEqual("1,234,567.89");
        });

        it("doesn't formats strings", function() {
            const nf = numberFormat();
            return expect(nf("hi there"))
            .toEqual("");
        });

        it("doesn't formats objects", function() {
            const nf = numberFormat();
            return expect(nf({a:1}))
            .toEqual("");
        });

        it("formats percentages", function() {
            const nf = numberFormat({scaler: 100, suffix: "%"});
            return expect(nf(0.12345))
            .toEqual("12.35%");
        });

        it("adds separators", function() {
            const nf = numberFormat({thousandsSep: "a", decimalSep: "b"});
            return expect(nf(1234567.89123456))
            .toEqual("1a234a567b89");
        });

        it("adds prefixes and suffixes", function() {
            const nf = numberFormat({prefix: "a", suffix: "b"});
            return expect(nf(1234567.89123456))
            .toEqual("a1,234,567.89b");
        });

        return it("scales and rounds", function() {
            const nf = numberFormat({digitsAfterDecimal: 3, scaler: 1000});
            return expect(nf(1234567.89123456))
            .toEqual("1,234,567,891.235");
        });
    });

    return describe(".derivers", function() {
        describe(".dateFormat()", function() {
            const df = $.pivotUtilities.derivers.dateFormat("x", "abc % %% %%% %a %y %m %n %d %w %x %H %M %S", true);

            it("formats date objects", () => expect(df({x: new Date("2015-01-02T23:43:11Z")}))
            .toBe('abc % %% %%% %a 2015 01 Jan 02 Fri 5 23 43 11'));

            return it("formats input parsed by Date.parse()", function() {
                expect(df({x: "2015-01-02T23:43:11Z"}))
                .toBe('abc % %% %%% %a 2015 01 Jan 02 Fri 5 23 43 11');

                return expect(df({x: "bla"}))
                .toBe('');
            });
        });

        return describe(".bin()", function() {
            const binner = $.pivotUtilities.derivers.bin("x", 10);

            it("bins numbers", function() {
                expect(binner({x: 11}))
                .toBe(10);

                expect(binner({x: 9}))
                .toBe(0);

                return expect(binner({x: 111}))
                .toBe(110);
            });

            it("bins booleans", () => expect(binner({x: true}))
            .toBe(0));

            it("bins negative numbers", () => expect(binner({x: -12}))
            .toBe(-10));

            it("doesn't bin strings", () => expect(binner({x: "a"}))
            .toBeNaN());

            return it("doesn't bin objects", () => expect(binner({x: {a:1}}))
            .toBeNaN());
        });
    });
});
