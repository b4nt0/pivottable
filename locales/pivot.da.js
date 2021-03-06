/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
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
    const nf = $.pivotUtilities.numberFormat;
    const tpl = $.pivotUtilities.aggregatorTemplates;

    const r = nf({
            thousandsSep: ".",
            decimalSep: ","
        });

    const t = nf({
            digitsAfterDecimal: 0,
            thousandsSep: ".",
            decimalSep: ","
        });

    const o = nf({
            digitsAfterDecimal: 1,
            scaler: 100,
            suffix: "%",
            thousandsSep: ".",
            decimalSep: ","
        });

    return $.pivotUtilities.locales.da = { 
        localeStrings: { 
            renderError: "Der opstod en fejl, mens du trak i feltet",
            computeError: "Der opstod en fejl ved beregningen af feltet",
            uiRenderError: "Der opstod en fejl, mens den grafiske brugerflade blev beregnet",
            selectAll: "Vælg alle",
            selectNone: "Vælg ingen",
            tooMany: "(for mange værdier til at vise)",
            filterResults: "Filter værdier",
            totals: "I alt",
            vs: "vs",
            by: "af"
        },
        aggregators: { 
            "Antal": tpl.count(t),
            "Antal Unikke værdier": tpl.countUnique(t),
            "Liste unikke værdier": tpl.listUnique(", "),
            "Sum": tpl.sum(r),
            "Sum i heltal": tpl.sum(t),
            "Gennemsnit": tpl.average(r),
            "Minimum": tpl.min(r),
            "Maximum": tpl.max(r),
            "Sum iforhold til sum": tpl.sumOverSum(r),
            "Sum iforhold til sum, øverst 80%": tpl.sumOverSumBound80(!0, r),
            "Sum iforhold til sum, lavest  80%": tpl.sumOverSumBound80(!1, r),
            "Andel af i alt sum": tpl.fractionOf(tpl.sum(), "total", o),
            "Andel af række sum": tpl.fractionOf(tpl.sum(), "row", o),
            "Andel af kolonner sum": tpl.fractionOf(tpl.sum(), "col", o),
            "Andel af i alt antal": tpl.fractionOf(tpl.count(), "total", o),
            "Andel af række antal": tpl.fractionOf(tpl.count(), "row", o),
            "Andel af kolonner antal": tpl.fractionOf(tpl.count(), "col", o)
        },
        renderers: { 
            "Tabel": $.pivotUtilities.renderers.Table,
            "Tabel med søjler": $.pivotUtilities.renderers["Table Barchart"],
            "Heatmap": $.pivotUtilities.renderers.Heatmap,
            "Heatmap per række": $.pivotUtilities.renderers["Row Heatmap"],
            "Heatmap per kolonne": $.pivotUtilities.renderers["Col Heatmap"]
        }
    };});
