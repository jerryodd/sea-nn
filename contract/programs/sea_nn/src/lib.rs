use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_spl::associated_token;
use anchor_spl::token;
use std::convert::TryFrom;

declare_id!("EUpVs4QcQwmLGSWbHieb5HxuBegxYCyYd6CyyVix9g6M");

#[derive(Debug)]
#[account]
pub struct Model {
    authority: Pubkey,
    datas: u64,
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

pub fn init_acc_handler(mut ctx: Context<InitAcc>, mut data: [u8; 1024]) -> Result<()> {
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

    for i in 0..1024 {
        __model_data[(((8 + 32) as u64) + i) as usize] = data[(i) as usize];
    }

    Ok(())
}

pub fn set_weights_handler(mut ctx: Context<SetWeights>) -> Result<()> {
    let mut signer = &mut ctx.accounts.signer;
    let mut model = &mut ctx.accounts.model;
    let mut data = &mut ctx.accounts.data;
    let mut __data_data = data.try_borrow_mut_data()?;

    require!(model.authority == signer.key(), ProgramError::E000);

    for i in __data_data.into_iter() {
        model.datas = model.datas + (*i as u64);
    }

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
pub struct InitAcc<'info> {
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
    pub model: Box<Account<'info, Model>>,
    #[doc = "CHECK: This account is unchecked."]
    #[account(mut)]
    pub data: UncheckedAccount<'info>,
}

#[program]
pub mod sea_nn {
    use super::*;

    pub fn init_model(ctx: Context<InitModel>) -> Result<()> {
        init_model_handler(ctx)
    }

    pub fn init_acc(ctx: Context<InitAcc>, data: [u8; 1024]) -> Result<()> {
        init_acc_handler(ctx, data)
    }

    pub fn set_weights(ctx: Context<SetWeights>) -> Result<()> {
        set_weights_handler(ctx)
    }
}

#[error_code]
pub enum ProgramError {
    #[msg("Invalid authority")]
    E000,
}
