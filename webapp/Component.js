sap.ui.define([
	"sap/ui/core/UIComponent",
	"./model/LocalStorageModel",
	"./model/models",
	"sap/ui/Device"
], function(UIComponent, LocalStorageModel, models, Device) {
	"use strict";

	return UIComponent.extend("cart.Component", {

		metadata: {
			manifest: "json"
		},

		init: function () {
			var oCartModel = new LocalStorageModel("SHOPPING_CART", {
				cartEntries: {},
				savedForLaterEntries: {}
			});
			this.setModel(oCartModel, "cartProducts");

			var oComparisonModel = new LocalStorageModel("PRODUCT_COMPARISON", {
				category: "",
				item1: "",
				item2: ""
			});
			this.setModel(oComparisonModel, "comparison");

			this.setModel(models.createDeviceModel(), "device");

			UIComponent.prototype.init.apply(this, arguments);

			this.getRouter().initialize();

			this.getRouter().attachTitleChanged(function(oEvent) {
				var sTitle = oEvent.getParameter("title");
				document.addEventListener('DOMContentLoaded', function(){
					document.title = sTitle;
				});
			});
		},

		getContentDensityClass : function() {
			if (this._sContentDensityClass === undefined) {
				if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) {
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		}
	});
});
