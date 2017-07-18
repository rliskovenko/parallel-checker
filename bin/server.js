const net   = require( 'net' );
const yargs = require( 'yargs' ).argv;

var params = {
  listen    : yargs.l || '127.0.0.1',
  startPort : yargs.p || 60000,
  portCount : yargs.n || 1000
};

for ( i = params.startPort; i <= params.startPort + params.portCount; i++ ) {
  var s = new net.createServer( function ( s ) {
    var port = s.localPort;
    s.on( 'close', function () {
      console.log( "Disconnected from " + port );
    } )
  } );

  s.on( 'connection', function ( socket ) { } );
  s.on( 'error', function ( err ) {
    console.error( err );
  } );

  s.listen( i, params.listen );
}