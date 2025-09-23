use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum SensorType {
    Noise,
    Temp,
    Vibration,
    Heat,
}
