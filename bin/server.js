const net   = require( 'net' ),
      util  = require( "util" ),
      EE    = require( 'events' ).EventEmitter,
      yargs = require( 'yargs' ).argv;

var params = {
  listen     : yargs.l || '127.0.0.1',
  startPort  : yargs.p || 60000,
  portCount  : yargs.n || 1000,
  singlePort : !!yargs.s
};

function InfoJob() {
  EE.call( this );
  this._whatsup = { connect : 0, disconnect : 0, requests : 0 };
  this._started = null;
  this.on( 'connect', function () {
    this._started = this._started || new Date();
    this._whatsup.connect++;
  } );
  this.on( 'disconnect', function () {
    this._started = this._started || new Date();
    this._whatsup.disconnect++;
  } );
  this.on( 'request', function () {
    this._started = this._started || new Date();
    this._whatsup.requests++;
  } );
  this.dumpInfo = function () {
    var connect    = this._whatsup.connect,
        disconnect = this._whatsup.disconnect,
        request    = this._whatsup.requests,
        time       = this._started,
        now        = new Date(),
        timeDiff   = now - time,
        cps        = connect / timeDiff * 1000,
        dps        = disconnect / timeDiff * 1000,
        rps        = request / timeDiff * 1000;

    this._whatsup = { connect : 0, disconnect : 0, requests : 0 };
    this._started = null;

    console.log( "Connection/s: " + cps.toFixed().toString() + "\tDisconnect/s: " + dps.toFixed().toString() + "\tRequest/s: " + rps.toFixed().toString() );
  };
}

function spawnServer( port, listen, notifier ) {
  var srv = new net.createServer( function ( sock ) {
    sock.on( 'close', function () {
      notifier.emit( 'disconnect' );
    } );
    sock.on( 'data', function ( data ) {
      notifier.emit( 'request' );
      try {
        this.write( 'OK: [' + data + ']' );
      } catch ( e ) {
        console.dir( e );
      }
    } );
    sock.on( 'error', function ( err ) {
      console.error( err );
    } );
  } );

  srv.on( 'connection', function () {
    notifier.emit( 'connect' );
  } );
  srv.on( 'error', function ( err ) {
    console.error( err );
  } );

  srv.listen( port, listen );
}

///// MAIN
util.inherits( InfoJob, EE );

var infoJob = new InfoJob();
setInterval( function () {
  infoJob.dumpInfo();
}, 5000 );

if ( params.singlePort ) {
  spawnServer( params.startPort, params.listen, infoJob );
} else {
  for ( i = params.startPort; i <= params.startPort + params.portCount; i++ ) {
    spawnServer( i, params.listen, infoJob );
  }
}