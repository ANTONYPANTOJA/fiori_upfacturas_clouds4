sap.ui.define([
    "sap/ui/core/format/DateFormat",
    "ns/asa/zappuploadinvoices/model/excelBase64",
], 
function (DateFormat,ExcelBase64) {
    "use strict";

    return {
        /**
         * Formato Status
         */
        DraftStatusStateFormat: function(InvoiceStatus,ActionCheckProcess,ActionContaProcess,CodeSend) {
            if (InvoiceStatus) {

                if (ActionCheckProcess == "X" || ActionContaProcess == "X") {
                    switch (CodeSend) {
                        case "E":
                            return sap.ui.core.MessageType.Error;
                            case "S":
                                return sap.ui.core.MessageType.Success;                                
                        default:
                            return sap.ui.core.MessageType.Warning;
                        }
            
                } else {

                if(InvoiceStatus == "0"){
                  return sap.ui.core.MessageType.None;
                }
                else if (InvoiceStatus === "A") {
                    return sap.ui.core.MessageType.Success;
                } else if (InvoiceStatus === "2") {
                    return sap.ui.core.MessageType.Error;
                } else {
                    return sap.ui.core.MessageType.None;
                } }
            }
        },

        base64ToFileExcel: function()
        {

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