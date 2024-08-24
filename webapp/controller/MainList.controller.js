sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
function (Controller) {
    "use strict";

    return Controller.extend("ns.asa.zappuploadinvoices.controller.MainList", {
        onInit: function () {
        
          //Inicializar el Modelo
        
         let dataModelTableList = this.getOwnerComponent().getModel("ModelDetailReport");
         this.getView().setModel(dataModelTableList, "detailReport");

        }
    });
});
