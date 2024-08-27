sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/m/MessageBox',
    "ns/asa/zappuploadinvoices/controller/BaseController",
],
    function (Controller, MessageBox, BaseController) {
        "use strict";

        return BaseController.extend("ns.asa.zappuploadinvoices.controller.MainList", {
            onInit: function () {

                //Inicializar el Modelo

                let dataModelTableList = this.getOwnerComponent().getModel("ModelDetailReport");
                this.getView().setModel(dataModelTableList, "detailReport");
            },
            onFileChange: async function (event) {
                const file = event.getParameter("files") && event.getParameter("files")[0];
                const fileUploader = event.getSource();

                sap.ui.core.BusyIndicator.show(0);
                const data = await this._readFile(file);
                if (data && data.length > 0) {
                    await this.setDataTable(data);              //Armar la Estructura del Excel
                    let result = await this.onUploadPostList(); //Almacenar los registros POST - UPLOAD
                    if (result) {
                        
                    }else{

                    }
                } else {
                    MessageBox.information(this.getResourceBundle("msg2"));
                    sap.ui.core.BusyIndicator.hide();
                }
                sap.ui.core.BusyIndicator.hide();
            },

            _readFile: async function (file) {
                let excelData = {};

                const resolveImport = (e) => {
                    let data = e.target.result;
                    let workbook = XLSX.read(data, {
                        type: 'binary'
                    });
                    workbook.SheetNames.forEach(function (sheetName) {
                        if (sheetName === "Template") {
                            excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                        }
                    });

                    let keys = [], keysNoValidas = [];
                    if (excelData.length > 0) {
                        return excelData
                    }
                };
                const rejectImport = (error) => {
                    console.log(error);
                }
                const readerImport = new Promise((resolve, reject) => {
                    if (file && window.FileReader) {
                        var reader = new FileReader();
                        reader.onload = resolve;
                        reader.onerror = reject;
                        reader.readAsBinaryString(file);
                    }

                });

                return await readerImport.then(resolveImport, rejectImport);
            },
            setDataTable: async function (data) {
                let oModelExcel = this.getModel("detailReport");
                if (data.length > 0) {
                    let oCamposValidados = await this.validarCamposExcel(data);
                    oModelExcel.setData(oCamposValidados);
                    sap.ui.core.BusyIndicator.hide();
                } else {
                    MessageBox.error(this.getResourceBundle("msg1"));
                    sap.ui.core.BusyIndicator.hide();
                }
            },
            validarCamposExcel: async function (data) {
                let aReturn = [];
                let promises = [];
                let oData = [];
                let lv_column = "";
                let lv_column_main = "";

                let oDataModel_main = { DetailList : [] };
                let oDataModelAdd  = {}
                

                for (let i = 0; i < data.length; i++) {
                    oData = [];
                    oData = data[i];

                    oDataModelAdd = {};

                    for (const [key, value] of Object.entries(oData)) {

                        lv_column = key.toUpperCase();
                        lv_column_main = lv_column.replace(" ", "");

                        switch (lv_column_main) {
                            case "*ID" || 'ID'://Columna A1                         
                                oDataModelAdd.Id = value;
                                break;
                            case "*SOCIEDAD" || 'SOCIEDAD'://Columna B1
                                oDataModelAdd.CompanyCode = value;
                                break;

                            case "*PROVEEDOR" || 'PROVEEDOR'://Columna C1
                                oDataModelAdd.InvoicingParty = value;
                                break;
                            case "REFERENCIA"   ://Columna D1
                                oDataModelAdd.Referencia = value;
                                break;
                            case "*FEC.DOC." || 'FEC.DOC.'://Columna E1
                                // oDataModel.DetailList.PostingDate = value;
                                break;
                            case "*FEC.CONTAB." || 'FEC.CONTAB.'://Columna F1
                                // oDataModel.DetailList.DocumentDate = value;
                                break;

                            case "*CL.DOC." || 'CL.DOC.'://Columna G1

                                break;

                            case "IND.CME"://Columna H1

                                break;

                            case "*MONEDA" || 'MONEDA'://Columna I1

                                break;
                            case "*IMPORTEPROVEEDOR" || 'IMPORTEPROVEEDOR'://Columna J1

                                break;
                            case "RET.IUE": //Columna K1

                                break;
                            case "*RET.IT" || 'RET.IT'://Columna L1

                                break;
                            case "ASIGNACIÓN"://Columna M1

                                break;
                            case "TEXTODECABECERA"://Columna N1

                                break;
                            default:
                                break;
                        }
                    }
                    oDataModel_main.DetailList.push(oDataModelAdd)
                }
                aReturn = oDataModel_main;
                return aReturn

            },

            onUploadPostList: async function () {

                let odataModel = this.getModel("detailReport").getData();
                let body = odataModel.DetailList;
                
                this.getView().getModel().create("/InvoiceList", body, {

                    success: function () {
                        MessageBox.success("ok");
                    }.bind(this),
                    error: function (e) {
                        MessageBox.error("Error" + e);
                    }.bind(this)
                });
            }


        });
    });
