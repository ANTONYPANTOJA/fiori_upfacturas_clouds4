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
    function (Controller, MessageBox, BaseController, Guid, JSONModel, Formatter,Filter,ShellUIService,formatter,moment) {
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
            },
            clearData: async  function()
            {
                await this.clearTableSingle();
            },
            formatter:formatter,
            moment:moment,

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
                    log:{
                        data: []
                    },
                    idSession: ""
                });
                this.setModel(model, "model");
            },
            _navBackViewMain: function(){
                this.onPressExit("","RouteApp");
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
                        if (sheetName === "Plantilla" || sheetName === "Template") {
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
                    if (oCamposValidados.length === 0 || oCamposValidados == undefined) {
                        MessageBox.error(this.getResourceBundle().getText("msg6"));
                    } else {
                        oModelExcel.setData(oCamposValidados);
                    }
                } else {
                    MessageBox.error(this.getResourceBundle().getText("msg1"));
                }
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
                            return aReturn;
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
                                    oDataModelAdd.ReferPago = String(value);
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
                                    oDataModelAdd.TxtPosProv = String(value);
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
                                    oDataModelAdd.TxtCtaMayorPos = String(value);
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
                let bodyInit = {};
                return new Promise(async (resolve, reject) => {
                    //Verificar si es Update o Create
                    let cargaInit = this.verificarCarga();
                    if (cargaInit) {
                        let idPostUpload = await this.createPost(bodyInit);
                        if (idPostUpload) {
                            await this.processDetailUpload(idPostUpload);
                            resolve(true)
                        } else {
                            resolve(false)
                        }                        
                    }else{
                        await this.updateDetail(true);
                        resolve(true)
                    }
                });
            },
            updateDetail: async function()
            {
              try {
                const oSmartTable = this.byId("detailList");
                const dataTable  = this.getDataTable();
                for (let index = 0; index < dataTable.length; index++) {
                    const element = dataTable[index];
                    const sPath = element.getBindingContext().sPath;
                    const currentObject = oSmartTable.getModel().getObject(sPath);
                    if (currentObject) {
                        
                    }
                }

              } catch (error) {
                console.error("Error Function.- updateDetail",error)
              }

            },
            getDataTable: function(){
                let tableId    = this.byId("detailList");
                return tableId.getTable().getItems();
            },

            verificarCarga: function(){
                let dataReport = this.getModel("model").getData();
                let dataTable  = this.getDataTable();

                if (dataReport.idSession == "" ||  dataReport.idSession == undefined )
                {
                    if (dataTable.length == 0) {
                        return true;
                    }else{
                        return false;
                    }
                }else{
                    if (dataTable.length == 0) {
                        return true;
                    }else{
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

            processDetailUpload: async function (idPostUpload,update) {
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

                        if (!update) {
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
                        }else{

                        }

                    } catch (error) {
                        console.error("Error Items - callOdataUpload", error);
                    }
                }
                console.log(resultsRespon)
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
            onPostPressed: async function () {

                const itemsSelected = this.getItemsTableSelected();
                if (!this.validCheck(itemsSelected)) return;

                try {
                    const rptaConfirm = await this.confirmPopup("TitDialog3", "msg22");
                    if (rptaConfirm) {
                        this.showBusyText("loadmsgPo");
                        const results = await this.checkItemsOdataRap(itemsSelected, 'PO', '2');
                        console.log({ results });
                        this.onRefreshSingle();
                        this.hideBusyText();
                        this.showMessageToast("msg5");
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
                    this.enableCheck(false);

                    const results = await this.checkItemsOdataRap(itemsSelected, 'CK', '2');
                    console.log({ results });
                    this.setDataChecked(results, 'CK');
                    this.onRefreshSingle();
                    this.updateModelButtons(false, true);  //Actualizar Buttons
                    this.hideBusyText();
                    this.showMessageToast("msg5");
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
                    Sendasync : ""
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
                        dateweb: this.getDateNow()
                    };
                    if (this.getView().byId("chkSendAsync").getSelected()) {
                        body.sendasync = "X";
                    }else{
                        body.sendasync = "";
                    }

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
                    const rptaConfirm = await this.confirmPopup("TitDialog1", "msg11");
                    if (rptaConfirm) {
                        this.showBusyText("loadmsgDl");
                        await this.checkItemsOdataRap(itemsSelected, 'DL', '1');
                        this.onRefreshSingle();
                        this.hideBusyText();
                        this.showMessageToast("msg5")
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
            setDataChecked: function (results, action) {

                const oModelData = this.getModel("model");
                let dataModel = oModelData.getData();

                try {
                    if (dataModel.ckProcess && action == "CK") {
                        if (dataModel.ckProcess.data) {
                            oModelData.setProperty("/ckProcess/data", results);
                        }
                    }
                } catch (error) {
                    console.log("Error FUNCTION.- setDataChecked", error)
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
                oDataModel.setProperty("/ckProcess/data", []);
                oDataModel.setProperty("/table/data", []);
                oDataModel.setProperty("/load/message", "");
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
                    this.enableCheck(true);
                    this.hideBusyText();
                    this.showMessageToast("msg5")
                }
            },
            clearTableSingle: async function(idSession)
            {
                try {
                    const parameters = {
                        action: "DA",
                        id: 1,
                        dateweb: ""
                    }
                    let result = await this.createPostAction2("ModelActionService", "/ActionInvoice", parameters);
                    this.onRefreshSingle();
                } catch (error) {
                    console.error("Error Function.- clearTableSingle",error);
                }
            },
            onShowLogButtonPressed: async function () {
                const itemsSelected = this.getItemsTableSelected();
                if (!this.validCheck(itemsSelected)) return;

                try {
                    this.showBusyText("mostlog");
                    await this.getLogDetail(itemsSelected);
                    this.hideBusyText();
                    this.getRouter().navTo("DetailLog");                    
                } catch (error) {
                    console.error("Error Function: onShowLogButtonPressed",error)
                    this.onDisplayMessageBoxPress("E","msgc1");
                    this.hideBusyText();
                }
            },
            getLogDetail: async function (itemsSelects) {
                
                let idsLogs = [];
                let parameters = { filters : [] , urlParameters: { "$expand": "to_ItemsList"}};

                
                //Obtener lso Ids
                for (let index = 0; index < itemsSelects.length; index++) {
                    const contextObject = itemsSelects[index].getBindingContext();
                    const keyPath = this.getIdPath(contextObject.getPath());
                    idsLogs.push(keyPath);
                }
                try 
                {
                    if (idsLogs.length > 0) {
                        for (let index = 0; index < idsLogs.length; index++) {
                            const element = idsLogs[index];
                            parameters.filters.push(new Filter("Supplierinvoiceuploaduuid", "EQ", element))
                        }
                        const resultOdata = await this.readInvoiceList(parameters);
                        if (resultOdata.results) {
                            if (resultOdata.results.length > 0) {
                                this.getOwnerComponent().setModel(new JSONModel(resultOdata.results), "LogDetails");
                            }
                        }
                    }   
                } catch (error) {
                    throw new Error(error);
                }
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
            getSession: function()
            {
                let getSessionId;
                let oModel = this.getModel("model");
                let odataModel = oModel.getData();

                if (oModel) {
                    if (oModel.idSession == undefined || oModel.idSession == "" || oModel.idSession == null ) {
                        const random = this.getRandom(1, 999999);
                        const dateWeb = this.getDateNow();
                        const serial = this.generateUniqSerial();
                        getSessionId = dateWeb.concat("-",serial,"-",String(random));
                        oModel.setProperty("/idSession", getSessionId);
                    }else{
                    getSessionId  = odataModel.idSession; 
                }
                return getSessionId;
            }
         }

        });
    });
