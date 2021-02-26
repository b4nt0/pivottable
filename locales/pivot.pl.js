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

    const plFmt =    nf({thousandsSep: " ", decimalSep: ","});
    const plFmtInt = nf({digitsAfterDecimal: 0, thousandsSep: " ", decimalSep: ","});
    const plFmtPct = nf({digitsAfterDecimal: 1, scaler: 100, suffix: "%", thousandsSep: " ", decimalSep: ","});

    return $.pivotUtilities.locales.pl = {
        localeStrings: {
            renderError: "Wystąpił błąd podczas renderowania wyników PivotTable.",
            computeError: "Wystąpił błąd podczas obliczania wyników PivotTable.",
            uiRenderError: "Wystąpił błąd podczas renderowania UI PivotTable.",
            selectAll: "Zaznacz wszystko",
            selectNone: "Odznacz wszystkie",
            tooMany: "(za dużo do wylistowania)",
            filterResults: "Filtruj wartości",
            apply: "Zastosuj",
            cancel: "Anuluj",
            totals: "Podsumowanie",
            vs: "vs",
            by: "przez"
        },

        aggregators: { 
            "Liczba":                       tpl.count(plFmtInt),
            "Liczba Unikatowych Wartości":  tpl.countUnique(plFmtInt),
            "Lista Unikatowych Wartości":   tpl.listUnique(", "),
            "Suma":                         tpl.sum(plFmt),
            "Całkowita Suma":               tpl.sum(plFmtInt),
            "Średnia":                      tpl.average(plFmt),
            "Minimum":                      tpl.min(plFmt),
            "Maksimum":                     tpl.max(plFmt),
            "Pierwszy":                     tpl.first(plFmt),
            "Ostatni":                      tpl.last(plFmt),
            "Suma po Sumie":                tpl.sumOverSum(plFmt),
            "80% Kres Dolny":               tpl.sumOverSumBound80(true, plFmt),
            "80% Kres Górny":               tpl.sumOverSumBound80(false, plFmt),
            "Suma jako Ułamek Całości":     tpl.fractionOf(tpl.sum(),       "total", plFmtPct),
            "Suma jako Ułamek w Wierszach":     tpl.fractionOf(tpl.sum(),   "row",   plFmtPct),
            "Suma jako Ułamek w Kolumnach":     tpl.fractionOf(tpl.sum(),   "col",   plFmtPct),
            "Liczba jako Ułamek Całości":       tpl.fractionOf(tpl.count(), "total", plFmtPct),
            "Liczba jako Ułamek w Wierszach":   tpl.fractionOf(tpl.count(), "row",   plFmtPct),
            "Liczba jako Ułamek w Kolumnach":   tpl.fractionOf(tpl.count(), "col",   plFmtPct)
        },

        renderers: {
            "Tabela":                       $.pivotUtilities.renderers["Table"],
            "Tabela z Wykresem Słupkowym":  $.pivotUtilities.renderers["Table Barchart"],
            "Mapa cieplna":                 $.pivotUtilities.renderers["Heatmap"],
            "Mapa cieplna po Wierszach":    $.pivotUtilities.renderers["Row Heatmap"],
            "Mapa cieplna po Kolumnach":    $.pivotUtilities.renderers["Col Heatmap"]
        }
    };});
