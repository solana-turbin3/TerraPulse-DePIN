#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("4fATibSDAGWfRBNuS9yXpA1SsZoxVKhdid6qWEttcsv5");

mod enums;
mod instructions;
mod state;

use enums::*;
use instructions::*;

#[program]
pub mod depin_home {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        reward_temp: u8,
        reward_noise: u8,
        reward_vibration: u8,
        reward_heat: u8,
    ) -> Result<()> {
        ctx.accounts.initialize(
            reward_temp,
            reward_noise,
            reward_vibration,
            reward_heat,
            &ctx.bumps,
        )
    }
    pub fn initialize_user(ctx: Context<InitializeUser>, user_key: Pubkey) -> Result<()> {
        ctx.accounts.initialize_user(user_key, &ctx.bumps)
    }

    pub fn update_points(
        ctx: Context<UpdatePoints>,
        sensor_type: SensorType,
        value: u32,
    ) -> Result<()> {
        ctx.accounts.update_points(sensor_type, value)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        ctx.accounts.claim()
    }
}
