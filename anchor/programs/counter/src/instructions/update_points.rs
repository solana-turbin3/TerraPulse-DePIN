use anchor_lang::prelude::*;

use crate::{enums::SensorType, state::{Config, UserConfig}};

#[derive(Accounts)]
pub struct UpdatePoints<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(     
        mut,
        seeds = [b"user".as_ref(), user_config.user.key().as_ref()],
        bump = user_config.bump
    )]
    pub user_config: Box<Account<'info, UserConfig>>,

     #[account(
        seeds = [b"config".as_ref()],
        bump = config.bump
    )]
    pub config: Box<Account<'info, Config>>,


    pub system_program: Program<'info, System>,
}

impl<'info> UpdatePoints<'info> {
    pub fn update_points(&mut self, sensor_type:SensorType,  value: u32) -> Result<()> {
        require_keys_eq!(self.admin.key(), self.config.admin.key());
          match sensor_type {
            SensorType::Noise => self.user_config.noise_points += value,
            SensorType::Temp => self.user_config.temp_points += value,
            SensorType::Vibration => self.user_config.vibration_points += value,
            SensorType::Heat => self.user_config.heat_points += value,
        }
        Ok(())
      
    }
}
