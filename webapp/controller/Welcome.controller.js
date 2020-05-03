sap.ui.define([
	"./BaseController",
	"../model/cart",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"../model/formatter",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast",
], function (BaseController, cart, JSONModel, Filter, formatter, Fragment, MessageToast) {
	"use strict";

	return BaseController.extend("cart.controller.Welcome", {

		_iCarouselTimeout: 0, // a pointer to the current timeout
		_iCarouselLoopTime: 8000, // loop to next picture after 8 seconds

		formatter: formatter,

		_mFilters: {
			Promoted: [new Filter("Type", "EQ", "Promoted")],
			Viewed: [new Filter("Type", "EQ", "Viewed")],
			Favorite: [new Filter("Type", "EQ", "Favorite")]
		},

		onInit: function () {
			var oViewModel = new JSONModel({
				welcomeCarouselShipping: '../img/1.gif',
				welcomeCarouselInviteFriend: '../img/2.gif',
				welcomeCarouselTablet: '../img/3.gif',
				welcomeCarouselCreditCard: '../img/4.gif',
				Promoted: [],
				Viewed: [],
				Favorite: [],
				Currency: "EUR"
			});
			this.getView().setModel(oViewModel, "view");
			this.getRouter().attachRouteMatched(this._onRouteMatched, this);	

			// select random carousel page at start
			var oWelcomeCarousel = this.byId("welcomeCarousel");
			var iRandomIndex = Math.floor(Math.abs(Math.random()) * oWelcomeCarousel.getPages().length);
			oWelcomeCarousel.setActivePage(oWelcomeCarousel.getPages()[iRandomIndex]);
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
							console.log(result);
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

			var oModel = this.getView().getModel("Login");
			oModel.setProperty("/token", "");
			oModel.setProperty("/login", "");
			oModel.setProperty("/password", "");
			oModel.setProperty("/id", "");
			oModel.setProperty("/admin", false);
		},

		/**
		 * lifecycle hook that will initialize the welcome carousel
		 */
		onAfterRendering: function () {
			this.onCarouselPageChanged();
		},
		

		_onRouteMatched: function (oEvent) {
			var sRouteName = oEvent.getParameter("name");

			// always display two columns for home screen
			if (sRouteName === "home") {
				this._setLayout("Two");
			}
			// we do not need to call this function if the url hash refers to product or cart product
			if (sRouteName !== "product" && sRouteName !== "cartProduct") {
				var aPromotedData = this.getView().getModel("view").getProperty("/Promoted");
				if (!aPromotedData.length) {
					var oModel = this.getModel();
					Object.keys(this._mFilters).forEach(function (sFilterKey) {
						// oModel.read("/FeaturedProducts", {
						// 	urlParameters: {
						// 		"$expand": "Product"
						// 	},
						// 	filters: this._mFilters[sFilterKey],
						// 	success: function (oData) {
						// 		this.getModel("view").setProperty("/" + sFilterKey, oData.results);
						// 		if (sFilterKey === "Promoted") {
						// 			this._selectPromotedItems();
						// 		}
						// 	}.bind(this)
						// });
					}.bind(this));
				}
			}
		},

		/**
		 * clear previous animation and initialize the loop animation of the welcome carousel
		 */
		onCarouselPageChanged: function () {
			clearTimeout(this._iCarouselTimeout);
			this._iCarouselTimeout = setTimeout(function () {
				var oWelcomeCarousel = this.byId("welcomeCarousel");
				if (oWelcomeCarousel) {
					oWelcomeCarousel.next();
					this.onCarouselPageChanged();
				}
			}.bind(this), this._iCarouselLoopTime);
		},

		/**
		 * Event handler to determine which link the user has clicked
		 * @param {sap.ui.base.Event} oEvent the press event of the link
		 */
		onSelectProduct: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("view");
			var sCategoryId = oContext.getProperty("Product/Category");
			var sProductId = oContext.getProperty("Product/ProductId");
			this.getRouter().navTo("product", {
				id: sCategoryId,
				productId: sProductId
			});
		},

		/**
		 * Navigates to the category overview on phones
		 */
		onShowCategories: function () {
			this.getRouter().navTo("categories");
		},

		/**
		 * Event handler to determine which button was clicked
		 * @param {sap.ui.base.Event} oEvent the button press event
		 */
		onAddToCart: function (oEvent) {
			var oResourceBundle = this.getModel("i18n").getResourceBundle();
			var oProduct = oEvent.getSource().getBindingContext("view").getObject();
			var oCartModel = this.getModel("cartProducts");
			cart.addToCart(oResourceBundle, oProduct, oCartModel);
		},

		/**
		 * Navigate to the generic cart view
		 * @param {sap.ui.base.Event} @param oEvent the button press event
		 */
		onToggleCart: function (oEvent) {
			var bPressed = oEvent.getParameter("pressed");

			this._setLayout(bPressed ? "Three" : "Two");
			this.getRouter().navTo(bPressed ? "cart" : "home");
		},

		/**
		 * Select two random elements from the promoted products array
		 * @private
		 */
		_selectPromotedItems: function () {
			var aPromotedItems = this.getView().getModel("view").getProperty("/Promoted");
			var iRandom1, iRandom2 = Math.floor(Math.random() * aPromotedItems.length);
			do {
				iRandom1 = Math.floor(Math.random() * aPromotedItems.length);
			} while (iRandom1 === iRandom2);
			this.getModel("view").setProperty("/Promoted", [aPromotedItems[iRandom1], aPromotedItems[iRandom2]]);
		}
	});
});
