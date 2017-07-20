const net   = require( 'net' ),
      util  = require( "util" ),
      EE    = require( 'events' ).EventEmitter,
      yargs = require( 'yargs' ).argv;

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

    console.log( "Connections: " + this._active.toString() + "\tConnect/s: " + nps.toFixed().toString() + "\tDisconnect\s: " + dps.toFixed().toString() );
  };
}


function createConnection( port, notifier ) {
  var client = new net.Socket;
  client.connect( port, params.connect, function () {
                    var toWatcher = null;
                    notifier.emit( 'start' );
                    setInterval( function () {
                      toWatcher = setTimeout( function () {
                        if ( !this.destroyed ) {
                          console.dir( { err : 'Timed out', port : this.localPort } );
                        } else {
                          this.removeAllListeners();
                          toWatcher && clearTimeout( toWatcher );
                        }
                      }.bind( this ), 3000 );
                      this.on( 'data', function ( data ) {
                        var d = data.toString();
                        if ( !this.destroyed && (d.indexOf( '[' + this.localPort.toString() + ']' ) < 0 ) ) {
                          console.log( "Consistency failed: >" + d + "<" );
                        }
                        toWatcher && clearTimeout( toWatcher );
                        this.removeAllListeners( 'data' );
                        toWatcher = null;
                        if ( params.freshConnection ) {
                          this.destroy();
                          this.removeAllListeners();
                          notifier.emit( 'stop' );
                          createConnection( port, notifier );
                        }
                      }.bind( this ) );
                      if ( !this.destroyed && this.localPort ) {
                        this.write( this.localPort.toString() );
                      }
                    }.bind( this ), 1000 );
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