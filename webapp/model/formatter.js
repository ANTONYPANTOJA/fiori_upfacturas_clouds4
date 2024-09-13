sap.ui.define([
    "sap/ui/core/format/DateFormat",
    "ns/asa/zappuploadinvoices/model/excelBase64",
],
    function (DateFormat, ExcelBase64) {
        "use strict";

        return {
            
            KeyTextFormat: function(k, t) {
                if (t) {
                    return k + " (" + t + ")";
                } else {
                    return k;
                }
            },
            InvoiceWithYear: function(n, y) {
                if (!n) {
                    return "";
                } else if (!y) {
                    return n;
                } else {
                    return n + "/" + y;
                }
            },
            /**
             * Formato Status
             */
            DraftStatusStateFormat: function (InvoiceStatus, CodeSend) {
                if (InvoiceStatus) {
                    switch (InvoiceStatus) {
                        case "0":
                            return sap.ui.core.MessageType.None;     //Borrador
                        case "1":
                            return sap.ui.core.MessageType.Warning;     //Pendiente Respuesta
                        case "2":
                            return sap.ui.core.MessageType.Success;  //Verificado con éxito
                        case "3":
                            return sap.ui.core.MessageType.Error;    //Verificado con errores
                        case "4":
                            return sap.ui.core.MessageType.Success; //Contabilización con éxito
                        case "5":
                            return sap.ui.core.MessageType.Error;   //Contabilización con errores
                        default:
                            break;
                    }
                } else {
                    return sap.ui.core.MessageType.None;
                }
            },

            base64ToFileExcel: function () {

                const base64String = ExcelBase64.DraftStatusStateFormat();
                let mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                let fileName = 'Plantilla.xlsx';

                // Remove data URL scheme if present
                const base64Data = base64String.replace(/^data:.+;base64,/, '');
                const byteCharacters = atob(base64Data); // Decode Base64 string
                const byteNumbers = new Array(byteCharacters.length);

                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });
                const url = URL.createObjectURL(blob);

                // Create a link element to download the file
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();

                // Cleanup
                URL.revokeObjectURL(url);
            }



        };

    });