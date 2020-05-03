sap.ui.define([
	"./BaseController",
	"sap/m/MessageBox"
], function (BaseController, MessageBox) {
	"use strict";

	return BaseController.extend("cart.controller.Order", {

		onInit: function () {
            this._oRouter = this.getRouter();
            this._oRouter.getRoute("orders").attachPatternMatched(function () {
                console.log("1");
				this._setLayout("Two");
			}.bind(this), this);
        },
        
        onOrderDeletePress: function() {
			var oOrder = this.getView().getModel("Order").getData();
			if (oOrder._id) {
				var that = this;
				MessageBox.confirm("Are you sure you want to delete " + oOrder._id, {
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					emphasizedAction: MessageBox.Action.YES,
					onClose: function (sAction) {
						if (sAction === "YES") {
							that.delete("http://127.0.0.1:8080/api/orders", {
								body: JSON.stringify({
									order: {
										id: oOrder._id
									}
								})
							}).then(function() {	
								that.loadOrders().then(function(aData) {
									that.setOrdersModel(aData);
								});				
							});
						}
					}
				});
			}
		},

		onReturnToShopButtonPress: function () {
			//navigates back to home screen
			
			this._oRouter.navTo("home");
		}
	});
});
