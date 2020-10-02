# sophon
Custom dark-forest tools

## Structure

* `/native` contains all the Rust code that we generate native bindings from.
* `/lib` contains the JS code that manages the SpiralPattern, Perlin, etc. In addition, it creates a leveldb instance where it stores all explored chunks, and a websocket server for communicating to a client.

## Install

* Install Node
* Install Yarn
* Install Rust

## Using

Install dependencies by running `yarn`, this will also kick off the first Rust build.

Once all that succeeds, use `yarn start` to start the explorer/websocket server.

## Rebuilding

If you change any Rust code, you need to run `yarn build` for the native bindings to be regenerated.

## "Known Board"

Any chunks explored by Sophon will be stored in a leveldb instance at `lib/known_board_perlin`. If something gets out-of-sync, you can delete that directory to start from scratch.
