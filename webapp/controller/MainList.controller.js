sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/m/MessageBox',
    "ns/asa/zappuploadinvoices/controller/BaseController",
    "sap/ui/model/odata/type/Guid",
    "sap/ui/model/json/JSONModel",
    "ns/asa/zappuploadinvoices/model/formatter",
    "sap/ui/model/Filter",
    "sap/ushell/ui5service/ShellUIService",
    "ns/asa/zappuploadinvoices/model/formatter",
    "ns/asa/zappuploadinvoices/libs/moment",
],
    function (Controller, MessageBox, BaseController, Guid, JSONModel, Formatter, Filter, ShellUIService, formatter, moment) {
        "use strict";

        let that;

        return BaseController.extend("ns.asa.zappuploadinvoices.controller.MainList", {
            onInit: function () {

                //Inicializar Variables.
                that = this;

                //Inicializar Modelos
                this.initModels();

                //Inicializar BACK del Launchpad
                this.oShellUIService = new ShellUIService({
                    scopeObject: this.getOwnerComponent(),
                    scopeType: "component"
                });
                this.oShellUIService.setBackNavigation(this._navBackViewMain.bind(this));

                //Clear Table
                this.clearData();

                //Inicializar stilos
                //this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
                this._oWorklistSmartTable = this.byId("detailList");
			    this._oWorklistSmartTable.addStyleClass("sapUiMediumMarginBeginEnd");

            },
            clearData: async function () {
                await this.clearTableSingle();
            },
            formatter: formatter,
            moment: moment,

            initModels: function () {
                //Model Tabla Detalle List
                let dataModelTableList = this.getOwnerComponent().getModel("ModelDetailReport");
                this.getView().setModel(dataModelTableList, "detailReport");

                //Modelo Button Status
                let buttonsStatus = { btnCheck: false, btnContab: false, btnEliminar: false, btnLog: true, btnFijar: false };
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
                    },
                    ckProcess: {
                        data: []
                    },
                    ckProcessOk: {
                        data: []
                    },
                    postProcess: {
                        data: []
                    },
                    log: {
                        data: []
                    },
                    idSession: ""
                });
                this.setModel(model, "model");
                this.enableCheck(false);
            },
            _navBackViewMain: function () {
                this.onPressExit("", "RouteApp");
            },

            onFileChange: async function (event) {
                const file = event.getParameter("files") && event.getParameter("files")[0];
                const fileUploader = event.getSource();

                const data = await this._readFile(file);
                if (data && data.length > 0) {
                    this.clearModelIntern();
                    this.showBusyText("loadmsgUp");
                    const resultEjec = await this.setDataTable(data);  //Armar la Estructura del Excel
                    if (resultEjec) {
                        let resultsProcess = await this.onUploadPostList();  //Almacenar los registros POST - UPLOAD
                        this.updateModelButtons(true);  //Actualizar Buttons
                        this.onRefresh();
                        this.hideBusyText();
                        fileUploader.clear();
                        this.messageShowUpload();                        
                    }else{
                        this.hideBusyText();
                    }

                } else {
                    MessageBox.error(this.getResourceBundle().getText("msg2"));
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
                        if (sheetName === "Plantilla" || sheetName === "Template" || sheetName === "plantilla" ) {
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
                let run = true;

                let oModelExcel = this.getModel("detailReport");
                if (data.length > 0) {
                    let oCamposValidados = await this.validarCamposExcel(data);
                    if (oCamposValidados.DetailList.length === 0 || oCamposValidados.DetailList == undefined) {
                        MessageBox.error(this.getResourceBundle().getText("msg66"));
                        run = false;
                    } else {
                        oModelExcel.setData(oCamposValidados);
                    }
                } else {
                    MessageBox.error(this.getResourceBundle().getText("msg1"));
                    run = false;
                }
                return run;
            },
            validarCamposExcel: async function (data) {
                let aReturn = [];
                let promises = [];
                let oData = [];
                let lv_column = "";
                let lv_column_main = "";

                let oDataModel_main = { DetailList: [] };
                let oDataModelAdd = {};
                let columNames = [];
                let lv_column_1 = "";
                let dateValue;


                for (let i = 0; i < data.length; i++) {
                    oData = [];
                    oData = data[i];

                    //Obtener los nombre de la cabecera
                    if (i === 1) {
                        const columns = data[i];
                        for (const [key1, value1] of Object.entries(columns)) {
                            columNames.push(key1);
                        }
                    }
                    oDataModelAdd = {};
                    //Datos
                    if (i >= 2) {
                        if (columNames.length != 49) {
                            break;
                            //return aReturn;
                        }

                        for (const [key, value] of Object.entries(oData)) {

                            //lv_column = key.toUpperCase();

                            lv_column_main = key;

                            if (lv_column_1 == undefined || lv_column_1 == "") {
                                for (let index = 0; index < columNames.length; index++) {
                                    if (index === 0) {
                                        lv_column_1 = columNames[index];
                                        break;
                                    }
                                }
                            }
                            switch (lv_column_main) {
                                case lv_column_1 || 'ID'://Columna A1                         
                                    oDataModelAdd.IdExcel = parseInt(value);
                                    break;
                                case "__EMPTY" || 'SOCIEDAD'://Columna B1
                                    oDataModelAdd.CompanyCode = String(value);
                                    break;

                                case "__EMPTY_1" || 'PROVEEDOR'://Columna C1
                                    oDataModelAdd.InvoicingParty = String(value);
                                    break;
                                case "__EMPTY_2"://Columna D1
                                    oDataModelAdd.Reference = String(value);
                                    break;
                                case "__EMPTY_3" || 'FEC.DOC.'://Columna E1
                                    let valueFdoc = this.getJsDateFromExcel(value);
                                    if (value) {
                                        oDataModelAdd.DocumentDate = valueFdoc;
                                    }
                                    break;
                                case "__EMPTY_4" || 'FEC.CONTAB.'://Columna F1
                                    let valueFcont = this.getJsDateFromExcel(value);
                                    if (value) {
                                        oDataModelAdd.PostingDate = valueFcont;
                                    }
                                    break;

                                case "__EMPTY_5" || 'CL.DOC.'://Columna G1
                                    oDataModelAdd.ClsDoc = value;
                                    break;
                                case "__EMPTY_6"://Columna H1
                                    oDataModelAdd.IndMe = value;
                                    break;

                                case "__EMPTY_7" || 'MONEDA'://Columna I1
                                    oDataModelAdd.Waers = value;
                                    break;
                                case "__EMPTY_8" || 'IMPORTEPROVEEDOR'://Columna J1
                                    try {
                                        oDataModelAdd.ImportProv = parseFloat(value).toFixed(2);
                                    } catch (error) {
                                        oDataModelAdd.ImportProv = parseFloat(0).toFixed(0);;
                                    }
                                    break;
                                case "__EMPTY_9": //Columna K1
                                    oDataModelAdd.RetIue = value;
                                    break;
                                case "__EMPTY_10" || 'RET.IT'://Columna L1
                                    oDataModelAdd.RetIt = value;
                                    break;
                                case "__EMPTY_11"://Columna M1
                                    oDataModelAdd.Asignacion = String(value);
                                    break;
                                case "__EMPTY_12"://Columna N1
                                    oDataModelAdd.TxtHeader = String(value);
                                    break;
                                case "__EMPTY_13":
                                    oDataModelAdd.ReferPago = String(value).substring(0,40);
                                    break;
                                case "__EMPTY_14":
                                    dateValue = this.getJsDateFromExcel(value);
                                    if (dateValue) {
                                        oDataModelAdd.FechaBase = dateValue;
                                    }
                                    break;
                                case "__EMPTY_15":
                                    try {
                                        oDataModelAdd.Dias = parseInt(value);
                                    } catch (error) {
                                        oDataModelAdd.Dias = 0;
                                    }
                                    break;
                                case "__EMPTY_16":
                                    oDataModelAdd.Nombre1 = value;
                                    break;
                                case "__EMPTY_17":
                                    oDataModelAdd.Nombre2 = value;
                                    break;
                                case "__EMPTY_18":
                                    oDataModelAdd.NitCi = String(value);
                                    break;
                                case "__EMPTY_19":
                                    oDataModelAdd.Poblacion = value;
                                    break;
                                case "__EMPTY_20":
                                    oDataModelAdd.TxtPosProv = String(value).substring(0,50);
                                    break;
                                case "__EMPTY_21":
                                    oDataModelAdd.Bloq = value;
                                    break;
                                case "__EMPTY_22":
                                    oDataModelAdd.Vp = value;
                                    break;
                                case "__EMPTY_23":
                                    oDataModelAdd.BancoPropio = value;
                                    break;
                                case "__EMPTY_24":
                                    oDataModelAdd.IdCuenta = String(value);
                                    break;
                                case "__EMPTY_25":
                                    oDataModelAdd.CtaAlternativa = String(value);
                                    break;
                                case "__EMPTY_26":
                                    oDataModelAdd.MotivoPago = value;
                                    break;
                                case "__EMPTY_27":
                                    oDataModelAdd.ClaveRef1 = String(value);
                                    break;
                                case "__EMPTY_28":
                                    oDataModelAdd.ClaveRef2 = String(value);
                                    break;
                                case "__EMPTY_29":
                                    oDataModelAdd.ClaveRef3 = String(value);
                                    break;
                                case "__EMPTY_30":
                                    oDataModelAdd.LugarComercial = value;
                                    break;
                                case "__EMPTY_31":
                                    oDataModelAdd.BukrsPos = String(value);
                                    break;
                                case "__EMPTY_32":
                                    oDataModelAdd.CtaPos = String(value);
                                    break;
                                case "__EMPTY_33":
                                    oDataModelAdd.TxtCtaMayorPos = String(value).substring(0,50);
                                    break;
                                case "__EMPTY_34":
                                    oDataModelAdd.IndicadorDhPos = value;
                                    break;
                                case "__EMPTY_35":
                                    try {
                                        oDataModelAdd.ImporteCtaMayorPos = parseFloat(value).toFixed(2);
                                    } catch (error) {
                                        oDataModelAdd.ImporteCtaMayorPos = parseFloat(0).toFixed(2);;
                                    }
                                    break;
                                case "__EMPTY_36":
                                    oDataModelAdd.IndIvaPos = value;
                                    break;
                                case "__EMPTY_37":
                                    oDataModelAdd.AsigCmPos = String(value);
                                    break;
                                case "__EMPTY_38":
                                    oDataModelAdd.CentroCostePos = String(value);
                                    break;
                                case "__EMPTY_39":
                                    oDataModelAdd.CentroBenefPos = String(value);
                                    break;
                                case "__EMPTY_40":
                                    oDataModelAdd.ClaveRef1Pos = String(value);
                                    break;
                                case "__EMPTY_41":
                                    oDataModelAdd.ClaveRef2Pos = String(value);
                                    break;
                                case "__EMPTY_42":
                                    oDataModelAdd.ClaveRef3Pos = String(value);
                                    break;
                                case "__EMPTY_43":
                                    oDataModelAdd.OrdenPos = String(value);
                                    break;
                                case "__EMPTY_44":
                                    oDataModelAdd.ElementPepPos = String(value);
                                    break;
                                case "__EMPTY_45":
                                    oDataModelAdd.AreaFuncionPos = String(value);
                                    break;
                                case "__EMPTY_46":
                                    oDataModelAdd.FondoPos = String(value);
                                    break;
                                case "__EMPTY_47":
                                    oDataModelAdd.SubvencionPos = String(value);
                                    break;
                                default:
                                    break;
                            }
                        }
                        oDataModel_main.DetailList.push(oDataModelAdd)
                    }

                }
                aReturn = oDataModel_main;
                return aReturn

            },

            onUploadPostList: async function () {
                return await this.callOdataUpload();
            },
            callOdataUpload: async function () {
                let results = [];
                let bodyInit = {};
                return new Promise(async (resolve, reject) => {
                    //Verificar si es Update o Create
                    let cargaInit = this.verificarCarga();
                    if (cargaInit) {
                        let idPostUpload = await this.createPost(bodyInit);
                        if (idPostUpload) {
                            let resultsProcess = await this.processDetailUpload(idPostUpload);
                            resolve(resultsProcess)
                        } else {
                            resolve([])
                        }
                    } else {
                        let resultsAux = await this.updateDetail(true);
                        resolve(resultsAux)
                    }
                });
            },
            updateDetail: async function () {
                let resultsRespon = [];
                try {
                    const oModelData = this.getModel("detailReport").getData();
                    const oSmartTable = this.byId("detailList");
                    const dataTable = this.getDataTable();

                    for (let index = 0; index < dataTable.length; index++) {
                        const element = dataTable[index];
                        const sPath = element.getBindingContext().sPath;
                        const currentObject = oSmartTable.getModel().getObject(sPath);
                        if (currentObject) {
                            if (currentObject.CodeSend == "E" || currentObject.InvoiceStatus == "3" || currentObject.InvoiceStatus == "0") {
                                const filterResults = oModelData.DetailList.filter(x => x.IdExcel === currentObject.IdExcel);
                                if (filterResults.length > 0) {
                                    //Actualizar
                                    try {
                                        for (let index = 0; index < filterResults.length; index++) {
                                            let item = index + 1.
                                            let dataResult = filterResults[index];
                                            dataResult.DateWeb = this.getDateNow();
                                            dataResult.Item = parseInt(item);
                                            dataResult.Action = "UPDT"
                                            dataResult.Supplierinvoiceuploaduuid = currentObject.Supplierinvoiceuploaduuid;
                                            const result = await this.callOdataUploadItems(currentObject.Supplierinvoiceuploaduuid, dataResult);
                                            resultsRespon.push(result);
                                        }
                                    } catch (error) {
                                        console.error("Error Function.- UpdateDetail", error)
                                    }
                                }
                            }
                        }
                    }
                    return resultsRespon;
                } catch (error) {
                    console.error("Error Function.- updateDetail", error)
                }
            },
            getDataTable: function () {
                let tableId = this.byId("detailList");
                return tableId.getTable().getItems();
            },

            verificarCarga: function () {
                let dataReport = this.getModel("model").getData();
                let dataTable = this.getDataTable();

                if (dataReport.idSession == "" || dataReport.idSession == undefined) {
                    if (dataTable.length == 0) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    if (dataTable.length == 0) {
                        return true;
                    } else {
                        return false;
                    }
                }

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
            createPostAction2: async function (model, path, body) {
                return new Promise(async (resolve, reject) => {
                    try {
                        this.getOwnerComponent().getModel().create(path, body, {
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
                                resolve(result);
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

            processDetailUpload: async function (idPostUpload, update) {
                let oDataItems = this.getModel("detailReport").getData();
                let lengthTable = oDataItems.DetailList.length
                let items = 0;
                let resultsRespon = [];
                let idSession;

                if (!update) {
                    idSession = this.getSession();
                }

                for (let index = 0; index < oDataItems.DetailList.length; index++) {
                    items++;
                    try {
                        oDataItems.DetailList[index].Item = index;
                        oDataItems.DetailList[index].Supplierinvoiceuploaduuid = idPostUpload;
                        oDataItems.DetailList[index].uuidAuxUpload = idPostUpload;
                        oDataItems.DetailList[index].Random = this.getRandom(1, 999999);
                        oDataItems.DetailList[index].DateWeb = this.getDateNow();
                        oDataItems.DetailList[index].IdSession = idSession;//+@add 
                        if (lengthTable === items) {
                            oDataItems.DetailList[index].FlagFin = "X";
                        }
                        const result = await this.callOdataUploadItems(idPostUpload, oDataItems.DetailList[index]);
                        resultsRespon.push(result);

                    } catch (error) {
                        console.error("Error Items - callOdataUpload", error);
                    }
                }
                return resultsRespon;
            },

            updateModelButtons: function (action1, action2) {
                let oViewModel = that.getView().getModel("aStatus");
                //oViewModel.setProperty("/Source", this.sUrlCosapi); -@DELETE
                if (action1) {
                    oViewModel.setProperty("/btnCheck", true);
                    oViewModel.setProperty("/btnEliminar", true);
                }
                if (action2) {
                    //oViewModel.setProperty("/btnContab", true);
                    oViewModel.setProperty("/btnLog", true);
                }

            },
            onPostPressed: async function () {

                const itemsSelected = this.getItemsTableSelected();
                if (!this.validCheck(itemsSelected)) return;

                async function delay(ms) {
                    return new Promise(resolve => setTimeout(resolve, ms));
                }

                try {
                    const rptaConfirm = await this.confirmPopup("TitDialog3", "msg22");
                    if (rptaConfirm) {
                        this.showBusyText("loadmsgPo");
                        const results = await this.checkItemsOdataRap(itemsSelected, 'PO', '2');
                        this.setDataEjec(results, 'PO');
                        this.hideBusyText();
                        if (results.length > 0) {
                            await delay(2000);
                            //await this.validateContabilizar();
                            this.showMessageContab();
                        } else {
                            this.showMessageToast("msgc3");
                        }
                        //this.onRefreshSingle();
                        //this.showMessageToast("msg5");
                    }
                } catch (error) {
                    console.log("Error Funcion .- onPostPressed ", error);
                    this.hideBusyText();
                }
            },

            onCheckPressed: async function () {
                const itemsSelected = this.getItemsTableSelected();
                if (!this.validCheck(itemsSelected)) return;

                const rptaConfirm = await this.confirmPopup("TitDialog2", "msg22");
                if (rptaConfirm) {
                    this.showBusyText("loadmsgCk");
                    const results = await this.checkItemsOdataRap(itemsSelected, 'CK', '2');
                    this.setDataEjec(results, 'CK');
                    this.updateModelButtons(false, true);  //Actualizar Buttons
                    this.enableButtonContab(true, true);
                    this.enableCheck(true);
                    this.hideBusyText();
                    //Obtener Respuestas
                    this.showMessageCheck();
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

                        //Validar los datos al contabilizar
                        if (action == "PO") {
                            if (odataBody.InvoiceStatus == "3" || odataBody.InvoiceStatus == "1" || odataBody.ContabFin == "X"
                                || odataBody.InvoiceStatus == "4" || odataBody.InvoiceStatus == "0" ) {
                                continue;
                            }
                        } else if (action == "CK") {
                            if (odataBody.InvoiceStatus == "2") {
                                continue;
                            }
                        }
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
                    Sendasync: ""
                }

                if (option == "1") {
                    /**POST - CALL FUNCTION */
                    path = "/postActionUpload";
                    await delay(10);
                    return await this.callFunctionOdata(path, parameters);

                } else if (option == "2") {
                    /** POST - CREATE ACTION */
                    path = "/ActionInvoice";
                    const body = {
                        supplierinvoiceuploaduuid: key,
                        idsuplier: key,
                        action: action,
                        id: 1,
                        dateweb: this.getDateNow()
                    };
                    if (this.getView().byId("chkSendAsync").getSelected()) {
                        body.sendasync = "X";
                    } else {
                        body.sendasync = "";
                    }

                    await delay(100);
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
                let length = 0;
                const itemsSelected = this.getItemsTableSelected();
                if (!this.validCheck(itemsSelected)) return;

                try {
                    length = itemsSelected.length;

                    const rptaConfirm = await this.confirmPopup("TitDialog1", "msg11");
                    if (rptaConfirm) {
                        this.showBusyText("loadmsgDl");
                        await this.checkItemsOdataRap(itemsSelected, 'DL', '1');
                        this.onRefreshSingle();
                        this.hideBusyText();
                        this.showMessageDelete(length);
                    }
                } catch (error) {
                    console.log("Error Funcion .- onDeletePress ", error);
                    this.hideBusyText();
                }
            },
            confirmPopup: async function (title, msg) {
                let t = this;

                return new Promise(async (resolve, reject) => {
                    MessageBox.confirm(this.getResourceBundle().getText(msg), {
                        title: this.getResourceBundle().getText(title),
                        onClose: function (sAction) {
                            if (sAction === MessageBox.Action.OK) {
                                resolve(true);
                            } else {
                                resolve(false);
                            }
                        }.bind(t)
                    });
                });

            },
            onRefreshSingle: function () {
                this.getView().getModel().refresh(true);
            },
            enableCheck: function (action) {
                this.getView().byId("chkSendAsync").setEnabled(action);
            },
            setDataEjec: function (results, action) {

                const oModelData = this.getModel("model");
                let dataModel = oModelData.getData();

                try {
                    if (dataModel.ckProcess && action == "CK") {
                        if (dataModel.ckProcess.data) {
                            oModelData.setProperty("/ckProcess/data", results);
                        }
                    } else if (dataModel.postProcess && action == "PO") {
                        oModelData.setProperty("/postProcess/data", results);
                    }
                } catch (error) {
                    console.log("Error FUNCTION.- setDataEjec", error)
                }
            },
            deleteDataSession: async function () {
                let idSuplier = [];
                let lv_id;
                const oDataModel = this.getModel("model").getData();
                if (oDataModel.ckProcess) {
                    if (oDataModel.ckProcess.data.length > 0) {
                        for (let index = 0; index < oDataModel.ckProcess.data.length; index++) {
                            const element = oDataModel.ckProcess.data[index];
                            idSuplier.push(element.idsuplier);
                            if (lv_id == "" || lv_id == undefined) {
                                lv_id = element.idsuplier;
                            }
                        }

                        let message = idSuplier.join('|')
                        let parameters = {
                            Supplierinvoiceuploaduuid: lv_id,
                            Action: "DL",
                            Message: message
                        }
                        let result = await this.callActionOther("/postActionOthers", parameters)
                        console.log("Result- postActionOthers ", result)
                    }
                }
            },
            callActionOther: async function (path, parameters) {
                return new Promise(async (resolve, reject) => {
                    try {
                        this.getView().getModel().callFunction(path, {
                            method: "POST",
                            urlParameters: parameters,
                            success: function () {
                                resolve(true)
                            }.bind(this),
                            error: function (e) {
                                resolve(false)
                            }.bind(this)
                        });
                    } catch (error) {
                        console.log("Error Function: callActionOther", error)
                        resolve(false)
                    }
                });
            },
            clearModel: function () {
                const oDataModel = this.getModel("model");
                const odetailReport = this.getModel("detailReport");

                if (oDataModel) {
                    oDataModel.setProperty("/ckProcess/data", []);
                    oDataModel.setProperty("/ckProcessOk/data", []);
                    oDataModel.setProperty("/postProcess/data", []);
                    oDataModel.setProperty("/table/data", []);
                    oDataModel.setProperty("/load/message", "");
                    oDataModel.setProperty("/idSession", undefined);
                }
                if (odetailReport) {
                    oDataModel.setProperty("/DetailList", []);
                }
            },
            onClearAll: async function () {
                const rptaConfirm = await this.confirmPopup("TitDialog4", "msg22");
                if (rptaConfirm) {
                    this.showBusyText("loadmsgNt");

                    const parameters = {
                        action: "DA",
                        id: 1,
                        dateweb: this.getDateNow()
                    };
                    let result = await this.createPostAction("ModelActionService", "/ActionInvoice", parameters)
                    this.onRefreshSingle();
                    this.enableCheck(false);
                    this.hideBusyText();
                    this.enableButtonContab(true, false);
                    this.showMessageToast("msg5")
                    this.clearModel();
                }
            },
            clearTableSingle: async function (idSession) {
                try {
                    const parameters = {
                        action: "DA",
                        id: 1,
                        dateweb: ""
                    }
                    let result = await this.createPostAction2("ModelActionService", "/ActionInvoice", parameters);
                    this.onRefreshSingle();
                } catch (error) {
                    console.error("Error Function.- clearTableSingle", error);
                }
            },
            validateContabilizar: async function () {
                let lv_mensaje = "";
                let contok = 0;

                let cadena1 = this.getResourceBundle().getText("msgc4");
                let cadena2 = this.getResourceBundle().getText("msgc5");

                try {
                    const itemsSelected = this.getItemsTableSelected();
                    if (itemsSelected.length > 0) {
                        const results = await this.getLogDetail(itemsSelected);
                        if (results.length > 0) {
                            for (let index = 0; index < results.length; index++) {
                                const element = results[index];
                                if (element.AccountingDocument != "" && element.AccountingDocument != undefined) {
                                    contok++;
                                }
                            }
                            if (contok > 0) {
                                lv_mensaje = cadena1.concat(" :", contok, " ", cadena2);
                                MessageBox.success(lv_mensaje);
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error Function: validateContabilizar", error)
                }
            },
            onShowLogButtonPressed: async function () {

                //Verificar Si se ha verificado
                let odataCheck = this.getModel("model").getProperty("/ckProcess/data");
                if (odataCheck.length == 0) {
                    this.onDisplayMessageBoxPress("I", "msgc6");
                    return
                }

                try {
                    const itemsSelected = this.getItemsTableSelected();
                    if (itemsSelected.length > 0) {
                        this.showBusyText("mostlog");
                        const results = await this.getLogDetail(itemsSelected);
                        if (results.length > 0) {
                            this.hideBusyText();
                            this.getRouter().navTo("DetailLog");
                        } else {
                            this.hideBusyText();
                            this.onDisplayMessageBoxPress("I", "msgc6");
                        }
                    } else {
                        this.showBusyText("mostlog");
                        const results = await this.getLogDetail2();
                        if (results.length > 0) {
                            this.hideBusyText();
                            this.getRouter().navTo("DetailLog");
                        } else {
                            this.hideBusyText();
                            this.onDisplayMessageBoxPress("I", "msgc6");
                        }
                    }

                } catch (error) {
                    console.error("Error Function: onShowLogButtonPressed", error)
                    this.onDisplayMessageBoxPress("E", "msgc1");
                    this.hideBusyText();
                }
            },
            getLogDetail2: async function (idLogSingle) {
                let results = [];
                let idsLogs = [];
                let parameters = { filters: [], urlParameters: { "$expand": "to_ItemsList" } };

                if (idLogSingle) {
                    idsLogs = idLogSingle;
                } else {
                    this.showBusyText("mostlog");

                    const odataCheck = this.getModel("model").getProperty("/ckProcess/data");
                    const odataPost = this.getModel("model").getProperty("/postProcess/data");

                    //Obtener lso Ids
                    for (let index = 0; index < odataCheck.length; index++) {
                        const element = odataCheck[index]
                        idsLogs.push(element.supplierinvoiceuploaduuid);
                    }

                    for (let index = 0; index < odataPost.length; index++) {
                        const element = odataPost[index]
                        idsLogs.push(element.supplierinvoiceuploaduuid);
                    }
                }
                try {
                    if (idsLogs.length > 0) {
                        for (let index = 0; index < idsLogs.length; index++) {
                            const element = idsLogs[index];
                            parameters.filters.push(new Filter("Supplierinvoiceuploaduuid", "EQ", element))
                        }
                        const resultOdata = await this.readInvoiceList(parameters);
                        if (resultOdata.results) {
                            if (resultOdata.results.length > 0) {
                                results = resultOdata.results;
                                this.getOwnerComponent().setModel(new JSONModel(resultOdata.results), "LogDetails");
                            }
                        }
                    }
                } catch (error) {
                    throw new Error(error);
                }
                return results;
            },

            getLogDetail: async function (itemsSelects) {

                let results = [];
                let idsLogs = [];
                let parameters = { filters: [], urlParameters: { "$expand": "to_ItemsList" } };


                //Obtener lso Ids
                for (let index = 0; index < itemsSelects.length; index++) {
                    const contextObject = itemsSelects[index].getBindingContext();
                    const keyPath = this.getIdPath(contextObject.getPath());
                    idsLogs.push(keyPath);
                }
                try {
                    if (idsLogs.length > 0) {
                        for (let index = 0; index < idsLogs.length; index++) {
                            const element = idsLogs[index];
                            parameters.filters.push(new Filter("Supplierinvoiceuploaduuid", "EQ", element))
                        }
                        const resultOdata = await this.readInvoiceList(parameters);
                        if (resultOdata.results) {
                            if (resultOdata.results.length > 0) {
                                results = resultOdata.results;
                                this.getOwnerComponent().setModel(new JSONModel(resultOdata.results), "LogDetails");
                            }
                        }
                    }
                } catch (error) {
                    throw new Error(error);
                }
                return results;
            },
            readInvoiceList: async function (parameters) {
                return new Promise(async (resolve, reject) => {
                    this.getView().getModel().read("/InvoiceList", {
                        filters: parameters.filters,
                        urlParameters: parameters.urlParameters,
                        success: function (result) {
                            resolve(result)
                        }.bind(this),
                        error: function (e) {
                            resolve([])
                        }.bind(this)
                    });
                });
            },
            getSession: function () {
                let getSessionId;
                let oModel = this.getModel("model");
                let odataModel = oModel.getData();

                if (oModel) {
                    if (oModel.idSession == undefined || oModel.idSession == "" || oModel.idSession == null) {
                        const random = this.getRandom(1, 999999);
                        const dateWeb = this.getDateNow();
                        const serial = this.generateUniqSerial();
                        getSessionId = dateWeb.concat("-", serial, "-", String(random));
                        oModel.setProperty("/idSession", getSessionId);
                    } else {
                        getSessionId = odataModel.idSession;
                    }
                    return getSessionId;
                }
            },
            enableButtonContab: function (single, action) {

                let oViewModel = that.getView().getModel("aStatus");
                if (single) {
                    oViewModel.setProperty("/btnContab", action);
                    oViewModel.setProperty("/btnCheck", action);
                    oViewModel.setProperty("/btnEliminar", action);
                }
            },
            onNavigation: async function (oEvent) {
                let idsLogs = [];
                try {
                    const oBindingContext = oEvent.getSource().getBindingContext();
                    if (oBindingContext) {
                        const objectData = oBindingContext.getObject();
                        if (objectData) {
                            this.clearSingleLogDetail();
                            idsLogs.push(objectData.Supplierinvoiceuploaduuid);
                            const results = await this.getLogDetail2(idsLogs);
                            if (results.length > 0) {
                                this.getRouter().navTo("DetailLog");
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error Function onNavigation", error)
                }
            },
            showMessageCheck: async function () {
                let contOK = 0;
                let contError = 0;
                let mensaje = "";
                let title = "";
                let idRptas = [];

                sap.ui.core.BusyIndicator.show(0);

                const oboundle = this.getResourceBundle();
                title = oboundle.getText("loadmsgCk");

                let parameters = { filters: [], urlParameters: undefined };

                const modelMain = this.getView().getModel("model");
                let odataCkOk = modelMain.getProperty("/ckProcessOk/data");
                if (!odataCkOk) {
                    odataCkOk = [];
                }

                const itemsSelected = this.getItemsTableSelected();
                if (itemsSelected.length > 0) {

                    let itemRpta = 0;
                    const n = itemsSelected.length;

                    //Obtener las respuestas
                    while (itemRpta < n) {

                        for (let index = 0; index < itemsSelected.length; index++) {
                            parameters.filters = [];
                            const contextObject = itemsSelected[index].getBindingContext();
                            const odataBody = contextObject.getObject();

                            if (odataBody) {
                                const filterProcess = idRptas.filter((rpta) => rpta == odataBody.Supplierinvoiceuploaduuid);
                                if (filterProcess.length === 0) {
                                    parameters.filters.push(new Filter("Supplierinvoiceuploaduuid", "EQ", odataBody.Supplierinvoiceuploaduuid));
                                    try {
                                        const resultOdata = await this.readInvoiceList(parameters);
                                        if (resultOdata.results) {
                                            if (resultOdata.results.length > 0) {
                                                const results = resultOdata.results[0];
                                                if (results.CodeSend != '' && results.CodeSend != undefined) {
                                                    itemRpta++;
                                                    if (results.CodeSend == 'S') {
                                                        contOK++;
                                                    } else if (results.CodeSend == 'E') {
                                                        contError++;
                                                    }
                                                    idRptas.push(odataBody.Supplierinvoiceuploaduuid);
                                                    //Almacenar lso datos Verificados con OK
                                                    if (results.CodeSend == 'S') {
                                                        if (odataCkOk.length > 0) { //+add
                                                            const filterCkOk = odataCkOk.filter((rpta) => rpta.Supplierinvoiceuploaduuid == odataBody.Supplierinvoiceuploaduuid);
                                                            if (filterCkOk.length == 0) {
                                                                odataCkOk.push(odataBody);
                                                            }
                                                        } else {
                                                            odataCkOk.push(odataBody);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } catch (error) {
                                        console.error("Erro Function: showMessageCheck", error);
                                    }
                                }
                            }
                        }
                        if (itemRpta == n) {
                            break;
                        }
                    }

                    if (odataCkOk.length > 0) {
                        modelMain.setProperty("/ckProcessOk/data", odataCkOk);
                    }

                    sap.ui.core.BusyIndicator.hide();

                    if (contOK > 0) {
                        if (contOK > 1) {
                            mensaje = oboundle.getText("msg10", [contOK]);
                        } else {
                            mensaje = oboundle.getText("msg9", [contOK]);
                        }
                        await this.onSuccessMessageDialogPress(title, mensaje);
                    }

                    if (contError > 0) {
                        if (contError > 1) {
                            mensaje = oboundle.getText("msg12", [contError]);
                        } else {
                            mensaje = oboundle.getText("msg111", [contError]);
                        }
                        await this.onErrorMessageDialogPress(title, mensaje);
                    }
                }
            },
            showMessageDelete: function (contDelete) {
                const oboundle = this.getResourceBundle();
                let title = oboundle.getText("Delete");
                let mensaje = "";

                if (contDelete > 1) {
                    mensaje = oboundle.getText("msg14", [contDelete]);
                } else {
                    mensaje = oboundle.getText("msg13", [contDelete]);
                }

                this.onSuccessMessageDialogPress(title, mensaje);
            },
            showMessageContab: function () {

                let contOks = 0;
                let mensaje = "";

                const oboundle = this.getResourceBundle();
                let title = oboundle.getText("Post");

                const itemsSelected = this.getItemsTableSelected();
                const datosCheck = this.getView().getModel("model").getData();
                let itemsCheck = [];

                if (datosCheck) {
                    if (datosCheck.ckProcessOk.data) {
                        itemsCheck = datosCheck.ckProcessOk.data;
                    }
                }

                if (itemsSelected.length > 0) {
                    for (let index = 0; index < itemsSelected.length; index++) {
                        const contextObject = itemsSelected[index].getBindingContext();
                        const odataBody = contextObject.getObject();
                        if (odataBody) {
                            const filterCkOk = itemsCheck.filter((rpta) => rpta.Supplierinvoiceuploaduuid == odataBody.Supplierinvoiceuploaduuid);
                            if (filterCkOk.length > 0) {
                                contOks++;
                            }
                        }
                    }
                }

                if (contOks > 0) {
                    if (contOks > 1) {
                        mensaje = oboundle.getText("msg16", [contOks]);
                    } else {
                        mensaje = oboundle.getText("msg15", [contOks]);
                    }
                    this.onSuccessMessageDialogPress(title, mensaje);
                }

            },
            clearModelIntern: function () {
                const modelDetailLog = this.getOwnerComponent().getModel("LogDetails");
                if (modelDetailLog) {
                    modelDetailLog.setData([]);
                    modelDetailLog.updateBindings(true);
                    modelDetailLog.refresh();
                }
            },
            onBeforeRebindViewTable: function (oEvent) {
                var oBindingParams = oEvent.getParameter("bindingParams");
                if (!oBindingParams.sorter.length) {
                    oBindingParams.sorter.push(new sap.ui.model.Sorter("IdExcel", false))
                }
            },

            // This function must be bound to the view's afterRendering event
            onAfterRendering: function () {
             /*
                // Stick the toolbar and header of the smart table to top. 
                var oSmartTable = this.byId("detailList");
                oSmartTable.onAfterRendering = function () {
                    var oToolbar = this.byId("stickyToolbar"),
                        oParent = oToolbar.$().parent();
                    if (oParent) {
                        oParent.addClass("stickyToolbar");
                    }
                }.bind(this);*/
                
            },
        });
    });
