sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	"sap/ui/Device",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function (
	BaseController,
	formatter,
	Filter,
	JSONModel,
	FilterOperator,
	Fragment,
	Device,
	MessageBox,
	MessageToast) {
	"use strict";

	return BaseController.extend("cart.controller.Home", {
		formatter : formatter,

		onInit: function () {
			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this._router.getRoute("categories").attachMatched(this._onRouteMatched, this);
		},

		onAfterRendering: function() {
			var  that = this;
			if (!this.getView().getModel("Categories").getData().length) {
				this.loadCategories().then(function(aData) {
					that.setCategoriesModel(aData);
				}, function() {
					MessageToast.show(that.oBundle.getText("categoriesLoadError"));
				})
				
			}

			if (!this.getView().getModel("Products").getData().length) {
				this.loadProducts().then(function(aData) {
					that.setProductsModel(aData);
				}, function() {
					MessageToast.show(that.oBundle.getText("productsLoadError"));
				});
			}
		},

		_onRouteMatched: function() {
			var bSmallScreen = this.getModel("appView").getProperty("/smallScreenMode");
			if (bSmallScreen) {
				this._setLayout("One");
			}
		},

		onSearch: function () {
			this._search();
		},

		onCategoryAddPress: function() {
			this.getView().getModel("Category").setData({
				_id: "",
				title: "",
				description: ""
			});

			if (!this.byId("categoryDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "cart.fragments.categoryDialog",
					controller: this
				}).then(function(oDialog){
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("categoryDialog").open();
			}
		},

		onCategoryDetailPress: function(oEvent){
			var oBindingContext = oEvent.getSource().getBindingContext("Categories");
			var oModel = oBindingContext.getModel();
			var sPath = oBindingContext.getPath();
			this.getView().getModel("Category").setData({...Object.assign({}, oModel.getProperty(sPath))});
			this.getView().getModel("Category").setProperty("/origin", {...Object.assign({}, oModel.getProperty(sPath))});
			debugger;
			if (!this.byId("categoryDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "cart.fragments.categoryDialog",
					controller: this
				}).then(function(oDialog){
					// connect dialog to the root view of this component (models, lifecycle)
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("categoryDialog").open();
			}
		},

		onCategorySaveButtonPress: function() {
			var oCategory = this.getModel("Category").getData();
			if (oCategory.origin && (oCategory.title === oCategory.origin.title && oCategory.description === oCategory.origin.description)) {
				this.byId("categoryDialog").close();
			} else {
				var that = this;
				var oBody = {
					body: JSON.stringify({
						category: {
							id: oCategory._id,
							title: oCategory.title,
							description: oCategory.description,
						},
						origin: {}
					})
				};
				
				if (oCategory._id) {
					this.put("http://127.0.0.1:8080/api/category", oBody).then(function(oResp) {
						oResp.json().then(function(oResult) {
							if (oResult.errors) {
								that._categoriesErrorHandler(oResult.errors);
							} else {
								that.byId("categoryDialog").close();
								that.loadCategories().then(function(aData) {
									that.setCategoriesModel(aData);
								}, function() {
									MessageToast.show(that.oBundle.getText("categoriesLoadError"));
								})
								that.loadProducts().then(function(aData) {
									that.setProductsModel(aData);
								}, function() {
									MessageToast.show(that.oBundle.getText("productsLoadError"));
								})
							}
						});
					});
				} else {
					this.post("http://127.0.0.1:8080/api/category", oBody).then(function(oResp) {
						oResp.json().then(function(oResult) {
							if (oResult.errors) {
								that._categoriesErrorHandler(oResult.errors);
							} else {
								that.byId("categoryDialog").close();
								that.loadCategories().then(function(aData) {
									that.setCategoriesModel(aData);
								}, function() {
									MessageToast.show(that.oBundle.getText("categoriesLoadError"));
								})
								that.loadProducts().then(function(aData) {
									that.setProductsModel(aData);
								}, function() {
									MessageToast.show(that.oBundle.getText("productsLoadError"));
								})
							}
						});
					});
				}
			}
		},

		onCategoryDeletePress: function(oEvent) {
			var oBindingContext = oEvent.getParameters().listItem.getBindingContext("Categories");
			var oModel = oBindingContext.getModel();
			var sPath = oBindingContext.getPath();
			var that = this;
			MessageBox.confirm("Are you sure you want to delete " + oModel.getProperty(sPath + "/title") + " category?", {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				emphasizedAction: MessageBox.Action.YES,
				onClose: function (sAction) {
					if (sAction === "YES") {
						that.delete("http://127.0.0.1:8080/api/category", {
							body: JSON.stringify({
								category: {
									id: oModel.getProperty(sPath + "/_id")
								}
							})
						}).then(function() {
							that.loadCategories().then(function(aData) {
								that.setCategoriesModel(aData);
							}, function() {
								MessageToast.show(that.oBundle.getText("categoriesLoadError"));
							})
							that.loadProducts().then(function(aData) {
								that.setProductsModel(aData);
							}, function() {
								MessageToast.show(that.oBundle.getText("productsLoadError"));
							})
						});
					}
				}
			});
		},

		onRefresh: function () {
			// trigger search again and hide pullToRefresh when data ready
			var oProductList = this.byId("productList");
			var oBinding = oProductList.getBinding("items");
			var fnHandler = function () {
				this.byId("pullToRefresh").hide();
				oBinding.detachDataReceived(fnHandler);
			}.bind(this);
			oBinding.attachDataReceived(fnHandler);
			this._search();
		},

		_search: function () {
			var oView = this.getView();
			var oProductList = oView.byId("productList");
			var oCategoryList = oView.byId("categoryList");
			var oSearchField = oView.byId("searchField");

			// switch visibility of lists
			var bShowSearchResults = oSearchField.getValue().length !== 0;
			oProductList.setVisible(bShowSearchResults);
			oCategoryList.setVisible(!bShowSearchResults);

			// filter product list
			var oBinding = oProductList.getBinding("items");
			if (oBinding) {
				if (bShowSearchResults) {
					var oFilter = new Filter("title", FilterOperator.Contains, oSearchField.getValue());
					oBinding.filter([oFilter]);
				} else {
					oBinding.filter([]);
				}
			}
		},

		onCategoryListItemPress: function (oEvent) {
			var oBindContext = oEvent.getSource().getBindingContext("Categories");
			var oModel = oBindContext.getModel();
			var sCategoryId = oModel.getProperty(oBindContext.getPath())._id;

			this._router.navTo("category", {id: sCategoryId});
			this._unhideMiddlePage();
		},

		onProductListSelect: function (oEvent) {
			var oItem = oEvent.getParameter("listItem");
			this._showProduct(oItem);
		},

		onProductListItemPress: function (oEvent) {
			var oItem = oEvent.getSource();
			this._showProduct(oItem);
		},

		_showProduct: function (oItem) {
			var oEntry = oItem.getBindingContext("Products").getObject();

			this._router.navTo("product", {
				id: oEntry.category._id,
				productId: oEntry._id
			}, !Device.system.phone);
		},

		/**
		 * Always navigates back to home
		 * @override
		 */
		onBack: function () {
			this.getRouter().navTo("home");
		}
	});
});
