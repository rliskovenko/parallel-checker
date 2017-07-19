const net   = require( 'net' ),
      yargs = require( 'yargs' ).argv;

var params = {
  listen     : yargs.l || '127.0.0.1',
  startPort  : yargs.p || 60000,
  portCount  : yargs.n || 1000,
  singlePort : !!yargs.s
};

if ( params.singlePort ) {
  var srv = new net.createServer( function ( sock ) {
    sock.on( 'close', function () {
      console.log( "Disconnected" );
    } );
    sock.on( 'data', function ( data ) {
      this.write( 'OK: ' + data );
    } );
    sock.on( 'error', function ( err ) {
      console.error( err );
    } );
  } );

  srv.on( 'error', function ( err ) {
    console.error( err );
  } );

  srv.listen( params.startPort, params.listen );
} else {
  for ( i = params.startPort; i <= params.startPort + params.portCount; i++ ) {
    var mSrv = new net.createServer( function ( sock ) {
      var port = sock.localPort;
      sock.on( 'close', function () {
        console.log( "Disconnected from " + port );
      } );
      sock.on( 'data', function ( data ) {
        try {
          this.write( 'OK: ' + data );
        } catch ( e ) {
          console.dir( e );
        }
      } );
      sock.on( 'error', function ( err ) {
        console.error( err );
      } );
    } );

    mSrv.on( 'connection', function ( socket ) { } );
    mSrv.on( 'error', function ( err ) {
      console.error( err );
    } );

    mSrv.listen( i, params.listen );
  }

}