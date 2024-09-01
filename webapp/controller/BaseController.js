sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/generic/app/navigation/service/NavigationHandler"
],
    function (Controller, NavigationHandler) {
        "use strict";

        return Controller.extend("ns.asa.zappuploadinvoices.controller.BaseController", {
            onInit: function () {

            },
            getRouter: function () {
                return sap.ui.core.UIComponent.getRouterFor(this);
            },
            getModel: function (object) {
                return this.getView().getModel(object);
            },
            getResourceBundle: function () {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },
            onRefresh: function () {
                this.getView().getModel().refresh(true);
            },
            getJsDateFromExcel: function (excelDate) 
            {
                //let dateConvert = new Date(Math.round(value - 25569)  * 86400 * 1000); 
                const SECONDS_IN_DAY = 24 * 60 * 60;
                const MISSING_LEAP_YEAR_DAY = SECONDS_IN_DAY * 1000;
                const MAGIC_NUMBER_OF_DAYS = (25567 + 2);
                if (!Number(excelDate)) {
                  return false;
                }

                const delta = excelDate - MAGIC_NUMBER_OF_DAYS;
                const parsed = delta * MISSING_LEAP_YEAR_DAY;
                const date = new Date(parsed)

                return date
            }
        });
    });
