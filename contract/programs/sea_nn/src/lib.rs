use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_spl::associated_token;
use anchor_spl::token;
use std::convert::TryFrom;

declare_id!("FWLq3NyoFVUWznniq1i5vU8Dp1DK3P6JxrXnJp2mq1DX");

#[derive(Debug)]
#[account(zero_copy)]
pub struct Model {
    authority: Pubkey,
    conv: [[i32; 8]; 512],
    dense: [[[[i32; 10]; 8]; 28]; 28],
}

pub fn init_model_handler(mut ctx: Context<InitModel>) -> Result<()> {
    let mut signer = &mut ctx.accounts.signer;
    let mut model = &mut ctx.accounts.model;
    let mut __model_data = model.try_borrow_mut_data()?;
    let mut discriminator = [152, 221, 247, 122, 185, 125, 223, 151];

    for i in 0..8 {
        __model_data[(i) as usize] = discriminator[(i) as usize];
    }

    let mut authority = signer.key().to_bytes();

    for i in 0..32 {
        __model_data[(8 + i) as usize] = authority[(i) as usize];
    }

    Ok(())
}

pub fn set_weights_handler(
    mut ctx: Context<SetWeights>,
    mut data: [i32; 128],
    mut loc: [u32; 9],
) -> Result<()> {
    let mut signer = &mut ctx.accounts.signer;
    let mut model = &mut ctx.accounts.model;
    let mut __model_data = ctx.accounts.model.load_mut()?;

    require!(
        (__model_data.authority as Pubkey) == signer.key(),
        ProgramError::E000
    );

    let mut c = 0;

    if loc[(0) as usize] == (0 as u32) {
        for i in loc[(1) as usize]..loc[(2) as usize] {
            for j in loc[(3) as usize]..loc[(4) as usize] {
                __model_data.conv[(i) as usize][(j) as usize] = data[(c) as usize];

                c += 1;
            }
        }
    } else {
        if loc[(0) as usize] == (1 as u32) {
            for i in loc[(1) as usize]..loc[(2) as usize] {
                for j in loc[(3) as usize]..loc[(4) as usize] {
                    for k in loc[(5) as usize]..loc[(6) as usize] {
                        for l in loc[(7) as usize]..loc[(8) as usize] {
                            __model_data.dense[(i) as usize][(j) as usize][(k) as usize]
                                [(l) as usize] = data[(c) as usize];

                            c += 1;
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

pub fn predict_handler(mut ctx: Context<Predict>, mut image: [u32; 28]) -> Result<()> {
    let mut model = &mut ctx.accounts.model;
    let mut __model_data = ctx.accounts.model.load_mut()?;

    msg!("{}", "==== INPUT ====");

    for i in 0..28 {
        let mut s: [u8; 28] = <[u8; 28] as TryFrom<_>>::try_from({
            let mut list = Vec::new();

            for j in 0..28 {
                list.push((((image[(i) as usize] & ((1 << j) as u32)) > (0 as u32)) as u8));
            }

            list
        })
        .unwrap();

        msg!("{:?}", s);
    }

    let mut out: [i32; 10] = <[i32; 10] as TryFrom<_>>::try_from({
        let mut list = Vec::new();

        for i in 0..10 {
            list.push((0 as i32));
        }

        list
    })
    .unwrap();

    for i in 0..13 {
        for j in 0..13 {
            for f in 0..8 {
                let mut m = (-33000) as i32;

                for di in 0..2 {
                    for dj in 0..2 {
                        let mut t: i32 = <i32 as TryFrom<_>>::try_from((i * 2) + di).unwrap();
                        let mut l: i32 = <i32 as TryFrom<_>>::try_from((j * 2) + dj).unwrap();
                        let mut b1 = ((image[(t) as usize] as i32) & ((7 as i32) << l)) >> l;
                        let mut b2 =
                            ((image[(t + (1 as i32)) as usize] as i32) & ((7 as i32) << l)) >> l;

                        let mut b3 =
                            ((image[(t + (2 as i32)) as usize] as i32) & ((7 as i32) << l)) >> l;

                        m = m.max(
                            __model_data.conv
                                [((b1 + (b2 << (3 as i32))) + (b3 << (6 as i32))) as usize]
                                [(f) as usize] as i32,
                        );
                    }
                }

                for d in 0..10 {
                    out[(d) as usize] = out[(d) as usize]
                        + ((m
                            * (__model_data.dense[(i) as usize][(j) as usize][(f) as usize]
                                [(d) as usize] as i32))
                            >> (15 as i32));
                }
            }
        }
    }

    let mut p = 0;

    for i in 0..10 {
        if out[(i) as usize] > out[(p) as usize] {
            p = i;
        }
    }

    msg!("{}", "==== OUTPUT ====");

    msg!("{} {}", "prediction:", p);

    Ok(())
}

#[derive(Accounts)]
pub struct InitModel<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[doc = "CHECK: This account is unchecked."]
    #[account(mut)]
    pub model: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct SetWeights<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub model: AccountLoader<'info, Model>,
}

#[derive(Accounts)]
pub struct Predict<'info> {
    #[account(mut)]
    pub model: AccountLoader<'info, Model>,
}

#[program]
pub mod sea_nn {
    use super::*;

    pub fn init_model(ctx: Context<InitModel>) -> Result<()> {
        init_model_handler(ctx)
    }

    pub fn set_weights(ctx: Context<SetWeights>, data: [i32; 128], loc: [u32; 9]) -> Result<()> {
        set_weights_handler(ctx, data, loc)
    }

    pub fn predict(ctx: Context<Predict>, image: [u32; 28]) -> Result<()> {
        predict_handler(ctx, image)
    }
}

#[error_code]
pub enum ProgramError {
    #[msg("Invalid authority")]
    E000,
}
