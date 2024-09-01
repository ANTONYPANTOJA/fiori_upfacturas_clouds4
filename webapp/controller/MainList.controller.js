sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/m/MessageBox',
    "ns/asa/zappuploadinvoices/controller/BaseController",
    "sap/ui/model/odata/type/Guid",
    "sap/ui/model/json/JSONModel",

],
    function (Controller, MessageBox, BaseController,Guid,JSONModel) {
        "use strict";

        let that;

        return BaseController.extend("ns.asa.zappuploadinvoices.controller.MainList", {
            onInit: function () {

                //Inicializar Variables.
                that = this;
                
                //Inicializar Modelos
                this.initModels();

            },
            initModels: function()
            {
                //Model Tabla Detalle List
                let dataModelTableList = this.getOwnerComponent().getModel("ModelDetailReport");
                this.getView().setModel(dataModelTableList, "detailReport");

                //Modelo Button Status
                let buttonsStatus = { btnCheck: false , btnContab: false, btnEliminar: false, btnLog: false, btnFijar: false };
                this.getView().setModel(new JSONModel(buttonsStatus), "aStatus");
            },

            onFileChange: async function (event) {
                const file = event.getParameter("files") && event.getParameter("files")[0];
                const fileUploader = event.getSource();

                sap.ui.core.BusyIndicator.show(0);
                const data = await this._readFile(file);
                if (data && data.length > 0) {
                    await this.setDataTable(data);  //Armar la Estructura del Excel
                    await this.onUploadPostList();  //Almacenar los registros POST - UPLOAD
                    this.updateModelButtons(true);  //Actualizar Buttons
                    this.onRefresh();
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
                                oDataModelAdd.Id = parseInt(value);
                                break;
                            case "*SOCIEDAD" || 'SOCIEDAD'://Columna B1
                                oDataModelAdd.CompanyCode = value;
                                break;

                            case "*PROVEEDOR" || 'PROVEEDOR'://Columna C1
                                oDataModelAdd.InvoicingParty = value;
                                break;
                            case "REFERENCIA"   ://Columna D1
                                oDataModelAdd.Reference = value;
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

                return await this.callOdataUpload();
            },
            callOdataUpload: async function()
            {
                    let oDataItems = this.getModel("detailReport").getData();
                    for (let index = 0; index < oDataItems.DetailList.length; index++) 
                    {
                        try {
                           await this.createPost(oDataItems.DetailList[index]); 
                        } catch (error) {
                            console.error("Error Items - callOdataUpload",error);
                        }
                    }
            },
            createPost: async function(body){
                return new Promise(async (resolve, reject) => {
                try {
                    this.getView().getModel().create("/InvoiceList", body,{
                        success: function (result) {
                            resolve(true);
                        }.bind(this),
                        error: function (e) {
                            reject(false);
                        }.bind(this)
                    });
                } catch (error) {    
                    reject(false);
                }
              });

            },

            callOdataUploadItems: async function(key)
            {
                return new Promise(async (resolve, reject) => {

                    let path1 = "/ItemsList(Supplierinvoiceuploaduuid='" + key + "',Item=0)";
                    let path ="/InvoiceList('" + key + "')/to_ItemsList";

                    let pathAction ="/InvoiceList.CreateInvoiceUpload";
//                    let instance = new sap.ui.model.odata.type.Guid();
//                    let uuid_aux = instance.parseValue(key,"sap.ui.model.odata.type.String.Guid"); 

                    let body = [{ id:1,CompanyCode: '1100' },{ id:2,CompanyCode: '1100' }];
                    let body2 = {d: [{ Supplierinvoiceuploaduuid:key,Item: 1,Id:1,CompanyCode:'1100',InvoicingParty:'',Reference:'',InvoiceStatus:''},
                                 { Supplierinvoiceuploaduuid:key,Item: 2,Id:1,CompanyCode:'1200',InvoicingParty:'',Reference:'',InvoiceStatus:''}]};
                    
                    let datafunction = { id : 2,reference:'145',companycode:'1100',invoicingparty:'aa', _Position: [{ id: 1,reference:'147'},{ id: 2,reference:'147'}]};
                    //ZUI_RAP_INVOICELIST_SB_OD2/InvoiceList(guid'00000000-0000-0000-0000-000000000000')/to_ItemsList"
                     
                    let results = { results : body2 };

                    let original = [{ results }];

                    try {
                       // this.getView().getModel().create(path, body2,{
                        this.getView().getModel().create(path, body2,{
                            success: function (result) {
                                MessageBox.success("callOdataUploadItems");
                                resolve(result);
                            }.bind(this),
                            error: function (e) {
                                MessageBox.error("Error" + e);
                                reject(false);
                            }.bind(this)
                        });
                    } catch (error) {    
                        reject(false);
                    }
                });
            },

            updateModelButtons: function(action1,action2)
            {
                let oViewModel = that.getView().getModel("aStatus");
                //oViewModel.setProperty("/Source", this.sUrlCosapi); -@DELETE
                if (action1) {
                    oViewModel.setProperty("/btnCheck",true);
                    oViewModel.setProperty("/btnEliminar",true);
                }
                if (action2) {
                    oViewModel.setProperty("/btnContab",true);
                    oViewModel.setProperty("/btnLog",true);
                }

            }


        });
    });
