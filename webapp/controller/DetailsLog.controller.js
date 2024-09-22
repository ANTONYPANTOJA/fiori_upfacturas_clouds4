sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "ns/asa/zappuploadinvoices/controller/BaseController",
    "sap/ui/core/Messaging",
    'sap/ui/core/message/Message',
	'sap/ui/core/message/MessageType',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ushell/ui5service/ShellUIService",
	"ns/asa/zappuploadinvoices/model/formatter",
	"sap/ui/core/library",
	"sap/ui/comp/navpopover/SemanticObjectController",
	"sap/ui/comp/navpopover/NavigationPopoverHandler",
],
function (Controller,BaseController,Messaging,Message,MessageType,Filter,FilterOperator,ShellUIService,formatter,CoreLibrary,
		  SemanticObjectController,NavigationPopoverHandler)
 {
    "use strict";
    let that;
	const SortOrder = CoreLibrary.SortOrder;
    return BaseController.extend("ns.asa.zappuploadinvoices.controller.DetailsLog", {
        
        onInit: function () {

            // Set global fields
            that = this;
			this._oFilter = [];
			this._aOrderedFieldName = [];
            this._oView = this.getView();
            this._oLogTable = this._oView.byId("messageLogTab");

            this._MessageManager = Messaging;
            this._MessageManager.registerObject(this._oView.byId("messageHandlingPage"), true);
            this._oView.setModel(this._MessageManager.getMessageModel(), "message");
            //Estilos
			
			this._oView.byId("sbiError-button").addStyleClass("sapMMsgViewBtnError");
			this._oView.byId("sbiWarning-button").addStyleClass("sapMMsgViewBtnWarning");
			this._oView.byId("sbiSuccess-button").addStyleClass("sapMMsgViewBtnSuccess");
			this._oView.byId("sbiInformation-button").addStyleClass("sapMMsgViewBtnInformation");

			
            //Inicializar BACK del Launchpad
            this.oShellUIService = new ShellUIService({
                    scopeObject: this.getOwnerComponent(),
                    scopeType: "component"
                });
            this.oShellUIService.setBackNavigation(this._navBackViewDetailLog.bind(this));

			//Inicializar el oRouter
			let oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("DetailLog").attachPatternMatched(this._onObjectMatched, this);
        },
		formatter:formatter,

        _onObjectMatched: function (oEvent) {
            //this._addMockMessages();
			//this._initSort();
        },
		_initSort: function(){
			try {
				const columnIdExcel = this.getView().byId("columnIdExcel");
				this.getView().byId("messageLogTab").sort(columnIdExcel, SortOrder.Ascending);
			} catch (error) {
			}
		},
        _addMockMessages: function () {
            this._bindTable();
        },
        _bindTable: function(){
            this._oLogTable.bindRows({
				path: "LogDetails>/",
				events: {
					change: this.onChangeRow.bind(this)
				}
			});

			let oSegmentedButton = this._oView.byId("logMessageSegmentButton");
			oSegmentedButton.setSelectedKey("All");
        },
        onChangeRow: function (oEvent) {
            var oReason = oEvent.getParameter("reason");
			if (oReason === "change") {

				var oBinding = this._oLogTable.getBinding("rows");
				var vCountAll = oBinding.getLength();
				var vCountError = 0,
					vCountWarning = 0,
					vCountSuccess = 0,
					vCountInformation = 0;
				
				for (var i = 0; i < vCountAll; i++) {
					if (oBinding.oList[i].CodeSend === "E" || oBinding.oList[i].CodeSend === "A") {
						vCountError = vCountError + 1;
					}
					if (oBinding.oList[i].CodeSend === "W") {
						vCountWarning = vCountWarning + 1;
					}
					if (oBinding.oList[i].CodeSend === "S") {
						vCountSuccess = vCountSuccess + 1;
					}
					if (oBinding.oList[i].CodeSend === "I") {
						vCountInformation = vCountInformation + 1;
					}
				}
				this._oView.byId("sbiError").setText(vCountError.toString());
				this._oView.byId("sbiWarning").setText(vCountWarning.toString());
				this._oView.byId("sbiSuccess").setText(vCountSuccess.toString());
				this._oView.byId("sbiInformation").setText(vCountInformation.toString());
			}
        },
		getStatusIcon: function(s, c) {
			if (c === "50") {
				return "sap-icon://edit";
			} else {
				switch (s) {
					case "E":
						return "sap-icon://message-error";
					case "A":
						return "sap-icon://message-error";
					case "W":
						return "sap-icon://message-warning";
					case "S":
						return "sap-icon://message-success";
					case "I":
						return "sap-icon://process";
					case "C":
						return "sap-icon://cancel";
					default:
						return s;
				}
			}
		},
		getLogMessageIcon: function(m) {
            switch (m) {
                case "E":
                    return "sap-icon://message-error";
                case "A":
                    return "sap-icon://message-error";
                case "I":
                    return "sap-icon://message-information";
                case "S":
                    return "sap-icon://message-success";
                case "W":
                    return "sap-icon://message-warning";
                default:
                    return "sap-icon://message-information";
            }
		},

		getStatusState: function(s, c) {
			if (c === "50") {
				return "Information";
			} else {
				switch (s) {
					case "E":
						return "Error";
					case "A":
						return "Error";
					case "W":
						return "Warning";
					case "S":
						return "Success";
					case "I":
						return "None";
					case "C":
						return "None";
					default:
						return "None";
				}
			}
		},

		onSelectionChange: function (oEvent) {

		let oSegmentedButton = this._oView.byId("logMessageSegmentButton"),
			oKey = oSegmentedButton.getSelectedKey();

		let vMsgType;
		// var oFilters = new Filter();
		if (oKey === "Error") {
			vMsgType = "E";
		}
		if (oKey === "Warning") {
			vMsgType = "W";
		}
		if (oKey === "Success") {
			vMsgType = "S";
		}
		if (oKey === "Information") {
			vMsgType = "I";
		}
		if (vMsgType === "W" || vMsgType === "S" || vMsgType === "I") {
			this._oFilter = new Filter({
				filters: [new Filter("CodeSend", FilterOperator.EQ, vMsgType)]
			});
		} else if (vMsgType === "E") {
			this._oFilter = new Filter({
				filters: [
					new Filter("CodeSend", FilterOperator.EQ, vMsgType),
					new Filter("CodeSend", FilterOperator.EQ, "A")
				],
				or: true
			});
		} else {
			this._oFilter = [];
		}
		this._oLogTable.getBinding("rows").filter(this._oFilter);
		},
		_navBackViewDetailLog: function(){
			this.onPressExit("RouteApp","DetailLog");
		},
		onSort: function(oEvent){

			/*
			const oView = this.getView();
			const oTable = oView.byId("messageLogTab");
			const columnIdExcel = oView.byId("columnIdExcel");

			let oColumn = oEvent.getParameter("column");
			let sOrder = oEvent.getParameter("sortOrder");
			let sIsDesc = "";
			if (sOrder === sap.ui.table.SortOrder.Descending) {
				sIsDesc = "X";
			}

			if (sIsDesc == "X") {
				oTable.sort(columnIdExcel, SortOrder.Descending, true);
			}else{
				oTable.sort(columnIdExcel, SortOrder.Ascending, true);
			}*/
		},
		onFilter: function(){
			
		},
		onLinkPress: function(oEvent){

			this.onNavTargetsObtained(oEvent);
			
			/*
			let object = oEvent.getSource();
			if (object) {
				let oLinkHandler = new NavigationPopoverHandler({
					semanticObject: 'AccountingDocument',
					fieldName: '',
					control: oEvent.getSource(),
					enableAvailableActionsPersonalization: false
				});
				oLinkHandler.openPopover();
			}*/
		}
    });
});