sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"sap/ui/Device",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment"
], function (BaseController, formatter, Device, Filter, FilterOperator, MessageToast, JSONModel, Fragment) {
	"use strict";

	return BaseController.extend("cart.controller.Category", {
		formatter : formatter,
		_iLowFilterPreviousValue: 0,
		_iHighFilterPreviousValue: 5000,

		onInit: function () {
			var oViewModel = new JSONModel({
				Suppliers: []
			});
			this.getView().setModel(oViewModel, "view");
			var oComponent = this.getOwnerComponent();
			this.oBundle = this.getResourceBundle();
			this._oRouter = oComponent.getRouter();
			this._oRouter.getRoute("category").attachMatched(this._loadProducts, this);
			this._oRouter.getRoute("productCart").attachMatched(this._loadProducts, this);
			this._oRouter.getRoute("product").attachMatched(this._loadProducts, this);

		},

		_loadProducts: function(oEvent) {
			var bSmallScreen = this.getModel("appView").getProperty("/smallScreenMode"),
				sRouteName = oEvent.getParameter("name");
			var sId = oEvent.getParameters().arguments.id;
			this._setLayout(bSmallScreen && sRouteName === "category" ? "One" : "Two");
			var that = this;
			if (!this.getView().getModel("Categories").getData().length) {
				this.loadCategories().then(function(aData) {
					that.setCategoriesModel(aData);
					var aCategory = aData.filter(function(oCategory) {
						return oCategory._id === sId;
					});
					if (aCategory.length) {
						that.byId("page").setTitle(aCategory[0].title);
					}
				}, function() {
					MessageToast.show(that.oBundle.getText("categoriesLoadError"));
				})
			}

			if (!this.getView().getModel("Products").getData().length) {
				this.loadProducts().then(function(aData) {
					that.setProductsModel(aData);
					var oView = that.getView();
					var oProductList = oView.byId("productList");
					
					var oBinding = oProductList.getBinding("items");
					if (oBinding) {
						var oFilter = new Filter("category/_id", FilterOperator.EQ, sId);
						oBinding.filter([oFilter]);
					}
				}, function() {
					MessageToast.show(that.oBundle.getText("productsLoadError"));
				});
			} else {
				var oView = this.getView();
				var oProductList = oView.byId("productList");

				var oBinding = oProductList.getBinding("items");
				debugger;
				if (oBinding) {
					var oFilter = new Filter("category/_id", FilterOperator.EQ, sId);
					oBinding.filter([oFilter]);
				}
			}
			
		},

		onProductAddPress: function() {
			if (!this.byId("productEditDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "cart.fragments.productEditDialog",
					controller: this
				}).then(function(oDialog){
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				var oModel = this.getView().getModel("Product");
				oModel.setData({title: "", description: "", picture: "", attributes: {width: "", height: "", length: "", weight: ""}, category: "", price: ""});
				this.byId("productEditDialog").open();
			}
		},

		onUploadPathChange: function(oEvent) {
			this.uploadedExcelFile = oEvent.getParameter("files")[0];
		},

		handleRemovePress: function() {
			this.byId("fileUploader").clear();
			this.getModel("Product").setProperty("/picture", "REMOVE");
		},

		onProductSaveButtonPress: function() {
			var oModel = this.getView().getModel("Product");
			var oProduct = oModel.getData();
			var that = this;
			var reader = new FileReader();
			var data =	that.getModel("Product").getData();
			
			reader.onload = function(e) {
				data.picture = {
					"picture": reader.result,
					"fileName": that.uploadedExcelFile.name,
				   	"type": that.uploadedExcelFile.type
				}
				if (data._id) {
					that.put("http://127.0.0.1:8080/api/products", {body: JSON.stringify({
							product: data
						})}).then(function() {
						 that.loadProducts().then(function(aData) {
							 that.byId("productEditDialog").close();
							 that.setProductsModel(aData);
							 if (that.getModel("ProductDisplay").getData()._id === data._id) {
								that.loadProductsById(data._id).then(function(aData) {
									that.setProductDisplayModel(aData);
								});
							 }
						 });
					});
				} else {
					that.post("http://127.0.0.1:8080/api/products", {body: JSON.stringify({
							product: data
						})}).then(function() {
						 that.loadProducts().then(function(aData) {
							 that.byId("productEditDialog").close();
							 that.setProductsModel(aData);
						 });
					});
				}
			};
			
			if (!oProduct.category) {
				if (this.getModel("Categories").getData().length()) {
					var sKey = this.byId("categorySelect").getSelectedKey();
					if (!sKey) {
						MessageToast.show(this.oBundle.getText("criticalUnexpectedError"));
						return false;
					} else {
						oProduct.category = sKey;
					}
				} else {
					MessageToast.show(this.oBundle.getText("noCategories"));
					return false;
				}
			}

			if (oProduct.title && oProduct.category && oProduct.description && oProduct.price 
						&& oProduct.attributes.width && oProduct.attributes.height && oProduct.attributes.length
						&& oProduct.attributes.weight) {
				if (this.uploadedExcelFile){
					reader.readAsBinaryString(this.uploadedExcelFile);
				} else {
					if (data._id) {
						that.put("http://127.0.0.1:8080/api/products", {body: JSON.stringify({
								product: data
							})}).then(function() {
							that.loadProducts().then(function(aData) {
								that.byId("productEditDialog").close();
								that.setProductsModel(aData);
								if (that.getModel("ProductDisplay").getData()._id === data._id) {
									that.loadProductsById(data._id).then(function(aData) {
										that.setProductDisplayModel(aData);
									});
								 }
							});
						});
					} else {
						that.post("http://127.0.0.1:8080/api/products", {body: JSON.stringify({
								product: data
							})}).then(function() {
							that.loadProducts().then(function(aData) {
								that.byId("productEditDialog").close();
								that.setProductsModel(aData);
							});
						});
					}
				}
			} else {
				MessageToast.show(this.oBundle.getText("fillAllRequiredFields"));
				return false;
			}
		},

		handleUploadPress: function() {
			var oFileUploader = this.byId("fileUploader");
			oFileUploader.upload();
		},

		_loadCategories: function(oEvent) {

		},

	
		_loadSuppliers: function () {
			
		},

		fnDataReceived: function() {
			var oList = this.byId("productList");
			var aListItems = oList.getItems();
			aListItems.some(function(oItem) {
				if (oItem.getBindingContext().sPath === "/Products('" + this._sProductId + "')") {
					oList.setSelectedItem(oItem);
					return true;
				}
			}.bind(this));
		},

		onProductListSelect : function (oEvent) {
			this._showProduct(oEvent);
		},

		onProductDetails: function (oEvent) {
			var oBindContext;
			if (Device.system.phone) {
				oBindContext = oEvent.getSource().getBindingContext("Products");
			} else {
				oBindContext = oEvent.getSource().getSelectedItem().getBindingContext("Products");
			}
			var oModel = oBindContext.getModel();
			var sCategoryId = oModel.getProperty(oBindContext.getPath()).category._id;
			var sProductId = oModel.getProperty(oBindContext.getPath())._id;

			var bCartVisible = this.getModel("appView").getProperty("/layout").startsWith("Three");
			this._setLayout("Two");
			this._oRouter.navTo(bCartVisible ? "productCart" : "product", {
				id: sCategoryId,
				productId: sProductId
			}, !Device.system.phone);

			this._unhideMiddlePage();
		},

		onProductEditPress: function(oEvent) {
			var oBindingContext = oEvent.getSource().getBindingContext("Products");
			var oModel = oBindingContext.getModel();
			var sPath = oBindingContext.getPath();
			this.getView().getModel("Product").setData({...Object.assign({}, oModel.getProperty(sPath))});
			this.getView().getModel("Product").setProperty("/origin", {...Object.assign({}, oModel.getProperty(sPath))});
			debugger;
			if (!this.byId("productEditDialog")) {
				Fragment.load({
					id: this.getView().getId(),
					name: "cart.fragments.productEditDialog",
					controller: this
				}).then(function(oDialog){
					this.getView().addDependent(oDialog);
					oDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
					oDialog.open();
				}.bind(this));
			} else {
				this.byId("productEditDialog").open();
			}
		},

		handleConfirm: function (oEvent) {
			var oCustomFilter = this.byId("categoryFilterDialog").getFilterItems()[1];
			var oSlider = oCustomFilter.getCustomControl().getAggregation("content")[0];
			this._iLowFilterPreviousValue = oSlider.getValue();
			this._iHighFilterPreviousValue = oSlider.getValue2();
			this._applyFilter(oEvent);
		},

		/**
		 * Sets the slider values to the previous ones
		 * Updates the filter count
		 */
		handleCancel: function () {
			var oCustomFilter = this.byId("categoryFilterDialog").getFilterItems()[1];
			var oSlider = oCustomFilter.getCustomControl().getAggregation("content")[0];
			oSlider.setValue(this._iLowFilterPreviousValue).setValue2(this._iHighFilterPreviousValue);
			if (this._iLowFilterPreviousValue > oSlider.getMin() || this._iHighFilterPreviousValue !== oSlider.getMax()) {
				oCustomFilter.setFilterCount(1);
			} else {
				oCustomFilter.setFilterCount(0);
			}
		},

		/**
		 * Updates filter count if there is a change in one of the slider values
		 * @param {sap.ui.base.Event} oEvent the change event of the sap.m.RangeSlider
		 */
		handleChange: function (oEvent) {
			var oCustomFilter = this.byId("categoryFilterDialog").getFilterItems()[1];
			var oSlider = oCustomFilter.getCustomControl().getAggregation("content")[0];
			var iLowValue = oEvent.getParameter("range")[0];
			var iHighValue = oEvent.getParameter("range")[1];
			if (iLowValue !== oSlider.getMin() || iHighValue !== oSlider.getMax()) {
				oCustomFilter.setFilterCount(1);
			} else {
				oCustomFilter.setFilterCount(0);
			}
		},

		/**
		 * Reset the price custom filter
		 */
		handleResetFilters: function () {
			var oCustomFilter = this.byId("categoryFilterDialog").getFilterItems()[1];
			var oSlider = oCustomFilter.getCustomControl().getAggregation("content")[0];
			oSlider.setValue(oSlider.getMin());
			oSlider.setValue2(oSlider.getMax());
			oCustomFilter.setFilterCount(0);
		},

		/**
		 * Navigation to comparison view
		 * @param {sap.ui.base.Event} oEvent the press event of the link text in sap.m.ObjectListItem
		 */
		compareProducts: function (oEvent) {
			var oProduct = oEvent.getSource().getBindingContext().getObject();
			var sItem1Id = this.getModel("comparison").getProperty("/item1");
			var sItem2Id = this.getModel("comparison").getProperty("/item2");
			this._oRouter.navTo("comparison", {
				id : oProduct.Category,
				item1Id : (sItem1Id ? sItem1Id : oProduct.ProductId),
				item2Id : (sItem1Id && sItem1Id != oProduct.ProductId ? oProduct.ProductId : sItem2Id)
			}, true);
		},
		/**
		 * Always navigates back to category overview
		 * @override
		 */
		onBack: function () {
			this.getRouter().navTo("categories");
		}
	});
});