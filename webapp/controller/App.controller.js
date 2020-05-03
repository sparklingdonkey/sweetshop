sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("cart.controller.App", {

		onInit : function () {
			var oViewModel;

			oViewModel = new JSONModel({
				busy : false,
				delay : 0,
				layout : "TwoColumnsMidExpanded",
				smallScreenMode : true
			});
			this.setModel(oViewModel, "appView");
			this.oBundle = this.getResourceBundle();

			this.getView().setModel(new JSONModel({login: "", password: "", token: "", new_password: "", id: "", admin: false}), "Login");
			this.getView().setModel(new JSONModel([]), "Categories");
			this.getView().setModel(new JSONModel({title: "", description: "", id: ""}), "Category");
			this.getView().setModel(new JSONModel([{title: this.oBundle.getText("statusO"), key: false},{key: true, title: this.oBundle.getText("statusA")} ]), "Available");
			this.getView().setModel(new JSONModel({title: "", description: "", picture: "", attributes: {width: "", height: "", length: "", weight: ""}, category: "", price: ""}), "Product");
			this.getView().setModel(new JSONModel({title: "", description: "", picture: "", attributes: {width: "", height: "", length: "", weight: ""}, category: "", price: ""}), "ProductDisplay");
			this.getView().setModel(new JSONModel([]), "Products");
			this.getView().setModel(new JSONModel([]), "Orders");
			this.getView().setModel(new JSONModel({}), "Order");

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		}

	});
});