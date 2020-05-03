sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("cart.controller.App", {

		onInit : function () {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy : false,
				delay : 0,
				layout : "TwoColumnsMidExpanded",
				smallScreenMode : true
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			this.getView().setModel(new JSONModel({login: "", password: "", token: "", new_password: "", id: "", admin: false}), "Login");
			this.getView().setModel(new JSONModel([]), "Categories");
			this.getView().setModel(new JSONModel({title: "", description: "", id: ""}), "Category");
			this.getView().setModel(new JSONModel([{title: "Out of stock", key: false},{key: true, title: "Available"} ]), "Available");
			this.getView().setModel(new JSONModel({title: "", description: "", picture: "", attributes: {width: "", height: "", length: "", weight: ""}, category: "", price: ""}), "Product");
			this.getView().setModel(new JSONModel({title: "", description: "", picture: "", attributes: {width: "", height: "", length: "", weight: ""}, category: "", price: ""}), "ProductDisplay");
			this.getView().setModel(new JSONModel([]), "Products");
			this.getView().setModel(new JSONModel([]), "Orders");
			this.getView().setModel(new JSONModel({}), "Order");

			// since then() has no "reject"-path attach to the MetadataFailed-Event to disable the busy indicator in case of an error
			// this.getOwnerComponent().getModel().metadataLoaded().then(fnSetAppNotBusy);
			// this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		}

	});
});