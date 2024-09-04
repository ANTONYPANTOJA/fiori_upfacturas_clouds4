sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/generic/app/navigation/service/NavigationHandler",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
],
    function (Controller, NavigationHandler, MessageBox, MessageToast) {
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
            /**
 * Convenience method for setting the view model.
 * @public
 * @param {sap.ui.model.Model} oModel the model instance
 * @param {string} sName the model name
 * @returns {sap.ui.mvc.View} the view instance
 */
            setModel: function (oModel, sName) {
                return this.getView().setModel(oModel, sName);
            },

            getResourceBundle: function () {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },
            onRefresh: function () {
                this.getView().getModel().refresh(true);
            },
            getJsDateFromExcel: function (excelDate) {
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
            },
            InvoiceStatusFormat: function (key, text) {
                const oModel = this.getResourceBundle();
                if (!key && !text) {
                    return "";
                } else if (key === "0") {
                    return "0 " + "(" + oModel.getText("statusCero") + ")";
                } else {
                    return key + "(" + text + ")";
                }

            },
            onDisplayMessageBoxPress: function (type, idText) {
                let oboundle = this.getResourceBundle();
                switch (type) {
                    case 'E':
                        MessageBox.error(oboundle.getText(idText));
                        break;
                    case 'C':
                        MessageBox.confirm(oboundle.getText(idText));
                        break;
                    case 'I':
                        MessageBox.information(oboundle.getText(idText));
                        break;
                    case 'S':
                        MessageBox.success(oboundle.getText(idText));
                        break;
                    default:
                        break;
                }

            },
            /**
             * Show message busy fragment
             * @param {sap.ui.model.Model} oModel the model instance
             * @public
             */
            showBusyText: function (idText) {

                const model = this.getModel('model');
                model.setProperty("/load/message", this.getResourceBundle().getText(idText));

                if (!this._BusyFragment) {
                    this._BusyFragment = sap.ui.xmlfragment("ns.asa.zappuploadinvoices.view.fragments.Busy", this);
                    this.getView().addDependent(this._BusyFragment);
                }

                this._BusyFragment.open();
            },

            /**
             * Hide message busy fragment
             * @public
             */
            hideBusyText: function () {
                if (this._BusyFragment)
                    this._BusyFragment.close();
            },

        });
    });
