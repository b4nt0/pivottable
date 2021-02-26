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

    return $.pivotUtilities.locales.ru = { 
        localeStrings: {
            renderError: "Ошибка рендеринга страницы.",
            computeError: "Ошибка табличных расчетов.",
            uiRenderError: "Ошибка во время прорисовки и динамического расчета таблицы.",
            selectAll: "Выбрать все",
            selectNone: "Снять выделение",
            tooMany: "(Выбрано слишком много значений)",
            filterResults: "Возможные значения",
            totals: "Всего",
            vs: "на",
            by: "с"
        },

        aggregators: { 
            "Кол-во": tpl.count(frFmtInt),
            "Кол-во уникальных": tpl.countUnique(frFmtInt),
            "Список уникальных": tpl.listUnique(", "),
            "Сумма": tpl.sum(frFmt),
            "Сумма целых": tpl.sum(frFmtInt),
            "Среднее": tpl.average(frFmt),
            "Минимум": tpl.min(frFmt),
            "Максимум": tpl.max(frFmt),
            "Сумма по сумме": tpl.sumOverSum(frFmt),
            "80% верхней границы": tpl.sumOverSumBound80(true, frFmt),
            "80% нижней границы": tpl.sumOverSumBound80(false, frFmt),
            "Доля по всему": tpl.fractionOf(tpl.sum(), "total", frFmtPct),
            "Доля по строке": tpl.fractionOf(tpl.sum(), "row", frFmtPct),
            "Доля по столбцу": tpl.fractionOf(tpl.sum(), "col", frFmtPct),
            "Кол-во по всему": tpl.fractionOf(tpl.count(), "total", frFmtPct),
            "Кол-во по строке": tpl.fractionOf(tpl.count(), "row", frFmtPct),
            "Кол-во по столбцу": tpl.fractionOf(tpl.count(), "col", frFmtPct)
        },

        renderers: {
            "Таблица": $.pivotUtilities.renderers["Table"],
            "График столбцы": $.pivotUtilities.renderers["Table Barchart"], // TODO придумать более понятный вариант
            "Тепловая карта": $.pivotUtilities.renderers["Heatmap"],
            "Тепловая карта по строке": $.pivotUtilities.renderers["Row Heatmap"],
            "Тепловая карта по столбцу": $.pivotUtilities.renderers["Col Heatmap"]
        }
    };});


//# sourceMappingURL=pivot.ru.js.map
