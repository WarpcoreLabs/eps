var cluster          = require("cluster");
var os               = require("os");
var Rx               = require("rx");
var RxHttpServer     = require("rx-http-server");
var responseConsumer = require("./util/response-consumer");

module.exports = function(manifest) {
    if (cluster.isMaster) {
        var cpus = os.cpus().length;
        for (var i = 0; i < cpus; i++) {
            cluster.fork();
        }
        return {
            workerUp: Rx.Observable.never(),
            workerDown: Rx.Node.fromEvent(cluster, "exit", function(args) {
                return {
                    worker: args[0],
                    code:   args[1],
                    signal: args[2]
                };
            }),
            listen: function() { }
        };
    } else {
        var server = new RxHttpServer();
        manifest(server).subscribe(responseConsumer);
        return {
            workerUp: Rx.Observable.returnValue(cluster),
            workerDown: Rx.Observable.never(),
            listen: function(port) {
                server.listen(port);
            }
        };
    }
};
