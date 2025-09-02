function initModel() {
	var sUrl = "/sap/opu/odata/sap/ZWM_ZW04_PUTAWAY_CASE_SRV/";
	var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	sap.ui.getCore().setModel(oModel);
}