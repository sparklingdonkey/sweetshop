sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"../model/formatter"
], function(
	BaseController,
	JSONModel,
	Fragment,
	MessageBox,
	formatter) {
	"use strict";

	return BaseController.extend("cart.controller.Product", {
		formatter : formatter,

		onInit : function () {
			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this._router.getRoute("product").attachPatternMatched(this._routePatternMatched, this);
			this._router.getRoute("productCart").attachPatternMatched(this._routePatternMatched, this);
			// this.getView
			this._router.getTarget("product").attachDisplay(function (oEvent) {
				this.fnUpdateProduct(oEvent.getParameter("data").productId);// update the binding based on products cart selection
			}, this);
		},

		_routePatternMatched: function(oEvent) {
			var sId = oEvent.getParameter("arguments").productId,
				oView = this.getView();
			var that = this;
			this.loadProductsById(sId).then(function(aData) {
				that.setProductDisplayModel(aData);
			});
		},

		loadProduct: function(fnSuccessCallback, fnErrorCallback) {
			var that = this;
			return this.get("http://127.0.0.1:8080/api/products").then(function(oResp) {
				oResp.json().then(function(result) {
					if (result.errors) {
						if (fnErrorCallback) {
							fnErrorCallback.call(that, result.errors);
						}
					} else if (fnSuccessCallback) {
						fnSuccessCallback.call(that, result.results);
					}
				});
			})
		},

		onProductDeletePress: function() {
			var oProduct = this.getView().getModel("ProductDisplay").getData();
			if (oProduct._id) {
				var that = this;
				MessageBox.confirm("Are you sure you want to delete " + oProduct.title, {
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					emphasizedAction: MessageBox.Action.YES,
					onClose: function (sAction) {
						if (sAction === "YES") {
							that.delete("http://127.0.0.1:8080/api/products", {
								body: JSON.stringify({
									product: {
										id: oProduct._id
									}
								})
							}).then(function() {	
								that.loadProducts().then(function(aData) {
									that.setProductsModel(aData);
								});				
								that._router.navTo("category", {
									id: that._router.oHashChanger.hash.substring(that._router.oHashChanger.hash.indexOf("/") + 1, that._router.oHashChanger.hash.indexOf("/product/"))
								});
							});
						}
					}
				});
			}
		},

		fnUpdateProduct: function(productId) {
			// var sPath = "/Products('" + productId + "')",
			// 	fnCheck = function () {
			// 		this._checkIfProductAvailable(sPath);
			// 	};

			// this.getView().bindElement({
			// 	path: sPath,
			// 	events: {
			// 		change: fnCheck.bind(this)
			// 	}
			// });
		},

		_checkIfProductAvailable: function(sPath) {
			var oModel = this.getModel();
			var oData = oModel.getData(sPath);

			// show not found page
			if (!oData) {
				this._router.getTargets().display("notFound");
			}
		},

		/**
		 * Navigate to the generic cart view
		 * @param {sap.ui.base.Event} @param oEvent the button press event
		 */
		onToggleCart: function (oEvent) {
			var bPressed = oEvent.getParameter("pressed");
			var oEntry = this.getModel("ProductDisplay").getData();

			this._setLayout(bPressed ? "Three" : "Two");
			this.getRouter().navTo(bPressed ? "productCart" : "product", {
				id: oEntry.category._id,
				productId: oEntry._id
			});
		}
	});
});
