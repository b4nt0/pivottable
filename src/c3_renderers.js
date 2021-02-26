/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const callWithJQuery = function(pivotModule) {
    if ((typeof exports === "object") && (typeof module === "object")) { // CommonJS
        return pivotModule(require("jquery"), require("c3"));
    } else if ((typeof define === "function") && define.amd) { // AMD
        return define(["jquery", "c3"], pivotModule);
    // Plain browser env
    } else {
        return pivotModule(jQuery, c3);
    }
};

callWithJQuery(function($, c3) {

    const makeC3Chart = function(chartOpts) { if (chartOpts == null) { chartOpts = {}; } return function(pivotData, opts) {
        let colKey, columns, groupByTitle, hAxisTitle, rowKey, scatterData, series, titleText, vAxisTitle, y;
        let c, x;
        const defaults = {
            localeStrings: {vs: "vs", by: "by"},
            c3: {}
        };

        opts = $.extend(true, {}, defaults, opts);
        if (opts.c3.size == null) { opts.c3.size = {}; }
        if (opts.c3.size.width == null) { opts.c3.size.width = window.innerWidth / 1.4; }
        if (opts.c3.size.height == null) { opts.c3.size.height = (window.innerHeight / 1.4) - 50; }
        if (chartOpts.type == null) { chartOpts.type = "line"; }
        if (chartOpts.horizontal == null) { chartOpts.horizontal = false; }
        if (chartOpts.stacked == null) { chartOpts.stacked = false; }

        const rowKeys = pivotData.getRowKeys();
        if (rowKeys.length === 0) { rowKeys.push([]); }
        const colKeys = pivotData.getColKeys();
        if (colKeys.length === 0) { colKeys.push([]); }

        let headers = (Array.from(colKeys).map((h) => h.join("-")));
        let rotationAngle = 0;

        let fullAggName = pivotData.aggregatorName;
        if (pivotData.valAttrs.length) {
            fullAggName += `(${pivotData.valAttrs.join(", ")})`;
        }

        if (chartOpts.type === "scatter") {
            scatterData = {x:{}, y:{}, t:{}};
            const attrs = pivotData.rowAttrs.concat(pivotData.colAttrs);
            vAxisTitle = attrs[0] != null ? attrs[0] : "";
            hAxisTitle = attrs[1] != null ? attrs[1] : "";
            groupByTitle = attrs.slice(2).join("-");
            titleText = vAxisTitle;
            if (hAxisTitle !== "") { titleText += ` ${opts.localeStrings.vs} ${hAxisTitle}`; }
            if (groupByTitle !== "") { titleText += ` ${opts.localeStrings.by} ${groupByTitle}`; }
            for (rowKey of Array.from(rowKeys)) {
                for (colKey of Array.from(colKeys)) {
                    const agg = pivotData.getAggregator(rowKey, colKey);
                    if (agg.value() != null) {
                        const vals = rowKey.concat(colKey);
                        series = vals.slice(2).join("-");
                        if (series === "") { series = "series"; }
                        if (scatterData.x[series] == null) { scatterData.x[series] = []; }
                        if (scatterData.y[series] == null) { scatterData.y[series] = []; }
                        y = vals[0] != null ? vals[0] : 0;
                        x = vals[1] != null ? vals[1] : 0;
                        scatterData.y[series].push(y);
                        scatterData.x[series].push(x);
                        if (scatterData.t[series] == null) { scatterData.t[series] = {}; }
                        if (scatterData.t[series][x] == null) { scatterData.t[series][x] = {}; }
                        scatterData.t[series][x][y] = agg.value();
                    }
                }
            }
        } else {
            let numCharsInHAxis = 0;
            for (x of Array.from(headers)) {
                numCharsInHAxis += x.length;
            }
            if (numCharsInHAxis > 50) {
                rotationAngle = 45;
            }

            columns = [];
            for (rowKey of Array.from(rowKeys)) {
                const rowHeader = rowKey.join("-");
                const row = [rowHeader === "" ? fullAggName : rowHeader];
                for (colKey of Array.from(colKeys)) {
                    const val = parseFloat(pivotData.getAggregator(rowKey, colKey).value());
                    if (isFinite(val)) {
                        row.push(val);
                    } else {
                        row.push(null);
                    }
                }
                columns.push(row);
            }

            vAxisTitle = fullAggName;

            if (chartOpts.horizontal) {
                hAxisTitle = pivotData.rowAttrs.join("-");
                groupByTitle = pivotData.colAttrs.join("-");
            } else {
                hAxisTitle = pivotData.colAttrs.join("-");
                groupByTitle = pivotData.rowAttrs.join("-");
            }
            titleText = fullAggName;
            if (hAxisTitle !== "") { titleText += ` ${opts.localeStrings.vs} ${hAxisTitle}`; }
            if (groupByTitle !== "") { titleText += ` ${opts.localeStrings.by} ${groupByTitle}`; }
        }

        const title = $("<p>", {style: "text-align: center; font-weight: bold"});
        title.text(titleText);

        const formatter = pivotData.getAggregator([], []).format;

        let params = {
            axis: {
                rotated: chartOpts.horizontal,
                y: {
                    label: vAxisTitle,
                    tick: {}
                },
                x: {
                    label: hAxisTitle,
                    tick: {
                        rotate: rotationAngle,
                        multiline: false
                    }
                }
            },
            data: {
                type: chartOpts.type,
                order: null
            },
            tooltip: {
                grouped: false
            },
            color: {
                pattern: [ "#3366cc", "#dc3912", "#ff9900", "#109618",
                           "#990099", "#0099c6", "#dd4477", "#66aa00",
                           "#b82e2e", "#316395", "#994499", "#22aa99",
                           "#aaaa11", "#6633cc", "#e67300", "#8b0707",
                           "#651067", "#329262", "#5574a6", "#3b3eac" ]
            }
        };


        params = $.extend(true, {}, params, opts.c3);
        if (chartOpts.type === "scatter") {
            const xs = {};
            let numSeries = 0;
            const dataColumns = [];
            for (let s in scatterData.x) {
                numSeries += 1;
                xs[s] = s+"_x";
                dataColumns.push([s+"_x"].concat(scatterData.x[s]));
                dataColumns.push([s].concat(scatterData.y[s]));
            }
            params.data.xs = xs;
            params.data.columns = dataColumns;
            params.axis.x.tick = {fit: false};
            if (numSeries === 1) {
                params.legend = {show: false};
            }
            params.tooltip.format = {
                title() { return fullAggName; },
                name() { return ""; },
                value(a,b,c,d,e) {
                    ({name: series, value: y, x} = e[0]);
                    return formatter(scatterData.t[series][x][y]);
                }
            };
        } else {
            let categories;
            params.axis.x.type= 'category';
            if (params.axis.y.tick.format == null) { params.axis.y.tick.format = v => formatter(v); }
            params.tooltip.format = {value(v) { return formatter(v); }};

            if (chartOpts.horizontal) {
                categories = ((() => {
                    const result1 = [];
                    for (c of Array.from(columns)) {                         result1.push(c.shift());
                    }
                    return result1;
                })());
                if ((categories.length === 1) && (categories[0] === fullAggName)) {
                    categories = [""];
                }
                params.axis.x.categories = categories;
                if ((headers.length === 1) && (headers[0] === "")) {
                    headers = [fullAggName];
                }
                columns.unshift(headers);
                params.data.rows = columns;
            } else {
                params.axis.x.categories = headers;
                params.data.columns = columns;
            }
        }


        if (chartOpts.stacked) {
            if (chartOpts.horizontal) {
                params.data.groups = [(() => {
                    const result2 = [];
                    for (x of Array.from(colKeys)) {                         result2.push(x.join("-"));
                    }
                    return result2;
                })()];
            } else {
                params.data.groups = [(() => {
                    const result3 = [];
                    for (x of Array.from(rowKeys)) {                         result3.push(x.join("-"));
                    }
                    return result3;
                })()];
            }
        }

        const renderArea = $("<div>", {style: "display:none;"}).appendTo($("body"));
        const result = $("<div>").appendTo(renderArea);
        params.bindto = result[0];
        c3.generate(params);
        result.detach();
        renderArea.remove();
        return $("<div>").append(title, result);
    }; };

    return $.pivotUtilities.c3_renderers = {
        "Horizontal Bar Chart": makeC3Chart({type: "bar", horizontal: true}),
        "Horizontal Stacked Bar Chart": makeC3Chart({type: "bar", stacked: true, horizontal: true}),
        "Bar Chart": makeC3Chart({type: "bar"}),
        "Stacked Bar Chart": makeC3Chart({type: "bar", stacked: true}),
        "Line Chart": makeC3Chart(),
        "Area Chart": makeC3Chart({type: "area", stacked: true}),
        "Scatter Chart": makeC3Chart({type: "scatter"})
    };
});
