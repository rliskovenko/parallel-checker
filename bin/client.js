const net   = require( 'net' );
const yargs = require( 'yargs' ).argv;

var params = {
  connect    : yargs.c || '127.0.0.1',
  startPort  : yargs.p || 60000,
  portCount  : yargs.n || 1000,
  singlePort : !!yargs.s
};

for ( i = params.startPort; i <= params.startPort + params.portCount; i++ ) {
  var client = new net.Socket;
  client.connect( params.singlePort ? params.startPort : i, params.connect, function () {
                    var sock = this;
                    setInterval( function () {
                      var toWatcher = setTimeout( function () {
                        console.dir( { err : 'Timed out', port : sock.localPort } );
                      }, 1000 );
                      sock.on( 'data', function ( data ) {
                        if ( data != 'OK: ' + sock.localPort.toString() ) {
                          console.log( "Got: " + data.toString() );
                        }
                        clearTimeout( toWatcher );
                        sock.removeAllListeners( 'data' );
                        toWatcher = null;
                      } );
                      sock.write( sock.localPort.toString() );
                    }, 1000 );
                  }
  )
  ;

  client.on( 'error', function ( err ) {
    console.error( err );
  } );
}