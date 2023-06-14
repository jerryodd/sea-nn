import { useRef, useState } from "react";
import {
  ComputeBudgetProgram,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { AnchorProvider, Program } from "@project-serum/anchor";
import { IDL } from "./sea_nn";
import clsx from "clsx";
import { SAMPLES } from "./samples";
import { BiEraser, BiLink, BiSend, BiShuffle } from "react-icons/bi";
import { ABOUT, INTRO } from "./text";

const PROGRAM_ID = new PublicKey(
  "EUpVs4QcQwmLGSWbHieb5HxuBegxYCyYd6CyyVix9g6M"
);
const MODEL_ID = new PublicKey("J71bKpwMYAQ6SMNK8f84BsbgFWhwhABs9jPhWCYeE2JJ"); // devnet
const L = 28;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const submit = async (grid: number[][], setLogs: any) => {
  const solana =
    (window as any).solana || (window as any).glow || (window as any).phantom;
  if (!solana) {
    alert("Please install Phantom or Glow wallet!");
    return;
  }
  try {
    await solana.connect();
    const connection = new Connection(
      // "http://localhost:8899",
      "https://api.devnet.solana.com",
      "confirmed"
    );
    const balance = await connection.getBalance(solana.publicKey);
    console.log("balance", balance);
    if (balance < LAMPORTS_PER_SOL * 0.01) {
      setLogs([
        `Devnet SOL balance: ${
          balance / LAMPORTS_PER_SOL
        }, airdropping more SOL...`,
      ]);
      const signature = await connection.requestAirdrop(
        solana.publicKey,
        LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction({
        ...(await connection.getLatestBlockhash()),
        signature,
      });
      setLogs((logs: any) => [...logs, "Done."]);
      console.log(await connection.getBalance(solana.publicKey));
    }
    const userProvider = new AnchorProvider(connection, solana, {
      commitment: "confirmed",
    });
    const userProgram = new Program<typeof IDL>(IDL, PROGRAM_ID, userProvider);
    const tx = new Transaction();
    tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 1.4e6 }));
    tx.add(
      await userProgram.methods
        .predict(
          grid.map((row) => row.reduce((acc, elem, i) => acc | (elem << i)), 0)
        )
        .accounts({ model: MODEL_ID })
        .instruction()
    );
    const signature = await userProvider.sendAndConfirm(tx);
    console.log("signature", signature);
    await connection.confirmTransaction({
      ...(await connection.getLatestBlockhash()),
      signature,
    });
    return [
      signature,
      (await connection.getTransaction(signature))?.meta?.logMessages,
    ];
  } catch (e: any) {
    console.log(e);
    alert(
      "Error: " +
        (e?.message ?? e) +
        "\n\n⚠️ Please ensure your wallet is set to Devnet under Developer Settings!"
    );
  }
};

const Cell = ({ active, onMove }: any) => {
  return (
    <div
      className={clsx(
        "h-3 w-3 border-t border-r border-blue-400/50",
        active ? "bg-blue-700" : "bg-blue-300",
        "nodrag"
      )}
      onMouseMove={() => onMove()}
      onTouchMove={() => onMove()}
      onClick={() => onMove(true)}
    ></div>
  );
};

function App() {
  const [mouseDown, _setMouseDown] = useState(false);
  const blankGrid = () => [...new Array(L)].map((_) => new Array(L).fill(0));
  const [showSource, setShowSource] = useState(false);
  const [grid, setGrid] = useState(blankGrid());
  const [sampleIndex, setSampleIndex] = useState(
    Math.floor(Math.random() * SAMPLES.length)
  );
  const [submitting, setSubmitting] = useState(false);
  const [signature, setSignature] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const logDiv = useRef<any>();
  const setMouseDown = (isDown: boolean) => {
    _setMouseDown(isDown);
  };
  const hit = (I: number, J: number) => {
    for (let i = I - 1; i <= I; i++) {
      for (let j = J - 1; j <= J; j++) {
        if (i !== I && j !== J) continue;
        if (i < 0 || j < 0 || i >= L || j >= L) continue;
        grid[i][j] = 1;
      }
    }

    setGrid([...grid]);
  };
  const resetGrid = () => {
    setGrid(blankGrid());
  };
  const loadSample = () => {
    setGrid(SAMPLES[sampleIndex]);
    setSampleIndex((sampleIndex + 1) % SAMPLES.length);
  };
  const onSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const [signature, result]: any = await submit(grid, setLogs);
      setSignature(signature);
      setLogs([]);
      for (let i = 0; i < result.length; i++) {
        setLogs((logs) => [...logs, result[i]]);
        await wait(100);
        if (logDiv.current) {
          logDiv.current.scrollTop = logDiv.current.scrollHeight;
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full text-black bg-neutral-50">
      <div className={clsx("flex flex-row items-center ml-8 mt-10 mb-10")}>
        <img src="./horsea.png" className={clsx("h-24 w-24")} />
        <div className={clsx("flex flex-col ml-6")}>
          <h1 className={clsx("font-bold text-3xl")}>Sea-NN</h1>
          <h2 className={clsx("text-xl")}>
            Fully On-chain Convolutional Neural Network
          </h2>
        </div>
      </div>
      <div className={clsx("flex flex-col md:flex-row items-center mb-6")}>
        <div className={clsx("flex flex-col")}>
          <button
            className={clsx(
              "flex flex-row items-center justify-center",
              "text-black bg-blue-200 border border-blue-400"
            )}
            onClick={loadSample}
          >
            Load random sample
            <span className={clsx("ml-2")}>
              <BiShuffle />{" "}
            </span>
          </button>
          <button
            className={clsx(
              "flex flex-row items-center justify-center",
              "text-black bg-blue-200 border border-blue-400"
            )}
            onClick={resetGrid}
          >
            Clear grid
            <span className={clsx("ml-2")}>
              <BiEraser />{" "}
            </span>
          </button>
          <div
            onMouseDown={() => setMouseDown(true)}
            onMouseUp={() => setMouseDown(false)}
            onMouseLeave={() => setMouseDown(false)}
            onTouchStart={() => setMouseDown(true)}
            onTouchEnd={() => setMouseDown(false)}
            onTouchCancel={() => setMouseDown(false)}
            className="nodrag relative"
          >
            {grid.find((row) => row.includes(1)) === undefined ? (
              <div
                className={clsx(
                  "absolute left-0 right-0 top-[9rem]",
                  "h-0",
                  "flex justify-center items-center"
                )}
              >
                <p className={clsx("font-bold h-0")}>{INTRO}</p>
              </div>
            ) : null}
            {[...new Array(L)].map((_, i) => (
              <div className={clsx("flex flex-row items-center nodrag")}>
                {[...new Array(L)].map((_, j) => (
                  <Cell
                    active={grid[i][j]}
                    onMove={(strong: any) => (strong || mouseDown) && hit(i, j)}
                  />
                ))}
              </div>
            ))}
          </div>
          <button
            className={clsx(
              "flex flex-row items-center justify-center",
              "text-black bg-blue-200 border border-blue-400"
            )}
            onClick={onSubmit}
          >
            Submit
            <span className={clsx("ml-2")}>
              <BiSend />{" "}
            </span>
          </button>
        </div>
        <div
          className={clsx(
            "flex flex-col items-stretch md:ml-8 md:mt-0 ml-0 mt-4"
          )}
        >
          <div
            className={clsx(
              "flex flex-row items-center justify-center",
              "text-neutral-600 bg-neutral-100 border border-neutral-400"
            )}
            onClick={resetGrid}
          >
            {signature ? (
              <a
                href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
                target="_blank"
                className={clsx("flex flex-row items-center justify-center")}
              >
                Transaction link
                <span className={clsx("ml-2")}>
                  <BiLink />{" "}
                </span>
              </a>
            ) : (
              <span className={clsx("opacity-0")}>"-"</span>
            )}
          </div>
          <div
            className={clsx(
              "flex flex-col",
              "bg-neutral-200 border",
              " border-neutral-400 text-neutral-600",
              "md:w-96 w-[22rem] h-[24.25rem] overflow-y-scroll",
              "text-xs"
            )}
            ref={logDiv}
          >
            {logs.map((log, i) => {
              const prefix = "Program log: ";
              if (!log.startsWith(prefix)) {
                return (
                  <span style={{ whiteSpace: "break-spaces" }}>{log}</span>
                );
              }
              log = log.substring(prefix.length);
              return (
                <div key={log + i + logs.length}>
                  <span
                    className={clsx(
                      log.includes("prediction") &&
                        "font-bold bg-blue-300 text-black"
                    )}
                    style={{
                      whiteSpace: "break-spaces",
                      letterSpacing: log.includes("[") ? -2 : 0,
                    }}
                  >
                    {!log.includes(",")
                      ? log
                      : [
                          "[",
                          ...JSON.parse(log).map((n: number, i: number) => (
                            <span>
                              {i !== 0 ? "," : ""}
                              <span
                                className={clsx(
                                  n === 1 && "bg-blue-300 text-black font-bold"
                                )}
                              >
                                {i !== 0 ? " " : ""}
                                {n}
                              </span>
                            </span>
                          )),
                          "]",
                        ]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div
        className={clsx(
          "mx-5 mb-4",
          "border-2 bg-neutral-100 rounded-md p-3",
          "max-w-[47rem]"
        )}
      >
        <p style={{ whiteSpace: "break-spaces" }}>
          {ABOUT.split("|").map((s, i) => {
            if (i % 2 === 0) {
              return s;
            }
            const [text, link] = s.split(";");
            return (
              <a href={link} target="_blank" className={clsx("text-blue-400")}>
                {text}
              </a>
            );
          })}
        </p>
      </div>
      <button
        className={clsx(
          "font-bold bg-neutral-100 border border-neutral-400 px-1 mb-4"
        )}
        onClick={() => setShowSource(!showSource)}
      >
        View source
      </button>
      <div className={clsx("overflow-hidden rounded-lg mb-10")}>
        {/* lazy... lol */}
        {showSource ? (
          <img src="./source.png" className={clsx("w-96 md:hidden")} />
        ) : null}
        {showSource ? (
          <img
            src="./source_lg.png"
            className={clsx("w-[47rem] hidden md:flex")}
          />
        ) : null}
      </div>
    </div>
  );
}

export default App;
