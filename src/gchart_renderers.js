/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
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

    const makeGoogleChart = (chartType, extraOptions) => (function(pivotData, opts) {
        let agg, dataArray, dataTable, hAxisTitle, title, vAxisTitle;
        const defaults = {
            localeStrings: {
                vs: "vs",
                by: "by"
            },
            gchart: {}
        };

        opts = $.extend(true, {}, defaults, opts);
        if (opts.gchart.width == null) { opts.gchart.width = window.innerWidth / 1.4; }
        if (opts.gchart.height == null) { opts.gchart.height = window.innerHeight / 1.4; }

        const rowKeys = pivotData.getRowKeys();
        if (rowKeys.length === 0) { rowKeys.push([]); }
        const colKeys = pivotData.getColKeys();
        if (colKeys.length === 0) { colKeys.push([]); }
        let fullAggName = pivotData.aggregatorName;
        if (pivotData.valAttrs.length) {
            fullAggName += `(${pivotData.valAttrs.join(", ")})`;
        }
        const headers = (Array.from(rowKeys).map((h) => h.join("-")));
        headers.unshift("");

        let numCharsInHAxis = 0;
        if (chartType === "ScatterChart") {
            dataArray = [];
            for (let y in pivotData.tree) {
                const tree2 = pivotData.tree[y];
                for (let x in tree2) {
                    agg = tree2[x];
                     dataArray.push([
                        parseFloat(x),
                        parseFloat(y),
                        fullAggName+": \n"+agg.format(agg.value())
                        ]);
                }
            }
            dataTable = new google.visualization.DataTable();
            dataTable.addColumn('number', pivotData.colAttrs.join("-"));
            dataTable.addColumn('number', pivotData.rowAttrs.join("-"));
            dataTable.addColumn({type: "string", role: "tooltip"});
            dataTable.addRows(dataArray);
            hAxisTitle = pivotData.colAttrs.join("-");
            vAxisTitle = pivotData.rowAttrs.join("-");
            title = "";
        } else {
            dataArray = [headers];
            for (let colKey of Array.from(colKeys)) {
                const row = [colKey.join("-")];
                numCharsInHAxis += row[0].length;
                for (let rowKey of Array.from(rowKeys)) {
                    agg = pivotData.getAggregator(rowKey, colKey);
                    if (agg.value() != null) {
                        const val = agg.value();
                        if ($.isNumeric(val)) {
                            if (val < 1) {
                                row.push(parseFloat(val.toPrecision(3)));
                            } else {
                                row.push(parseFloat(val.toFixed(3)));
                            }
                        } else {
                            row.push(val);
                        }
                    } else { row.push(null); }
                }
                dataArray.push(row);
            }

            dataTable = google.visualization.arrayToDataTable(dataArray);

            title = (vAxisTitle = fullAggName);
            hAxisTitle = pivotData.colAttrs.join("-");
            if (hAxisTitle !== "") { title += ` ${opts.localeStrings.vs} ${hAxisTitle}`; }
            const groupByTitle = pivotData.rowAttrs.join("-");
            if (groupByTitle !== "") { title += ` ${opts.localeStrings.by} ${groupByTitle}`; }
        }

        let options = {
            title,
            hAxis: {title: hAxisTitle, slantedText: numCharsInHAxis > 50},
            vAxis: {title: vAxisTitle},
            tooltip: { textStyle: { fontName: 'Arial', fontSize: 12 } }
        };

        if (chartType === "ColumnChart") {
            options.vAxis.minValue = 0;
        }

        if (chartType === "ScatterChart") {
            options.legend = {position: "none"};
            options.chartArea = {'width': '80%', 'height': '80%'};

        } else if ((dataArray[0].length === 2) && (dataArray[0][1] ===  "")) {
            options.legend = {position: "none"};
        }

        options = $.extend(true, {}, options, opts.gchart, extraOptions);

        const result = $("<div>").css({width: "100%", height: "100%"});
        const wrapper = new google.visualization.ChartWrapper({dataTable, chartType, options});
        wrapper.draw(result[0]);
        result.bind("dblclick", function() {
            const editor = new google.visualization.ChartEditor();
            google.visualization.events.addListener(editor, 'ok', () => editor.getChartWrapper().draw(result[0]));
            return editor.openDialog(wrapper);
        });
        return result;
    });

    return $.pivotUtilities.gchart_renderers = {
        "Line Chart": makeGoogleChart("LineChart"),
        "Bar Chart": makeGoogleChart("ColumnChart"),
        "Stacked Bar Chart": makeGoogleChart("ColumnChart", {isStacked: true}),
        "Area Chart": makeGoogleChart("AreaChart", {isStacked: true}),
        "Scatter Chart": makeGoogleChart("ScatterChart")
    };
});
