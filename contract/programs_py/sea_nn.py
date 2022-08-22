from seahorse.prelude import *

declare_id('FWLq3NyoFVUWznniq1i5vU8Dp1DK3P6JxrXnJp2mq1DX')

@zero_copy
class Model(Account):
  authority: Pubkey
  conv: Array[Array[i32, 8], 512]
  dense: Array[Array[Array[Array[i32, 10], 8], 28], 28]

@instruction
def init_model(signer: Signer, model: UncheckedAccount):
  # initialize by hand since model exceeds max inner instruction alloc size (10KB)
  discriminator = [152, 221, 247, 122, 185, 125, 223, 151]
  for i in range(8):
    model.data[i] = discriminator[i]
  
  authority = signer.key().to_bytes()
  for i in range(32):
    model.data[8 + i] = authority[i]

@instruction
def set_weights(signer: Signer, model: Model, data: Array[i32, 128], loc: Array[u32, 9]):
  assert model.authority == signer.key(), 'Invalid authority'

  c = 0
  if loc[0] == 0:
    for i in range(loc[1], loc[2]):
      for j in range(loc[3], loc[4]):
        model.conv[i][j] = data[c]
        c += 1
  elif loc[0] == 1:
    for i in range(loc[1], loc[2]):
      for j in range(loc[3], loc[4]):
        for k in range(loc[5], loc[6]):
          for l in range(loc[7], loc[8]):
            model.dense[i][j][k][l] = data[c]
            c += 1

@instruction
def predict(model: Model, image: Array[u32, 28]):
  # Print input
  print("==== INPUT ====")
  for i in range(28):
    s: Array[u8, 28] = [u8((image[i] & (1 << j)) > 0) for j in range(28)]
    print(s)

  # Run model
  out: Array[i32, 10] = [i32(0) for i in range(10)]
  for i in range(13):
    for j in range(13):
      for f in range(8):
        m = i32(-33000)
        for di in range(2):
          for dj in range(2):
            t: i32 = i * 2 + di
            l: i32 = j * 2 + dj
            b1 = (image[t] & (i32(7) << l)) >> l
            b2 = (image[t + 1] & (i32(7) << l)) >> l
            b3 = (image[t + 2] & (i32(7) << l)) >> l
            m = max(m, model.conv[b1 + (b2 << 3) + (b3 << 6)][f])
        for d in range(10):
          out[d] = out[d] + (m * model.dense[i][j][f][d] >> 15)
  
  # Choose best prediction
  p = 0
  for i in range(10):
    if out[i] > out[p]:
      p = i

  # Ouptut prediction
  print("==== OUTPUT ====")
  print("prediction:", p)