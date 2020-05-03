sap.ui.define([
	"./BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("cart.controller.Orders", {

		onInit: function () {
            this._oRouter = this.getRouter();
            this._oRouter.getRoute("orders").attachPatternMatched(function () {
                this.loadOrders().then(function(aOrders) {
                    this.setOrdersModel(aOrders);
                }.bind(this));
			}.bind(this), this);
        },
        
        onOrderSelect: function(oEvent) {
            var oContext = oEvent.getSource().getSelectedItem().getBindingContext("Orders");
            var oModel = oContext.getModel();

            this.setOrderModel(oModel.getProperty(oContext.getPath()));
            console.log(this.getModel("Order"));
        },

		onReturnToShopButtonPress: function () {
			//navigates back to home screen
			// this._setLayout("Two");
			this._oRouter.navTo("home");
		}
	});
});
