const net   = require( 'net' );
const yargs = require( 'yargs' ).argv;

var params = {
  connect   : yargs.c || '127.0.0.1',
  startPort : yargs.p || 60000,
  portCount : yargs.n || 1000
};

for ( i = params.startPort; i <= params.startPort + params.portCount; i++ ) {
  var s = new net.Socket;
  s.connect( i, params.connect, function () {
    var socket = this;
    setInterval( function () {
      socket.write( socket.localPort.toString() );
    }, 1000 );
  } );

  s.on( 'error', function ( err ) {
    console.error( err );
  } );
}