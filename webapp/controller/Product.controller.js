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
		

		_productsErrorHandler: function(oErrors) {
			MessageToast.show(oErrors && oErrors.title ? "Title is already taken" : "Unexpected error");
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
		},

		onAvatarPress: function() {
			if (!this.byId("loginDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "cart.fragments.loginDialog",
					controller: this
				}).then(function(oDialog){
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				var oModel = this.getView().getModel("Login");
				oModel.setProperty("/password", "");
				oModel.setProperty("/new_password", "");

				this.byId("loginDialog").open();
			}
		},

		onRegisterButtonPress: function() {
			var oModel = this.getView().getModel("Login");
			var sToken = oModel.getProperty("/token");
			var sLogin = oModel.getProperty("/login");
			var sPassword = oModel.getProperty("/password");

			if (sLogin.trim().length && sPassword.trim().length) {
				if (sToken.trim().length) {
					MessageToast.show("You are already logged in");
				} else {
					var that = this;

					that.post("http://127.0.0.1:8080/api/users", {body: JSON.stringify({
						user: {
							username: sLogin, 
							email: sLogin, 
							password: sPassword
						}
					})}).then(function(oResp) {
						oResp.json().then(function(result) {
							if (result.errors) {
								MessageToast.show("User name is already taken");
							} else {
								that.byId("loginDialog").close();
								oModel.setProperty("/admin", result.user.admin);
								oModel.setProperty("/login", result.user.username || result.user.email);
								oModel.setProperty("/token", "Token " + result.user.token);
								oModel.setProperty("/id", result.user.id);
								oModel.setProperty("/new_password", "");
							}
						});
					})
				}
			} else {
				MessageToast.show("Login and password can't be empty");
			}
		},

		onLoginButtonPress: function() {
			var oModel = this.getView().getModel("Login");
			var sToken = oModel.getProperty("/token");
			var sLogin = oModel.getProperty("/login");
			var sPassword = oModel.getProperty("/password");

			if (sLogin.trim().length && sPassword.trim().length) {
				if (sToken.trim().length) {
					MessageToast.show("You are already logged in");
				} else {
					var that = this;

					that.post("http://127.0.0.1:8080/api/users/login", {body: JSON.stringify({
						user: {
							email: sLogin, 
							password: sPassword
						}
					})}).then(function(oResp) {
						oResp.json().then(function(result) {
							if (result.errors) {
								MessageToast.show("User name or password is invalid");
							} else {
								that.byId("loginDialog").close();
								oModel.setProperty("/admin", result.user.admin);
								oModel.setProperty("/login", result.user.username);
								oModel.setProperty("/password", "");
								oModel.setProperty("/token", "Token " + result.user.token);
								oModel.setProperty("/id", result.user.id);
								oModel.setProperty("/new_password", "");
							}
						});
					})
				}
			} else {
				MessageToast.show("Login and password can't be empty");
			}
		},

		onChangePasswordButtonPress: function() {
			var oModel = this.getView().getModel("Login");
			var sId = oModel.getProperty("/id");
			var sLogin = oModel.getProperty("/login");
			var sPassword = oModel.getProperty("/password");
			var sNewPassword = oModel.getProperty("/new_password");

			if (sPassword.trim().length && sNewPassword.trim().length) {
				var that = this;

				that.put("http://127.0.0.1:8080/api/user", {body: JSON.stringify({
					user: {
						id: sId, 
						email: sLogin, 
						password: sPassword,
						new_password: sNewPassword
					}
				})}).then(function(oResp) {
					oResp.json().then(function(result) {
						that.byId("loginDialog").close();

						oModel.setProperty("/login", result.user.username);
						oModel.setProperty("/token", "Token " + result.user.token);
						oModel.setProperty("/password", "");
						oModel.setProperty("/new_password", "");
						oModel.setProperty("/admin", result.user.admin);
						
					});
				})
				
			} else {
				MessageToast.show("Password and New password fields have to be filled");
			}
		},

		onLogoutButtonPress: function() {
			this.byId("loginDialog").close();

			this.setOrdersModel([]);
			this.setOrderModel({});

			var oModel = this.getView().getModel("Login");
			oModel.setProperty("/token", "");
			oModel.setProperty("/login", "");
			oModel.setProperty("/password", "");
			oModel.setProperty("/id", "");
			oModel.setProperty("/admin", false);
		},
	});
});
