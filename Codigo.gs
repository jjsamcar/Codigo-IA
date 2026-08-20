function doGet() {
  return HtmlService.createHtmlOutputFromFile('Formulario')
    .setTitle('Mediciones Preventivas - VEOLIA')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function obtenerTecnicos() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('TÉCNICOS');

    if (!sheet) {
      throw new Error('No se encontró la hoja TÉCNICOS');
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return [];
    }

    const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    return data.map(row => row[0]).filter(nombre => nombre !== '' && nombre !== null);

  } catch (error) {
    Logger.log('Error en obtenerTecnicos: ' + error.toString());
    throw error;
  }
}

function obtenerCampos() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('CAMPOS');

    if (!sheet) {
      throw new Error('No se encontró la hoja CAMPOS');
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return [];
    }

    // Columnas: CAMPO (A), TIPO DE DATO (B), OBLIGATORIO (C), ETIQUETAS (D)
    const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    return data
      .filter(row => row[0] !== '' && row[0] !== null)
      .map(row => ({
        campo: String(row[0]).trim(),
        tipo: String(row[1]).trim(),
        obligatorio: String(row[2] || '').trim().toUpperCase() === 'SI',
        etiquetas: String(row[3] || '').split(',').map(e => e.trim().toUpperCase()).filter(e => e !== '')
      }));

  } catch (error) {
    Logger.log('Error en obtenerCampos: ' + error.toString());
    throw error;
  }
}

function buscarEquipo(codigo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('EQUIPOS');

    if (!sheet) {
      throw new Error('No se encontró la hoja EQUIPOS');
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return null;
    }

    // Columnas: CÓDIGO (A), NOMBRE (B), ESTACIÓN (C), INSTRUCTIVO (D), INSUMOS (E), ETIQUETAS (F)
    const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();

    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === codigo) {
        return {
          nombre: data[i][1],
          estacion: data[i][2],
          instructivo: data[i][3] || '',
          insumos: data[i][4] || '',
          etiquetas: String(data[i][5] || '').split(',').map(e => e.trim().toUpperCase()).filter(e => e !== '')
        };
      }
    }
    return null;

  } catch (error) {
    Logger.log('Error en buscarEquipo: ' + error.toString());
    throw error;
  }
}

function guardarDatos(datos) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('DATOS');

    if (!sheet) {
      throw new Error('No se encontró la hoja DATOS');
    }

    const lastColumn = sheet.getLastColumn();
    if (lastColumn === 0) {
      throw new Error('La hoja DATOS no tiene encabezados. Por favor, agregue los encabezados en la primera fila.');
    }

    const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

    const ahora = new Date();
    const fechaRegistro = Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    const nuevaFila = headers.map(header => {
      const h = String(header).toUpperCase().trim();
      if (h === 'FECHA DE REGISTRO') return fechaRegistro;
      return datos.hasOwnProperty(header) ? datos[header] : '';
    });

    sheet.appendRow(nuevaFila);

    return {
      success: true,
      message: 'Datos guardados correctamente en la fila ' + sheet.getLastRow()
    };

  } catch (error) {
    Logger.log('Error en guardarDatos: ' + error.toString());
    return {
      success: false,
      message: 'Error al guardar: ' + error.toString()
    };
  }
}

function buscarDatosPorOT(ot) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('DATOS');

    if (!sheet) {
      throw new Error('No se encontró la hoja DATOS');
    }

    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();

    if (lastRow < 2 || lastColumn === 0) {
      return {
        encontrado: false,
        mensaje: 'No hay datos en la hoja'
      };
    }

    const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

    let columnaOT = -1;
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i]).toUpperCase().trim();
      if (header.includes('OT') || header.includes('ORDEN DE TRABAJO')) {
        columnaOT = i;
        break;
      }
    }

    if (columnaOT === -1) {
      return {
        encontrado: false,
        mensaje: 'No se encontró la columna de OT en la hoja DATOS'
      };
    }

    const data = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();

    const otBuscada = String(ot).trim().toUpperCase();
    let filaEncontrada = null;

    for (let i = 0; i < data.length; i++) {
      const valorOT = String(data[i][columnaOT]).trim().toUpperCase();
      if (valorOT === otBuscada) {
        filaEncontrada = data[i];
        break;
      }
    }

    if (!filaEncontrada) {
      return {
        encontrado: false,
        mensaje: 'No se encontró la OT: ' + ot
      };
    }

    const resultado = [];

    for (let i = 0; i < headers.length; i++) {
      if (i === 1) continue; // Saltar columna TÉCNICO

      const header = String(headers[i]).trim();
      const valor = filaEncontrada[i];

      if (
        header !== '' &&
        valor !== '' &&
        valor !== null &&
        valor !== undefined
      ) {
        let valorFinal;

        if (valor instanceof Date) {
          valorFinal = Utilities.formatDate(
            valor,
            Session.getScriptTimeZone(),
            'dd/MM/yyyy'
          );
        } else {
          valorFinal = String(valor).trim();
        }

        resultado.push([header, valorFinal]);
      }
    }

    return {
      encontrado: true,
      datos: resultado
    };

  } catch (error) {
    Logger.log('Error en buscarDatosPorOT: ' + error.toString());
    return {
      encontrado: false,
      mensaje: 'Error al buscar: ' + error.toString()
    };
  }
}