importScripts('/snarkjs.min.js');

self.addEventListener('message', async ({ data }) => {
  const snarkProof = await self.snarkjs.groth16.fullProve(
    data,
    '/circuits/move/circuit.wasm',
    '/move.zkey'
  );

  self.postMessage(snarkProof);
});
