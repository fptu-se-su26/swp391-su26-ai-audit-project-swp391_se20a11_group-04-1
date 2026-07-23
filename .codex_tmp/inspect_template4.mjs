import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "D:/FPTU/kì 5/SWP391/git/Template4_Issues Report.xlsx";
const blob = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(blob);

async function printInspect(label, options) {
  const result = await workbook.inspect(options);
  console.log(`\n=== ${label} ===`);
  console.log(result.ndjson);
}

await printInspect("Workbook overview", {
  kind: "workbook,sheet,table,definedName,drawing",
  maxChars: 10000,
  tableMaxRows: 8,
  tableMaxCols: 12,
  tableMaxCellChars: 120,
});

await printInspect("Main sheet region A1:L40", {
  kind: "region",
  sheetId: "Issues Report",
  range: "A1:L40",
  maxChars: 12000,
});

await printInspect("Main sheet table A1:L40 values formulas", {
  kind: "table",
  sheetId: "Issues Report",
  range: "A1:L40",
  include: "values,formulas",
  tableMaxRows: 40,
  tableMaxCols: 12,
  tableMaxCellChars: 160,
  maxChars: 20000,
});

await printInspect("Formula scan", {
  kind: "formula",
  maxChars: 5000,
  options: { maxResults: 100 },
});

await printInspect("Style sample A1:L12", {
  kind: "computedStyle",
  sheetId: "Issues Report",
  range: "A1:L12",
  maxChars: 8000,
});

const outputDir = ".codex_tmp";
const preview = await workbook.render({
  sheetName: "Issues Report",
  range: "A1:L25",
  scale: 1,
  format: "png",
});
await fs.writeFile(`${outputDir}/template4_issues_report_preview.png`, new Uint8Array(await preview.arrayBuffer()));
console.log("\n=== Preview ===");
console.log(`${outputDir}/template4_issues_report_preview.png`);
