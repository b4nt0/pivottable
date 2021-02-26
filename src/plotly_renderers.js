/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const callWithJQuery = function(pivotModule) {
    if ((typeof exports === "object") && (typeof module === "object")) { // CommonJS
        return pivotModule(require("jquery"), require("plotly.js"));
    } else if ((typeof define === "function") && define.amd) { // AMD
        return define(["jquery", "plotly.js"], pivotModule);
    // Plain browser env
    } else {
        return pivotModule(jQuery, Plotly);
    }
};

callWithJQuery(function($, Plotly) {

    const makePlotlyChart = function(traceOptions, layoutOptions, transpose) {
        if (traceOptions == null) { traceOptions = {}; }
        if (layoutOptions == null) { layoutOptions = {}; }
        if (transpose == null) { transpose = false; }
        return function(pivotData, opts) {
            let groupByTitle, hAxisTitle;
            const defaults = {
                localeStrings: {vs: "vs", by: "by"},
                plotly: {},
                plotlyConfig: {}
            };

            opts = $.extend(true, {}, defaults, opts);

            const rowKeys = pivotData.getRowKeys();
            const colKeys = pivotData.getColKeys();
            const traceKeys = transpose ? colKeys : rowKeys;
            if (traceKeys.length === 0) { traceKeys.push([]); }
            const datumKeys = transpose ? rowKeys : colKeys;
            if (datumKeys.length === 0) { datumKeys.push([]); }

            let fullAggName = pivotData.aggregatorName;
            if (pivotData.valAttrs.length) {
                fullAggName += `(${pivotData.valAttrs.join(", ")})`;
            }

            const data = traceKeys.map(function(traceKey) {
                const values = [];
                const labels = [];
                for (let datumKey of Array.from(datumKeys)) {
                    const val = parseFloat(pivotData.getAggregator(
                        transpose ? datumKey : traceKey,
                        transpose ? traceKey : datumKey
                    ).value());
                    values.push(isFinite(val) ? val : null);
                    labels.push(datumKey.join('-') || ' ');
                }

                const trace = {name: traceKey.join('-') || fullAggName};
                if (traceOptions.type === "pie") {
                    trace.values = values;
                    trace.labels = labels.length > 1 ? labels : [fullAggName];
                } else {
                    trace.x = transpose ? values : labels;
                    trace.y = transpose ? labels : values;
                }
                return $.extend(trace, traceOptions);
            });

            if (transpose) {
                hAxisTitle = pivotData.rowAttrs.join("-");
                groupByTitle = pivotData.colAttrs.join("-");
            } else {
                hAxisTitle = pivotData.colAttrs.join("-");
                groupByTitle = pivotData.rowAttrs.join("-");
            }
            let titleText = fullAggName;
            if (hAxisTitle !== "") { titleText += ` ${opts.localeStrings.vs} ${hAxisTitle}`; }
            if (groupByTitle !== "") { titleText += ` ${opts.localeStrings.by} ${groupByTitle}`; }

            const layout = {
                title: titleText,
                hovermode: 'closest',
                width: window.innerWidth / 1.4,
                height: (window.innerHeight / 1.4) - 50
            };

            if (traceOptions.type === 'pie') {
                const columns = Math.ceil(Math.sqrt(data.length));
                const rows = Math.ceil(data.length / columns);
                layout.grid = {columns, rows};
                for (let i in data) {
                    const d = data[i];
                    d.domain = {
                        row: Math.floor(i / columns),
                        column: i - (columns * Math.floor(i / columns)),
                    };
                    if (data.length > 1) {
                        d.title = d.name;
                    }
                }
                if (data[0].labels.length === 1) { layout.showlegend = false; }
            } else {
                layout.xaxis = {
                    title: transpose ? fullAggName : null,
                    automargin: true
                };
                layout.yaxis = {
                    title: transpose ? null : fullAggName,
                    automargin: true
                };
            }


            const result = $("<div>").appendTo($("body"));
            Plotly.newPlot(result[0], data, $.extend(layout, layoutOptions, opts.plotly), opts.plotlyConfig);
            return result.detach();
        };
    };

    const makePlotlyScatterChart = () => (function(pivotData, opts) {
        const defaults = {
            localeStrings: {vs: "vs", by: "by"},
            plotly: {},
            plotlyConfig: {}
        };

        opts = $.extend(true, {}, defaults, opts);

        const rowKeys = pivotData.getRowKeys();
        if (rowKeys.length === 0) { rowKeys.push([]); }
        const colKeys = pivotData.getColKeys();
        if (colKeys.length === 0) { colKeys.push([]); }

        const data = {x: [], y: [], text: [], type: 'scatter', mode: 'markers'};

        for (let rowKey of Array.from(rowKeys)) {
            for (let colKey of Array.from(colKeys)) {
                const v = pivotData.getAggregator(rowKey, colKey).value();
                if (v != null) {
                    data.x.push(colKey.join('-'));
                    data.y.push(rowKey.join('-'));
                    data.text.push(v);
                }
            }
        }

        const layout = {
            title: pivotData.rowAttrs.join("-") + ' vs ' + pivotData.colAttrs.join("-"),
            hovermode: 'closest',
            xaxis: {title: pivotData.colAttrs.join('-'), automargin: true},
            yaxis: {title: pivotData.rowAttrs.join('-'), automargin: true},
            width: window.innerWidth / 1.5,
            height: (window.innerHeight / 1.4) - 50
        };

        const renderArea = $("<div>", {style: "display:none;"}).appendTo($("body"));
        const result = $("<div>").appendTo(renderArea);
        Plotly.newPlot(result[0], [data], $.extend(layout, opts.plotly), opts.plotlyConfig);
        result.detach();
        renderArea.remove();
        return result;
    });

    return $.pivotUtilities.plotly_renderers = {
        "Horizontal Bar Chart": makePlotlyChart({type: 'bar', orientation: 'h'},
            {barmode: 'group'}, true),
        "Horizontal Stacked Bar Chart": makePlotlyChart({type: 'bar', orientation: 'h'},
            {barmode: 'relative'}, true),
        "Bar Chart": makePlotlyChart({type: 'bar'}, {barmode: 'group'}),
        "Stacked Bar Chart": makePlotlyChart({type: 'bar'}, {barmode: 'relative'}),
        "Line Chart": makePlotlyChart(),
        "Area Chart": makePlotlyChart({stackgroup: 1}),
        "Scatter Chart": makePlotlyScatterChart(),
        'Multiple Pie Chart': makePlotlyChart(
            {type: 'pie', scalegroup: 1, hoverinfo: 'label+value', textinfo: 'none'},
            {}, true)
    };
});
