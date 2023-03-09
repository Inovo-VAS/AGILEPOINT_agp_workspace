// Base CND/Static Files URL. 
window.BaseURL = "https://wcollectdev.woolworths.co.za:443";

// CND/Static Files URL for shared resources. if same as base URL, changes are not required. 
window.SharedResourcesbaseURL = BaseURL + "";

// CND/Static Files URL for Tasklist. if same as base URL, changes are not required.
window.TaskListbaseURL = BaseURL + "workcenter/";

// CND/Static Files URL for Form render. if same as base URL, changes are not required.
window.FormRenderbaseURL = BaseURL + "/applicationbuilder/";

// CND/Static Files URL for Application Builder. if same as base URL, changes are not required.
window.AppBuilderbaseURL = BaseURL + "";

// CND/Static Files URL for Form render. if same as base URL, changes are not required.
window.ManageCenterbaseURL = BaseURL + "EnterpriseManager/";

// CND/Static File URL for tasklist main page.
window.workcenterentryPoint = BaseURL + "TaskList/js/init/home.js";

//CND/Static Files URL for settings xml.
window.SettingsURL = "/WorkCenter/";

var versionNumber = "";

// Default Schema for the cookie to created. 
var externalHostingCookie = {
    auth: "",
    APIUrl: "",
    culture: "en-US",
    provider: "ActiveDirectory",
    showMyApps: true,
    ASPASSOCIATION: "",
    CDNHosting: true,
    staySignedIn: true,
    UserDetails: {
        UserName: "",
        FullName: "",
        EMailAddress: ""
    }
};

function getBuildVersionFromXml(callback) {
    try {
        var VerNumber = getuserlocaleCookie("AP_Version");
        if (VerNumber != null && VerNumber != "") {
            try {
                var v = JSON.parse(VerNumber);
                versionNumber = v.version
            } catch (e) {}
            callback && callback();
            return;
        }
        var xmlhttp;
        var XmlURL = (window.BaseURL ? window.BaseURL : "") + "BuildDetails.xml?t=" + (new Date()).getMilliseconds();
        if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        } else { // code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.open("GET", XmlURL, false);
        xmlhttp.send();
        var xmlDoc = xmlhttp.responseXML;
        var x = xmlDoc.getElementsByTagName("BuildDetails");
        versionNumber = x[0].getElementsByTagName("Version")[0].childNodes[0].nodeValue.toString().trim()
        document.cookie = 'AP_Version={"version":"' + versionNumber + '"};Secure=true';
        callback && callback();
    } catch (e) {
        callback && callback();
    }

}

function getUserLocale(externalHostingCookie, callback) {
    try {
        var userlocale = getuserlocaleCookie("userlocale");
        if (userlocale != null && userlocale != "") {
            externalHostingCookie.culture = userlocale;
            callback && callback();
            return;
        }
        var JSONObject = { userName: externalHostingCookie.UserDetails.UserName };
        var serviceURL = externalHostingCookie.APIUrl + "/Admin/GetRegisterUser";
        var headers = {
            "Authorization": externalHostingCookie.auth,
            "appID": "Portal",
            "locale": "en-US"
        };
        $.ajax({
            headers: headers,
            url: serviceURL,
            type: "POST",
            processData: false,
            contentType: "application/json",
            dataType: "json",
            async: true,
            crossDomain: true,
            data: JSON.stringify(JSONObject),
            success: function(data, status) {
                if (data && data.SupportedLanguage)
                    externalHostingCookie.culture = data.SupportedLanguage;
                setuserlocaleCookie("userlocale", data.SupportedLanguage, 1);
                callback && callback();
            },
            error: function() {
                callback && callback();
            }
        });
    } catch (e) {
        callback && callback();
    }
}

function getuserlocaleCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setuserlocaleCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";Secure=true";
}

// Implementation of the method to load the Module. Callback method should be in the page.
function LoadModule(container, module, pageName, callback) {
    fetchConfigurations(function(cookieDetails) {
        var pageURL = window.BaseURL + "/Pages/" + pageName + ".html?t=" + versionNumber;
        switch (module) {
            case "Dashboard":
                pageURL = window.TaskListbaseURL + "/Base" + pageName + ".html?t=" + versionNumber;
                break;
            case "FormRender":
                pageURL = window.FormRenderbaseURL + "/Base" + pageName + ".html?t=" + versionNumber;
                break;
        }

        $.get(pageURL, function(data, status) {
            var content = $(data);
            container.append(content);
            callback && callback(cookieDetails);
        });
    });
}

function fetchConfigurations(callback) {
    var config = {
        AgilePointCDNURL: "https://wcollectdev.woolworths.co.za:443",
        AgilePointRestURL: "https://wcollectdev.woolworths.co.za:13490/AgilePointServer/",
        FormRenderURL: "FormRender.html",
        ProcessViewerURL: "FormRender.html",
        ProcessAdaptationURL: "FormRender.html",
        Auth: "Basic d2ZzLWhjY1xhZ2lsZXNlcnZpY2U6SW4wdjBQV0RAQVA=",
        FullName: "AgileService",
        UserName: "wfs-hcc\\agileservice"


    }
    window.BaseURL = config.AgilePointCDNURL.substr(-1) != '/' ? config.AgilePointCDNURL + "/" : config.AgilePointCDNURL;
    window.SharedResourcesbaseURL = BaseURL + "";
    window.TaskListbaseURL = BaseURL + "/workcenter/";
    window.FormRenderbaseURL = BaseURL + "/applicationbuilder/";
    window.ManageCenterbaseURL = BaseURL + "/managecenter/";
    externalHostingCookie.APIUrl = config.AgilePointRestURL;
    externalHostingCookie.ASPASSOCIATION = config.FormRenderURL;
    externalHostingCookie.PROCESSVIEWER_URL = config.ProcessViewerURL;
    externalHostingCookie.PROCESS_ADAPTATION_URL = config.ProcessAdaptationURL;
    externalHostingCookie.auth = config.Auth;
    externalHostingCookie.UserDetails.FullName = config.FullName;

    externalHostingCookie.UserDetails.UserName = config.UserName;

    //Settings for hiding form header and background.
    //window.hideheader = true;
    //window.hidebackground = true;

    getBuildVersionFromXml(function() {
        getUserLocale(externalHostingCookie, function() {
            callback && callback(externalHostingCookie);
        });
    });
};

// Implementation of the method to fill the data in the cookie to be created. Callback method should be in the page if called independently.
function fetchConfigurations_old(callback) {
    $.ajax({
        url: "ConfigLoader.aspx/getDetails",
        type: "POST",
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function(data) {
            var config = data.d;
            window.BaseURL = config.AgilePointCDNURL.substr(-1) != '/' ? config.AgilePointCDNURL + "/" : config.AgilePointCDNURL;
            window.SharedResourcesbaseURL = BaseURL + "";
            window.TaskListbaseURL = BaseURL + "/workcenter/";
            window.FormRenderbaseURL = BaseURL + "/applicationbuilder/";
            window.ManageCenterbaseURL = BaseURL + "/managecenter/";
            externalHostingCookie.APIUrl = config.AgilePointRestURL;
            externalHostingCookie.ASPASSOCIATION = config.FromRenderURL;
            externalHostingCookie.PROCESSVIEWER_URL = config.ProcessViewerURL;
            externalHostingCookie.PROCESS_ADAPTATION_URL = config.ProcessAdaptationURL;
            externalHostingCookie.auth = config.Auth;
            externalHostingCookie.UserDetails.FullName = config.FullName;

            externalHostingCookie.UserDetails.UserName = config.UserName;

            //Settings for hiding form header and background.
            //window.hideheader = true;
            //window.hidebackground = true;

            getBuildVersionFromXml(function() {
                getUserLocale(externalHostingCookie, function() {
                    callback && callback(externalHostingCookie);
                });
            });
        }
    });
};