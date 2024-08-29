sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/generic/app/navigation/service/NavigationHandler"
],
function (Controller,NavigationHandler) {
    "use strict";

    return Controller.extend("ns.asa.zappuploadinvoices.controller.BaseController", {
        onInit: function () {

        },
        getRouter: function() {
            return sap.ui.core.UIComponent.getRouterFor(this);
        },
        getModel: function(object) {
            return this.getView().getModel(object);
        },
        getResourceBundle: function() {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        onRefresh: function () {
			this.getView().getModel().refresh(true);
		},
    });
});
