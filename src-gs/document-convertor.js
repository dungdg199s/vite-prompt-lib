const TEMP_FOLDER_ID = process.env.WORKSPACES_FOLDER_ID;

/**
 *
 * @param {string} preasheetId - The ID of the Google Spreadsheet
 * @param {Object} options - Conversion options
 * @returns {string} - The converted markdown content
 */
export const convertPreashetToMarkdown = (preasheetId, options = {}) => {
  const safeId = getSafeWorkbookId(preasheetId);
  const preasheet = SpreadsheetApp.openById(safeId);
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
  const safeId = getSafeWorkbookId(preasheetId);
  const preasheet = SpreadsheetApp.openById(safeId);
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
            if (row[i] !== "" && row[i] !== undefined && row[i] !== null) {
              rowObj[`Column${i + 1}`] = row[i] || "";
            }
          }
          sheetData.data.push(rowObj);
        }
      }
    }

    jsonContent.sheets.push(sheetData);
  }

  return jsonContent;
};

export const getSpreadsheetInfo = (id) => {
  const preasheetId = getSafeWorkbookId(id);
  const preasheet = SpreadsheetApp.openById(preasheetId);
  if (!preasheet) {
    throw new Error(`Preasheet "${preasheetId}" not found`);
  }
  const sheetNames = preasheet.getSheets().map((sheet) => sheet.getName());
  return {
    preasheetId,
    preasheetName: preasheet.getName(),
    sheetNames,
  };
};

function getSafeWorkbookId(id) {
  const parentTempFolder = DriveApp.getFolderById(TEMP_FOLDER_ID);
  const file = DriveApp.getFileById(id);
  const mimeType = file.getMimeType();

  // Nếu là Google Sheets thì trả về luôn, không cần xử lý
  if (mimeType === MimeType.GOOGLE_SHEETS) {
    return id;
  }

  // Kiểm tra định dạng Excel
  if (
    mimeType === MimeType.MICROSOFT_EXCEL ||
    mimeType === MimeType.MICROSOFT_EXCEL_LEGACY
  ) {
    const fileName = file.getName();
    const currentLastUpdated = file.getLastUpdated().getTime().toString(); // Lấy timestamp ngày cập nhật
    const props = PropertiesService.getScriptProperties();

    // Đọc dữ liệu đã lưu trong Properties dưới dạng JSON string
    const cachedDataStr = props.getProperty(id);

    if (cachedDataStr) {
      const cachedData = JSON.parse(cachedDataStr);

      // TRƯỜNG HỢP 1: Ngày cập nhật KHÔNG đổi -> Trả về ID file đã có sẵn
      if (cachedData.lastUpdated === currentLastUpdated) {
        try {
          // Kiểm tra xem file cũ còn tồn tại trong Drive không (tránh trường hợp bị xóa tay)
          DriveApp.getFileById(cachedData.convertedId);
          return cachedData.convertedId;
        } catch (e) {
          // Nếu file cũ đã bị xóa, xóa cache cũ và chạy tiếp xuống dưới để tạo file mới
          props.deleteProperty(id);
        }
      }

      // TRƯỜNG HỢP 2: Ngày cập nhật THAY ĐỔI -> Ghi đè nội dung vào file cũ
      else {
        try {
          // Dùng Drive API v2 để cập nhật (ghi đè) nội dung mới từ file Excel vào ID Google Sheet cũ
          Drive.Files.update({}, cachedData.convertedId, file.getBlob(), {
            convert: true,
          });

          // Cập nhật lại ngày LastUpdated mới vào Properties
          cachedData.lastUpdated = currentLastUpdated;
          props.setProperty(id, JSON.stringify(cachedData));

          return cachedData.convertedId;
        } catch (e) {
          // Nếu ghi đè lỗi (ví dụ file cũ nằm trong thùng rác), tiến hành tạo file mới ở bước dưới
        }
      }
    }

    // TRƯỜNG HỢP 3: Chưa từng convert hoặc file cũ không còn khả dụng -> Tạo file mới hoàn toàn
    const resource = {
      name: fileName.replace(".xlsx", ""),
      mimeType: MimeType.GOOGLE_SHEETS,
      parents: [parentTempFolder.getId()],
    };

    const convertedFile = Drive.Files.create(resource, file.getBlob());
    const tempSheetId = convertedFile.id;

    // Lưu thông tin file mới vào Properties để dùng cho các lần sau
    const dataToCache = {
      convertedId: tempSheetId,
      lastUpdated: currentLastUpdated,
    };
    props.setProperty(id, JSON.stringify(dataToCache));

    return tempSheetId;
  }

  throw new Error("File format is not supported. Check file id: " + id);
}
