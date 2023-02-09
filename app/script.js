var leadId;
var entity;
var leadDetails;
var button = document.getElementById("btnsubmit");
var togglebtn = document.getElementById("togglebtn");
var status_select = document.querySelector(".status-select");
console.log(status_select);
togglebtn.addEventListener("click", controlButton);
var modalSubmitButton = document.getElementById("modalsubmit");

//**********************************Page On Load**********************************************/
//While loading the page for first time the entity has been fetched
//Function fetch data has been initiated to display the related records
ZOHO.embeddedApp.on("PageLoad", function (data) {
    console.log(data);
    leadId = data.EntityId;
    entity = data.Entity;
    console.log(`Entity=${entity}`);
    console.log(`Entity Id=${leadId}`);
    // const resp=ZOHO.CRM.API.getRelatedRecords({Entity:"Leads",RecordID:leadId,RelatedList:"Candidate_Documents_Verify"})
    // console.log(resp)
    fetchData();
});


//******************************************FUNCTIONS***************************************************/

//>>>>>>>>>>>>>>>>Fetch Details from module and show it in the table 
function fetchData() {
    document.getElementById("tablebody").innerHTML = "";
    var resp_related = ZOHO.CRM.API.searchRecord({
        Entity: "Candidate_Documents",
        Type: "criteria",
        Query: `(Lead:equals:${leadId})`,
        delay: false,
    }).then(function (resp) {
        console.log(resp.data);
        if (resp.data != undefined) {
            var tablebody = document.getElementById("tablebody");
            resp.data.forEach((element) => {
                var row = tablebody.insertRow(0);
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                var cell3 = row.insertCell(2);
                var cell4 = row.insertCell(3);
                var cell5 = row.insertCell(4);

                cell1.innerHTML = element.Name;
                cell2.innerHTML = element.Document_Type;
                cell2.style = "max-width: 35px;";
                cell3.style = "max-width: 35px;";
                if (element.Document) {
                    console.log("Document");
                    console.log(element.Document);
                    cell3.innerHTML = element.Document[0].file_Name;
                } else {
                    var uploadfile = document.createElement("button");
                    uploadfile.type = "button";
                    uploadfile.setAttribute("data-toggle", "modal");
                    uploadfile.setAttribute("data-target", "#uploadModal");
                    uploadfile.innerHTML = "Upload File";
                    uploadfile.className = "btn btn-success";
                    uploadfile.onclick = () => {
                        //**Updating element id to the modal form */
                        console.log("clicked");
                        document.getElementById("uploadrecordId").value =
                            element.id;
                    };
                    cell3.appendChild(uploadfile);
                }

                var values = ["Pending", "Received", "Verified"];
                var select = document.createElement("select");
                select.name = "status";
                select.id = element.id;
                for (const val of values) {
                    var option = document.createElement("option");
                    option.value = val;
                    option.text = val.charAt(0).toUpperCase() + val.slice(1);
                    select.appendChild(option);
                }
                select.value = element.Document_Status;
                //*******updating the candidate document when it is edited */
                select.onchange = () => {
                    console.log(`Changed docid=${element.id}`);
                    if (select.value != "Verified") {
                        var config = {
                            Entity: "Candidate_Documents",
                            APIData: {
                                id: element.id,
                                Document_Status: select.value,
                            },
                        };
                        console.log(config);
                        ZOHO.CRM.API.updateRecord(config).then(function (data) {
                            console.log(data);
                        });
                    } else {
                        console.log("clicked on verified");
                        document.getElementById("remarkrecordId").value =
                            element.id;
                        $("#remarkModal").modal("show");
                    }
                };
                select.className = "form-control status-select";

                cell4.appendChild(select);

                var viewRecord = document.createElement("a");
                viewRecord.href = `https://crm.zoho.com/crm/org757739095/tab/CustomModule7/${element.id}`;
                viewRecord.className = "btn btn-primary";
                viewRecord.innerHTML = "View Record";
                viewRecord.target = "_blank";
                cell5.appendChild(viewRecord);
            });
        }
    });
}



//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Control Toggle<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
function controlButton() {
    console.log("Clicked on Toggle Button");
    if (togglebtn.innerHTML === "Add New File") {
        document.getElementById("table").classList.add("hide");
        togglebtn.innerHTML = "Close X";
        togglebtn.classList.toggle("bg-danger");
        document.getElementById("formelements").style = "display:inherit";
    } 
    else {
        togglebtn.innerHTML = "Add New File";
        togglebtn.classList.toggle("bg-danger");
        document.getElementById("formelements").style = "display:none";
        document.getElementById("table").classList.remove("hide");
    }
}

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Submit Form<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
button.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("cover-spin").style="display:inherit";
    var fileid;
    //>>>Upoading Image 
    var file = document.getElementById("file").files[0];
    var fileType = file.type;
    var config = {
        CONTENT_TYPE: "multipart",
        PARTS: [
            {
                headers: {
                    "Content-Disposition": "file;",
                },
                content: "__FILE__",
            },
        ],
        FILE: {
            fileParam: "content",
            file: file,
        },
    };

    ZOHO.CRM.API.uploadFile(config).then(function (resp) {
        console.log("uploaded file");
        console.log(resp);
        fileid = resp.data[0].details.id;
        console.log(`fileid=${fileid}`);
        var recordData = {
            Name: document.getElementById("docname").value,
            Document_Type: document.getElementById("filetype").value,
            Lead: leadId,
            Document: [{ file_id: fileid }],
            Document_Status: document.getElementById("filestatus").value,
        };
        ZOHO.CRM.API.insertRecord({
            Entity: "Candidate_Documents",
            APIData: recordData,
            Trigger: ["workflow"],
        }).then(function (data) {
            console.log(data);
            fetchData();
            controlButton();
            document.getElementById("inputform").reset();
            document.getElementById("table").classList.remove("hide");
            document.getElementById("cover-spin").style="display:none";
        });
    });
});

//>>>>>>>>>>>>>>Uploading file from modal window.This should be refactored with file upload in add new record <<<<<<<<<<

modalSubmitButton.addEventListener("click", () => {
    var recordid = document.getElementById("uploadrecordId").value;
    var modalfile = document.getElementById("modaluploadfile").files[0];

    console.log("record id");
    console.log(recordid);

    var modal_upload_config = {
        CONTENT_TYPE: "multipart",
        PARTS: [
            {
                headers: {
                    "Content-Disposition": "file;",
                },
                content: "__FILE__",
            },
        ],
        FILE: {
            fileParam: "content",
            file: modalfile,
        },
    };

    ZOHO.CRM.API.uploadFile(modal_upload_config).then(function (resp) {
        console.log("uploaded file");
        console.log(resp);
        var uploadedfileid = resp.data[0].details.id;
        console.log(`fileid=${uploadedfileid}`);
        //File Upload to server Completed
        //Updating documents record
        var updateconfig = {
            Entity: "Candidate_Documents",
            APIData: {
                id: recordid,
                Document: [{ file_id: uploadedfileid }],
            },
        };
        ZOHO.CRM.API.updateRecord(updateconfig).then(function (data) {
            console.log(data);
            fetchData();
        });
    });
});

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Remark Modal handling<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
//>>>>>>>>>>>closing remark modal
var closeRemarkModal = document.getElementById("closeremark");
closeRemarkModal.addEventListener("click", () => {
    let recid = document.getElementById("remarkrecordId").value;
    document.getElementById(recid).value = "Received";
});
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>Remark Submit <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
var remarksubmit = document.getElementById("remarksubmit");
remarksubmit.addEventListener("click", () => {
    var config = {
        Entity: "Candidate_Documents",
        APIData: {
            id: document.getElementById("remarkrecordId").value,
            Document_Status: "Verified",
            Remarks: document.getElementById("remark").value,
        },
    };
    console.log(config);
    ZOHO.CRM.API.updateRecord(config).then(function (data) {
        console.log(data);
    });
});

ZOHO.embeddedApp.init();
