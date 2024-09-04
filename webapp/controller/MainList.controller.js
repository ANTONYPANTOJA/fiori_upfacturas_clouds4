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
                let buttonsStatus = { btnCheck: true , btnContab: false, btnEliminar: false, btnLog: false, btnFijar: false };
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
                                let valueFdoc = this.getJsDateFromExcel(value);
                                if (value) {
                                    oDataModelAdd.DocumentDate = valueFdoc;  
                                }
                                break;
                            case "*FEC.CONTAB." || 'FEC.CONTAB.'://Columna F1
                                let valueFcont = this.getJsDateFromExcel(value);
                                if (value) {
                                    oDataModelAdd.PostingDate = valueFcont;  
                                }
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
                let bodyInit = {};
                return new Promise(async (resolve, reject) => {
                    let idPostUpload = await this.createPost(bodyInit);
                    if (idPostUpload) {
                        await this.processDetailUpload(idPostUpload);
                        resolve(true) 
                    }else{
                        resolve(false)
                    } 
                });
            },
            createPost: async function(body){
                return new Promise(async (resolve, reject) => {
                try {
                    this.getView().getModel().create("/InvoiceList", body,{
                        success: function (result) {
                            resolve(result.Supplierinvoiceuploaduuid);
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

            callOdataUploadItems: async function(key,body)
            {
                return new Promise(async (resolve, reject) => {

                    let path ="/InvoiceList('" + key + "')/to_ItemsList";
                    let pathAction ="/InvoiceList.CreateInvoiceUpload";

                    //let instance = new sap.ui.model.odata.type.Guid();
                    //let uuid_aux = instance.parseValue(key,"sap.ui.model.odata.type.String.Guid"); 
                    //ZUI_RAP_INVOICELIST_SB_OD2/InvoiceList(guid'00000000-0000-0000-0000-000000000000')/to_ItemsList"

                    try {
                        this.getView().getModel().create(path, body,{
                            success: function (result) {
                                resolve(true);
                            }.bind(this),
                            error: function (e) {
                                console.log("Error Function callOdataUploadItems",e)
                                reject(false);
                            }.bind(this)
                        });
                    } catch (error) {    
                        reject(false);
                    }

                });
            },

            processDetailUpload: async function(idPostUpload)
            {
                let oDataItems = this.getModel("detailReport").getData();
                let lengthTable = oDataItems.DetailList.length
                let items = 0;
                for (let index = 0; index < oDataItems.DetailList.length; index++) 
                {
                    items ++;
                    try {
                        oDataItems.DetailList[index].Item = index;
                        oDataItems.DetailList[index].Supplierinvoiceuploaduuid = idPostUpload;
                        oDataItems.DetailList[index].uuidAuxUpload = idPostUpload;  
                        if (lengthTable === items) 
                        {
                            oDataItems.DetailList[index].FlagFin = "X";    
                        }
                       await this.callOdataUploadItems(idPostUpload,oDataItems.DetailList[index]); 
                    } catch (error) {
                        console.error("Error Items - callOdataUpload",error);
                    }
                }
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

            },

            onCheckPressed: async function()
            {
                const itemsSelected = this.getItemsTableSelected();
                const results = await this.checkItemsOdataRap(itemsSelected,'CK');
                console.log({ itemsSelected });
            },

            getItemsTableSelected: function()
            {
                return this.getView().byId("detailList").getTable().getSelectedItems();
            },
            checkItemsOdataRap: async function (itemsSelects,action)
            {
                if (itemsSelects.length > 0 ) {
                    for (let index = 0; index < itemsSelects.length; index++) {
                        const contextObject = itemsSelects[index].getBindingContext();
                        const path = contextObject.getPath();
                        const odataBody = contextObject.getObject();
                        let result = await this.callOdataActionRows(odataBody,action);
                    }
                }
            },
            callOdataActionRows: async function(odataBody,action)
            {   
                let parameters = { Idsuplier: '14',
                                   Id: 1,
                                   Action: action
                }
                return await this.callFunctionOdata('/actionUploadInvoice',parameters)
            },

            callFunctionOdata: async function(path,parameters)
            {
                return new Promise(async (resolve, reject) => {
                    try {
                           // this.getView().getModel().update(path,{
                           this.getView().getModel().callFunction(path, {
                            method: "GET",
                            urlParameters:parameters,
                            success: function (result) {
                                resolve(result);
                            }.bind(this),
                            error: function (e){
                                reject(false);
                            }.bind(this)
                        });
                    } catch (error) {    
                        reject(false);
                    }
                });                  
            }
        });
    });
