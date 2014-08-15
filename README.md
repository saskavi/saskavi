# saskavi

saskavi is an open source platform for realtime serverless and distributed RPC.  saskavi lets you deploy code in small units of functions to the cloud.  Your Function are securely callable as simple javascript from any client side script.


## Example

### to run the example

The `example/run` script will start both a http-server serving `./public` and do a `saskavi run` in the server directory

You can run the script:
    `./example/run`

You can use npm run-script:
   `npm run-script example`



The script will first start `http-server`(npm) to server the ./ublic directory on localhost. It also runs`saskavi run` in the ./server directory to register the reverse function for RPC (see saskavi.json).


