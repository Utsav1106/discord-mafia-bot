export const inWords = (num: number): string => {
    if (num === 0) {
        return 'zero';
    }

    const a: string[] = [
        '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
        'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
    ];
    const b: string[] = [
        '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
    ];

    const numStr = num.toString();

    if (numStr.length > 9) {
        return 'overflow';
    }

    const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);

    if (!n) {
        return '';
    }

    let str = '';

    str += (n[1] !== '00') ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + ' crore ' : '';
    str += (n[2] !== '00') ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + ' lakh ' : '';
    str += (n[3] !== '00') ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + ' thousand ' : '';
    str += (n[4] !== '0') ? a[Number(n[4])] + ' hundred ' : '';
    if (n[5] !== '00') {
        str += (str !== '') ? 'and ' : '';
        str += (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]);
    }
    if (n[5] !== '00' && str.endsWith(a[Number(n[5][1])])) {
        str += ' only';
    } else if (n[5] !== '00') {
        str += ' only';
    }
    return str.trim().replace(/\s\s+/g, ' ');
};


export const sleep = (time: number) => {
    return new Promise((resolve) => setTimeout(resolve, time));
}
