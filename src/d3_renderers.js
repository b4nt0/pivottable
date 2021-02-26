/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const callWithJQuery = function(pivotModule) {
    if ((typeof exports === "object") && (typeof module === "object")) { // CommonJS
        return pivotModule(require("jquery"), require("d3"));
    } else if ((typeof define === "function") && define.amd) { // AMD
        return define(["jquery", "d3"], pivotModule);
    // Plain browser env
    } else {
        return pivotModule(jQuery, d3);
    }
};

callWithJQuery(($, d3) => $.pivotUtilities.d3_renderers = { Treemap(pivotData, opts) {
    let value;
    const defaults = {
        localeStrings: {},
        d3: {
            width() { return $(window).width() / 1.4; },
            height() { return $(window).height() / 1.4; }
        }
    };

    opts = $.extend(true, {}, defaults, opts);


    const result = $("<div>").css({width: "100%", height: "100%"});

    const tree = {name: "All", children: []};
    var addToTree = function(tree, path, value) {
        if (path.length === 0) {
            tree.value = value;
            return;
        }
        if (tree.children == null) { tree.children = []; }
        const x = path.shift();
        for (let child of Array.from(tree.children)) {
            if (child.name === x) {
                addToTree(child, path, value);
                return;
            }
        }
        const newChild = {name: x};
        addToTree(newChild, path, value);
        return tree.children.push(newChild);
    };

    for (let rowKey of Array.from(pivotData.getRowKeys())) {
        value = pivotData.getAggregator(rowKey, []).value();
        if (value != null) {
            addToTree(tree, rowKey, value);
        }
    }

    const color = d3.scale.category10();
    const width = opts.d3.width();
    const height = opts.d3.height();

    const treemap = d3.layout.treemap()
        .size([width, height])
        .sticky(true)
        .value( d => d.size);

    d3.select(result[0])
        .append("div")
            .style("position", "relative")
            .style("width", width + "px")
            .style("height", height + "px")
        .datum(tree).selectAll(".node")
            .data(treemap.padding([15,0,0,0]).value( d => d.value).nodes)
        .enter().append("div")
        .attr("class", "node")
        .style("background", function(d) { if (d.children != null) { return "lightgrey"; } else { return color(d.name); }  })
        .text( d => d.name)
        .call(function() {
                this.style("left",  d => d.x+"px")
                    .style("top",   d => d.y+"px")
                    .style("width", d => Math.max(0, d.dx - 1)+"px")
                    .style("height",d => Math.max(0, d.dy - 1)+"px");
    });

    return result;
}
});



