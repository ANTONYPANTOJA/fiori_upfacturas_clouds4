sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/generic/app/navigation/service/NavigationHandler",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "ns/asa/zappuploadinvoices/libs/xlsxfullmin",
    "ns/asa/zappuploadinvoices/libs/JSZIP",
    /* "ns/asa/zappuploadinvoices/libs/moment",*/
    "sap/ui/core/routing/History",
    "sap/ui/comp/navpopover/LinkData",
],
    function (Controller, NavigationHandler, MessageBox, MessageToast, XLSX, JSZIP,History,LinkData) {
        "use strict";

        return Controller.extend("ns.asa.zappuploadinvoices.controller.BaseController", {

            constructor: function() {
                this.sLocalContainerKey = "fin.ap.lineitems";
				this.sPrefix = "fin.ap.lineitems.display";
            },
            
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
            setRouterNavTo: function (router) {
                let oRouter = this.getOwnerComponent().getRouter();
                oRouter.navTo(router, true);
            },
            onPressExit: function (Route,origenRoute) {
                //Clear Variables
                this._ClearAllObjects(origenRoute);

                //Back
                let oHistory = History.getInstance();
                let sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else {
                    this.setRouterNavTo(Route);
                }
            },

            _ClearAllObjects: function (origenRoute){
                try {

                    if (origenRoute == "DetailLog") {
                        this.clearDetailsLog();
                    }else if(origenRoute == "RouteApp"){
                        this.clearMainList();
                    }
                    
                } catch (error) {
                    console.error("Error Function: _ClearAllObjects ",error)
                }
            },
            clearDetailsLog: function(){
                try {
                	/*Clear la tabla del Detalle */
			        const oTable = this.getView().byId("messageLogTab");
                    if (oTable) {
                        oTable.removeAllRows();
                        oTable.unbindRows();
                        oTable.unbindRows().getModel().refresh(true);
                    }
                    /** Limpiar el Modelo */

                const modelDetailLog = this.getOwnerComponent().getModel("LogDetails");
                    if (modelDetailLog) {
                        modelDetailLog.setData([]);
                        modelDetailLog.updateBindings(true);
                        modelDetailLog.refresh();
                        modelDetailLog.destroy();
                    }
                } catch (error) {
                    console.error("Error Function: clearDetailsLog ",error) 
                }
            },
            clearMainList: function(){
                try {
                    this.deleteDataSession();
                    this.clearModel();
                } catch (error) {
                    console.error("Error Function: clearMainList ",error) 
                }
            },
            onNavTargetsObtained: function(oEvent) {
				this.openPopover(oEvent,"");
			},
            openPopover: function(oEvent, sSelfNavigationText) {
				// This event handler is called after oParameters.open(), which was triggered by onBeforePopoverOpens.
				let oEventParameters = oEvent.getParameters();
				let oDataForm ;

                try {

				let aActions = this.modifyPopoverActions(oEventParameters, oEventParameters.semanticObject, sSelfNavigationText);
				oEventParameters.show(undefined, aActions, oDataForm); // opens the popover
                } catch (error) {
                   console.error("Error Function: openPopover - SemanticView ",error) 
                }
			},
            modifyPopoverActions: function(oEventParameters, sSemanticObject, sSelfNavigationText) {

                let aActions = [];
                let oNavArguments = {};
                if (!this.oCrossApplicationNavigation) {
					this.oCrossApplicationNavigation = sap.ushell.Container.getService("CrossApplicationNavigation");
				}
                
                if (sSemanticObject == "AccountingDocument") 
                    {
					// Special handling for AccountingDocument to remove navigation to createSinglePayment;
					// Special handling for AccountingDocument to remove navigation to resetClearedItems
					// (AccountingDocument and FiscalYear would be handed over instead of ClearingAccountingDocument and ClearingFiscalYear);
					// Remove action "manage" (app Manage Jounrnal Entries) as navigation to it will be inserted at top of popover below in code
				    let bSuppressResetClearedItemsLink = false;
					let oSmartLink = this.byId(oEventParameters.originalId);
                    
                    let oURLParsing = sap.ushell.Container.getService("URLParsing");
					let bActionManageGranted = false;
                    
                    for (var i = 0; i < oEventParameters.actions.length; i++) {
						var sAction = oURLParsing.parseShellHash(oEventParameters.actions[i].getHref()).action;
						if (sAction === "manage") {
							bActionManageGranted = true;
						}
						if (sAction !== "createSinglePayment" && sAction !== "manage" &&
						   (sAction !== "resetClearedItems" || !bSuppressResetClearedItemsLink)) {
							aActions.push(oEventParameters.actions[i]);
						}
					}

                    // insert links to journal entry line item and journal entry (header) at top of popover actions available
					if (bActionManageGranted === true) {
						oNavArguments = {
							target: {
								semanticObject: sSemanticObject,
								action: "manage"
							},
							params: {}
					};

                    	// Semantic attributes are already set by processBeforeSmartLinkPopoverOpens, thus they are available in oEventParameters
						// Navigation to journal entry header (don't provide line item number)
						oNavArguments.params[sSemanticObject] = oEventParameters.semanticAttributes[sSemanticObject];
						oNavArguments.params.CompanyCode = oEventParameters.semanticAttributes.CompanyCode;
						oNavArguments.params.FiscalYear = oEventParameters.semanticAttributes.FiscalYear;

                        						// construct new link to journal entry header
						let sExternalHash = this.oCrossApplicationNavigation.hrefForExternal(oNavArguments,this.getOwnerComponent());
						let sInternalHash = this.externalToInternalHash(sExternalHash);
						let sKey = this.sPrefix + ".customLink.manageJournalEntryHeader";
						let oLinkData = new LinkData({
							text: this.getResourceBundle().getText("POPOVER_JE_HEADER_LINK"),
							href: sInternalHash,
							key: sKey
						});

                        // insert link "Manage Journal Entry" (header) at second position
						aActions.unshift(oLinkData);
                   }
                   return aActions; 
                }
            },
            externalToInternalHash: function(sExternalHash){
				return decodeURIComponent(sExternalHash);
			},
            generateUniqSerial: function()
            {  
                return 'xxxx-xxxx-xxx-xxxx'.replace(/[x]/g, (c) => {  
                    const r = Math.floor(Math.random() * 16);  
                    return r.toString(16);  
              });  
            }

        });
    });
