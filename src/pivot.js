/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__, or convert again using --optional-chaining
 * DS104: Avoid inline assignments
 * DS201: Simplify complex destructure assignments
 * DS202: Simplify dynamic range loops
 * DS203: Remove `|| {}` from converted for-own loops
 * DS204: Change includes calls to have a more natural evaluation order
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const callWithJQuery = function(pivotModule) {
    if ((typeof exports === "object") && (typeof module === "object")) { // CommonJS
        return pivotModule(require("jquery"));
    } else if ((typeof define === "function") && define.amd) { // AMD
        return define(["jquery"], pivotModule);
    // Plain browser env
    } else {
        return pivotModule(jQuery);
    }
};

callWithJQuery(function($) {

    /*
    Utilities
    */

    const addSeparators = function(nStr, thousandsSep, decimalSep) {
        nStr += '';
        const x = nStr.split('.');
        let x1 = x[0];
        const x2 = x.length > 1 ?  decimalSep + x[1] : '';
        const rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) { x1 = x1.replace(rgx, '$1' + thousandsSep + '$2'); }
        return x1 + x2;
    };

    const numberFormat = function(opts) {
        const defaults = {
            digitsAfterDecimal: 2, scaler: 1,
            thousandsSep: ",", decimalSep: ".",
            prefix: "", suffix: ""
        };
        opts = $.extend({}, defaults, opts);
        return function(x) {
            if (isNaN(x) || !isFinite(x)) { return ""; }
            const result = addSeparators((opts.scaler*x).toFixed(opts.digitsAfterDecimal), opts.thousandsSep, opts.decimalSep);
            return ""+opts.prefix+result+opts.suffix;
        };
    };

    //aggregator templates default to US number formatting but this is overrideable
    const usFmt = numberFormat();
    const usFmtInt = numberFormat({digitsAfterDecimal: 0});
    const usFmtPct = numberFormat({digitsAfterDecimal:1, scaler: 100, suffix: "%"});

    const aggregatorTemplates = {
        count(formatter) { if (formatter == null) { formatter = usFmtInt; } return () => (function(data, rowKey, colKey) {
            return {
                count: 0,
                push() { return this.count++; },
                value() { return this.count; },
                format: formatter
            };
        }); },

        uniques(fn, formatter) { if (formatter == null) { formatter = usFmtInt; } return function(...args) { const [attr] = Array.from(args[0]); return function(data, rowKey, colKey) {
            return {
                uniq: [],
                push(record) { if (!Array.from(this.uniq).includes(record[attr])) { return this.uniq.push(record[attr]); } },
                value() { return fn(this.uniq); },
                format: formatter,
                numInputs: (attr != null) ? 0 : 1
            };
        }; }; },

        sum(formatter) { if (formatter == null) { formatter = usFmt; } return function(...args) { const [attr] = Array.from(args[0]); return function(data, rowKey, colKey) {
            return {
                sum: 0,
                push(record) { if (!isNaN(parseFloat(record[attr]))) { return this.sum += parseFloat(record[attr]); } },
                value() { return this.sum; },
                format: formatter,
                numInputs: (attr != null) ? 0 : 1
            };
        }; }; },

        extremes(mode, formatter) { if (formatter == null) { formatter = usFmt; } return function(...args) { const [attr] = Array.from(args[0]); return function(data, rowKey, colKey) {
            return {
                val: null,
                sorter: getSort(data != null ? data.sorters : undefined, attr),
                push(record) {
                    let x = record[attr];
                    if (["min", "max"].includes(mode)) {
                        x = parseFloat(x);
                        if (!isNaN(x)) { this.val = Math[mode](x, this.val != null ? this.val : x); }
                    }
                    if (mode === "first") { if (this.sorter(x, this.val != null ? this.val : x) <= 0) { this.val = x; } }
                    if (mode === "last") {  if (this.sorter(x, this.val != null ? this.val : x) >= 0) { return this.val = x; } }
                },
                value() { return this.val; },
                format(x) { if (isNaN(x)) { return x; } else { return formatter(x); } },
                numInputs: (attr != null) ? 0 : 1
            };
        }; }; },

        quantile(q, formatter) { if (formatter == null) { formatter = usFmt; } return function(...args) { const [attr] = Array.from(args[0]); return function(data, rowKey, colKey) {
            return {
                vals: [],
                push(record) {
                    const x = parseFloat(record[attr]);
                    if (!isNaN(x)) { return this.vals.push(x); }
                },
                value() {
                    if (this.vals.length === 0) { return null; }
                    this.vals.sort((a, b) => a-b);
                    const i = (this.vals.length-1)*q;
                    return (this.vals[Math.floor(i)] + this.vals[Math.ceil(i)])/2.0;
                },
                format: formatter,
                numInputs: (attr != null) ? 0 : 1
            };
        }; }; },

        runningStat(mode, ddof, formatter) { if (mode == null) { mode = "mean"; } if (ddof == null) { ddof = 1; } if (formatter == null) { formatter = usFmt; } return function(...args) { const [attr] = Array.from(args[0]); return function(data, rowKey, colKey) {
            return {
                n: 0.0, m: 0.0, s: 0.0,
                push(record) {
                    const x = parseFloat(record[attr]);
                    if (isNaN(x)) { return; }
                    this.n += 1.0;
                    if (this.n === 1.0) {
                        return this.m = x;
                    } else {
                        const m_new = this.m + ((x - this.m)/this.n);
                        this.s = this.s + ((x - this.m)*(x - m_new));
                        return this.m = m_new;
                    }
                },
                value() {
                    if (mode === "mean") {
                        if (this.n === 0) { return 0/0; } else { return this.m; }
                    }
                    if (this.n <= ddof) { return 0; }
                    switch (mode) {
                        case "var":   return this.s/(this.n-ddof);
                        case "stdev": return Math.sqrt(this.s/(this.n-ddof));
                    }
                },
                format: formatter,
                numInputs: (attr != null) ? 0 : 1
            };
        }; }; },

        sumOverSum(formatter) { if (formatter == null) { formatter = usFmt; } return function(...args) { const [num, denom] = Array.from(args[0]); return function(data, rowKey, colKey) {
            return {
                sumNum: 0,
                sumDenom: 0,
                push(record) {
                    if (!isNaN(parseFloat(record[num]))) { this.sumNum   += parseFloat(record[num]); }
                    if (!isNaN(parseFloat(record[denom]))) { return this.sumDenom += parseFloat(record[denom]); }
                },
                value() { return this.sumNum/this.sumDenom; },
                format: formatter,
                numInputs: (num != null) && (denom != null) ? 0 : 2
            };
        }; }; },

        sumOverSumBound80(upper, formatter) { if (upper == null) { upper = true; } if (formatter == null) { formatter = usFmt; } return function(...args) { const [num, denom] = Array.from(args[0]); return function(data, rowKey, colKey) {
            return {
                sumNum: 0,
                sumDenom: 0,
                push(record) {
                    if (!isNaN(parseFloat(record[num]))) { this.sumNum   += parseFloat(record[num]); }
                    if (!isNaN(parseFloat(record[denom]))) { return this.sumDenom += parseFloat(record[denom]); }
                },
                value() {
                    const sign = upper ? 1 : -1;
                    return ((0.821187207574908/this.sumDenom) + (this.sumNum/this.sumDenom) + (1.2815515655446004*sign*
                        Math.sqrt((0.410593603787454/ (this.sumDenom*this.sumDenom)) + ((this.sumNum*(1 - (this.sumNum/ this.sumDenom)))/ (this.sumDenom*this.sumDenom)))))/
                        (1 + (1.642374415149816/this.sumDenom));
                },
                format: formatter,
                numInputs: (num != null) && (denom != null) ? 0 : 2
            };
        }; }; },

        fractionOf(wrapped, type, formatter) { if (type == null) { type = "total"; } if (formatter == null) { formatter = usFmtPct; } return (...x) => (function(data, rowKey, colKey) {
            return {
                selector: {total:[[],[]],row:[rowKey,[]],col:[[],colKey]}[type],
                inner: wrapped(...Array.from(x || []))(data, rowKey, colKey),
                push(record) { return this.inner.push(record); },
                format: formatter,
                value() { return this.inner.value() / data.getAggregator(...Array.from(this.selector || [])).inner.value(); },
                numInputs: wrapped(...Array.from(x || []))().numInputs
            };
        }); }
    };

    aggregatorTemplates.countUnique = f => aggregatorTemplates.uniques((x => x.length), f);
    aggregatorTemplates.listUnique =  s => aggregatorTemplates.uniques((x => x.sort(naturalSort).join(s)), (x => x));
    aggregatorTemplates.max =         f => aggregatorTemplates.extremes('max', f);
    aggregatorTemplates.min =         f => aggregatorTemplates.extremes('min', f);
    aggregatorTemplates.first =       f => aggregatorTemplates.extremes('first', f);
    aggregatorTemplates.last =        f => aggregatorTemplates.extremes('last', f);
    aggregatorTemplates.median =      f => aggregatorTemplates.quantile(0.5, f);
    aggregatorTemplates.average =     f => aggregatorTemplates.runningStat("mean", 1, f);
    aggregatorTemplates.var =         (ddof, f) => aggregatorTemplates.runningStat("var", ddof, f);
    aggregatorTemplates.stdev =       (ddof, f) => aggregatorTemplates.runningStat("stdev", ddof, f);

    //default aggregators & renderers use US naming and number formatting
    const aggregators = ((tpl => ({
        "Count":                tpl.count(usFmtInt),
        "Count Unique Values":  tpl.countUnique(usFmtInt),
        "List Unique Values":   tpl.listUnique(", "),
        "Sum":                  tpl.sum(usFmt),
        "Integer Sum":          tpl.sum(usFmtInt),
        "Average":              tpl.average(usFmt),
        "Median":               tpl.median(usFmt),
        "Sample Variance":      tpl.var(1, usFmt),
        "Sample Standard Deviation": tpl.stdev(1, usFmt),
        "Minimum":              tpl.min(usFmt),
        "Maximum":              tpl.max(usFmt),
        "First":                tpl.first(usFmt),
        "Last":                 tpl.last(usFmt),
        "Sum over Sum":         tpl.sumOverSum(usFmt),
        "80% Upper Bound":      tpl.sumOverSumBound80(true, usFmt),
        "80% Lower Bound":      tpl.sumOverSumBound80(false, usFmt),
        "Sum as Fraction of Total":     tpl.fractionOf(tpl.sum(),   "total", usFmtPct),
        "Sum as Fraction of Rows":      tpl.fractionOf(tpl.sum(),   "row",   usFmtPct),
        "Sum as Fraction of Columns":   tpl.fractionOf(tpl.sum(),   "col",   usFmtPct),
        "Count as Fraction of Total":   tpl.fractionOf(tpl.count(), "total", usFmtPct),
        "Count as Fraction of Rows":    tpl.fractionOf(tpl.count(), "row",   usFmtPct),
        "Count as Fraction of Columns": tpl.fractionOf(tpl.count(), "col",   usFmtPct)
    })))(aggregatorTemplates);

    const renderers = {
        "Table"(data, opts) {   return pivotTableRenderer(data, opts); },
        "Table Barchart"(data, opts) { return $(pivotTableRenderer(data, opts)).barchart(); },
        "Heatmap"(data, opts) { return $(pivotTableRenderer(data, opts)).heatmap("heatmap",    opts); },
        "Row Heatmap"(data, opts) { return $(pivotTableRenderer(data, opts)).heatmap("rowheatmap", opts); },
        "Col Heatmap"(data, opts) { return $(pivotTableRenderer(data, opts)).heatmap("colheatmap", opts); }
    };

    const locales = {
        en: {
            aggregators,
            renderers,
            localeStrings: {
                renderError: "An error occurred rendering the PivotTable results.",
                computeError: "An error occurred computing the PivotTable results.",
                uiRenderError: "An error occurred rendering the PivotTable UI.",
                selectAll: "Select All",
                selectNone: "Select None",
                tooMany: "(too many to list)",
                filterResults: "Filter values",
                apply: "Apply",
                cancel: "Cancel",
                totals: "Totals", //for table renderer
                vs: "vs", //for gchart renderer
                by: "by"
            }
        } //for gchart renderer
    };

    //dateFormat deriver l10n requires month and day names to be passed in directly
    const mthNamesEn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dayNamesEn = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const zeroPad = number => ("0"+number).substr(-2,2);

    const derivers = {
        bin(col, binWidth) { return record => record[col] - (record[col] % binWidth); },
        dateFormat(col, formatString, utcOutput, mthNames, dayNames) {
            if (utcOutput == null) { utcOutput = false; }
            if (mthNames == null) { mthNames = mthNamesEn; }
            if (dayNames == null) { dayNames = dayNamesEn; }
            const utc = utcOutput ? "UTC" : "";
            return function(record) { //thanks http://stackoverflow.com/a/12213072/112871
                const date = new Date(Date.parse(record[col]));
                if (isNaN(date)) { return ""; }
                return formatString.replace(/%(.)/g, function(m, p) {
                    switch (p) {
                        case "y": return date[`get${utc}FullYear`]();
                        case "m": return zeroPad(date[`get${utc}Month`]()+1);
                        case "n": return mthNames[date[`get${utc}Month`]()];
                        case "d": return zeroPad(date[`get${utc}Date`]());
                        case "w": return dayNames[date[`get${utc}Day`]()];
                        case "x": return date[`get${utc}Day`]();
                        case "H": return zeroPad(date[`get${utc}Hours`]());
                        case "M": return zeroPad(date[`get${utc}Minutes`]());
                        case "S": return zeroPad(date[`get${utc}Seconds`]());
                        default: return "%" + p;
                    }
                });
            };
        }
    };

    const rx = /(\d+)|(\D+)/g;
    const rd = /\d/;
    const rz = /^0/;
    var naturalSort = (as, bs) => {
        //nulls first
        if ((bs != null) && (as == null)) { return -1; }
        if ((as != null) && (bs == null)) { return  1; }

        //then raw NaNs
        if ((typeof as === "number") && isNaN(as)) { return -1; }
        if ((typeof bs === "number") && isNaN(bs)) { return  1; }

        //numbers and numbery strings group together
        const nas = +as;
        const nbs = +bs;
        if (nas < nbs) { return -1; }
        if (nas > nbs) { return  1; }

        //within that, true numbers before numbery strings
        if ((typeof as === "number") && (typeof bs !== "number")) { return -1; }
        if ((typeof bs === "number") && (typeof as !== "number")) { return  1; }
        if ((typeof as === "number") && (typeof bs === "number")) { return  0; }

        // 'Infinity' is a textual number, so less than 'A'
        if (isNaN(nbs) && !isNaN(nas)) { return -1; }
        if (isNaN(nas) && !isNaN(nbs)) { return  1; }

        //finally, "smart" string sorting per http://stackoverflow.com/a/4373421/112871
        let a = String(as);
        let b = String(bs);
        if (a === b) { return 0; }
        if (!rd.test(a) || !rd.test(b)) { return (a > b ? 1 : -1); }

        //special treatment for strings containing digits
        a = a.match(rx); //create digits vs non-digit chunks and iterate through
        b = b.match(rx);
        while (a.length && b.length) {
            const a1 = a.shift();
            const b1 = b.shift();
            if (a1 !== b1) {
                if (rd.test(a1) && rd.test(b1)) { //both are digit chunks
                    return a1.replace(rz, ".0") - b1.replace(rz, ".0");
                } else {
                    return (a1 > b1 ? 1 : -1);
                }
            }
        }
        return a.length - b.length;
    };

    const sortAs = function(order) {
        const mapping = {};
        const l_mapping = {}; // sort lowercased keys similarly
        for (let i in order) {
            const x = order[i];
            mapping[x] = i;
            if (typeof x === "string") { l_mapping[x.toLowerCase()] = i; }
        }
        return function(a, b) {
            if ((mapping[a] != null) && (mapping[b] != null)) { return mapping[a] - mapping[b];
            } else if (mapping[a] != null) { return -1;
            } else if (mapping[b] != null) { return 1;
            } else if ((l_mapping[a] != null) && (l_mapping[b] != null)) { return l_mapping[a] - l_mapping[b];
            } else if (l_mapping[a] != null) { return -1;
            } else if (l_mapping[b] != null) { return 1;
            } else { return naturalSort(a,b); }
        };
    };

    var getSort = function(sorters, attr) {
        if (sorters != null) {
            if ($.isFunction(sorters)) {
                const sort = sorters(attr);
                if ($.isFunction(sort)) { return sort; }
            } else if (sorters[attr] != null) {
                return sorters[attr];
            }
        }
        return naturalSort;
    };

    /*
    Data Model class
    */

    class PivotData {
        constructor(input, opts) {
            this.arrSort = this.arrSort.bind(this);
            this.sortKeys = this.sortKeys.bind(this);
            this.getColKeys = this.getColKeys.bind(this);
            this.getRowKeys = this.getRowKeys.bind(this);
            this.getAggregator = this.getAggregator.bind(this);
            if (opts == null) { opts = {}; }
            this.input = input;
            this.aggregator = opts.aggregator != null ? opts.aggregator : aggregatorTemplates.count()();
            this.aggregatorName = opts.aggregatorName != null ? opts.aggregatorName : "Count";
            this.colAttrs = opts.cols != null ? opts.cols : [];
            this.rowAttrs = opts.rows != null ? opts.rows : [];
            this.valAttrs = opts.vals != null ? opts.vals : [];
            this.sorters = opts.sorters != null ? opts.sorters : {};
            this.rowOrder = opts.rowOrder != null ? opts.rowOrder : "key_a_to_z";
            this.colOrder = opts.colOrder != null ? opts.colOrder : "key_a_to_z";
            this.derivedAttributes = opts.derivedAttributes != null ? opts.derivedAttributes : {};
            this.filter = opts.filter != null ? opts.filter : (() => true);
            this.tree = {};
            this.rowKeys = [];
            this.colKeys = [];
            this.rowTotals = {};
            this.colTotals = {};
            this.allTotal = this.aggregator(this, [], []);
            this.sorted = false;

            // iterate through input, accumulating data for cells
            PivotData.forEachRecord(this.input, this.derivedAttributes, record => {
                if (this.filter(record)) { return this.processRecord(record); }
            });
        }

        //can handle arrays or jQuery selections of tables
        static forEachRecord(input, derivedAttributes, f) {
            let addRecord;
            if ($.isEmptyObject(derivedAttributes)) {
                addRecord = f;
            } else {
                addRecord = function(record) {
                    for (let k in derivedAttributes) { var left;
                    const v = derivedAttributes[k]; record[k] = (left = v(record)) != null ? left : record[k]; }
                    return f(record);
                };
            }

            //if it's a function, have it call us back
            if ($.isFunction(input)) {
                return input(addRecord);
            } else if ($.isArray(input)) {
                if ($.isArray(input[0])) { //array of arrays
                    return (() => {
                        const result = [];
                        for (let i of Object.keys(input || {})) {
                            const compactRecord = input[i];
                            if (i > 0) {
                                const record = {};
                                for (let j of Object.keys(input[0] || {})) { const k = input[0][j]; record[k] = compactRecord[j]; }
                                result.push(addRecord(record));
                            }
                        }
                        return result;
                    })();
                } else { //array of objects
                    return (() => {
                        const result1 = [];
                        for (let record of Array.from(input)) {                             result1.push(addRecord(record));
                        }
                        return result1;
                    })();
                }
            } else if (input instanceof $) {
                const tblCols = [];
                $("thead > tr > th", input).each(function(i) { return tblCols.push($(this).text()); });
                return $("tbody > tr", input).each(function(i) {
                    const record = {};
                    $("td", this).each(function(j) { return record[tblCols[j]] = $(this).text(); });
                    return addRecord(record);
                });
            } else {
                throw new Error("unknown input format");
            }
        }

        forEachMatchingRecord(criteria, callback) {
            return PivotData.forEachRecord(this.input, this.derivedAttributes, record => {
                if (!this.filter(record)) { return; }
                for (let k in criteria) {
                    const v = criteria[k];
                    if (v !== (record[k] != null ? record[k] : "null")) { return; }
                }
                return callback(record);
            });
        }

        arrSort(attrs) {
            let a;
            const sortersArr = ((() => {
                const result = [];
                for (a of Array.from(attrs)) {                     result.push(getSort(this.sorters, a));
                }
                return result;
            })());
            return function(a,b) {
                for (let i of Object.keys(sortersArr || {})) {
                    const sorter = sortersArr[i];
                    const comparison = sorter(a[i], b[i]);
                    if (comparison !== 0) { return comparison; }
                }
                return 0;
            };
        }

        sortKeys() {
            if (!this.sorted) {
                this.sorted = true;
                const v = (r,c) => this.getAggregator(r,c).value();
                switch (this.rowOrder) {
                    case "value_a_to_z":  this.rowKeys.sort((a,b) =>  naturalSort(v(a,[]), v(b,[]))); break;
                    case "value_z_to_a": this.rowKeys.sort((a,b) => -naturalSort(v(a,[]), v(b,[]))); break;
                    default:             this.rowKeys.sort(this.arrSort(this.rowAttrs));
                }
                switch (this.colOrder) {
                    case "value_a_to_z":  return this.colKeys.sort((a,b) =>  naturalSort(v([],a), v([],b)));
                    case "value_z_to_a": return this.colKeys.sort((a,b) => -naturalSort(v([],a), v([],b)));
                    default:             return this.colKeys.sort(this.arrSort(this.colAttrs));
                }
            }
        }

        getColKeys() {
            this.sortKeys();
            return this.colKeys;
        }

        getRowKeys() {
            this.sortKeys();
            return this.rowKeys;
        }

        processRecord(record) { //this code is called in a tight loop
            let x;
            const colKey = [];
            const rowKey = [];
            for (x of Array.from(this.colAttrs)) { colKey.push(record[x] != null ? record[x] : "null"); }
            for (x of Array.from(this.rowAttrs)) { rowKey.push(record[x] != null ? record[x] : "null"); }
            const flatRowKey = rowKey.join(String.fromCharCode(0));
            const flatColKey = colKey.join(String.fromCharCode(0));

            this.allTotal.push(record);

            if (rowKey.length !== 0) {
                if (!this.rowTotals[flatRowKey]) {
                    this.rowKeys.push(rowKey);
                    this.rowTotals[flatRowKey] = this.aggregator(this, rowKey, []);
                }
                this.rowTotals[flatRowKey].push(record);
            }

            if (colKey.length !== 0) {
                if (!this.colTotals[flatColKey]) {
                    this.colKeys.push(colKey);
                    this.colTotals[flatColKey] = this.aggregator(this, [], colKey);
                }
                this.colTotals[flatColKey].push(record);
            }

            if ((colKey.length !== 0) && (rowKey.length !== 0)) {
                if (!this.tree[flatRowKey]) {
                    this.tree[flatRowKey] = {};
                }
                if (!this.tree[flatRowKey][flatColKey]) {
                    this.tree[flatRowKey][flatColKey] = this.aggregator(this, rowKey, colKey);
                }
                return this.tree[flatRowKey][flatColKey].push(record);
            }
        }

        getAggregator(rowKey, colKey) {
            let agg;
            const flatRowKey = rowKey.join(String.fromCharCode(0));
            const flatColKey = colKey.join(String.fromCharCode(0));
            if ((rowKey.length === 0) && (colKey.length === 0)) {
                agg = this.allTotal;
            } else if (rowKey.length === 0) {
                agg = this.colTotals[flatColKey];
            } else if (colKey.length === 0) {
                agg = this.rowTotals[flatRowKey];
            } else {
                agg = this.tree[flatRowKey][flatColKey];
            }
            return agg != null ? agg : {value() { return null; }, format() { return ""; }};
        }
    }

    //expose these to the outside world
    $.pivotUtilities = {aggregatorTemplates, aggregators, renderers, derivers, locales,
        naturalSort, numberFormat, sortAs, PivotData};

    /*
    Default Renderer for hierarchical table layout
    */

    var pivotTableRenderer = function(pivotData, opts) {

        let colKey, getClickHandler, i, j, td, th, totalAggregator, tr, val, x;
        const defaults = {
            table: {
                clickCallback: null,
                rowTotals: true,
                colTotals: true
            },
            localeStrings: { totals: "Totals"
        }
        };

        opts = $.extend(true, {}, defaults, opts);

        const {
            colAttrs
        } = pivotData;
        const {
            rowAttrs
        } = pivotData;
        const rowKeys = pivotData.getRowKeys();
        const colKeys = pivotData.getColKeys();

        if (opts.table.clickCallback) {
            getClickHandler = function(value, rowValues, colValues) {
                let attr, i;
                const filters = {};
                for (i of Object.keys(colAttrs || {})) { attr = colAttrs[i]; if (colValues[i] != null) { filters[attr] = colValues[i]; } }
                for (i of Object.keys(rowAttrs || {})) { attr = rowAttrs[i]; if (rowValues[i] != null) { filters[attr] = rowValues[i]; } }
                return e => opts.table.clickCallback(e, value, filters, pivotData);
            };
        }

        //now actually build the output
        const result = document.createElement("table");
        result.className = "pvtTable";

        //helper function for setting row/col-span in pivotTableRenderer
        const spanSize = function(arr, i, j) {
            let x;
            if (i !== 0) {
                let asc, end;
                let noDraw = true;
                for (x = 0, end = j, asc = 0 <= end; asc ? x <= end : x >= end; asc ? x++ : x--) {
                    if (arr[i-1][x] !== arr[i][x]) {
                        noDraw = false;
                    }
                }
                if (noDraw) {
                  return -1; //do not draw cell
              }
            }
            let len = 0;
            while ((i+len) < arr.length) {
                var asc1, end1;
                let stop = false;
                for (x = 0, end1 = j, asc1 = 0 <= end1; asc1 ? x <= end1 : x >= end1; asc1 ? x++ : x--) {
                    if (arr[i][x] !== arr[i+len][x]) { stop = true; }
                }
                if (stop) { break; }
                len++;
            }
            return len;
        };

        //the first few rows are for col headers
        const thead = document.createElement("thead");
        for (j of Object.keys(colAttrs || {})) {
            const c = colAttrs[j];
            tr = document.createElement("tr");
            if ((parseInt(j) === 0) && (rowAttrs.length !== 0)) {
                th = document.createElement("th");
                th.setAttribute("colspan", rowAttrs.length);
                th.setAttribute("rowspan", colAttrs.length);
                tr.appendChild(th);
            }
            th = document.createElement("th");
            th.className = "pvtAxisLabel";
            th.textContent = c;
            tr.appendChild(th);
            for (i of Object.keys(colKeys || {})) {
                colKey = colKeys[i];
                x = spanSize(colKeys, parseInt(i), parseInt(j));
                if (x !== -1) {
                    th = document.createElement("th");
                    th.className = "pvtColLabel";
                    th.textContent = colKey[j];
                    th.setAttribute("colspan", x);
                    if ((parseInt(j) === (colAttrs.length-1)) && (rowAttrs.length !== 0)) {
                        th.setAttribute("rowspan", 2);
                    }
                    tr.appendChild(th);
                }
            }
            if ((parseInt(j) === 0) && opts.table.rowTotals) {
                th = document.createElement("th");
                th.className = "pvtTotalLabel pvtRowTotalLabel";
                th.innerHTML = opts.localeStrings.totals;
                th.setAttribute("rowspan", colAttrs.length + (rowAttrs.length ===0 ? 0 : 1));
                tr.appendChild(th);
            }
            thead.appendChild(tr);
        }

        //then a row for row header headers
        if (rowAttrs.length !==0) {
            tr = document.createElement("tr");
            for (i of Object.keys(rowAttrs || {})) {
                const r = rowAttrs[i];
                th = document.createElement("th");
                th.className = "pvtAxisLabel";
                th.textContent = r;
                tr.appendChild(th);
            }
            th = document.createElement("th");
            if (colAttrs.length ===0) {
                th.className = "pvtTotalLabel pvtRowTotalLabel";
                th.innerHTML = opts.localeStrings.totals;
            }
            tr.appendChild(th);
            thead.appendChild(tr);
        }
        result.appendChild(thead);

        //now the actual data rows, with their row headers and totals
        const tbody = document.createElement("tbody");
        for (i of Object.keys(rowKeys || {})) {
            const rowKey = rowKeys[i];
            tr = document.createElement("tr");
            for (j of Object.keys(rowKey || {})) {
                const txt = rowKey[j];
                x = spanSize(rowKeys, parseInt(i), parseInt(j));
                if (x !== -1) {
                    th = document.createElement("th");
                    th.className = "pvtRowLabel";
                    th.textContent = txt;
                    th.setAttribute("rowspan", x);
                    if ((parseInt(j) === (rowAttrs.length-1)) && (colAttrs.length !==0)) {
                        th.setAttribute("colspan",2);
                    }
                    tr.appendChild(th);
                }
            }
            for (j of Object.keys(colKeys || {})) { //this is the tight loop
                colKey = colKeys[j];
                const aggregator = pivotData.getAggregator(rowKey, colKey);
                val = aggregator.value();
                td = document.createElement("td");
                td.className = `pvtVal row${i} col${j}`;
                td.textContent = aggregator.format(val);
                td.setAttribute("data-value", val);
                if (getClickHandler != null) {
                    td.onclick = getClickHandler(val, rowKey, colKey);
                }
                tr.appendChild(td);
            }

            if (opts.table.rowTotals || (colAttrs.length === 0)) {
                totalAggregator = pivotData.getAggregator(rowKey, []);
                val = totalAggregator.value();
                td = document.createElement("td");
                td.className = "pvtTotal rowTotal";
                td.textContent = totalAggregator.format(val);
                td.setAttribute("data-value", val);
                if (getClickHandler != null) {
                    td.onclick = getClickHandler(val, rowKey, []);
                }
                td.setAttribute("data-for", "row"+i);
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }

        //finally, the row for col totals, and a grand total
        if (opts.table.colTotals || (rowAttrs.length === 0)) {
            tr = document.createElement("tr");
            if (opts.table.colTotals || (rowAttrs.length === 0)) {
                th = document.createElement("th");
                th.className = "pvtTotalLabel pvtColTotalLabel";
                th.innerHTML = opts.localeStrings.totals;
                th.setAttribute("colspan", rowAttrs.length + (colAttrs.length === 0 ? 0 : 1));
                tr.appendChild(th);
            }
            for (j of Object.keys(colKeys || {})) {
                colKey = colKeys[j];
                totalAggregator = pivotData.getAggregator([], colKey);
                val = totalAggregator.value();
                td = document.createElement("td");
                td.className = "pvtTotal colTotal";
                td.textContent = totalAggregator.format(val);
                td.setAttribute("data-value", val);
                if (getClickHandler != null) {
                    td.onclick = getClickHandler(val, [], colKey);
                }
                td.setAttribute("data-for", "col"+j);
                tr.appendChild(td);
            }
            if (opts.table.rowTotals || (colAttrs.length === 0)) {
                totalAggregator = pivotData.getAggregator([], []);
                val = totalAggregator.value();
                td = document.createElement("td");
                td.className = "pvtGrandTotal";
                td.textContent = totalAggregator.format(val);
                td.setAttribute("data-value", val);
                if (getClickHandler != null) {
                    td.onclick = getClickHandler(val, [], []);
                }
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        result.appendChild(tbody);

        //squirrel this away for later
        result.setAttribute("data-numrows", rowKeys.length);
        result.setAttribute("data-numcols", colKeys.length);

        return result;
    };

    /*
    Pivot Table core: create PivotData object and call Renderer on it
    */

    $.fn.pivot = function(input, inputOpts, locale) {
        let e;
        if (locale == null) { locale = "en"; }
        if ((locales[locale] == null)) { locale = "en"; }
        const defaults = {
            cols : [], rows: [], vals: [],
            rowOrder: "key_a_to_z", colOrder: "key_a_to_z",
            dataClass: PivotData,
            filter() { return true; },
            aggregator: aggregatorTemplates.count()(),
            aggregatorName: "Count",
            sorters: {},
            derivedAttributes: {},
            renderer: pivotTableRenderer
        };

        const localeStrings = $.extend(true, {}, locales.en.localeStrings, locales[locale].localeStrings);
        const localeDefaults = {
            rendererOptions: {localeStrings},
            localeStrings
        };

        const opts = $.extend(true, {}, localeDefaults, $.extend({}, defaults, inputOpts));

        let result = null;
        try {
            const pivotData = new opts.dataClass(input, opts);
            try {
                result = opts.renderer(pivotData, opts.rendererOptions);
            } catch (error) {
                e = error;
                if (typeof console !== 'undefined' && console !== null) { console.error(e.stack); }
                result = $("<span>").html(opts.localeStrings.renderError);
            }
        } catch (error1) {
            e = error1;
            if (typeof console !== 'undefined' && console !== null) { console.error(e.stack); }
            result = $("<span>").html(opts.localeStrings.computeError);
        }

        const x = this[0];
        while (x.hasChildNodes()) { x.removeChild(x.lastChild); }
        return this.append(result);
    };


    /*
    Pivot Table UI: calls Pivot Table core above with options set by user
    */

    $.fn.pivotUI = function(input, inputOpts, overwrite, locale) {
        let opts;
        let a, c;
        if (overwrite == null) { overwrite = false; }
        if (locale == null) { locale = "en"; }
        if ((locales[locale] == null)) { locale = "en"; }
        const defaults = {
            derivedAttributes: {},
            aggregators: locales[locale].aggregators,
            renderers: locales[locale].renderers,
            hiddenAttributes: [],
            hiddenFromAggregators: [],
            hiddenFromDragDrop: [],
            menuLimit: 500,
            cols: [], rows: [], vals: [],
            rowOrder: "key_a_to_z", colOrder: "key_a_to_z",
            dataClass: PivotData,
            exclusions: {},
            inclusions: {},
            unusedAttrsVertical: 85,
            autoSortUnusedAttrs: false,
            onRefresh: null,
            showUI: true,
            filter() { return true; },
            sorters: {}
        };

        const localeStrings = $.extend(true, {}, locales.en.localeStrings, locales[locale].localeStrings);
        const localeDefaults = {
            rendererOptions: {localeStrings},
            localeStrings
        };

        const existingOpts = this.data("pivotUIOptions");
        if ((existingOpts == null) || overwrite) {
            opts = $.extend(true, {}, localeDefaults, $.extend({}, defaults, inputOpts));
        } else {
            opts = existingOpts;
        }

        try {
            // do a first pass on the data to cache a materialized copy of any
            // function-valued inputs and to compute dimension cardinalities
            let attr, i, unusedAttrsVerticalAutoCutoff, x;
            const attrValues = {};
            const materializedInput = [];
            let recordsProcessed = 0;
            PivotData.forEachRecord(input, opts.derivedAttributes, function(record) {
                let attr;
                if (!opts.filter(record)) { return; }
                materializedInput.push(record);
                for (attr of Object.keys(record || {})) {
                    if ((attrValues[attr] == null)) {
                        attrValues[attr] = {};
                        if (recordsProcessed > 0) {
                            attrValues[attr]["null"] = recordsProcessed;
                        }
                    }
                }
                for (attr in attrValues) {
                    const value = record[attr] != null ? record[attr] : "null";
                    if (attrValues[attr][value] == null) { attrValues[attr][value] = 0; }
                    attrValues[attr][value]++;
                }
                return recordsProcessed++;
            });

            //start building the output
            const uiTable = $("<table>", {"class": "pvtUi"}).attr("cellpadding", 5);

            //renderer control
            const rendererControl = $("<td>").addClass("pvtUiCell");

            const renderer = $("<select>")
                .addClass('pvtRenderer')
                .appendTo(rendererControl)
                .bind("change", () => refresh()); //capture reference
            for (x of Object.keys(opts.renderers || {})) {
                $("<option>").val(x).html(x).appendTo(renderer);
            }


            //axis list, including the double-click menu
            const unused = $("<td>").addClass('pvtAxisContainer pvtUnused pvtUiCell');
            const shownAttributes = ((() => {
                const result = [];
                for (a in attrValues) {
                    if (!Array.from(opts.hiddenAttributes).includes(a)) {
                        result.push(a);
                    }
                }
                return result;
            })());
            const shownInAggregators = ((() => {
                const result1 = [];
                for (c of Array.from(shownAttributes)) {                     if (!Array.from(opts.hiddenFromAggregators).includes(c)) {
                        result1.push(c);
                    }
                }
                return result1;
            })());
            const shownInDragDrop = ((() => {
                const result2 = [];
                for (c of Array.from(shownAttributes)) {                     if (!Array.from(opts.hiddenFromDragDrop).includes(c)) {
                        result2.push(c);
                    }
                }
                return result2;
            })());


            let unusedAttrsVerticalAutoOverride = false;
            if (opts.unusedAttrsVertical === "auto") {
                unusedAttrsVerticalAutoCutoff = 120; // legacy support
            } else {
                unusedAttrsVerticalAutoCutoff = parseInt(opts.unusedAttrsVertical);
            }

            if (!isNaN(unusedAttrsVerticalAutoCutoff)) {
                let attrLength = 0;
                for (a of Array.from(shownInDragDrop)) { attrLength += a.length; }
                unusedAttrsVerticalAutoOverride = attrLength > unusedAttrsVerticalAutoCutoff;
            }

            if ((opts.unusedAttrsVertical === true) || unusedAttrsVerticalAutoOverride) {
                unused.addClass('pvtVertList');
            } else {
                unused.addClass('pvtHorizList');
            }

            for (i of Object.keys(shownInDragDrop || {})) {
                attr = shownInDragDrop[i];
                (function(attr) {
                    let v;
                    const values = ((() => {
                        const result3 = [];
                        for (v in attrValues[attr]) {
                            result3.push(v);
                        }
                        return result3;
                    })());
                    let hasExcludedItem = false;
                    const valueList = $("<div>").addClass('pvtFilterBox').hide();

                    valueList.append($("<h4>").append(
                        $("<span>").text(attr),
                        $("<span>").addClass("count").text(`(${values.length})`)
                        )
                    );
                    if (values.length > opts.menuLimit) {
                        valueList.append($("<p>").html(opts.localeStrings.tooMany));
                    } else {
                        if (values.length > 5) {
                            const controls = $("<p>").appendTo(valueList);
                            const sorter = getSort(opts.sorters, attr);
                            const placeholder = opts.localeStrings.filterResults;
                            $("<input>", {type: "text"}).appendTo(controls)
                                .attr({placeholder, class: "pvtSearch"})
                                .bind("keyup", function() {
                                    const filter = $(this).val().toLowerCase().trim();
                                    const accept_gen = (prefix, accepted) => (function(v) {
                                        let needle;
                                        const real_filter = filter.substring(prefix.length).trim();
                                        if (real_filter.length === 0) { return true; }
                                        return (needle = Math.sign(sorter(v.toLowerCase(), real_filter)), Array.from(accepted).includes(needle));
                                    });
                                    const accept =
                                        filter.indexOf(">=") === 0 ? accept_gen(">=", [1,0])
                                        : filter.indexOf("<=") === 0 ? accept_gen("<=", [-1,0])
                                        : filter.indexOf(">") === 0  ? accept_gen(">",  [1])
                                        : filter.indexOf("<") === 0  ? accept_gen("<",  [-1])
                                        : filter.indexOf("~") === 0  ? function(v) {
                                                if (filter.substring(1).trim().length === 0) { return true; }
                                                return v.toLowerCase().match(filter.substring(1));
                                            }
                                        : v => v.toLowerCase().indexOf(filter) !== -1;

                                    return valueList.find('.pvtCheckContainer p label span.value').each(function() {
                                        if (accept($(this).text())) {
                                            return $(this).parent().parent().show();
                                        } else {
                                            return $(this).parent().parent().hide();
                                        }
                                    });
                            });
                            controls.append($("<br>"));
                            $("<button>", {type:"button"}).appendTo(controls)
                                .html(opts.localeStrings.selectAll)
                                .bind("click", function() {
                                    valueList.find("input:visible:not(:checked)")
                                        .prop("checked", true).toggleClass("changed");
                                    return false;
                            });
                            $("<button>", {type:"button"}).appendTo(controls)
                                .html(opts.localeStrings.selectNone)
                                .bind("click", function() {
                                    valueList.find("input:visible:checked")
                                        .prop("checked", false).toggleClass("changed");
                                    return false;
                            });
                        }

                        const checkContainer = $("<div>").addClass("pvtCheckContainer").appendTo(valueList);

                        for (let value of Array.from(values.sort(getSort(opts.sorters, attr)))) {
                             const valueCount = attrValues[attr][value];
                             const filterItem = $("<label>");
                             let filterItemExcluded = false;
                             if (opts.inclusions[attr]) {
                                filterItemExcluded = (!Array.from(opts.inclusions[attr]).includes(value));
                             } else if (opts.exclusions[attr]) {
                                filterItemExcluded = (Array.from(opts.exclusions[attr]).includes(value));
                           }
                             if (!hasExcludedItem) { hasExcludedItem = filterItemExcluded; }
                             $("<input>")
                                .attr("type", "checkbox").addClass('pvtFilter')
                                .attr("checked", !filterItemExcluded).data("filter", [attr,value])
                                .appendTo(filterItem)
                                .bind("change", function() { return $(this).toggleClass("changed"); });
                             filterItem.append($("<span>").addClass("value").text(value));
                             filterItem.append($("<span>").addClass("count").text("("+valueCount+")"));
                             checkContainer.append($("<p>").append(filterItem));
                        }
                    }

                    const closeFilterBox = function() {
                        if (valueList.find("[type='checkbox']").length >
                               valueList.find("[type='checkbox']:checked").length) {
                                attrElem.addClass("pvtFilteredAttribute");
                            } else {
                                attrElem.removeClass("pvtFilteredAttribute");
                            }

                        valueList.find('.pvtSearch').val('');
                        valueList.find('.pvtCheckContainer p').show();
                        return valueList.hide();
                    };

                    const finalButtons = $("<p>").appendTo(valueList);

                    if (values.length <= opts.menuLimit) {
                        $("<button>", {type: "button"}).text(opts.localeStrings.apply)
                            .appendTo(finalButtons).bind("click", function() {
                                if (valueList.find(".changed").removeClass("changed").length) {
                                    refresh();
                                }
                                return closeFilterBox();
                        });
                    }

                    $("<button>", {type: "button"}).text(opts.localeStrings.cancel)
                        .appendTo(finalButtons).bind("click", function() {
                            valueList.find(".changed:checked")
                                .removeClass("changed").prop("checked", false);
                            valueList.find(".changed:not(:checked)")
                                .removeClass("changed").prop("checked", true);
                            return closeFilterBox();
                    });

                    const triangleLink = $("<span>").addClass('pvtTriangle')
                        .html(" &#x25BE;").bind("click", function(e) {
                            const {left, top} = $(e.currentTarget).position();
                            return valueList.css({left: left+10, top: top+10}).show();
                    });

                    var attrElem = $("<li>").addClass(`axis_${i}`)
                        .append($("<span>").addClass('pvtAttr').text(attr).data("attrName", attr).append(triangleLink));

                    if (hasExcludedItem) { attrElem.addClass('pvtFilteredAttribute'); }
                    return unused.append(attrElem).append(valueList);
                })(attr);
            }

            const tr1 = $("<tr>").appendTo(uiTable);

            //aggregator menu and value area

            const aggregator = $("<select>").addClass('pvtAggregator')
                .bind("change", () => refresh()); //capture reference
            for (x of Object.keys(opts.aggregators || {})) {
                aggregator.append($("<option>").val(x).html(x));
            }

            const ordering = {
                key_a_to_z:   {rowSymbol: "&varr;", colSymbol: "&harr;", next: "value_a_to_z"},
                value_a_to_z: {rowSymbol: "&darr;", colSymbol: "&rarr;", next: "value_z_to_a"},
                value_z_to_a: {rowSymbol: "&uarr;", colSymbol: "&larr;", next: "key_a_to_z"}
            };

            const rowOrderArrow = $("<a>", {role: "button"}).addClass("pvtRowOrder")
                .data("order", opts.rowOrder).html(ordering[opts.rowOrder].rowSymbol)
                .bind("click", function() {
                    $(this).data("order", ordering[$(this).data("order")].next);
                    $(this).html(ordering[$(this).data("order")].rowSymbol);
                    return refresh();
            });

            const colOrderArrow = $("<a>", {role: "button"}).addClass("pvtColOrder")
                .data("order", opts.colOrder).html(ordering[opts.colOrder].colSymbol)
                .bind("click", function() {
                    $(this).data("order", ordering[$(this).data("order")].next);
                    $(this).html(ordering[$(this).data("order")].colSymbol);
                    return refresh();
            });

            $("<td>").addClass('pvtVals pvtUiCell')
              .appendTo(tr1)
              .append(aggregator)
              .append(rowOrderArrow)
              .append(colOrderArrow)
              .append($("<br>"));

            //column axes
            $("<td>").addClass('pvtAxisContainer pvtHorizList pvtCols pvtUiCell').appendTo(tr1);

            const tr2 = $("<tr>").appendTo(uiTable);

            //row axes
            tr2.append($("<td>").addClass('pvtAxisContainer pvtRows pvtUiCell').attr("valign", "top"));

            //the actual pivot table container
            const pivotTable = $("<td>")
                .attr("valign", "top")
                .addClass('pvtRendererArea')
                .appendTo(tr2);

            //finally the renderer dropdown and unused attribs are inserted at the requested location
            if ((opts.unusedAttrsVertical === true) || unusedAttrsVerticalAutoOverride) {
                uiTable.find('tr:nth-child(1)').prepend(rendererControl);
                uiTable.find('tr:nth-child(2)').prepend(unused);
            } else {
                uiTable.prepend($("<tr>").append(rendererControl).append(unused));
            }

            //render the UI in its default state
            this.html(uiTable);

            //set up the UI initial state as requested by moving elements around

            for (x of Array.from(opts.cols)) {
                this.find(".pvtCols").append(this.find(`.axis_${$.inArray(x, shownInDragDrop)}`));
            }
            for (x of Array.from(opts.rows)) {
                this.find(".pvtRows").append(this.find(`.axis_${$.inArray(x, shownInDragDrop)}`));
            }
            if (opts.aggregatorName != null) {
                this.find(".pvtAggregator").val(opts.aggregatorName);
            }
            if (opts.rendererName != null) {
                this.find(".pvtRenderer").val(opts.rendererName);
            }

            if (!opts.showUI) { this.find(".pvtUiCell").hide(); }

            let initialRender = true;

            //set up for refreshing
            const refreshDelayed = () => {
                let left;
                const subopts = {
                    derivedAttributes: opts.derivedAttributes,
                    localeStrings: opts.localeStrings,
                    rendererOptions: opts.rendererOptions,
                    sorters: opts.sorters,
                    cols: [], rows: [],
                    dataClass: opts.dataClass
                };

                let numInputsToProcess = (left = opts.aggregators[aggregator.val()]([])().numInputs) != null ? left : 0;
                let vals = [];
                this.find(".pvtRows li span.pvtAttr").each(function() { return subopts.rows.push($(this).data("attrName")); });
                this.find(".pvtCols li span.pvtAttr").each(function() { return subopts.cols.push($(this).data("attrName")); });
                this.find(".pvtVals select.pvtAttrDropdown").each(function() {
                    if (numInputsToProcess === 0) {
                        return $(this).remove();
                    } else {
                        numInputsToProcess--;
                        if ($(this).val() !== "") { return vals.push($(this).val()); }
                    }
                });

                if (numInputsToProcess !== 0) {
                    let asc, end;
                    const pvtVals = this.find(".pvtVals");
                    for (x = 0, end = numInputsToProcess, asc = 0 <= end; asc ? x < end : x > end; asc ? x++ : x--) {
                        const newDropdown = $("<select>")
                            .addClass('pvtAttrDropdown')
                            .append($("<option>"))
                            .bind("change", () => refresh());
                        for (attr of Array.from(shownInAggregators)) {
                            newDropdown.append($("<option>").val(attr).text(attr));
                        }
                        pvtVals.append(newDropdown);
                    }
                }

                if (initialRender) {
                    ({
                        vals
                    } = opts);
                    i = 0;
                    this.find(".pvtVals select.pvtAttrDropdown").each(function() {
                        $(this).val(vals[i]);
                        return i++;
                    });
                    initialRender = false;
                }

                subopts.aggregatorName = aggregator.val();
                subopts.vals = vals;
                subopts.aggregator = opts.aggregators[aggregator.val()](vals);
                subopts.renderer = opts.renderers[renderer.val()];
                subopts.rowOrder = rowOrderArrow.data("order");
                subopts.colOrder = colOrderArrow.data("order");
                //construct filter here
                const exclusions = {};
                this.find('input.pvtFilter').not(':checked').each(function() {
                    const filter = $(this).data("filter");
                    if (exclusions[filter[0]] != null) {
                        return exclusions[filter[0]].push( filter[1] );
                    } else {
                        return exclusions[filter[0]] = [ filter[1] ];
                    }});
                //include inclusions when exclusions present
                const inclusions = {};
                this.find('input.pvtFilter:checked').each(function() {
                    const filter = $(this).data("filter");
                    if (exclusions[filter[0]] != null) {
                        if (inclusions[filter[0]] != null) {
                            return inclusions[filter[0]].push( filter[1] );
                        } else {
                            return inclusions[filter[0]] = [ filter[1] ];
                        }
                    }});

                subopts.filter = function(record) {
                    if (!opts.filter(record)) { return false; }
                    for (let k in exclusions) {
                        const excludedItems = exclusions[k];
                        if (Array.from(excludedItems).includes(""+(record[k] != null ? record[k] : 'null'))) { return false; }
                    }
                    return true;
                };

                pivotTable.pivot(materializedInput,subopts);
                const pivotUIOptions = $.extend({}, opts, {
                    cols: subopts.cols,
                    rows: subopts.rows,
                    colOrder: subopts.colOrder,
                    rowOrder: subopts.rowOrder,
                    vals,
                    exclusions,
                    inclusions,
                    inclusionsInfo: inclusions, //duplicated for backwards-compatibility
                    aggregatorName: aggregator.val(),
                    rendererName: renderer.val()
                }
                );

                this.data("pivotUIOptions", pivotUIOptions);

                // if requested make sure unused columns are in alphabetical order
                if (opts.autoSortUnusedAttrs) {
                    const unusedAttrsContainer = this.find("td.pvtUnused.pvtAxisContainer");
                    $(unusedAttrsContainer).children("li")
                        .sort((a, b) => naturalSort($(a).text(), $(b).text()))
                        .appendTo(unusedAttrsContainer);
                }

                pivotTable.css("opacity", 1);
                if (opts.onRefresh != null) { return opts.onRefresh(pivotUIOptions); }
            };

            var refresh = () => {
                pivotTable.css("opacity", 0.5);
                return setTimeout(refreshDelayed, 10);
            };

            //the very first refresh will actually display the table
            refresh();

            this.find(".pvtAxisContainer").sortable({
                    update(e, ui) { if ((ui.sender == null)) { return refresh(); } },
                    connectWith: this.find(".pvtAxisContainer"),
                    items: 'li',
                    placeholder: 'pvtPlaceholder'
            });
        } catch (error) {
            const e = error;
            if (typeof console !== 'undefined' && console !== null) { console.error(e.stack); }
            this.html(opts.localeStrings.uiRenderError);
        }
        return this;
    };

    /*
    Heatmap post-processing
    */

    $.fn.heatmap = function(scope, opts) {
        if (scope == null) { scope = "heatmap"; }
        const numRows = this.data("numrows");
        const numCols = this.data("numcols");

        // given a series of values
        // must return a function to map a given value to a CSS color
        let colorScaleGenerator = __guard__(opts != null ? opts.heatmap : undefined, x => x.colorScaleGenerator);
        if (colorScaleGenerator == null) { colorScaleGenerator = function(values) {
            const min = Math.min(...Array.from(values || []));
            const max = Math.max(...Array.from(values || []));
            return function(x) {
                const nonRed = 255 - Math.round((255*(x-min))/(max-min));
                return `rgb(255,${nonRed},${nonRed})`;
            };
        }; }

        const heatmapper = scope => {
            const forEachCell = f => {
                return this.find(scope).each(function() {
                    const x = $(this).data("value");
                    if ((x != null) && isFinite(x)) { return f(x, $(this)); }
                });
            };

            const values = [];
            forEachCell(x => values.push(x));
            const colorScale = colorScaleGenerator(values);
            return forEachCell((x, elem) => elem.css("background-color", colorScale(x)));
        };

        switch (scope) {
            case "heatmap":    heatmapper(".pvtVal"); break;
            case "rowheatmap": for (let i = 0, end = numRows, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) { heatmapper(`.pvtVal.row${i}`); } break;
            case "colheatmap": for (let j = 0, end1 = numCols, asc1 = 0 <= end1; asc1 ? j < end1 : j > end1; asc1 ? j++ : j--) { heatmapper(`.pvtVal.col${j}`); } break;
        }

        heatmapper(".pvtTotal.rowTotal");
        heatmapper(".pvtTotal.colTotal");

        return this;
    };

    /*
    Barchart post-processing
    */

    return $.fn.barchart = function(opts) {
        const numRows = this.data("numrows");
        const numCols = this.data("numcols");

        const barcharter = scope => {
            const forEachCell = f => {
                return this.find(scope).each(function() {
                    const x = $(this).data("value");
                    if ((x != null) && isFinite(x)) { return f(x, $(this)); }
                });
            };

            const values = [];
            forEachCell(x => values.push(x));
            let max = Math.max(...Array.from(values || []));
            if (max < 0) {
                max = 0;
            }
            let range = max;
            const min = Math.min(...Array.from(values || []));
            if (min < 0) {
                range = max - min;
            }
            const scaler = x => (100*x)/(1.4*range);
            return forEachCell(function(x, elem) {
                const text = elem.text();
                const wrapper = $("<div>").css({
                    "position": "relative",
                    "height": "55px"
                });
                let bgColor = "gray";
                let bBase = 0;
                if (min < 0) {
                    bBase = scaler(-min);
                }
                if (x < 0) {
                    bBase += scaler(x);
                    bgColor = "darkred";
                    x = -x;
                }
                wrapper.append($("<div>").css({
                    "position": "absolute",
                    "bottom": bBase + "%",
                    "left": 0,
                    "right": 0,
                    "height": scaler(x) + "%",
                    "background-color": bgColor
                })
                );
                wrapper.append($("<div>").text(text).css({
                    "position":"relative",
                    "padding-left":"5px",
                    "padding-right":"5px"
                })
                );

                return elem.css({"padding": 0,"padding-top": "5px", "text-align": "center"}).html(wrapper);
            });
        };

        for (let i = 0, end = numRows, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) { barcharter(`.pvtVal.row${i}`); }
        barcharter(".pvtTotal.colTotal");

        return this;
    };
});

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}