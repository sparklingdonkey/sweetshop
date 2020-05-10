sap.ui.define([
	"./BaseController",
	"../model/cart",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"../model/formatter",
	"sap/m/MessageBox",
	"sap/m/Link",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"../model/EmailType"
], function (
	BaseController,
	cart,
	JSONModel,
	Device,
	formatter,
	MessageBox,
	Link,
	MessagePopover,
	MessagePopoverItem,
	EmailType) {
	"use strict";

	return BaseController.extend("cart.controller.Checkout", {

		types : {
			email: new EmailType()
		},

		formatter: formatter,

		onInit: function () {
			this.oBundle = this.getResourceBundle();
			var oModel = new JSONModel(
				{
					SelectedPayment: this.oBundle.getText("creditCard"),
					SelectedDeliveryMethod: this.oBundle.getText("standardDelivery"),
					DifferentDeliveryAddress: false,
					CashOnDelivery: {
						FirstName: "",
						LastName: "",
						PhoneNumber: "",
						Email: ""
					},
					InvoiceAddress: {
						Address: "",
						City: "",
						ZipCode: "",
						Country: "",
						Note: ""
					},
					DeliveryAddress: {
						Address: "",
						Country: "",
						City: "",
						ZipCode: "",
						Note: ""
					},
					CreditCard: {
						Name: "",
						CardNumber: "",
						SecurityCode: "",
						Expire: ""
					}
				}
			);

			this.setModel(oModel);

			this._oHistory = {
				prevPaymentSelect: null,
				prevDiffDeliverySelect: null
			};

			this.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");

			this.getRouter().getRoute("checkout").attachMatched(function () {
				this._setLayout("One");
			}.bind(this));
		},

		onShowMessagePopoverPress: function (oEvent) {
			var oButton = oEvent.getSource();

			var oLink = new Link({
				text: "Show more information",
				href: "http://sap.com",
				target: "_blank"
			});

			var oMessageTemplate = new MessagePopoverItem({
				type: '{message>type}',
				title: '{message>message}',
				subtitle: '{message>additionalText}',
				link: oLink
			});

			if (!this.byId("errorMessagePopover")) {
				var oMessagePopover = new MessagePopover(this.createId("messagePopover"), {
					items: {
						path: 'message>/',
						template: oMessageTemplate
					},
					afterClose: function () {
						oMessagePopover.destroy();
					}
				});
				this._addDependent(oMessagePopover);
			}

			oMessagePopover.openBy(oButton);
		},

		_addDependent: function (oMessagePopover) {
			this.getView().addDependent(oMessagePopover);
		},

		goToPaymentStep: function () {
			var selectedKey = this.getModel().getProperty("/SelectedPayment");
			var oElement = this.byId("paymentTypeStep");
			switch (selectedKey) {
				case this.oBundle.getText("bankTransfer"):
					oElement.setNextStep(this.byId("bankAccountStep"));
					break;
				case this.oBundle.getText("cashOnDelivery"):
					oElement.setNextStep(this.byId("cashOnDeliveryStep"));
					break;
				case this.oBundle.getText("creditCard"):
				default:
					oElement.setNextStep(this.byId("creditCardStep"));
					break;
			}
		},

		setPaymentMethod: function () {
			this._setDiscardableProperty({
				message: this.getResourceBundle().getText("checkoutControllerChangePayment"),
				discardStep: this.byId("paymentTypeStep"),
				modelPath: "/SelectedPayment",
				historyPath: "prevPaymentSelect"
			});
		},

		setDifferentDeliveryAddress: function () {
			this._setDiscardableProperty({
				message: this.getResourceBundle().getText("checkoutControllerChangeDelivery"),
				discardStep: this.byId("invoiceStep"),
				modelPath: "/DifferentDeliveryAddress",
				historyPath: "prevDiffDeliverySelect"
			});
		},

		invoiceAddressComplete: function () {
			var sNextStepId = (this.getModel().getProperty("/DifferentDeliveryAddress"))
				? "deliveryAddressStep"
				: "deliveryTypeStep";
			this.byId("invoiceStep").setNextStep(this.byId(sNextStepId));

		},

		handleWizardCancel: function () {
			var sText = this.getResourceBundle().getText("checkoutControllerAreYouSureCancel");
			this._handleSubmitOrCancel(sText, "warning", "home");
		},

		handleWizardSubmit: function () {
			var sText = this.getResourceBundle().getText("checkoutControllerAreYouSureSubmit");
			this._handleSubmitOrCancel(sText, "confirm", "ordercompleted");
		},

		backToWizardContent: function () {
			this.byId("wizardNavContainer").backToPage(this.byId("wizardContentPage").getId());
		},

		_clearMessages: function () {
			sap.ui.getCore().getMessageManager().removeAllMessages();
		},

		onCheckStepActivation: function(oEvent) {
			this._clearMessages();
			var sWizardStepId = oEvent.getSource().getId();
			switch (sWizardStepId) {
			case this.createId("creditCardStep"):
				this.checkCreditCardStep();
				break;
			case this.createId("cashOnDeliveryStep"):
				this.checkCashOnDeliveryStep();
				break;
			case this.createId("invoiceStep"):
				this.checkInvoiceStep();
				break;
			case this.createId("deliveryAddressStep"):
				this.checkDeliveryAddressStep();
				break;
			}
		},

		checkCreditCardStep: function () {
			this._checkStep("creditCardStep", ["creditCardHolderName", "creditCardNumber", "creditCardSecurityNumber", "creditCardExpirationDate"]);
		},

		checkCashOnDeliveryStep: function () {
			this._checkStep("cashOnDeliveryStep", ["cashOnDeliveryName", "cashOnDeliveryLastName", "cashOnDeliveryPhoneNumber", "cashOnDeliveryEmail"]);
		},

		checkInvoiceStep: function () {
			this._checkStep("invoiceStep", ["invoiceAddressAddress", "invoiceAddressCity", "invoiceAddressZip", "invoiceAddressCountry"]);
		},

		checkDeliveryAddressStep: function () {
			this._checkStep("deliveryAddressStep", ["deliveryAddressAddress", "deliveryAddressCity", "deliveryAddressZip", "deliveryAddressCountry"]);
		},

		_checkInputFields : function (aInputIds) {
			var oView = this.getView();

			return aInputIds.some(function (sInputId) {
				var oInput = oView.byId(sInputId);
				var oBinding = oInput.getBinding("value");
				try {
					oBinding.getType().validateValue(oInput.getValue());
				} catch (oException) {
					return true;
				}
				return false;
			});
		},

		_checkStep: function (sStepName, aInputIds) {
			var oWizard = this.byId("shoppingCartWizard"),
				oStep = this.byId(sStepName),
				bEmptyInputs = this._checkInputFields(aInputIds),
				bValidationError = !!sap.ui.getCore().getMessageManager().getMessageModel().getData().length;

			if (!bValidationError && !bEmptyInputs) {
				oWizard.validateStep(oStep);
			} else {
				oWizard.invalidateStep(oStep);
			}
		},


		checkCompleted: function () {
			if (sap.ui.getCore().getMessageManager().getMessageModel().getData().length > 0) {
				MessageBox.error(this.getResourceBundle().getText("popOverMessageText"));
			} else {
				this.byId("wizardNavContainer").to(this.byId("summaryPage"));
			}
		},

		onReturnToShopButtonPress: function () {
			this._setLayout("Two");
			this.getRouter().navTo("home");
		},

		_setDiscardableProperty: function (oParams) {
			var oWizard = this.byId("shoppingCartWizard");
			if (oWizard.getProgressStep() !== oParams.discardStep) {
				MessageBox.warning(oParams.message, {
					actions: [MessageBox.Action.YES,
						MessageBox.Action.NO],
					onClose: function (oAction) {
						if (oAction === MessageBox.Action.YES) {
							oWizard.discardProgress(oParams.discardStep);
							this._oHistory[oParams.historyPath] = this.getModel().getProperty(oParams.modelPath);
						} else {
							this.getModel().setProperty(oParams.modelPath, this._oHistory[oParams.historyPath]);
						}
					}.bind(this)
				});
			} else {
				this._oHistory[oParams.historyPath] = this.getModel().getProperty(oParams.modelPath);
			}
		},

		_handleSubmitOrCancel: function (sMessage, sMessageBoxType, sRoute) {
			MessageBox[sMessageBoxType](sMessage, {
				actions: [MessageBox.Action.YES,
					MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === MessageBox.Action.YES) {
						var oWizard = this.byId("shoppingCartWizard");
						var oModel = this.getModel();
						var oCartModel = this.getOwnerComponent().getModel("cartProducts");
						this._navToWizardStep(this.byId("contentsStep"));
						oWizard.discardProgress(oWizard.getSteps()[0]);
						var oModelData = oModel.getData();
						debugger;
						var aProducts = Object.keys(oCartModel.getData().cartEntries);
						var aQuantity = [];
						aProducts.forEach(function(sPrd) {
							aQuantity.push(oCartModel.getData().cartEntries[sPrd].Quantity);
						});
						this.post("http://127.0.0.1:8080/api/orders", {
							body: JSON.stringify({products: aProducts, productsQuantity: aQuantity, paymentInfo: JSON.stringify(oModelData)})
						});
						oModelData.SelectedPayment = this.oBundle.getText("creditCard");
						oModelData.SelectedDeliveryMethod = "Standard Delivery";
						oModelData.DifferentDeliveryAddress = false;
						oModelData.CashOnDelivery = {};
						oModelData.InvoiceAddress = {};
						oModelData.DeliveryAddress = {};
						oModelData.CreditCard = {};
						oModel.setData(oModelData);
						var oCartModelData = oCartModel.getData();
						oCartModelData.cartEntries = {};
						oCartModelData.totalPrice = 0;
						oCartModel.setData(oCartModelData);
						this.getRouter().navTo(sRoute);
					}
				}.bind(this)
			});
		},

		_navBackToStep: function (oEvent) {
			var sStep = oEvent.getSource().data("navBackTo");
			var oStep = this.byId(sStep);
			this._navToWizardStep(oStep);
		},

		_navToWizardStep: function (oStep) {
			var oNavContainer = this.byId("wizardNavContainer");
			var _fnAfterNavigate = function () {
				this.byId("shoppingCartWizard").goToStep(oStep);
				// detaches itself after navigaton
				oNavContainer.detachAfterNavigate(_fnAfterNavigate);
			}.bind(this);

			oNavContainer.attachAfterNavigate(_fnAfterNavigate);
			oNavContainer.to(this.byId("wizardContentPage"));
		}
	});
});
