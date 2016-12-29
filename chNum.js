(function(window) {
    
    /*
        一   1
        十   10
        百   100
        千   1000
        
        一万 10000 1
        十万 10000 10
        百万 10000 100
        千万 10000 1000
        
        一亿 10000 10000 1    
        十亿 10000 10000 10
        百亿 10000 10000 100
        千亿 10000 10000 1000
        
        一兆 10000 10000 10000
    */
    
    let digits: string[] = ['零','一','二','三','四','五','六','七','八','九'],
        // Fourth digit is a thousandth, hence the array is padded
        // so that '千' can be on index number 4
        subScale: string[] = ['', '', '十','百','千'],
        scale: string[] = ['', '万','亿','兆'],
        scaleSize: number = 4;
    
    // Pinyin / romanised translation of the numbers
    let digitsPinyin: string[] = ['líng','yī','èr','sān','sì','wǔ','liù','qī','bā','jiǔ'],
        subScalePinyin = ['', '', 'shí', 'bǎi', 'qiān'],
        scalePinyin = ['', 'wàn', 'yì', 'zhào'],
        pinyin = {};
    
    digits.forEach((digit, index) => {
        pinyin[digit] =  digitsPinyin[index];
    });
    subScale.forEach((word, index) => {
        if(word !== '')
            pinyin[word] = subScalePinyin[index];
    });
    scale.forEach((word, index) => {
        if(word !== '')
            pinyin[word] = scalePinyin[index];
    });
    pinyin['点'] = 'diǎn';
    pinyin['负'] = 'fù';
    
    // Validates input, removes whitespaces and commas from the number
    function sanitise(strVal: string) : string {
        // remove whitespaces, commas
        let val: string = strVal.toString().replace(/[\,\s]/g, '');
        
        // remove front zeros
        val = val.replace(/^0+(?!\.)/,'');
        
        // remove trailing zeros that are after the decimal point 
        if(val.indexOf('.') >= 0 && /0*$/.test(val)){
            val = val.replace(/0*$/, '');
        }
        // 1.00 -> 1
        // 0.10 -> 0.1
        // 00.1 -> 0.1
        
        if(isNaN(parseFloat(val)))
            throw new Error('Please input only numbers');
        
        return val;
    }    
    
    // Translates digits 0 - 9
    function translateDigit(strDigit: string) : string {
        return digits[parseInt(strDigit)];
    }
    
    // Translates a section of the Integer part
    function translateSection(arrDigit: string[], scaleLevel: number) : string {
        if(arrDigit.length > scaleSize)
            throw new Error(`Section should only have $(scaleSize) digits`);
        
        let subScaleLevelIndex: number = arrDigit.length,
            intEndIndex: number = arrDigit.join('').search(/0+$/),
            strOutput: string = '';
        
        intEndIndex = (intEndIndex === -1)? arrDigit.length : intEndIndex;
        
        for(let digitIndex = 0; digitIndex < intEndIndex; digitIndex++){
            let digit = arrDigit[digitIndex];
            strOutput += translateDigit(digit) + ((digit !== '0')? subScale[subScaleLevelIndex] : '');
            subScaleLevelIndex--;
        }
        
        // Ten should only be displayed as 十
        if(arrDigit.join('') === '10'){
            strOutput = strOutput.slice(-1);
        }
        else {
            // Numbers > 10 and < 20 can be either in the format of 十一 or 一十一,
            // depending on the presence of a larger scale.
            if(arrDigit.length === 2 && arrDigit[0] === '1'){
                strOutput = strOutput.slice(-2);
            }
        }
        return strOutput + scale[(scaleLevel === undefined) ? 0 : scaleLevel];
    }
    
    // Translate Integer part of the number
    function translateInteger(strVal: string, scaleLevel: number) : string {
        if(strVal.toString().length > scale.length * scaleSize) {
            throw new Error('chNum only supports up to 16 digits');
        }
        
        let arrDigit: number[] = strVal.toString().split(''),
            section: number[] = arrDigit.splice(-scaleSize, scaleSize),
            translatedSection: string = translateSection(section, scaleLevel).replace(/零+/, '零');
        
        if(!!arrDigit.length) {
            return translateInteger(
                arrDigit.join(''),
                (scaleLevel === undefined ? 0 : scaleLevel) + 1
            ) + translatedSection;
        }
        else {
            return translatedSection;
        }
    }
    
    // Translate Fractional part of the number
    function translateFractional(strVal: string) : string {
        return strVal.toString().split('').map(strDigit => {
            return translateDigit(strDigit);
        }).join('');
    }
    
    function romaniser(strChinese: string): string[] {
        return strChinese.split('').map((digit) => {
            return pinyin[digit];
        });
    }
    
    function chNum(strVal: string) {
        
        let [integer, fractional] = sanitise(strVal).split('.'),
            isNegative = (integer.indexOf('-') === 0);
        
        if(isNegative)
            integer = integer.replace('-', '');
        
        let outInteger = translateInteger(integer),
            outFractional = (!!fractional) ? translateFractional(fractional) : false,
            output = '';
        
        if(isNegative)
            output += '负';
        
        if(!!outFractional) {
            output += ((outInteger === '') ? translateDigit(0) : outInteger) + '点' + outFractional
        }
        else {
            output += outInteger;
        }
        
        return {
            chinese: output.split(''),
            romanised: romaniser(output)
        };       
    }
    
    window.chNum = chNum;
}(window));

(function(window) {
    /*  
        The functions 'measureText' and 'shrinkToFill' are by the jsfiddle author 'nrabinowitz'.
        See the fiddle here: http://jsfiddle.net/nrabinowitz/9BFQ8/5/
    */
    
    // txt is the text to measure, font is the full CSS font declaration,
    // e.g. "bold 12px Verdana"
    function measureText(txt: string, font: string) : {width: number, height: number}  {
        var id = 'text-width-tester',
            $tag = $('#' + id);
        if (!$tag.length) {
            $tag = $('<span id="' + id + '" style="display:none;font:' + font + ';">' + txt + '</span>');
            $('body').append($tag);
        } else {
            $tag.css({font:font}).html(txt);
        }
        return {
            width: $tag.width(),
            height: $tag.height()
        }
    }
    
    function shrinkToFill(input, fontSize, fontWeight, fontFamily) : void {
        var $input = $(input),
            txt = $input.val(),
            maxWidth = $input.width() + 5, // add some padding
            font = fontWeight + " " + fontSize + "pt " + fontFamily;
        // see how big the text is at the default size
        var textWidth = measureText(txt, font).width;
        if (textWidth > maxWidth) {
            // if it's too big, calculate a new font size
            // the extra .9 here makes up for some over-measures
            fontSize = fontSize * maxWidth / textWidth * .9;
            font = fontWeight + " " + fontSize + "pt " + fontFamily;
            // and set the style on the input
            $input.css({font:font});
        } else {
            // in case the font size has been set small and 
            // the text was then deleted
            $input.css({font:font});
        }
    }
    
    function table_shrinkToFill(table, measuredRowIndex, fontSize, fontWeight, fontFamily) : void {
        let row = $('tr', table)[measuredRowIndex],
            cells = $('td', row),
            cellMaxWidth: number = $(cells[0]).width() + 5,
            textWidths: number[] = [],
            textMaxWidth: number,
            font: string = `${fontWeight} ${fontSize}pt ${fontFamily}`;
        
        Array.prototype.forEach.call(cells, (cell) => {
            textWidths.push(measureText(cell.innerText, font).width);
        });
        
        textMaxWidth = Math.max(...textWidths);
        //console.log(textWidths, textMaxWidth, cellMaxWidth);
        
        if(textMaxWidth > cellMaxWidth){
            font = `${fontWeight} ${fontSize * cellMaxWidth / textMaxWidth * .9}pt ${fontFamily}`;
        }
        $('.output-table td').css({font: font});
    };
    
    window.measureText = measureText;
    window.shrinkToFill = shrinkToFill;
    window.table_shrinkToFill = table_shrinkToFill;
}(window));

$(document).ready(function(){
    let input = $('#input');
    
    input.keyup(function() {
        
        shrinkToFill(this, 100, "", "'Reem Kufi', san-serif");
        
        let translated = chNum(this.value),
            table = $('.output-table');
        
        table.empty();
        $('.output').append(tabulate(translated));
        
        table_shrinkToFill(table[0], 1, 40, "", "'Noto Sans SC', sans-serif");
    });
    
    input.val(3.14159265);
    input.keyup();
    
    function tabulate(translated: { chinese: string, romanised: string[] }) {
        let table = $('.output-table');    

        [translated.chinese, translated.romanised].forEach((str) => {
            let row = $('<tr></tr>');
            str.forEach((char, index) => {
                row.append($('<td></td>').text(char));
            });
            table.append(row);
        });

        return table;
    }
});


