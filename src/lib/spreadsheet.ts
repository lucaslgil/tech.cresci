import ExcelJS from 'exceljs'

type CellValue = ExcelJS.CellValue

function unwrapCell(value: CellValue): unknown {
  if (value === null || value === undefined) return undefined
  if (value instanceof Date) return value
  if (typeof value === 'object') {
    if ('richText' in value) return (value as ExcelJS.CellRichTextValue).richText.map(r => r.text).join('')
    if ('result' in value) return unwrapCell((value as ExcelJS.CellFormulaValue).result as CellValue)
    if ('error' in value) return undefined
  }
  return value
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readSpreadsheet(file: File): Promise<any[]> {
  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const worksheet = workbook.worksheets[0]
  if (!worksheet) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = []
  let headers: string[] = []

  worksheet.eachRow((row, rowNumber) => {
    const values = row.values as CellValue[]
    if (rowNumber === 1) {
      headers = values.slice(1).map(v => String(unwrapCell(v) ?? ''))
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: any = {}
      headers.forEach((h, i) => {
        obj[h] = unwrapCell(values[i + 1])
      })
      rows.push(obj)
    }
  })

  return rows
}

export async function downloadSpreadsheet(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[],
  sheetName: string,
  filename: string,
  headers?: string[],
  colWidths?: Record<string, number>,
  defaultColWidth = 20
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName)

  const keys = headers ?? (data.length > 0 ? Object.keys(data[0]) : [])
  worksheet.columns = keys.map(key => ({
    header: key,
    key,
    width: colWidths?.[key] ?? defaultColWidth
  }))

  for (const row of data) {
    worksheet.addRow(keys.map(k => row[k]))
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
