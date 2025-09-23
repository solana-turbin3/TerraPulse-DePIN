use anchor_lang::prelude::*;

use crate::state::{Config, UserConfig};

#[derive(Accounts)]
#[instruction(user_key:Pubkey)]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        seeds = [b"user", user_key.key().as_ref()],
        space = 8 + UserConfig::INIT_SPACE,
        bump
    )]
    pub user_config: Box<Account<'info, UserConfig>>,

    #[account(
        seeds = [b"config".as_ref()],
        bump = config.bump
    )]
    pub config: Box<Account<'info, Config>>,

    pub system_program: Program<'info, System>,
}

impl<'info> InitializeUser<'info> {
    pub fn initialize_user(&mut self, user_key: Pubkey, bumps: &InitializeUserBumps) -> Result<()> {
        require_keys_eq!(self.admin.key(), self.config.admin.key());
        self.user_config.set_inner(UserConfig {
            user: user_key,
            temp_points: 0,
            noise_points: 0,
            heat_points: 0,
            vibration_points: 0,
            bump: bumps.user_config,
        });
        Ok(())
    }
}
