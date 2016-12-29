'use strict';
(function (window) {
    var digits = [
            '零',
            '一',
            '二',
            '三',
            '四',
            '五',
            '六',
            '七',
            '八',
            '九'
        ], subScale = [
            '',
            '',
            '十',
            '百',
            '千'
        ], scale = [
            '',
            '万',
            '亿',
            '兆'
        ], scaleSize = 4;
    var digitsPinyin = [
            'líng',
            'yī',
            'èr',
            'sān',
            'sì',
            'wǔ',
            'liù',
            'qī',
            'bā',
            'jiǔ'
        ], subScalePinyin = [
            '',
            '',
            'shí',
            'bǎi',
            'qiān'
        ], scalePinyin = [
            '',
            'wàn',
            'yì',
            'zhào'
        ], pinyin = {};
    digits.forEach(function (digit, index) {
        pinyin[digit] = digitsPinyin[index];
    });
    subScale.forEach(function (word, index) {
        if (word !== '')
            pinyin[word] = subScalePinyin[index];
    });
    scale.forEach(function (word, index) {
        if (word !== '')
            pinyin[word] = scalePinyin[index];
    });
    pinyin['点'] = 'diǎn';
    pinyin['负'] = 'fù';
    function sanitise(strVal) {
        var val = strVal.toString().replace(/[\,\s]/g, '');
        val = val.replace(/^0+(?!\.)/, '');
        if (val.indexOf('.') >= 0 && /0*$/.test(val)) {
            val = val.replace(/0*$/, '');
        }
        if (isNaN(parseFloat(val)))
            throw new Error('Please input only numbers');
        return val;
    }
    function translateDigit(strDigit) {
        return digits[parseInt(strDigit)];
    }
    function translateSection(arrDigit, scaleLevel) {
        if (arrDigit.length > scaleSize)
            throw new Error('Section should only have $(scaleSize) digits');
        var subScaleLevelIndex = arrDigit.length, intEndIndex = arrDigit.join('').search(/0+$/), strOutput = '';
        intEndIndex = intEndIndex === -1 ? arrDigit.length : intEndIndex;
        for (var digitIndex = 0; digitIndex < intEndIndex; digitIndex++) {
            if (window.CP.shouldStopExecution(1)) {
                break;
            }
            var digit = arrDigit[digitIndex];
            strOutput += translateDigit(digit) + (digit !== '0' ? subScale[subScaleLevelIndex] : '');
            subScaleLevelIndex--;
        }
        window.CP.exitedLoop(1);
        if (arrDigit.join('') === '10') {
            strOutput = strOutput.slice(-1);
        } else {
            if (arrDigit.length === 2 && arrDigit[0] === '1') {
                strOutput = strOutput.slice(-2);
            }
        }
        return strOutput + scale[scaleLevel === undefined ? 0 : scaleLevel];
    }
    function translateInteger(strVal, scaleLevel) {
        if (strVal.toString().length > scale.length * scaleSize) {
            throw new Error('chNum only supports up to 16 digits');
        }
        var arrDigit = strVal.toString().split(''), section = arrDigit.splice(-scaleSize, scaleSize), translatedSection = translateSection(section, scaleLevel).replace(/零+/, '零');
        if (!!arrDigit.length) {
            return translateInteger(arrDigit.join(''), (scaleLevel === undefined ? 0 : scaleLevel) + 1) + translatedSection;
        } else {
            return translatedSection;
        }
    }
    function translateFractional(strVal) {
        return strVal.toString().split('').map(function (strDigit) {
            return translateDigit(strDigit);
        }).join('');
    }
    function romaniser(strChinese) {
        return strChinese.split('').map(function (digit) {
            return pinyin[digit];
        });
    }
    function chNum(strVal) {
        var _a = sanitise(strVal).split('.'), integer = _a[0], fractional = _a[1], isNegative = integer.indexOf('-') === 0;
        if (isNegative)
            integer = integer.replace('-', '');
        var outInteger = translateInteger(integer), outFractional = !!fractional ? translateFractional(fractional) : false, output = '';
        if (isNegative)
            output += '负';
        if (!!outFractional) {
            output += (outInteger === '' ? translateDigit(0) : outInteger) + '点' + outFractional;
        } else {
            output += outInteger;
        }
        return {
            chinese: output.split(''),
            romanised: romaniser(output)
        };
    }
    window.chNum = chNum;
}(window));
(function (window) {
    function measureText(txt, font) {
        var id = 'text-width-tester', $tag = $('#' + id);
        if (!$tag.length) {
            $tag = $('<span id="' + id + '" style="display:none;font:' + font + ';">' + txt + '</span>');
            $('body').append($tag);
        } else {
            $tag.css({ font: font }).html(txt);
        }
        return {
            width: $tag.width(),
            height: $tag.height()
        };
    }
    function shrinkToFill(input, fontSize, fontWeight, fontFamily) {
        var $input = $(input), txt = $input.val(), maxWidth = $input.width() + 5, font = fontWeight + ' ' + fontSize + 'pt ' + fontFamily;
        var textWidth = measureText(txt, font).width;
        if (textWidth > maxWidth) {
            fontSize = fontSize * maxWidth / textWidth * 0.9;
            font = fontWeight + ' ' + fontSize + 'pt ' + fontFamily;
            $input.css({ font: font });
        } else {
            $input.css({ font: font });
        }
    }
    function table_shrinkToFill(table, measuredRowIndex, fontSize, fontWeight, fontFamily) {
        var row = $('tr', table)[measuredRowIndex], cells = $('td', row), cellMaxWidth = $(cells[0]).width() + 5, textWidths = [], textMaxWidth, font = fontWeight + ' ' + fontSize + 'pt ' + fontFamily;
        Array.prototype.forEach.call(cells, function (cell) {
            textWidths.push(measureText(cell.innerText, font).width);
        });
        textMaxWidth = Math.max.apply(Math, textWidths);
        if (textMaxWidth > cellMaxWidth) {
            font = fontWeight + ' ' + fontSize * cellMaxWidth / textMaxWidth * 0.9 + 'pt ' + fontFamily;
        }
        $('.output-table td').css({ font: font });
    }
    ;
    window.measureText = measureText;
    window.shrinkToFill = shrinkToFill;
    window.table_shrinkToFill = table_shrinkToFill;
}(window));
$(document).ready(function () {
    var input = $('#input');
    input.keyup(function () {
        shrinkToFill(this, 100, '', '\'Reem Kufi\', san-serif');
        var translated = chNum(this.value), table = $('.output-table');
        table.empty();
        $('.output').append(tabulate(translated));
        table_shrinkToFill(table[0], 1, 40, '', '\'Noto Sans SC\', sans-serif');
    });
    input.val(3.14159265);
    input.keyup();
    function tabulate(translated) {
        var table = $('.output-table');
        [
            translated.chinese,
            translated.romanised
        ].forEach(function (str) {
            var row = $('<tr></tr>');
            str.forEach(function (char, index) {
                row.append($('<td></td>').text(char));
            });
            table.append(row);
        });
        return table;
    }
});
