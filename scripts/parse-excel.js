const fs = require('fs');
const path = require('path');

const sharedStringsXml = fs.readFileSync(path.join(process.env.TEMP, 'xlsx_inspect', 'xl', 'sharedStrings.xml'), 'utf8');
const strings = [];
const sRegex = /<si\b[^>]*>(.*?)<\/si>/gs;
let match;
while ((match = sRegex.exec(sharedStringsXml)) !== null) {
    const tRegex = /<t\b[^>]*>(.*?)<\/t>/g;
    let tMatch;
    let text = '';
    while ((tMatch = tRegex.exec(match[1])) !== null) {
        text += tMatch[1];
    }
    strings.push(text);
}

function parseSheet(sheetXmlPath) {
    const xml = fs.readFileSync(sheetXmlPath, 'utf8');
    const rowRegex = /<row\b[^>]*\br="(\d+)"[^>]*>(.*?)<\/row>/gs;
    const rows = [];
    let rMatch;
    while ((rMatch = rowRegex.exec(xml)) !== null) {
        const rowNum = rMatch[1];
        const rowContent = rMatch[2];
        const cRegex = /<c\b([^>]*)>(?:<f[^>]*>.*?<\/f>)?(?:<v>([^<]*)<\/v>)?(?:<is><t>([^<]*)<\/t><\/is>)?<\/c>/gs;
        let cMatch;
        const row = {};
        while ((cMatch = cRegex.exec(rowContent)) !== null) {
            const attrs = cMatch[1];
            const val = cMatch[2];
            const isText = cMatch[3];
            
            const rAttr = (attrs.match(/\br="([A-Z]+)\d+"/) || [])[1];
            const tAttr = (attrs.match(/\bt="([^"]+)"/) || [])[1];
            
            if (!rAttr) continue;
            let value = '';
            if (isText !== undefined) {
                value = isText;
            } else if (tAttr === 's' && val !== undefined) {
                value = strings[parseInt(val, 10)] || '';
            } else if (val !== undefined) {
                value = val;
            }
            row[rAttr] = value;
        }
        rows.push({ rowNum, row });
    }
    return rows;
}

console.log('=== DEPARTMENTS ===');
const depts = parseSheet(path.join(process.env.TEMP, 'xlsx_inspect', 'xl', 'worksheets', 'sheet2.xml'));
depts.forEach(r => console.log(r.rowNum + ': ' + JSON.stringify(r.row)));

console.log('=== EMPLOYEES ===');
const emps = parseSheet(path.join(process.env.TEMP, 'xlsx_inspect', 'xl', 'worksheets', 'sheet3.xml'));
emps.forEach(r => console.log(r.rowNum + ': ' + JSON.stringify(r.row)));
