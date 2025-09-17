use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserConfig {
    pub user: Pubkey,
    pub temp_points: u32,
    pub noise_points: u32,
    pub vibration_points: u32,
    pub heat_points: u32,
    pub bump: u8,
}
