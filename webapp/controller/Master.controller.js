sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/m/TextArea",
	"sap/m/ButtonType",
	"sap/m/Button",
	"sap/m/Label",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/ui/core/Core",
	"zanxlib/zanxlib/controllers/addons",
	"sap/m/MessageToast"
], function (Controller, MessageBox, TextArea, ButtonType, Button, Label, Filter, JSONModel, Fragment, Core, addons, MessageToast) {
	"use strict";

	return Controller.extend("inchcape.anx.putaway-case.controller.Master", {
		onInit: function () {
			this.correctCase = "";
			this.getView().setModel(this.getOwnerComponent().getModel());
			this.oModel = this.getView().getModel();
			this.CurrentInput = '';
			this._selectedBrand = null;
			this.bulk = false;
			this.clearPayload();

			this.oCarousel = this.getView().byId("itemsCarousel");

			var that = this;
			var req = "/DummySet('AAA')";
			this.oModel.read(req, {
				urlParameters: {},
				success: that.onDummyHeaderReceived.bind(that),
				error: that.onDataError.bind(that)
			});
		},
		clearPayload: function () {

			var oJsonModel = new sap.ui.model.json.JSONModel({
				Material: 'INITIAL',
				Brand: 'INITIAL',
				Scan: 'INITIAL',
				AnxCase: 'INITIAL',
				InbDlv: 'INITIAL',
				AnxOrder: 'INITIAL',
				Barcode: 'INITIAL',
				Case: 'INITIAL',
				ProposedBin: 'INITIAL',
				ProposedBinPrefix: 'INITIAL',
				ProvidedNewBin: 'INITIAL',
				Warehouse: 'INITIAL',
				SourceBin: 'INITIAL',
				SourceBinPrefix: 'INITIAL',
				NewBin: 'INITIAL',
				NewBinPrefix: 'INITIAL'
			});
			this.getView().setModel(oJsonModel, "Payload");
			this.getView().getModel("Payload").refresh(true);
		},
		onPrinterScannFail: function (e) {
			MessageBox.error("Problem with scanning process.");
		},
		onDummyHeaderReceived: function (oData) {
			var oJsonModel = new sap.ui.model.json.JSONModel(oData),
				t = this.getView();

			t.setModel(oJsonModel, "DummySet");

			t.setBusy(false);
		},
		handleBrandHelp: function (oEvent) {
			this.inputObj = oEvent.getSource();
			// create value help dialog
			if (!this._BrandHelpDialog) {
				this._BrandHelpDialog = sap.ui.xmlfragment(
					"inchcape.anx.putaway-case.view.BrandHelpDialog",
					this
				);
				this.getView().addDependent(this._BrandHelpDialog);
			}

			// open value help dialog
			this._BrandHelpDialog.open();
		},
		_handleValueHelpClose: function (oEvent) {
			if (oEvent.sId == "cancel") return;
			var oSelectedItem = oEvent.getParameter("selectedItem"),
				t = this.getView();
			if (oSelectedItem) {
				this.inputObj.setValue(oSelectedItem.getTitle());
			}
			oEvent.getSource().getBinding("items").filter([]);
			t.getModel('Payload').setProperty("/Brand", oSelectedItem.getTitle());

			jQuery.sap.delayedCall(500, this, function () {
				t.byId('idAnxCaseInput').focus();
			});
		},
		_focusOnNextField: function (oEvent) {

			this._selectedBrand = oEvent.getSource().getSelectedKey(); // Save for later
			jQuery.sap.delayedCall(500, this, function () {
				this.getView().byId('idAnxCaseInput').focus();
			});
		},
		_handleBrandHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter(
				"BrandName",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		onLiveChangeCase: function (oEvent) {
			var inputVal = oEvent.getSource().getValue();
			if (inputVal.length > 2) {
				this.onCaseScanSuccess(oEvent);
			} else if (inputVal.length < 3 && inputVal.length !== 0) {
				this.throwMessageBoxManualInput();
			}
		},
		onLiveChangeMaterial: function (oEvent) {
			var inputVal = oEvent.getSource().getValue();
			if (inputVal.length > 2) {
				this.onMaterialScanSuccess(oEvent);
			} else if (inputVal.length < 3 && inputVal.length !== 0) {
				this.throwMessageBoxManualInput();
			}
		},
		onLiveChange: function (oEvent) {
			var inputVal = oEvent.getSource().getValue().trim();
			if (inputVal.length > 2) {
				this.onBinScanSuccess(oEvent);
			} else if (inputVal.length < 3 && inputVal.length !== 0) {
				this.throwMessageBoxManualInput();
			}
		},
		throwMessageBoxManualInput: function () {
			sap.m.MessageToast.show("Manual Input can be done by Keyboard Button!", {
				my: "center center",
				at: "center center",
				duration: 6000
			});
		},
		onManualCaseInput: function (oEvent) {
			this.onManualInputPopup("Manual Case Input", "Case number ...", "idAnxCaseInput");
		},
		onManualMaterialInput: function (oEvent) {
			this.onManualInputPopup("Manual Material Input", "Material number ...", "idMaterialInput");
		},
		onManualBinInput: function (oEvent) {
			this.onManualInputPopup("Manual Bin Input", "Bin number ...", "idValueInput");
		},
		onManualInputPopup: function (title, placeholder, inputToGo) {
			if (!this.oSubmitDialog) {
				this.oSubmitDialog = new sap.m.Dialog({
					type: sap.m.DialogType.Message,
					title: title,
					content: [
						new sap.m.Input("manualInput", {
							width: "100%",
							placeholder: placeholder,
							liveChange: function (oEvent) {
								var sText = oEvent.getParameter("value");
								this.oSubmitDialog.getBeginButton().setEnabled(sText.length > 0);
							}.bind(this)
						})
					],
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: "Submit",
						enabled: false,
						press: function () {
							var sManualInput = Core.byId("manualInput").getValue();
							Core.byId("manualInput").setValue();
							this.oSubmitDialog.close();
							this.oSubmitDialog.destroy();
							this.oSubmitDialog = null;
							this.getView().byId(inputToGo).setValue(sManualInput).fireSubmit();
						}.bind(this)
					}),
					endButton: new Button({
						text: "Cancel",
						press: function () {
							this.oSubmitDialog.close();
							this.oSubmitDialog.destroy();
							this.oSubmitDialog = null;
						}.bind(this)
					})
				});
			}

			this.oSubmitDialog.open();
		},

		onCaseScanSuccess: function (oEvent) {
			if (oEvent.getParameter("cancelled") == true) return; // Action was cancelled.

			var brand = this.getView().byId('Brand').getSelectedKey();
			this._selectedBrand = brand;
			var scan = "";
			if (oEvent.sId == "submit") { // eslint-disable-line
				scan = oEvent.mParameters.value; // eslint-disable-line
				if (scan === undefined)
					scan = this.getView().byId('idAnxCaseInput').getValue();
			} else if (oEvent.sId == "press" || oEvent.sId == "liveChange") { // eslint-disable-line
				scan = this.getView().byId('idAnxCaseInput').getValue();
			} else {
				scan = oEvent.getParameter('text')
			}

			scan = scan.trim()
			// Check if internal number was scanned. Internal has always 6 characters. For SU... 
			var internalScanned = false;
			var scanBuffer = scan;
			if (scan.length === 6) {
				internalScanned = true;
			}

			var slice = scan.substring(0, 2);
			switch (brand) {
				case 'KM':
					if (slice == '00')
						scan = scan.slice(2);;
					break;
				case 'HQ':
					if (slice == '00')
						scan = scan.slice(2);
					break;
			}

			scan = this.convertCaseBarcode(scan);

			if (internalScanned)
				scan = scanBuffer;

			this.getView().getModel('Payload').setProperty("/Barcode", scan);
			if (oEvent.sId == "scanSuccess") { // eslint-disable-line
				oEvent.getSource().getParent().getContent()[0].setValue(oEvent.getParameters().text);
			}
			this.correctCase = scan;
			this.searchCaseRelatedDocument(scan);

		},
		convertCaseBarcode: function (scan) {
			var convert = scan;
			var len = convert.length;
			switch (this.getView().getModel('Payload').getProperty("/Brand")) {
				case 'SU':
					convert = this.convertSubaruBarcode(convert);
					convert = this.format(convert, "#####-####");
					break;
				case 'CI':
					if (len === 9) break; // no conversion needed

					if (len < 9) { // just map
						convert = this.deleteDash(convert);
						convert = this.format(convert, "######-##"); // map to pattern
					} else { // full conversion
						convert = convert.replace(/\s/g, ''); //delete unwanted spaces everywhere in string
						convert = this.convertPSABarcode(convert); // trim first and last char
						convert = this.format(convert, "######-##"); // map to pattern
					}
					break;
				case 'PE':
					if (len === 10) break; // no conversion needed

					if (len < 10) { // just map
						convert = this.deleteDash(convert);
						convert = this.format(convert, "######-###"); // map to pattern
					} else { // full conversion
						convert = convert.replace(/\s/g, ''); //delete unwanted spaces everywhere in string
						convert = this.convertPSABarcode(convert); // trim first and last char
						convert = this.format(convert, "######-###"); // map to pattern
					}
					break;
				case 'KM':
					convert = this.format(convert, "########"); // Same as SU
					break;
				case 'HQ':
					convert = this.format(convert, "########"); // Same as SU
					break;
				default:
					break;
			}
			return convert;
		},
		convertSubaruBarcode: function (barcode) {
			var mod = barcode;
			mod = this.deleteDash(mod);
			return mod;
		},
		deleteDash: function (barcode) {
			return barcode.replace("-", "");
		},
		convertPSABarcode: function (barcode) {
			var mod = barcode.substring(1);
			mod = mod.slice(0, -1);
			return mod;
		},
		// Leave it as is. This JS pattern is ok. I mean, this bottom
		format: function (value, pattern) {
			// var i = 0,
			var v = value.toString();
			var j = 0;
			var returnValue = "";
			for (var i = 0; i < v.length; i++) {
				if (pattern.substr(j, 1) === "-") {
					returnValue = returnValue + pattern.substr(j, 1);
					j++;
				}
				returnValue = returnValue + v[i];
				j++;
			}
			return returnValue;
		},

		onMaterialScanSuccess: async function (oEvent) {
			if (oEvent.getParameter("cancelled") == true) return; // Action was cancelled.
			var oInputControl = this.getView().byId('idMaterialInput');
			var scan = "";
			if (oEvent.sId == "submit") {
				scan = oEvent.mParameters.value;
			} else if (oEvent.sId == "press" || oEvent.sId == "liveChange") {
				scan = oInputControl.getValue();
			} else {
				scan = oEvent.getParameters().text;
			}
			var sBrand = this.getView().getModel('Payload').getProperty("/Brand");

			scan = await addons.prototype.trimUnwantedChars(scan, sBrand);
			this.getView().getModel('Payload').setProperty("/Material", scan);
			if (oEvent.sId == "scanSuccess") {
				oEvent.getSource().getParent().getContent()[0].setValue(scan);
			}

			if ((sBrand === "PE" || sBrand === "CI") && scan.substring(0, 1) === "P") {
				scan = scan.substring(1, scan.length);
			}
			oInputControl.setValue(scan);
			this.searchMaterial(scan);
		},

		correctMaterial: function (oEvent) {
			var sPutMaterial = oEvent.getParameters().value;
			sPutMaterial = sPutMaterial.trim();
			var sBrand = this.getView().getModel('Payload').getProperty("/Brand");
			var oInputControl = this.getView().byId('idMaterialInput');

			oInputControl.setValue(sPutMaterial);
		},

		searchMaterial: function (material) {
			var that = this;
			this.getView().setBusy(true);

			var brand = this.getView().getModel('Payload').oData.Brand;
			// material = material.replaceAll(" ","%20");

			var req = this.oModel.createKey("/MaterialSet", {
				MaterialNr: material,
				Brand: brand,
				Case: this.correctCase
			});

			// var req = "/MaterialSet(MaterialNr='" + material + "',Brand='" + brand + "',Case='" + this.correctCase + "')";
			this.oModel.read(req, {
				urlParameters: {},
				error: that.onMaterialError.bind(that),
				success: that.onMaterialHeaderReceived.bind(that)
			});
		},
		onMaterialHeaderReceived: function (oData) {

			if (oData.BinMessage) MessageToast.show(oData.BinMessage);

			var oJsonModel = new sap.ui.model.json.JSONModel(oData), t = this.getView(), m = t.getModel('Payload');
			m.setProperty("/Material", oData.MaterialNr);
			m.setProperty("/ProposedBin", oData.Bin);
			m.setProperty("/ProposedBinPrefix", oData.BinPrefix);
			m.setProperty("/SourceBin", oData.BinSource);
			m.setProperty("/SourceBinPrefix", oData.BinSourcePrefix);
			m.setProperty("/Warehouse", oData.Warehouse);
			m.setProperty("/SC", oData.SC);
			m.setProperty("/Available", oData.Available);
			this.bulk = false;
			t.setModel(oJsonModel, "Material");

			// Invisible scan buttons
			t.byId('idMaterialButton').setVisible(false);
			t.byId('idMaterialNextButton').setVisible(false);
			t.byId('idOpenListNextButton').setVisible(false);
			t.byId('idManualMaterialInput').setVisible(false);

			t.byId('idMaterialInput').setWidth("20rem");
			t.byId('idMaterialInput').setEnabled(false);

			t.byId('idMaterialDescLabel').setVisible(true);
			//HazMatnr
			if (oData.HazMatnr !== '' && oData.HazMatnr !== undefined && oData.HazMatnr !== null)
				t.byId('idHazMaterial').setVisible(true);

			t.byId('idBinLabel').setVisible(true);
			t.byId('idBinText').setVisible(true);

			t.byId('idSmartFormThirdSeparator').setVisible(true);
			t.byId('idSmartFormThird').setVisible(true);
			t.byId('idSmartFormFourthSeparator').setVisible(true);
			t.byId('idSmartFormFourth').setVisible(true);

			t.setBusy(false);
			jQuery.sap.delayedCall(500, this, function () {
				t.byId('idValueInput').focus();
			});

		},
		onBinScanSuccess: function (oEvent) {
			if (oEvent.getParameter("cancelled") == true) return; // Action was cancelled.

			var scan = "";
			var proposedBin = this.getView().getModel('Payload').getProperty('/ProposedBin');
			var proposedBinPrefix = this.getView().getModel('Payload').getProperty('/ProposedBinPrefix');
			var control = this.getView().byId('idValueInput');

			if (oEvent.sId == "press" || oEvent.sId == "submit") { // eslint-disable-line
				scan = control.getValue();
			} else if (oEvent.sId == "scanSuccess") { // eslint-disable-line
				scan = oEvent.getParameters().text;
				scan = scan.trim();
				this.getView().byId("idValueInput").setValue(scan);
				// oEvent.getSource().getParent().getContent()[0].setValue(scan);
			} else if (oEvent.sId == "liveChange" && oEvent.getParameter('value').length > 3) { // that means go ahead. Scan performed
				scan = oEvent.getParameter('value');
				scan = scan.trim();
			}
			if (scan == '') {
				sap.m.MessageToast.show("Bin input was empty. Please try again by scanning BIN label.", {
					my: "center center",
					at: "center center",
					duration: 3000
				});
				this.getView().byId('idValueInput').setValue('');
				return;
			}
			var dataObj = {
				scan: scan,
				scanBinType: '',
				proposedBin: proposedBin,
				proposedBinType: proposedBinPrefix
			}
			this._dataObj = dataObj;
			this.getBinVariants(scan);

		},
		getBinVariants: function (providedBin) {

			//Get bin varians as there can be more than one type of bin with same name
			var oURLParameters = {
				StorageBin: providedBin
			};
			this.oModel.callFunction("/GetBinVariants", {
				method: "GET",
				urlParameters: oURLParameters,
				success: this.onBinVariantsReceived.bind(this),
				error: this.onDataError.bind(this)
			});
		},
		onBinVariantsReceived: function (oData) {
			var cur = oData.results[0];
			if (oData.results.length < 2) {
				this._dataObj.scanBinType = cur.StorageType;
				this.prepareDataBeforeAskAboutBin();
				return;
			}
			var oJsonModel = new sap.ui.model.json.JSONModel(oData);
			var oView = this.getView();
			oView.setModel(oJsonModel, "BinVariants");


			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment(
					"inchcape.anx.putaway-case.view.BinVariants",
					this
				);
				this.getView().addDependent(this._oDialog);
			}

			// toggle compact style
			this._dialogSource = "source";
			jQuery.sap.syncStyleClass("sapUiSizeCompact", oView, this._oDialog);
			this._oDialog.open();
		},
		onBinVariantChosen: function (oEvent) {
			if (oEvent.sId == "cancel") {
				return;
			}
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				this._dataObj.scanBinType = oSelectedItem.getTitle();
				this.prepareDataBeforeAskAboutBin();
				return;
			}
		},
		prepareDataBeforeAskAboutBin: function () {
			var control = this.getView().byId('idValueInput');
			var that = this;
			// scan: scan,
			// scanBinType : '',
			// proposedBin: proposedBin,
			// proposedBinType: proposedBinPrefix

			if (this._dataObj.scan != '' && this._dataObj.proposedBin != '') { // New provided and suggested
				if ((this._dataObj.scan !== this._dataObj.proposedBin) || (this._dataObj.scanBinType !== this._dataObj.proposedBinType)) {
					MessageBox.warning("Bin: " + this._dataObj.scanBinType + " " + this._dataObj.scan +
						" is not the suggested Bin: " + this._dataObj.proposedBinType + " " + this._dataObj.proposedBin +
						". Do you wish to continue ?", {
						actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
						emphasizedAction: MessageBox.Action.OK,
						onClose: function (sAction) {
							if (sAction === "OK") {
								that.askAboutBin(that._dataObj.scanBinType, that._dataObj.scan);
							} else {
								jQuery.sap.delayedCall(500, this, function () {
									control.setValue('');
									control.focus();
								});
							}
						}
					});
				} else {
					this.askAboutBin(this._dataObj.scanBinType, this._dataObj.scan);
				}
			} else if (this._dataObj.scan == '' && this._dataObj.proposedBin != '') { // No new but suggested
				this.askAboutBin(this._dataObj.proposedBinType, this._dataObj.proposedBin);
			} else if (this._dataObj.scan == '' && this._dataObj.proposedBin == '') { // If no new provided and proposed empty
				// error, provide new bin.
				MessageBox.error("No Bin has been proposed by system so you need to enter it by yourself.");
				jQuery.sap.delayedCall(500, this, function () {
					control.setValue('');
					control.focus();
				});
				return;
			} else if (this._dataObj.scan != '' && this._dataObj.proposedBin == '') {
				this.askAboutBin(this._dataObj.scanBinType, this._dataObj.scan);
			}
		},
		askAboutBin: function (prefix, bin) {
			this.getView().setBusy(true);

			var t = this.getView();
			var m = t.getModel('Payload');
			m.setProperty("/ProvidedNewBin", bin);
			var that = this;

			var newbin = bin;
			var newbinprefix = prefix;
			var sourceBin = m.getProperty('/SourceBin');
			var sourceBinPrefix = m.getProperty('/SourceBinPrefix');
			var proposedBin = m.getProperty('/ProposedBin');
			var proposedBinPrefix = m.getProperty('/ProposedBinPrefix');
			var warehouse = m.getProperty('/Warehouse');
			var material = m.getProperty('/Material');
			var brand = m.getProperty('/Brand');
			var sCase = m.getProperty('/Case');
			if (!this.bulk) {
				var req = this.oModel.createKey("/NewBinSet", {
					NewBinName: newbin,
					NewBinPrefix: newbinprefix,
					ProposedBin: proposedBin,
					ProposedBinPrefix: proposedBinPrefix,
					Warehouse: warehouse,
					SourceBin: sourceBin,
					SourceBinPrefix: sourceBinPrefix,
					Brand: brand,
					AnxCase: sCase,
					Material: material
				});
				// var req = "/NewBinSet(NewBinName='" + newbin 
				// 			+ "',NewBinPrefix='" + newbinprefix
				// 			+ "',ProposedBin='" + proposedBin 
				// 			+ "',ProposedBinPrefix='" + proposedBinPrefix 
				// 			+ "',Warehouse='" + warehouse 
				// 			+ "',SourceBin='" + sourceBin 
				// 			+ "',SourceBinPrefix='" + sourceBinPrefix
				// 			+ "',Brand='" + brand 
				// 			+ "',AnxCase='" + sCase 
				// 			+ "',Material='" + material 
				// 			+ "')";
			} else {
				var req = this.oModel.createKey("/NewBinSet", {
					NewBinName: newbin,
					NewBinPrefix: newbinprefix,
					ProposedBin: proposedBin,
					ProposedBinPrefix: proposedBinPrefix,
					Warehouse: warehouse,
					SourceBin: sourceBin,
					SourceBinPrefix: sourceBinPrefix,
					Brand: brand,
					AnxCase: sCase,
					Material: ""
				});
				// var req = "/NewBinSet(NewBinName='" + newbin 
				// 		+ "',NewBinPrefix='" + newbinprefix
				// 		+ "',ProposedBin='" + proposedBin 
				// 		+ "',ProposedBinPrefix='" + proposedBinPrefix 
				// 		+ "',Warehouse='" + warehouse 
				// 		+ "',SourceBin='" + sourceBin 
				// 		+ "',SourceBinPrefix='" + sourceBinPrefix
				// 		+ "',Brand='" + brand 
				// 		+ "',AnxCase='" + sCase
				// 		+ "',Material='"
				// 		+ "')";
			}

			this.oModel.read(req, {
				urlParameters: {},
				success: this.onBinHeaderReceived.bind(that),
				error: this.onBinError.bind(that)
			});

		},
		onBinHeaderReceived: function (oData) {
			var oJsonModel = new sap.ui.model.json.JSONModel(oData),
				t = this.getView(),
				m = t.getModel('Payload');

			m.setProperty('/NewBinPrefix', oJsonModel.oData.NewBinPrefix);
			m.setProperty('/NewBin', oJsonModel.oData.NewBinName);

			t.setModel(oJsonModel, "NewBin");

			var control = t.byId('idValueInput');
			control.setEnabled(false);
			control.setWidth("14rem");
			if (control.getValue() == '') {
				control.setValue(m.getProperty('/ProposedBin'));
			}

			t.byId('idBinPrefix').setVisible(true);
			t.byId('idValueInput').setWidth("14rem");
			t.byId('idBinPrefix').setVisible(true);
			t.byId("idValueButton").setVisible(false);
			t.byId("idValueNextButton").setVisible(false);
			t.byId("idManualBinInput").setVisible(false);

			t.byId("idQuantityInput").setEnabled(true);

			jQuery.sap.delayedCall(500, this, function () {
				t.byId('idQuantityInput').focus();
			});
			if (this.bulk) {
				this.getView().byId('idButtonConfirmBulk').setVisible(true);
			}
			t.setBusy(false);
		},

		onLiveChangeQuantity: function (oEvent) {
			var input = oEvent.getSource();
			var stateTxtEqZero = "Quantity 0 is not allowed!";
			var stateTxtMore = "Qty exceeds available Qty";
			var stateTxtLess = "Qty is less than available Qty";
			var avail = this.getView().getModel("Material").getData().Available;
			//Value State section

			if (parseFloat(input.getValue()) === 0) {
				input.setValueState("Error");
				input.setValueStateText(stateTxtEqZero);
			} else if (parseFloat(input.getValue()) > avail) {
				input.setValueState("Warning");
				input.setValueStateText(stateTxtMore);
			} else if (parseFloat(input.getValue()) < avail) {
				input.setValueState("Warning");
				input.setValueStateText(stateTxtLess);
			} else {
				input.setValueState("None");
				input.setValueStateText("");
			}

			//Value State section

			this.getView().getModel('Payload').setProperty('/Quantity', input.getValue());
			var control = this.getView().byId('idButtonConfirm');
			if (input.getValue().length > 0) {
				control.setVisible(true);
				control.setEnabled(true);
			} else {
				control.setVisible(true);
				control.setEnabled(false);
			}

		},
		searchCaseRelatedDocument: function (scan) {
			var that = this;
			this.getView().setBusy(true);

			var brand = this.getView().getModel('Payload').oData.Brand;

			if (brand === "INITIAL" || brand === null) { // No brand selected
				this.onDataError({
					responseText: "Please select Brand beforehand!"
				});
				return;
			}

			var req = "/ANXCaseSet(Scan='" + scan + "',Brand='" + brand + "')";
			this.oModel.read(req, {
				urlParameters: {},
				success: that.onAnxCaseHeaderReceived.bind(that),
				error: that.onCaseError.bind(that)
			});
		},
		onAnxCaseHeaderReceived: function (oData) {
			var oJsonModel = new sap.ui.model.json.JSONModel(oData),
				t = this.getView(),
				m = t.getModel('Payload');

			m.setProperty("/Scan", oData.Scan);

			m.setProperty("/Case", oData.Case);
			m.setProperty("/InbDlv", oData.InbDlv);
			m.setProperty("/AnxOrder", oData.AnxOrder);
			m.setProperty("/AnxCase", oData.AnxCase);

			t.setModel(oJsonModel, "ANXCase");

			t.byId('idAnxCaseInput').setValue(oJsonModel.oData.AnxCase);

			// Invisible scan buttons and Brand selection
			t.byId('Brand').setEnabled(false);
			t.byId('idCaseNextButton').setVisible(false);
			t.byId('idCaseButton').setVisible(false);
			t.byId('idManualCaseInput').setVisible(false);
			t.byId('idAnxCaseInput').setWidth("20rem");
			t.byId('idAnxCaseInput').setEnabled(false);

			t.byId('idMaterial').setVisible(true);
			t.byId('idSmartFormSecondSeparator').setVisible(true);
			t.byId('idSmartFormSecond').setVisible(true);

			t.setBusy(false);

			jQuery.sap.delayedCall(500, this, function () {
				t.byId('idMaterialInput').focus();
			});
		},
		focusOnInput: function (controlId) {
			jQuery.sap.delayedCall(500, this, function () {
				this.getView().byId(controlId).focus();
			});
			this.CurrentInput = '';
		},
		onCaseError: function (response) {
			this.CurrentInput = 'idAnxCaseInput';
			this.onDataError(response);
		},
		onMaterialError: function (response) {
			this.CurrentInput = 'idMaterialInput';
			this.onDataError(response);
		},
		onBinError: function (response) {
			this.CurrentInput = 'idValueInput';
			this.onDataError(response);
		},
		onDataError: function (response) {
			var sMessage;
			var that = this;
			if (typeof response.responseText !== "undefined") {
				try {
					sMessage = JSON.parse(response.responseText).error.message.value;
				} catch (error) {
					if (response.responseText === undefined || response.responseText === "" || response.responseText === null)
						sMessage = "An error has occured";
					else
						sMessage = response.responseText;
				}
			}
			var dialog = new sap.m.Dialog({
				title: "Error",
				type: "Message",
				state: "Error",
				content: new sap.m.Text({
					text: sMessage
				}),
				beginButton: new sap.m.Button({
					text: "OK",
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
					if (that.CurrentInput != '') {
						jQuery.sap.delayedCall(500, that, function () {
							that.getView().byId(that.CurrentInput).setValue('');
							that.getView().byId(that.CurrentInput).focus();
							that.CurrentInput = '';
						});
					}
				}
			});
			this.getView().setBusy(false);
			dialog.open();
			// if (this.CurrentInput != ''){
			// 	jQuery.sap.delayedCall(500, this, function () {
			// 		this.getView().byId(this.CurrentInput).setValue('');
			// 		this.getView().byId(this.CurrentInput).focus();
			// 		this.CurrentInput = '';
			// 	});
			// }
		},
		onConfirmButton: function (oEvent) {
			var Payload = this.getView().getModel('Payload').oData;
			this.getView().setBusy(true);

			var qty = this.getView().byId('idQuantityInput').getValue();
			var avail = this.getView().getModel("Material").getData().Available;

			var isCaseEmpty = false;
			var that = this;
			if (parseFloat(qty) < parseFloat(avail) && parseFloat(qty) > 0) {
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				MessageBox.confirm(
					"Is Case empty of material " + Payload.Material + "?", {
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					styleClass: bCompact ? "sapUiSizeCompact" : "",
					onClose: function (sAction) {
						if (sAction === MessageBox.Action.YES) {
							isCaseEmpty = true;
						} else {
							isCaseEmpty = false;
						}
						that.postDocument(isCaseEmpty);
					}
				}
				);
			} else if (parseFloat(qty) === 0) {
				var message = "Putaway for 0 quantity not allowed. Contact your Supervisor. Press (OK) to go back or (Correct Input)";
				var dialog = new sap.m.Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new sap.m.Text({
						text: message
					}),
					beginButton: new sap.m.Button({
						text: "OK",
						press: function () {
							that.refreshView();
							dialog.close();
						}
					}),
					endButton: new sap.m.Button({
						text: "Correct Input",
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function (oEvent) {
						that.getView().setBusy(false);
						that.getView().byId('idQuantityInput').setValueState("None");
						that.getView().byId('idQuantityInput').setValueStateText("");
						that.getView().byId('idQuantityInput').setValue("");
						that.getView().byId('idQuantityInput').focus();
					}
				});
				dialog.open();
				return;

			} else if (parseFloat(qty) > parseFloat(avail)) {
				var message = "Quantity for Putaway is more than Available Quantity?";
				var dialog = new sap.m.Dialog({
					title: "Error",
					type: "Message",
					state: "Error",
					content: new sap.m.Text({
						text: message
					}),
					beginButton: new sap.m.Button({
						text: "OK",
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						that.getView().setBusy(false);
						that.getView().byId('idQuantityInput').setValue("");
						that.getView().byId('idQuantityInput').focus();
					}
				});
				dialog.open();
				return;
			} else {
				this.postDocument(isCaseEmpty);
			}

		},

		postDocument: function (isCaseEmpty) {
			var Payload = this.getView().getModel('Payload').oData;

			var oJsonModel = new sap.ui.model.json.JSONModel({
				NewBin: Payload.NewBin,
				NewBinPrefix: Payload.NewBinPrefix,
				Warehouse: Payload.Warehouse,
				BinSource: Payload.SourceBin,
				BinSourcePrefix: Payload.SourceBinPrefix,
				Material: Payload.Material,
				Case: this.correctCase,
				Brand: Payload.Brand,
				ProposedBin: Payload.ProposedBin,
				ProposedBinPrefix: Payload.ProposedBinPrefix,
				Quantity: this.getView().byId('idQuantityInput').getValue(),
				IsCaseEmpty: isCaseEmpty
			});

			var that = this;
			this.oModel.callFunction("/PostDocument", {
				method: "GET",
				urlParameters: oJsonModel.oData,
				success: function (oData, response) {
					that.refreshView();

					var message = response.data.results[0].Message;
					var aMessage = message.split('^');
					var displayMes = "";
					for (var i = 0; i < aMessage.length; i++) {
						displayMes = displayMes + aMessage[i] + "\n\n";
					}
					that.getView().setBusy(false);
					var message = response.data.results[0].Message;
					sap.m.MessageToast.show(displayMes, {
						my: "center center",
						at: "center center",
						duration: 6000
					});
				},
				error: function (err) {
					that.getView().setBusy(false);
					that.refreshView();
					that.onDataError(err);
				}
			});
		},

		onConfirmBulkButton: function (oEvent) {
			var Payload = this.getView().getModel('Payload').oData;
			this.getView().setBusy(true);

			var oJsonModel = new sap.ui.model.json.JSONModel({
				NewBin: Payload.NewBin,
				NewBinPrefix: Payload.NewBinPrefix,
				Warehouse: Payload.Warehouse,
				BinSource: Payload.SourceBin,
				BinSourcePrefix: Payload.SourceBinPrefix,
				Case: this.correctCase,
				Brand: Payload.Brand,
				ProposedBin: Payload.ProposedBin,
				ProposedBinPrefix: Payload.ProposedBinPrefix
			});

			var that = this;
			this.oModel.callFunction("/PostDocumentBulk", {
				method: "GET",
				urlParameters: oJsonModel.oData,
				success: function (oData, response) {
					that.refreshView();

					var message = response.data.results[0].Message;
					var aMessage = message.split('^');
					var displayMes = "";
					for (var i = 0; i < aMessage.length; i++) {
						displayMes = displayMes + aMessage[i] + "\n\n";
					}
					that.getView().setBusy(false);
					var message = response.data.results[0].Message;
					sap.m.MessageToast.show(displayMes, {
						my: "center center",
						at: "center center",
						duration: 6000
					});
				},
				error: function (err) {
					that.getView().setBusy(false);
					that.refreshView();
					that.onDataError(err);
				}
			});
		},

		refreshView: function () {

			var oView = this.getView();

			// Case Input
			oView.byId('Brand').setEnabled(true);
			oView.byId('idAnxCaseInput').setEnabled(true);
			oView.byId('idAnxCaseInput').setValue(""); // Input for case
			oView.byId('idAnxCaseInput').setWidth("17rem"); // Input for case
			oView.byId('idCaseNextButton').setVisible(true); // Next button below Case input
			oView.byId('idCaseButton').setVisible(true); //Barcode scanner for case
			oView.byId('idManualCaseInput').setVisible(true);
			oView.byId('idManualMaterialInput').setVisible(true);
			oView.byId('idManualBinInput').setVisible(true);
			// Material Input
			oView.byId('idMaterial').setVisible(false);
			oView.byId('idMaterialDescLabel').setVisible(false);
			oView.byId('idHazMaterial').setVisible(false);

			oView.byId('idMaterialInput').setEnabled(true);
			oView.byId('idMaterialInput').setValue('');
			oView.byId('idMaterialInput').setWidth("17rem");
			oView.byId('idMaterialNextButton').setVisible(true);
			oView.byId('idOpenListNextButton').setVisible(true);

			oView.byId('idMaterialButton').setVisible(true);

			// ANX Order Section
			oView.byId('idSmartFormSecondSeparator').setVisible(false);
			oView.byId('idSmartFormSecond').setVisible(false);
			oView.byId('idBinLabel').setVisible(false);
			oView.byId('idBinText').setVisible(false);

			oView.byId('idSmartFormThirdSeparator').setVisible(false);
			oView.byId('idSmartFormThird').setVisible(false);
			oView.byId('idSmartFormFourthSeparator').setVisible(false);
			oView.byId('idSmartFormFourth').setVisible(false);

			//LastBit

			oView.byId('idBinPrefix').setVisible(false);

			oView.byId('idValueInput').setEnabled(true);
			oView.byId('idValueInput').setValue('');
			oView.byId('idValueInput').setWidth("10rem");

			oView.byId('idValueNextButton').setVisible(true);
			oView.byId('idBinPrefix').setVisible(false);
			oView.byId('idValueButton').setVisible(true);
			oView.byId("itemsCarousel").setVisible(false);
			//QUantity
			oView.byId('idQuantityInput').setValue('');

			// Toolbar
			oView.byId('idButtonConfirm').setVisible(false);
			oView.byId('idButtonConfirmBulk').setVisible(false);
			this.bulk = false;	
			this.clearPayload();
			
		},

		setCarousel: function (oItemsData) {
			this.oCarousel.destroyPages();
			this.activePage = 0;
			var that = this;
			this.bReadyForDespatch = false;
			this.aFragments = [];
			oItemsData.forEach(function (element, index) {

				var oJsonItemModel = new JSONModel(element, "item");
				var oXMLFragment = sap.ui.xmlfragment("item" + index, "inchcape.anx.putaway-case.view.ItemForm", that);
				that.getView().addDependent(oXMLFragment);
				oXMLFragment.setModel(oJsonItemModel, "item");
				that.oCarousel.addPage(oXMLFragment);
				that.aFragments.push(oXMLFragment);

			});

			// if (this.navToNextPage) {
			// 	var iDelay = this.NEXT_TO_DELAY;
			// 	if (this.activePage + 1 >= this.aFragments.length) {
			// 		iDelay += 2000;
			// 	}
			// 	jQuery.sap.delayedCall(iDelay, this, function () {
			// 		this.oCarousel.next();
			// 	});
			// } else {
			// 	this.oCarousel.setActivePage(this.oCarousel.getPages()[this.activePage]);
			// }

		},

		onCheckOpenListItem: function (event) {
			var brand = this.getView().getModel('Payload').oData.Brand;
			var scanCase = this.getView().getModel('Payload').oData.Case;
			var filters = [];
			filters.push(new Filter("Brand", sap.ui.model.FilterOperator.EQ, brand));
			filters.push(new Filter("Scan", sap.ui.model.FilterOperator.EQ, scanCase));
			var that = this;
			this.getView().setBusy(true);
			this.oModel.read("/OpenListItemSet", {
				filters: filters,
				success: that.onOpenListItemReceived.bind(that),
				error: that.onDataError.bind(that)
			});
		},

		onOpenListItemReceived: function (oData) {
			var oJsonModel = new sap.ui.model.json.JSONModel(oData),
				t = this.getView(),
				m = t.getModel('Payload');
			t.setBusy(false);
			t.byId('idMaterial').setVisible(false);
			this.bulk = true;
			// m.setProperty("/Material",oData.MaterialNr);
			try {
				var item1 = oData.results[0];
				var material = [];
				material.BinPrefix = item1.StorageType;
				material.Bin = item1.StorageBin;
				var oJsonModel = new sap.ui.model.json.JSONModel(material);
				t.setModel(oJsonModel, "Material");

			} catch (e) {
				return;
			}
			m.setProperty("/ProposedBin", item1.StorageBin);
			m.setProperty("/ProposedBinPrefix", item1.StorageType);
			m.setProperty("/SourceBin", item1.StorageBin);
			m.setProperty("/SourceBinPrefix", item1.StorageType);
			m.setProperty("/Warehouse", item1.Lgnum);
			m.setProperty("/SC", item1.StockCateg);

			// t.setModel(oJsonModel, "Material");

			// Invisible scan buttons
			t.byId('idMaterialButton').setVisible(false);
			t.byId('idMaterialNextButton').setVisible(false);
			t.byId("idOpenListNextButton").setVisible(false);
			t.byId('idMaterialInput').setWidth("20rem");
			t.byId('idMaterialInput').setEnabled(false);
			t.byId("itemsCarousel").setVisible(true);
			t.byId('idMaterialDescLabel').setVisible(true);

			t.byId('idBinLabel').setVisible(true);
			t.byId('idBinText').setVisible(true);

			t.byId('idSmartFormThirdSeparator').setVisible(true);
			t.byId('idSmartFormThird').setVisible(true);
			// t.byId('idSmartFormFourth').setVisible(true);

			this.setCarousel(oData.results);

		}

	});
});