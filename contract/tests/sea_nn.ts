import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { IDL, SeaNn } from "../target/types/sea_nn";

describe("sea_nn", () => {
  // Configure the client to use the local cluster.
  const web3 = anchor.web3;
  // const program = anchor.workspace.SeaNn as anchor.Program<SeaNn>;
  const provider = anchor.AnchorProvider.local("https://api.devnet.solana.com");
  const program = new anchor.Program(
    IDL,
    "EUpVs4QcQwmLGSWbHieb5HxuBegxYCyYd6CyyVix9g6M",
    provider
  );
  const connection = new anchor.web3.Connection(
    provider.connection.rpcEndpoint,
    "confirmed"
  );
  const wallet = provider.wallet;
  const publicKey = wallet.publicKey;

  anchor.setProvider(provider);

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const readJson = (relativePath: string) =>
    JSON.parse(fs.readFileSync(path.join(__dirname, relativePath), "utf-8"));

  const precompFilter = (rawFilters: number[][][]) => {
    const filters: number[][] = [];
    for (let f = 0; f < 8; f++) {
      const filter = [];
      for (let i = 0; i < 1 << 9; i++) {
        let precomp = 0;
        for (let j = 0; j < 9; j++) {
          const mult = (i & (1 << j)) == 0 ? -1 : 1;
          precomp += rawFilters[f][Math.floor(j / 3)][j % 3] * mult;
        }
        filter.push(Math.floor(precomp / 9));
      }
      filters.push(filter);
    }
    return filters;
  };

  const confirm = async (signature: string) =>
    connection.confirmTransaction(
      { ...(await connection.getLatestBlockhash()), signature },
      "confirmed"
    );

  const sendIx = async (
    ix: web3.TransactionInstruction,
    signers: web3.Keypair[] = [],
    debug = true
  ) => {
    try {
      const tx = new web3.Transaction();
      tx.add(web3.ComputeBudgetProgram.setComputeUnitLimit({ units: 1.4e6 }));
      tx.add(ix);
      const sig = await provider.sendAndConfirm(tx, signers);
      await confirm(sig);
      if (debug) {
        console.log((await connection.getTransaction(sig)).meta.logMessages);
      }
      await wait(500);
    } catch (e) {
      for (const log of e.logs) {
        console.log(log);
      }
      throw e;
    }
  };

  it("Is initialized!", async () => {
    const contents = fs.readFileSync('/workspaces/sea-nn/animage.jpg', {encoding: 'binary'});
    let length = contents.length 
    let width = length / Math.sqrt(length)
    let height = width 
    // const model = new web3.Keypair();
    const model = web3.Keypair.generate()
    console.log("model pk", model.publicKey.toBase58()); //
    if ((model as any).privateKey) {
      // discriminator + authority + filters + weights
      const space = 8 + 32 + 4 * (length) + 4 * (28 * 28 * 10 * 8);
      await sendIx(
        await web3.SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: model.publicKey,
          programId: program.programId,
          space,
          lamports: await connection.getMinimumBalanceForRentExemption(space),
        }),
        [model as any],
        false
      );
      await sendIx(
        await program.methods
          .initModel()
          .accounts({ model: model.publicKey })
          .instruction(),
        [],
        false
      );
    }
    const blockSize = Math.ceil(length / 1100);
    let block: number[] = [];
    let numBlocks = 0;

    const results: Promise<any>[] = [];
    for (var i = 0 ; i <= blockSize; i++){
    for (var segment of contents.slice(1100 * i, (i+1)*1100)){
        
        const acc = web3.Keypair.generate();

        console.log("model pk", model.publicKey.toBase58()); //
        if ((model as any).privateKey) {
          // discriminator + authority + filters + weights
          const space = segment.length + 64;
          await sendIx(
            await web3.SystemProgram.createAccount({
              fromPubkey: publicKey,
              newAccountPubkey: acc.publicKey,
              programId: program.programId,
              space,
              lamports: await connection.getMinimumBalanceForRentExemption(space),
            }),
            [acc.publicKey as any],
            false
          );
          await sendIx(
            await program.methods
              .initAcc([parseInt(segment)])
              .accounts({ model: model.publicKey })
              .instruction(),
            [],
            false
          );
        const res = await sendIx(
          await program.methods
            .setWeights()
            .accounts({ model: model.publicKey, data: acc.publicKey })
            .instruction(),
          [],
          false
        );
        // results.push(res);
        block = [];
      }
    }
  }
  
    // console.log("sending blocks...");
    // await Promise.all(results);
    const image = [
      /*
      0b0000000000000000000000000000, //
      0b0000000000000000000000000000,
      0b0000000000000000000000000000,
      0b0000000000000000000000000000,
      0b0000000000000000000000000000,
      0b0000000000000000000000000000,
      0b0000000000000000000000000000,
      0b0000000000000000001110000000,
      0b0000000111111111111111000000,
      0b0000000111111111110000000000,
      0b0000000110000000000000000000,
      0b0000000110000000000000000000,
      0b0000000011000000000000000000,
      0b0000000011000000000000000000,
      0b0000000001100000000000000000,
      0b0000000001100000000000000000,
      0b0000000000110000000000000000,
      0b0000000000110000000000000000,
      0b0000000000011000000000000000,
      0b0000000000011100000000000000,
      0b0000000000001110000000000000,
      0b0000000000000110000000000000,
      0b0000000000000011000000000000,
      0b0000000000000011000000000000,
      0b0000000000000011100000000000,
      0b0000000000000011100000000000,
      0b0000000000000001100000000000,
      0b0000000000000000000000000000,
      */
      0b0000000000000000000000000000, //
      0b0000000000000000000000000000,
      0b0000000000000000000000000000,
      0b0000000000000111000000000000,
      0b0000000000011111111000000000,
      0b0000000000011101111100000000,
      0b0000000000011000011100000000,
      0b0000000000011000001100000000,
      0b0000000000011100000000000000,
      0b0000000000011100000000000000,
      0b0000000000001110000000000000,
      0b0000000000000110000000000000,
      0b0000000000000111100000000000,
      0b0000000000000011100000000000,
      0b0000000000000001110000000000,
      0b0000000000000001110000000000,
      0b0000000000000000111000000000,
      0b0000000000000000111000000000,
      0b0000000000000000011100000000,
      0b0000000000000000011100000000,
      0b0011111111011111111100000000,
      0b0000111111111111111100000000,
      0b0000000000111110000000000000,
      0b0000000000000000000000000000,
      0b0000000000000000000000000000,
      0b0000000000000000000000000000,
      0b0000000000000000000000000000,
      0b0000000000000000000000000000,
    ];
  });
});
