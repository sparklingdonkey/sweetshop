sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/ui/core/routing/History",
	"../model/cart",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment"
], function(Controller, UIComponent, History, cart, MessageToast, Fragment) {
	"use strict";

	return Controller.extend("cart.controller.BaseController", {
		cart: cart,
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
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

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * React to FlexibleColumnLayout resize events
		 * Hides navigation buttons and switches the layout as needed
		 * @param {sap.ui.base.Event} oEvent the change event
		 */
		onStateChange: function (oEvent) {
			var sLayout = oEvent.getParameter("layout"),
				iColumns = oEvent.getParameter("maxColumnsCount");

			if (iColumns === 1) {
				this.getModel("appView").setProperty("/smallScreenMode", true);
			} else {
				this.getModel("appView").setProperty("/smallScreenMode", false);
				// swich back to two column mode when device orientation is changed
				if (sLayout === "OneColumn") {
					this._setLayout("Two");
				}
			}
		},

		/**
		 * Sets the flexible column layout to one, two, or three columns for the different scenarios across the app
		 * @param {string} sColumns the target amount of columns
		 * @private
		 */
		_setLayout: function (sColumns) {
			debugger;
			if (sColumns) {
				this.getModel("appView").setProperty("/layout", sColumns + "Column" + (sColumns === "One" ? "" : "sMidExpanded"));
			}
		},

		/**
		 * Apparently, the middle page stays hidden on phone devices when it is navigated to a second time
		 * @private
		 */
		_unhideMiddlePage: function () {
			// TODO: bug in sap.f router, open ticket and remove this method afterwards
			setTimeout(function () {
				this.getOwnerComponent().getRootControl().byId("layout").getCurrentMidColumnPage().removeStyleClass("sapMNavItemHidden");
			}.bind(this), 0);
		},

		/**
		 * Navigates back in browser history or to the home screen
		 */
		onBack: function () {
			this._unhideMiddlePage();
			var oHistory = History.getInstance();
			var oPrevHash = oHistory.getPreviousHash();
			if (oPrevHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("home");
			}
		},

		/**
		 * Called, when the add button of a product is pressed.
		 * Saves the product, the i18n bundle, and the cart model and hands them to the <code>addToCart</code> function
		 * @public
		 */
		onAddToCart : function () {
			var oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			var oEntry = this.getModel("ProductDisplay").getData();
			var oCartModel = this.getView().getModel("cartProducts");
			cart.addToCart(oResourceBundle, oEntry, oCartModel);
		},
		/**
		 * Clear comparison model
		 * @protected
		 */
		_clearComparison: function (){
			var oModel = this.getOwnerComponent().getModel("comparison");
			oModel.setData({
				category: "",
				item1: "",
				item2: ""
			});
		},

		loadCategories: function() {
			var that = this;
			return new Promise(function(res, rej) {
				that.get("http://127.0.0.1:8080/api/category").then(function(oResp) {
					if (oResp.ok) {
						oResp.json().then(function(result) {
							res(result.results)
						});
					} else {
						rej();
					}
				});
			});
		},

		loadProductsByCategory: function(sCategory) {
			var that = this;
			return new Promise(function(res, rej) {
				that.get("http://127.0.0.1:8080/api/products?category="+sCategory).then(function(oResp) {
					if (oResp.ok) {
						oResp.json().then(function(result) {
							res(result.results)
						});
					} else {
						rej();
					}
				});
			});
		},

		loadProductsById: function(sProduct) {
			var that = this;
			return new Promise(function(res, rej) {
				that.get("http://127.0.0.1:8080/api/products/"+sProduct).then(function(oResp) {
					if (oResp.ok) {
						oResp.json().then(function(result) {
							res(result.results[0])
						});
					} else {
						rej();
					}
				});
			});
		},

		loadProducts: function() {
			var that = this;
			return new Promise(function(res, rej) {
				that.get("http://127.0.0.1:8080/api/products").then(function(oResp) {
					if (oResp.ok) {
						oResp.json().then(function(result) {
							res(result.results)
						});
					} else {
						rej();
					}
				});
			});
		},

		loadOrders: function() {
			var that = this;
			return new Promise(function(res, rej) {
				that.get("http://127.0.0.1:8080/api/orders").then(function(oResp) {
					if (oResp.ok) {
						oResp.json().then(function(result) {
							res(result.results)
						});
					} else {
						rej();
					}
				});
			});
		},

		loadOrderById: function(sOrder) {
			var that = this;
			return new Promise(function(res, rej) {
				that.get("http://127.0.0.1:8080/api/orders/"+sOrder).then(function(oResp) {
					if (oResp.ok) {
						oResp.json().then(function(result) {
							res(result.results[0]);
						});
					} else {
						rej();
					}
				});
			});
		},

		setOrdersModel: function(aData) {
			var aParsedOrders = aData.map(function(oOrder) {
				if (oOrder.paymentInfo) {
					oOrder.totalPrice = 0;
					oOrder.totalAmount = 0;
					try {
						oOrder.paymentInfo = JSON.parse(oOrder.paymentInfo);
						oOrder.products.forEach(function(oProduct, i) {
							oProduct.quantity = oOrder.productsQuantity[i];
							oProduct.totalPrice = oProduct.price * oOrder.productsQuantity[i];
							oOrder.totalPrice += oProduct.price * oOrder.productsQuantity[i];
							oOrder.totalAmount += +oOrder.productsQuantity[i];
						});
					} catch(err) {
						oOrder.paymentInfo = {};
					}
				}

				return oOrder;
			});

			this.getView().getModel("Orders").setData(aParsedOrders);
		},

		setOrderModel: function(aData) {
			this.getView().getModel("Order").setData(aData);
		},

		setProductsModel: function(aData) {
			this.getView().getModel("Products").setData(aData);
		},

		setProductModel: function(oData) {
			this.getView().getModel("Product").setData(oData);
		},

		setProductDisplayModel: function(oData) {
			this.getView().getModel("ProductDisplay").setData(oData);
		},

		setCategoriesModel: function(aData) {
			this.getView().getModel("Categories").setData(aData);
		},

		setCategoryModel: function(oData) {
			this.getView().getModel("Category").setData(oData);
		},

		setLoginModel: function(oData) {
			this.getView().getModel("Login").setData(oData);
		},
		

		get: function(sUrl, oOptions) {
			if (!oOptions) {
				oOptions = {};
			}

			oOptions.method = "GET",
			oOptions.headers = {
				"Content-Type": "application/json; charset=utf-8", 
				"Authorization": this.getView().getModel("Login").getProperty("/token")
			};
			
			return fetch(sUrl, oOptions);
		},

		post: function(sUrl, oOptions) {
			if (!oOptions) {
				oOptions = {};
			}

			oOptions.method = "POST";
			oOptions.headers = {
				"Content-Type":"application/json; charset=utf-8", 
				"Authorization": this.getView().getModel("Login").getProperty("/token")
			};
			return fetch(sUrl, oOptions);
		},

		put: function(sUrl, oOptions) {
			if (!oOptions) {
				oOptions = {};
			}

			oOptions.method = "PUT";
			oOptions.headers = {
				"Content-Type":"application/json; charset=utf-8", 
				"Authorization": this.getView().getModel("Login").getProperty("/token")
			};
			return fetch(sUrl, oOptions);
		},

		delete: function(sUrl, oOptions) {
			if (!oOptions) {
				oOptions = {};
			}

			oOptions.method = "DELETE";
			oOptions.headers = {
				"Content-Type":"application/json; charset=utf-8", 
				"Authorization": this.getView().getModel("Login").getProperty("/token")
			};
			return fetch(sUrl, oOptions);
		},

		onOrdersPress: function() {
			this.getRouter().navTo("orders");
		},

		onLoginButtonPress: function() {
			var oModel = this.getView().getModel("Login");
			var sToken = oModel.getProperty("/token");
			var sLogin = oModel.getProperty("/login");
			var sPassword = oModel.getProperty("/password");

			if (sLogin.trim().length && sPassword.trim().length) {
				if (sToken.trim().length) {
					MessageToast.show(this.getResourceBundle().getText("alreadyLogged"));
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
								MessageToast.show(that.getResourceBundle().getText("userNameOrPasswordInvalid"));
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
				MessageToast.show(this.getResourceBundle().getText("fillAllRequiredFields"));
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
						MessageToast.show(that.getResourceBundle().getText("logged"));
					});
				})
				
			} else {
				MessageToast.show(this.getResourceBundle().getText("fillAllRequiredFields"));
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

		onRegisterButtonPress: function() {
			var oModel = this.getView().getModel("Login");
			var sToken = oModel.getProperty("/token");
			var sLogin = oModel.getProperty("/login");
			var sPassword = oModel.getProperty("/password");

			if (sLogin.trim().length && sPassword.trim().length) {
				if (sToken.trim().length) {
					MessageToast.show(this.getResourceBundle().getText("alreadyLogged"));
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
								MessageToast.show(that.getResourceBundle().getText("userNameTaken"));
							} else {
								that.byId("loginDialog").close();
								oModel.setProperty("/admin", result.user.admin);
								oModel.setProperty("/login", result.user.username || result.user.email);
								oModel.setProperty("/token", "Token " + result.user.token);
								oModel.setProperty("/id", result.user.id);
								oModel.setProperty("/new_password", "");
								MessageToast.show(that.getResourceBundle().getText("registeredAndLogged"));
							}
						});
					})
				}
			} else {
				MessageToast.show(this.getResourceBundle().getText("fillAllRequiredFields"));
			}
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
		}
	});
});