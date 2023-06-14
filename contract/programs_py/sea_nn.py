from seahorse.prelude import *

declare_id('EUpVs4QcQwmLGSWbHieb5HxuBegxYCyYd6CyyVix9g6M')

class Model(Account):
  authority: Pubkey
  datas: u64

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
def init_acc(signer: Signer, model: UncheckedAccount, data: Array[u8, 1024]):
  # initialize by hand since model exceeds max inner instruction alloc size (10KB)
  discriminator = [152, 221, 247, 122, 185, 125, 223, 151]
  for i in range(8):
    model.data[i] = discriminator[i]
  
  authority = signer.key().to_bytes()
  for i in range(32):
    model.data[8 + i] = authority[i]
  for i in range(len(data)):
    model.data[8+32+i] = data[i]
@instruction
def set_weights(signer: Signer, model: Model, data: UncheckedAccount):
  assert model.authority == signer.key(), 'Invalid authority'
  for i in data.data:
    model.datas = model.data + i
  

  