sap.ui.define([
    "sap/ui/core/format/DateFormat",
], 
function (DateFormat) {
    "use strict";

    return {
        /**
         * Formato Status
         */
        DraftStatusStateFormat: function(valor) {
            if (valor) {
                if (valor === "") {
                    return sap.ui.core.MessageType.Success;
                } else if (valor === "2") {
                    return sap.ui.core.MessageType.Error;
                } else {
                    return sap.ui.core.MessageType.None;
                }
            } else {
                return sap.ui.core.MessageType.Success;
            }
        },
        InvoiceStatusFormat: function()
        {
            
        }

    };

});