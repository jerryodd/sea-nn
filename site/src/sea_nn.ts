export type SeaNn = {
  version: "0.1.0";
  name: "sea_nn";
  instructions: [
    {
      name: "initModel";
      accounts: [
        {
          name: "signer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "model";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "setWeights";
      accounts: [
        {
          name: "signer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "model";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "data";
          type: {
            array: ["i32", 128];
          };
        },
        {
          name: "loc";
          type: {
            array: ["u32", 9];
          };
        }
      ];
    },
    {
      name: "predict";
      accounts: [
        {
          name: "model";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "image";
          type: {
            array: ["u32", 28];
          };
        }
      ];
    }
  ];
  accounts: [
    {
      name: "model";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "conv";
            type: {
              array: [
                {
                  array: ["i32", 8];
                },
                512
              ];
            };
          },
          {
            name: "dense";
            type: {
              array: [
                {
                  array: [
                    {
                      array: [
                        {
                          array: ["i32", 10];
                        },
                        8
                      ];
                    },
                    28
                  ];
                },
                28
              ];
            };
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: "E000";
      msg: "Invalid authority";
    }
  ];
};

export const IDL: SeaNn = {
  version: "0.1.0",
  name: "sea_nn",
  instructions: [
    {
      name: "initModel",
      accounts: [
        {
          name: "signer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "model",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "setWeights",
      accounts: [
        {
          name: "signer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "model",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "data",
          type: {
            array: ["i32", 128],
          },
        },
        {
          name: "loc",
          type: {
            array: ["u32", 9],
          },
        },
      ],
    },
    {
      name: "predict",
      accounts: [
        {
          name: "model",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "image",
          type: {
            array: ["u32", 28],
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: "model",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "conv",
            type: {
              array: [
                {
                  array: ["i32", 8],
                },
                512,
              ],
            },
          },
          {
            name: "dense",
            type: {
              array: [
                {
                  array: [
                    {
                      array: [
                        {
                          array: ["i32", 10],
                        },
                        8,
                      ],
                    },
                    28,
                  ],
                },
                28,
              ],
            },
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: "E000",
      msg: "Invalid authority",
    },
  ],
};
