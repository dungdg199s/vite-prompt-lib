/**
 *
 * @param {string} preasheetId - The ID of the Google Spreadsheet
 * @param {Object} options - Conversion options
 * @returns {string} - The converted markdown content
 */
export const convertPreashetToMarkdown = (preasheetId, options = {}) => {
  const preasheet = SpreadsheetApp.openById(preasheetId);
  let sheets = preasheet.getSheets();

  if (options.sheets) {
    sheets = sheets.filter((sheet) => options.sheets.includes(sheet.getName()));
  }

  let markdownContent = `# ${preasheet.getName()}\n\n`;

  for (const sheet of sheets) {
    markdownContent += `## ${sheet.getName()}\n\n`;

    // convert sheet content to markdown table
    let data = sheet.getDataRange().getValues();
    if (options.includeEmptyRows === false) {
      data = data.filter((row) => row.some((cell) => cell !== ""));
    }

    if (data.length > 0) {
      const header = options.headerRow ? data[options.headerRow - 1] : [];
      const rows = options.headerRow ? data.slice(options.headerRow) : data;

      if (header.length > 0) {
        markdownContent += `| ${header.join(" | ")} |\n`;
        markdownContent += `| ${header.map(() => "---").join(" | ")} |\n`;
      } else {
        // Header default is Column1, Column2, ...
        const defaultHeader = rows[0].map((_, index) => `Column${index + 1}`);
        markdownContent += `| ${defaultHeader.join(" | ")} |\n`;
        markdownContent += `| ${defaultHeader.map(() => "---").join(" | ")} |\n`;
      }
      for (const row of rows) {
        markdownContent += `| ${row.join(" | ")} |\n`;
      }
      markdownContent += `\n`;
    }
  }
  return markdownContent;
};

export const convertPreashetToJSON = (preasheetId, options = {}) => {
  const preasheet = SpreadsheetApp.openById(preasheetId);
  let sheets = preasheet.getSheets();

  if (options.sheets) {
    sheets = sheets.filter((sheet) => options.sheets.includes(sheet.getName()));
  }

  const jsonContent = {
    name: preasheet.getName(),
    sheets: [],
  };

  for (const sheet of sheets) {
    let data = sheet.getDataRange().getValues();
    if (options.includeEmptyRows === false) {
      data = data.filter((row) => row.some((cell) => cell !== ""));
    }

    const sheetData = {
      name: sheet.getName(),
      data: [],
    };

    if (data.length > 0) {
      const header = options.headerRow ? data[options.headerRow - 1] : [];
      const rows = options.headerRow ? data.slice(options.headerRow) : data;

      if (header.length > 0) {
        for (const row of rows) {
          const rowObj = {};
          for (let i = 0; i < header.length; i++) {
            rowObj[header[i]] = row[i] || "";
          }
          sheetData.data.push(rowObj);
        }
      } else {
        for (const row of rows) {
          const rowObj = {};
          for (let i = 0; i < row.length; i++) {
            rowObj[`Column${i + 1}`] = row[i] || "";
          }
          sheetData.data.push(rowObj);
        }
      }
    }

    jsonContent.sheets.push(sheetData);
  }

  return jsonContent;
};
