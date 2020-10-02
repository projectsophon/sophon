use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Coords {
    pub x: i64,
    pub y: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Planet {
    pub coords: Coords,
    pub hash: String,
}

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct ChunkFootprint {
    pub bottomLeft: Coords,
    pub sideLength: i64,
}
