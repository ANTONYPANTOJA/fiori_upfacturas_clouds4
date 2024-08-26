sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/m/MessageBox',
    "ns/asa/zappuploadinvoices/controller/BaseController",
],
function (Controller,MessageBox,BaseController) {
    "use strict";
    
    return BaseController.extend("ns.asa.zappuploadinvoices.controller.MainList", {
        onInit: function () {
        
          //Inicializar el Modelo
        
         let dataModelTableList = this.getOwnerComponent().getModel("ModelDetailReport");
         this.getView().setModel(dataModelTableList, "detailReport");

        },
        onFileChange: function()
        {
            let body = {};
            this.getView().getModel().create("/InvoiceList",body,{

                success: function(){
                 MessageBox.success("ok");
                }.bind(this),
                error: function(e){
                    MessageBox.error("Error" + e);
                }.bind(this)
            });
        }

    });
});
