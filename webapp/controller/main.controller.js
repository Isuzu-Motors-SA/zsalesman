sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/core/Fragment',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    'sap/ui/model/json/JSONModel',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterType',
    'sap/ui/model/FilterOperator',
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet"
],
    function (Controller, Fragment, MessageToast, MessageBox, JSONModel, Filter, FilterType, FilterOperator, exportLibrary, Spreadsheet) {
        "use strict";
        const EdmType = exportLibrary.EdmType;
        return Controller.extend("isuzu.com.zsalesman.controller.main", {
            onInit: function () {

                var oDialogModel = new JSONModel({
                    Zidnum: "",
                    Zname: "",
                    Mobile: "",
                    Wphone: "",
                    Email: ""
                });
                this.getView().setModel(oDialogModel, "dialogModel");
                if (!this.addDialog) {
                    this.addDialog = sap.ui.xmlfragment("isuzu.com.zsalesman.view.Fragment.AddEmployeeDialog", this);
                    this.getView().addDependent(this.addDialog);
                }
            },

            onOpenAddDialog: function () {
                // if (!this.addDialog) {
                //     this.addDialog = sap.ui.xmlfragment("isuzu.com.zsalesman.view.Fragment.AddEmployeeDialog", this);
                //     this.getView().addDependent(this.addDialog);
                // }
                // Clear input fields from the fragment
                sap.ui.getCore().byId("_IDGenInput").setValue("");
                sap.ui.getCore().byId("_IDGenInput1").setValue("");
                sap.ui.getCore().byId("_IDGenInput2").setValue("");
                sap.ui.getCore().byId("_IDGenInput3").setValue("");
                sap.ui.getCore().byId("_IDGenInput4").setValue("");
                this.addDialog.open();
            },

            onCloseDialog: function () {
                this.addDialog.close();
            },
            onInputChange: function (oEvent) {
                const oInput = oEvent.getSource();
                const sId = oInput.getId(); // e.g., "__xmlview0--idZidnum"
                const sValue = oEvent.getParameter("value");

                // Extract field key by stripping view prefix
                const sFieldId = sId.split("--").pop(); // "idZidnum", etc.

                // Reset default state
                oInput.setValueState("None");

                switch (sFieldId) {
                    case "_IDGenInput":
                        if (!sValue) {
                            oInput.setValueState("Error");
                            oInput.setValueStateText("ID is required");
                            MessageToast.error("ID is required");
                        } else if (!/^\d+$/.test(sValue)) {
                            oInput.setValueState("Error");
                            oInput.setValueStateText("ID must be numeric");
                            MessageToast.error("ID must be numeric");
                        }
                        break;

                    case "_IDGenInput1":
                        if (!sValue) {
                            oInput.setValueState("Error");
                            oInput.setValueStateText("Name is required");
                        }
                        break;

                    case "_IDGenInput4":
                        if (!sValue) {
                            oInput.setValueState("Error");
                            oInput.setValueStateText("Email is required");
                        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sValue)) {
                            oInput.setValueState("Error");
                            oInput.setValueStateText("Invalid email format");
                        }
                        break;

                    case "_IDGenInput2":
                    case "_IDGenInput3":
                        const oView = this.getView();
                        const sMobile = oView.byId("idMobile").getValue();
                        const sWphone = oView.byId("idWphone").getValue();

                        if (!sMobile && !sWphone) {
                            oView.byId("idMobile").setValueState("Error");
                            oView.byId("idWphone").setValueState("Error");
                            const msg = "At least one phone number is required";
                            oView.byId("idMobile").setValueStateText(msg);
                            oView.byId("idWphone").setValueStateText(msg);
                        } else {
                            oView.byId("idMobile").setValueState("None");
                            oView.byId("idWphone").setValueState("None");
                        }
                        break;
                }
            },

            onSaveEmployee: function () {
                const oDialogModel = this.getView().getModel("dialogModel");
                const oData = oDialogModel.getData();
                const oTable = this.byId("employeeTable");
                const oModel = this.getView().getModel();
                const requiredFields = ["Zidnum", "Zname", "Email"];
                const that = this;

                for (let key of requiredFields) {
                    if (!oData[key]) {
                        MessageToast.show("Please fill all required fields!");
                        return;
                    }
                }
                // At least one phone number (Mobile or Wphone) must be provided
                if (!oData.Mobile && !oData.Wphone) {
                    MessageToast.show("Please provide at least Mobile or Work Phone number.");
                    return;
                }

                // ID validation: numeric only
                if (!/^\d+$/.test(oData.Zidnum)) {
                    MessageToast.show("ID must be numeric only!");
                    return;
                }

                // Email validation: must contain @ 
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(oData.Email)) {
                    MessageToast.show("Please enter a valid Email address with '@'");
                    return;
                }

                const aTableItems = oTable.getItems(); // All visible items
                const aSalesManData = aTableItems.map(function (oItem) {
                    return oItem.getBindingContext().getObject();
                });

                if (aSalesManData.some(emp => emp.Zidnum === oData.Zidnum)) {
                    MessageToast.show("Employee with same ID already exists in the selected rows!");
                    return;
                }

                let sSalesManData = [
                    {
                        Action: "ADD",
                        "Zclient": "",
                        "Zdealer": "",
                        "Zidnum": oData.Zidnum,
                        "Zname": oData.Zname,
                        "Zdate": "/Date(0)/",
                        "Zstatus": "",
                        "Mobile": oData.Mobile,
                        "Wphone": oData.Wphone,
                        "Email": oData.Email,
                        "Search": ""
                    }
                ];
                // Construct the payload
                const oPayload = {
                    Action: "ADD",
                    headerToSalesMan: sSalesManData
                };

                oModel.create("/SalesManHeaderSet", oPayload, {
                    method: "POST",
                    success: function (oData) {
                        MessageToast.show("Selected records Added successfully.");
                        oTable.removeSelections(); // optional
                        oModel.refresh(true); // refresh data
                        that.addDialog.close();
                    },
                    error: function (oError) {
                        MessageToast.show("Failed to Added selected records.");
                        that.addDialog.close();
                    }
                });

            },


            onDeleteSelected: function () {
                const oTable = this.byId("employeeTable");
                const aSelectedItems = oTable.getSelectedItems();
                const oModel = this.getView().getModel();

                if (!aSelectedItems.length) {
                    MessageToast.show("Please select at least one row to delete.");
                    return;
                }
                sap.m.MessageBox.confirm("Do you want to delete the selected records?", {
                    title: "Confirm Deletion",
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    emphasizedAction: sap.m.MessageBox.Action.YES,
                    onClose: function (sAction) {
                        if (sAction === sap.m.MessageBox.Action.YES) {
                            // Collect selected context data
                            const aSalesManData = aSelectedItems.map(function (oItem) {
                                return oItem.getBindingContext().getObject();
                            });

                            // Construct the payload
                            const oPayload = {
                                Action: "DEL",
                                headerToSalesMan: aSalesManData
                            };
                            // Send POST call to function import (e.g., /DeleteSalesManEntries)
                            oModel.create("/SalesManHeaderSet", oPayload, {
                                method: "POST",
                                success: function (oData) {
                                    MessageToast.show("Selected records deleted successfully.");
                                    oTable.removeSelections(); // optional
                                    oModel.refresh(true); // refresh data
                                },
                                error: function (oError) {
                                    MessageToast.show("Failed to delete selected records.");
                                }
                            });
                        }
                    }
                });
            },

            onSearch: function (oEvent) {
                const sQuery = oEvent.getParameter("newValue");
                const oTable = this.byId("employeeTable");
                const oModel = this.getView().getModel();

                const aFilters = [];
                if (sQuery) {
                    aFilters.push(
                        new Filter({
                            filters: [
                                new Filter("Search", FilterOperator.EQ, sQuery),
                            ],
                            and: false
                        })
                    );
                }
                oTable.getBinding("items").filter(aFilters);
            },
            onExport: function () {
                const oTable = this.byId("employeeTable");
                const aSelectedItems = oTable.getItems();
                const aSalesManData = aSelectedItems.map(function (oItem) {
                    return oItem.getBindingContext().getObject();
                });
                const aCols = this.createColumnConfig();
                const oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: "Level"
                    },
                    dataSource: aSalesManData,
                    fileName: "SalesMan.xlsx",
                    worker: false
                };

                const oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function () {
                    oSheet.destroy();
                });
            },
            createColumnConfig: function () {
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                const aCols = [];
                aCols.push({
                    label: oResourceBundle.getText("IDNumber"),
                    property: "Zidnum",
                    type: EdmType.String
                });

                aCols.push({
                    label: oResourceBundle.getText("Name"),
                    property: "Zname",
                    type: EdmType.String
                });

                aCols.push({
                    label: oResourceBundle.getText("Mobile"),
                    property: "Mobile",
                    type: EdmType.String
                });

                aCols.push({
                    label: oResourceBundle.getText("WorkPhoneNo"),
                    property: "Wphone",
                    type: EdmType.String
                });

                aCols.push({
                    label: oResourceBundle.getText("Email"),
                    property: "Email",
                    type: EdmType.String
                });
                return aCols;
            }

        });
    });
