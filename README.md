# Mediciones Preventivas PTAR — VEOLIA

Aplicación web de Google Apps Script asociada a una hoja de cálculo de Google.
Permite registrar mediciones preventivas de equipos y consultar los datos ya
registrados por número de OT.

## Archivos

| Archivo | Descripción |
| --- | --- |
| `Codigo.gs` | Código del lado del servidor (Google Apps Script). |
| `Formulario.html` | Interfaz de usuario (HTML + CSS + JavaScript) servida por `doGet()`. |

> En el editor de Apps Script el archivo `Formulario.html` debe llamarse
> **Formulario**, ya que `doGet()` lo carga con
> `HtmlService.createHtmlOutputFromFile('Formulario')`.

## Hojas de cálculo utilizadas

| Hoja | Columnas | Uso |
| --- | --- | --- |
| `TÉCNICOS` | A: nombre | Llena el desplegable de técnicos. |
| `CAMPOS` | A: CAMPO, B: TIPO DE DATO, C: OBLIGATORIO, D: ETIQUETAS | Define los campos dinámicos del formulario. |
| `EQUIPOS` | A: CÓDIGO, B: NOMBRE, C: ESTACIÓN, D: INSTRUCTIVO, E: INSUMOS, F: ETIQUETAS | Búsqueda de equipo por código (`E-000000` / `K-000000`). |
| `DATOS` | Encabezados en la fila 1 | Destino de los registros y origen de la consulta por OT. |

## Funcionamiento

1. **Formulario**: el usuario elige técnico e ingresa el código del equipo
   (prefijo `E-`/`K-` conmutable + número que se completa a 6 dígitos). Al
   encontrarlo se muestran nombre, estación, instructivo/insumos y los campos
   dinámicos filtrados por las etiquetas del equipo.
2. **Resumen**: valida los campos obligatorios, genera un texto resumen y, con
   *Copiar Texto y Enviar*, lo copia al portapapeles y guarda la fila en la
   hoja `DATOS` (`guardarDatos`).
3. **Consulta OT**: busca una OT en la hoja `DATOS` (`buscarDatosPorOT`) y
   muestra los valores no vacíos para copiarlos.

## Funciones del servidor

- `doGet()` — sirve la interfaz.
- `obtenerTecnicos()` — lista de técnicos.
- `obtenerCampos()` — configuración de campos dinámicos.
- `buscarEquipo(codigo)` — datos del equipo por código.
- `guardarDatos(datos)` — agrega una fila en `DATOS` mapeando por encabezado.
- `buscarDatosPorOT(ot)` — devuelve los pares campo/valor de una OT.
