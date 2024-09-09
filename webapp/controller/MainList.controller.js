sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/m/MessageBox',
    "ns/asa/zappuploadinvoices/controller/BaseController",
    "sap/ui/model/odata/type/Guid",
    "sap/ui/model/json/JSONModel",
    "ns/asa/zappuploadinvoices/model/formatter",
],
    function (Controller, MessageBox, BaseController, Guid, JSONModel,Formatter) {
        "use strict";

        let that;

        return BaseController.extend("ns.asa.zappuploadinvoices.controller.MainList", {
            onInit: function () {

                //Inicializar Variables.
                that = this;

                //Inicializar Modelos
                this.initModels();

            },
            initModels: function () {
                //Model Tabla Detalle List
                let dataModelTableList = this.getOwnerComponent().getModel("ModelDetailReport");
                this.getView().setModel(dataModelTableList, "detailReport");

                //Modelo Button Status
                let buttonsStatus = { btnCheck: true, btnContab: true, btnEliminar: true, btnLog: true, btnFijar: false };
                this.getView().setModel(new JSONModel(buttonsStatus), "aStatus");

                //Model Global
                const bundle = this.getResourceBundle();
                const model = new JSONModel({
                    messages: [],
                    load: {
                        message: bundle.getText("loadmsg")
                    },
                    table: {
                        data: []
                    }
                });
                this.setModel(model, "model");
                //Link de Plantilla
                //this.sUrlPlantilla = sap.ui.require.toUrl("ns/asa/zappuploadinvoices/model/Formato_Carga_Facturas.xlsx");
            },

            onFileChange: async function (event) {
                const file = event.getParameter("files") && event.getParameter("files")[0];
                const fileUploader = event.getSource();

                const data = await this._readFile(file);
                if (data && data.length > 0) {
                    this.showBusyText("loadmsgUp");
                    await this.setDataTable(data);  //Armar la Estructura del Excel
                    await this.onUploadPostList();  //Almacenar los registros POST - UPLOAD
                    this.updateModelButtons(true);  //Actualizar Buttons
                    this.onRefresh();
                    this.hideBusyText();
                } else {
                    MessageBox.information(this.getResourceBundle("msg2"));
                }
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
                } else {
                    MessageBox.error(this.getResourceBundle("msg1"));
                }
            },
            validarCamposExcel: async function (data) {
                let aReturn = [];
                let promises = [];
                let oData = [];
                let lv_column = "";
                let lv_column_main = "";

                let oDataModel_main = { DetailList: [] };
                let oDataModelAdd = {}


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
                            case "REFERENCIA"://Columna D1
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
            callOdataUpload: async function () {
                let bodyInit = {};
                return new Promise(async (resolve, reject) => {
                    let idPostUpload = await this.createPost(bodyInit);
                    if (idPostUpload) {
                        await this.processDetailUpload(idPostUpload);
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                });
            },
            createPost: async function (body) {
                return new Promise(async (resolve, reject) => {
                    try {
                        this.getView().getModel().create("/InvoiceList", body, {
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
            createPostAction: async function (model, path, body) {
                return new Promise(async (resolve, reject) => {
                    try {
                        this.getView().getModel().create(path, body, {
                            success: function (result) {
                                resolve(result);
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

            callOdataUploadItems: async function (key, body) {
                return new Promise(async (resolve, reject) => {

                    let path = "/InvoiceList('" + key + "')/to_ItemsList";
                    let pathAction = "/InvoiceList.CreateInvoiceUpload";

                    //let instance = new sap.ui.model.odata.type.Guid();
                    //let uuid_aux = instance.parseValue(key,"sap.ui.model.odata.type.String.Guid"); 
                    //ZUI_RAP_INVOICELIST_SB_OD2/InvoiceList(guid'00000000-0000-0000-0000-000000000000')/to_ItemsList"

                    try {
                        this.getView().getModel().create(path, body, {
                            success: function (result) {
                                resolve(true);
                            }.bind(this),
                            error: function (e) {
                                console.log("Error Function callOdataUploadItems", e)
                                reject(false);
                            }.bind(this)
                        });
                    } catch (error) {
                        reject(false);
                    }

                });
            },

            processDetailUpload: async function (idPostUpload) {
                let oDataItems = this.getModel("detailReport").getData();
                let lengthTable = oDataItems.DetailList.length
                let items = 0;
                for (let index = 0; index < oDataItems.DetailList.length; index++) {
                    items++;
                    try {
                        oDataItems.DetailList[index].Item = index;
                        oDataItems.DetailList[index].Supplierinvoiceuploaduuid = idPostUpload;
                        oDataItems.DetailList[index].uuidAuxUpload = idPostUpload;
                        oDataItems.DetailList[index].Random  = this.getRandom(1, 999999);
                        oDataItems.DetailList[index].DateWeb = this.getDateNow();
                        
                        if (lengthTable === items) {
                            oDataItems.DetailList[index].FlagFin = "X";
                        }
                        await this.callOdataUploadItems(idPostUpload, oDataItems.DetailList[index]);
                    } catch (error) {
                        console.error("Error Items - callOdataUpload", error);
                    }
                }
            },

            updateModelButtons: function (action1, action2) {
                let oViewModel = that.getView().getModel("aStatus");
                //oViewModel.setProperty("/Source", this.sUrlCosapi); -@DELETE
                if (action1) {
                    oViewModel.setProperty("/btnCheck", true);
                    oViewModel.setProperty("/btnEliminar", true);
                }
                if (action2) {
                    oViewModel.setProperty("/btnContab", true);
                    oViewModel.setProperty("/btnLog", true);
                }

            },

            onCheckPressed: async function () {
                const itemsSelected = this.getItemsTableSelected();
                if (!this.validCheck(itemsSelected)) return;

                const rptaConfirm  = await this.confirmPopup("TitDialog2","msg2");
                if (rptaConfirm) {
                    this.showBusyText("loadmsgCk");
                    const results = await this.checkItemsOdataRap(itemsSelected, 'CK', '2');
                    console.log({ results });
                    this.hideBusyText();
                    this.showMessageToast("msg4");                    
                }
            },
            validCheck: function (itemsSelected) {
                if (itemsSelected.length === 0) {
                    this.onDisplayMessageBoxPress('E', 'msg3');
                    return false;
                } else {
                    return true;
                }
            },

            getItemsTableSelected: function () {
                return this.getView().byId("detailList").getTable().getSelectedItems();
            },
            checkItemsOdataRap: async function (itemsSelects, action, option) {
                let resultProcess = [];
                if (itemsSelects.length > 0) {
                    for (let index = 0; index < itemsSelects.length; index++) {
                        const contextObject = itemsSelects[index].getBindingContext();
                        const keyPath = this.getIdPath(contextObject.getPath());
                        const odataBody = contextObject.getObject();
                        let result = await this.callOdataActionRows(odataBody, action, keyPath, option);
                        resultProcess.push(result);
                    }
                }
                return resultProcess;
            },
            getIdPath: function (cadena) {
                //InvoiceList(""1-20240902023534-942"
                let values = cadena.split("'");
                if (values.length > 0) {
                    return values[1];
                } else {
                    return null;
                }
            },
            callOdataActionRows: async function (odataBody, action, key, option) {
                let path = "";
                let dateWeb = this.getDateNow();
                async function delay(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }

                let parameters = {
                    Idsuplier: key,
                    Id: 1,
                    Action: action,
                    Supplierinvoiceuploaduuid: key,
                    Dateweb: dateWeb,
                }
                
                if (option == "1") {
                    /**POST - CALL FUNCTION */
                    path = "/postActionUpload";
                    await delay(500);
                    return await this.callFunctionOdata(path, parameters);

                } else if (option == "2") {
                    /** POST - CREATE ACTION */
                    path = "/ActionInvoice";
                    const body = {
                        supplierinvoiceuploaduuid: key,
                        idsuplier: key,
                        action: action,
                        id: 1,
                        dateweb:this.getDateNow()
                    };

                    await delay(500);
                    return await this.createPostAction("ModelActionService", path, body);
                }

            },

            callFunctionOdata: async function (path, parameters) {
                return new Promise(async (resolve, reject) => {
                    try {
                        this.getView().getModel().callFunction(path, {
                            method: "POST",
                            urlParameters: parameters,
                            success: function (result) {
                                resolve(result);
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
            onDownloadPress: function () {
                
                 Formatter.base64ToFileExcel();
                // this.downloadFile("Formato Carga Masiva de Facturas.xlsx",this.sUrlPlantilla);
                
            },
            onRefresh: function () {
                this.getView().getModel().refresh(true);
            },
            onDeletePress: async function () {
                const itemsSelected = this.getItemsTableSelected();
                if (!this.validCheck(itemsSelected)) return;

                try {
                    const rptaConfirm = await this.confirmPopup("TitDialog1","msg1");
                    if (rptaConfirm) {
                        this.showBusyText("loadmsgCk");
                        await this.checkItemsOdataRap(itemsSelected, 'DL', '1');
                        this.onRefreshSingle();
                        this.hideBusyText(); 
                        this.showMessageToast("msg4") 
                    }
                } catch (error) {
                  console.log("Error Funcion .- onDeletePress " , error);
                  this.hideBusyText(); 
                }
            },
            confirmPopup: async function(title,msg){
                let t = this;

                return new Promise( async (resolve, reject) => {
                    MessageBox.confirm(this.getResourceBundle().getText(msg), {
                        title: this.getResourceBundle().getText(title),
                        onClose: function (sAction) {
                            if (sAction === MessageBox.Action.OK) {
                                resolve(true);
                            }else{
                                resolve(false);
                            }
                        }.bind(t)
                    });
                });

            },
            onRefreshSingle: function () {
                this.getView().getModel().refresh(true);
            },
        });
    });
