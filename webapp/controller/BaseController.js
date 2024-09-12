sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/generic/app/navigation/service/NavigationHandler",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "ns/asa/zappuploadinvoices/libs/xlsxfullmin",
    "ns/asa/zappuploadinvoices/libs/JSZIP",
    "ns/asa/zappuploadinvoices/libs/moment",
],
    function (Controller, NavigationHandler, MessageBox, MessageToast, XLSX, JSZIP) {
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
                }

                switch (key) {
                    case "0":
                        if (text) {
                            return key + " (" + text + ")";
                        }else {
                            return key + " (" + oModel.getText("statusCero") + ")";
                        }
                    case "1":
                        if (text) {
                            return key + " (" + text + ")";
                        }else {
                            return key + " (" + oModel.getText("statusUno") + ")";
                        }
                    case "2":
                        if (text) {
                            return key + " (" + text + ")";
                        }else {
                            return key + " (" + oModel.getText("statusDos") + ")";
                        }
                    case "3":
                        if (text) {
                            return key + " (" + text + ")";
                        }else {
                            return key + " (" + oModel.getText("statusTres") + ")";
                        }
                    case "4":
                        if (text) {
                            return key + " (" + text + ")";
                        }else {
                            return key + " (" + oModel.getText("statusCuatro") + ")";
                        }
                    case "5":
                        if (text) {
                            return key + " (" + text + ")";
                        }else {
                            return key + " (" + oModel.getText("statusQuinto") + ")";
                        }
                    default:
                        break;
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
            /**
            * Dowloand Template Excel
            * @public
            */
            downloadFile: function (sTitle, oFile) {
                var linkPN = document.createElement('a');
                linkPN.href = oFile;
                linkPN.download = sTitle;
                linkPN.style.display = 'none';
                document.body.appendChild(linkPN);
                linkPN.click();
                document.body.removeChild(linkPN);
            },
            getRandom: function (min, max) {
                return Math.floor((Math.random() * (max - min + 1)) + min);
            },
            getDateNow: function () {
                const date = moment();
                return date.format();
            },
            showMessageToast: function (idMsg) {
                let oboundle = this.getResourceBundle();
                MessageToast.show(oboundle.getText(idMsg));
            },
            onExit: function () {
                this.deleteDataSession();
                this.clearModel();
            }

        });
    });
