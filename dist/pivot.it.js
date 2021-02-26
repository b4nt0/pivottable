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

  const frFmt =    nf({thousandsSep: " ", decimalSep: ","});
  const frFmtInt = nf({digitsAfterDecimal: 0, thousandsSep: " ", decimalSep: ","});
  const frFmtPct = nf({digitsAfterDecimal: 1, scaler: 100, suffix: "%", thousandsSep: " ", decimalSep: ","});

  return $.pivotUtilities.locales.it = {
    localeStrings: {
      renderError: "Si è verificato un errore durante la creazione della tabella.",
      computeError: "Si è verificato un errore di calcolo nella tabella.",
      uiRenderError: "Si è verificato un errore durante il disegno di interfaccia della tabella pivot.",
      selectAll: "Seleziona tutto",
      selectNone: "Deseleziona tutto",
      tooMany: "(troppi valori da visualizzare)",
      filterResults: "Filtra i valori",
      apply: "Applica",
      cancel: "Annulla",
      totals: "Totali",
      vs: "su",
      by: "da"
    },

    aggregators: {
      "Numero":                             tpl.count(frFmtInt),
      "Numero di valori unici":             tpl.countUnique(frFmtInt),
      "Elenco di valori unici":             tpl.listUnique(", "),
      "Somma":                              tpl.sum(frFmt),
      "Somma intera":                       tpl.sum(frFmtInt),
      "Media":                              tpl.average(frFmt),
      "Minimo":                             tpl.min(frFmt),
      "Massimo":                            tpl.max(frFmt),
      "Rapporto":                           tpl.sumOverSum(frFmt),
      "Limite superiore 80%":               tpl.sumOverSumBound80(true, frFmt),
      "limite inferiore 80%":               tpl.sumOverSumBound80(false, frFmt),
      "Somma proporzionale al totale":      tpl.fractionOf(tpl.sum(),   "total", frFmtPct),
      "Somma proporzionale alla riga":      tpl.fractionOf(tpl.sum(),   "row",   frFmtPct),
      "Somma proporzionale alla colonna":   tpl.fractionOf(tpl.sum(),   "col",   frFmtPct),
      "Numero proporzionale al totale":     tpl.fractionOf(tpl.count(), "total", frFmtPct),
      "Numero proporzionale alla riga":     tpl.fractionOf(tpl.count(), "row",   frFmtPct),
      "Numero proporzionale alla colonna":  tpl.fractionOf(tpl.count(), "col",   frFmtPct)
    },

    renderers: {
      "Tabella":                           $.pivotUtilities.renderers["Table"],
      "Tabella con grafico":               $.pivotUtilities.renderers["Table Barchart"],
      "Mappa di calore":                   $.pivotUtilities.renderers["Heatmap"],
      "Mappa di calore per righe":         $.pivotUtilities.renderers["Row Heatmap"],
      "Mappa di calore per colonne":       $.pivotUtilities.renderers["Col Heatmap"]
    }
  };});



//# sourceMappingURL=pivot.it.js.map
