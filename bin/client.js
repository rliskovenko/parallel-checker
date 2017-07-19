const net   = require( 'net' ),
      util  = require( "util" ),
      yargs = require( 'yargs' ).argv,
      EE    = require( 'events' ).EventEmitter;

// -n -- amount of opened ports
// -s -- to use a single port, thus changing -n to be an amount of parallel connection to that single port
// -f -- to freshen connections, -n becomes the amount of connections we are trying to keep at the same time
var params = {
  connect         : yargs.c || '127.0.0.1',
  startPort       : yargs.p || 60000,
  portCount       : yargs.n || 1000,
  singlePort      : !!yargs.s,
  freshConnection : !!yargs.f
};

function InfoJob() {
  EE.call( this );
  this._whatsup = { new : 0, del : 0 };
  this._started = null;
  this._active  = 0;
  this.on( 'start', function () {
    this._started = this._started || new Date();
    this._active++;
    this._whatsup.new++;
  } );
  this.on( 'stop', function () {
    this._started = this._started || new Date();
    this._active--;
    this._whatsup.del++;
  } );
  this.dumpInfo = function () {
    var started  = this._whatsup.new,
        stopped  = this._whatsup.del,
        time     = this._started,
        now      = new Date(),
        timeDiff = now - time,
        nps      = started / timeDiff * 1000,
        dps      = stopped / timeDiff * 1000;

    this._whatsup = { new : 0, del : 0 };
    this._started = null;

    console.log( "Current connections: " + this._active.toString() + " New per second: " + nps.toFixed().toString() + " Delete per second: " + dps.toFixed().toString() );
  };
}


function createConnection( port, notifier ) {
  var client = new net.Socket;
  client.connect( port, params.connect, function () {
                    var sock = this;
                    notifier.emit( 'start' );
                    setInterval( function () {
                      var toWatcher = setTimeout( function () {
                        if ( !sock.destroyed ) {
                          console.dir( { err : 'Timed out', port : sock.localPort } );
                        } else {
                          sock.removeAllListeners();
                          clearTimeout( toWatcher );
                        }
                      }, 1000 );
                      sock.on( 'data', function ( data ) {
                        if ( !sock.destroyed && data != 'OK: ' + sock.localPort.toString() ) {
                          console.log( "Consistency failed: " + data.toString() );
                        }
                        clearTimeout( toWatcher );
                        sock.removeAllListeners( 'data' );
                        toWatcher = null;
                        if ( params.freshConnection ) {
                          sock.destroy();
                          sock.removeAllListeners();
                          notifier.emit( 'stop' );
                          createConnection( port, notifier );
                        }
                      } );
                      if ( !sock.destroyed && sock.localPort ) {
                        sock.write( sock.localPort.toString() );
                      }
                    }, 1000 );
                  }
  );

  client.on( 'error', function ( err ) {
    console.error( err );
  } );
}

///// MAIN
util.inherits( InfoJob, EE );

var infoJob = new InfoJob();
setInterval( function () {
  infoJob.dumpInfo();
}, 5000 );

for ( i = params.startPort; i <= params.startPort + params.portCount; i++ ) {
  createConnection( params.singlePort ? params.startPort : i, infoJob );
}