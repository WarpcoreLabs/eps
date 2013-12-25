var path                = require("path");
var eps                 = require("./index");
var serviceContainer    = require("./services/container");
var requestLogger       = require("./middleware/root/request-logger");
var less                = require("./middleware/root/less");
var staticFiles         = require("./middleware/root/static-files");
var services            = require("./middleware/root/services");
var cookieReader        = require("./middleware/root/cookie/reader");
var cookieWriter        = require("./middleware/root/cookie/writer");
var flashSessionReader  = require("./middleware/root/flash-session/reader");
var flashSessionWriter  = require("./middleware/root/flash-session/writer");
var signedSessionReader = require("./middleware/root/signed-session/reader");
var signedSessionWriter = require("./middleware/root/signed-session/writer");
var router              = require("./middleware/root/router");
var WorkerOnlineAction  = require("./models/actions/worker/online");
var WorkerDiedAction    = require("./models/actions/worker/died");

var conduit = eps(function(server) {
    var lessPath   = path.join(__dirname, "public/css/main.less");
    var publicPath = path.join(__dirname, "public");
    return server
        .requests
        .flatMap(services)
        .flatMap(requestLogger)
        .flatMap(less("/public/css/main.css", lessPath))
        .flatMap(staticFiles("/public", publicPath))
        .flatMap(cookieReader)
        .flatMap(flashSessionReader)
        .flatMap(signedSessionReader("Why is a raven like a writing desk?"))
        .flatMap(router)
        .flatMap(signedSessionWriter("Why is a raven like a writing desk?"))
        .flatMap(flashSessionWriter)
        .flatMap(cookieWriter);
});

conduit.workerUp.subscribe(function(cluster) {
    serviceContainer("logger").subscribe(function(logger) {
        logger.info(new WorkerOnlineAction(cluster));
    });
});

conduit.workerDown.subscribe(function(data) {
    serviceContainer("logger").subscribe(function(logger) {
        logger.error(new WorkerDiedAction(data.worker));
    });
});

conduit.listen(3000);
