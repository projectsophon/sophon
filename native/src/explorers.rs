#![allow(non_snake_case)]

use crate::game::{ChunkFootprint, Coords};

pub trait MiningPattern {
    fn next(&self, fromChunk: &ChunkFootprint) -> ChunkFootprint;
}

pub struct SpiralMiner {
    currentChunk: ChunkFootprint,
    pattern: Spiral,
}

impl SpiralMiner {
    pub fn new(center: Coords, chunkSideLength: u16) -> Self {
        let currentChunk = ChunkFootprint {
            bottomLeft: center.clone(),
            sideLength: chunkSideLength as i64,
        };
        let pattern = Spiral::new(&center, chunkSideLength);

        Self {
            currentChunk,
            pattern,
        }
    }
}
impl Iterator for SpiralMiner {
    type Item = ChunkFootprint;
    fn next(&mut self) -> Option<Self::Item> {
        let next = self.pattern.next(&self.currentChunk);
        self.currentChunk = next.clone();
        Some(next)
    }
}

pub struct Spiral {
    chunkSideLength: u16,
    fromChunk: ChunkFootprint,
}

impl Spiral {
    pub fn new(center: &Coords, chunkSideLength: u16) -> Self {
        //floor by default?

        let length = i64::from(chunkSideLength);

        let bottomLeftX = (center.x / length) * length;
        let bottomLeftY = (center.y / length) * length;
        let bottomLeft = Coords {
            x: bottomLeftX,
            y: bottomLeftY,
        };

        let fromChunk = ChunkFootprint {
            bottomLeft,
            sideLength: length,
        };

        Self {
            fromChunk,
            chunkSideLength,
        }
    }
}

impl MiningPattern for Spiral {
    fn next(&self, chunk: &ChunkFootprint) -> ChunkFootprint {
        let homeX = self.fromChunk.bottomLeft.x;
        let homeY = self.fromChunk.bottomLeft.y;
        let currX = chunk.bottomLeft.x;
        let currY = chunk.bottomLeft.y;

        let mut nextBottomLeft = Coords { x: currX, y: currY };

        let length = i64::from(self.chunkSideLength);

        if currX == homeX && currY == homeY {
            nextBottomLeft.y = homeY + length;
        } else if currY - currX > homeY - homeX && currY + currX >= homeX + homeY {
            if currY + currX == homeX + homeY {
                // break the circle
                nextBottomLeft.y = currY + length;
            } else {
                nextBottomLeft.x = currX + length;
            }
        } else if currX + currY > homeX + homeY && currY - currX <= homeY - homeX {
            nextBottomLeft.y = currY - length;
        } else if currX + currY <= homeX + homeY && currY - currX < homeY - homeX {
            nextBottomLeft.x = currX - length;
        } else {
            // if (currX + currY < homeX + homeY && currY - currX >= homeY - homeX)
            nextBottomLeft.y = currY + length;
        }

        ChunkFootprint {
            bottomLeft: nextBottomLeft,
            sideLength: length,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    extern crate test;

    #[test]
    fn sixteen_iter() {
        let center = Coords { x: 0, y: 0 };
        let chunkSideLength = 16;
        let mut miner = SpiralMiner::new(center, chunkSideLength);

        assert_eq!(
            miner.next(),
            Some(ChunkFootprint {
                bottomLeft: Coords {
                    x: 0,
                    y: chunkSideLength as i64,
                },
                sideLength: chunkSideLength as i64
            })
        );

        assert_eq!(
            miner.next(),
            Some(ChunkFootprint {
                bottomLeft: Coords {
                    x: chunkSideLength as i64,
                    y: chunkSideLength as i64,
                },
                sideLength: chunkSideLength as i64
            })
        );

        assert_eq!(
            miner.next(),
            Some(ChunkFootprint {
                bottomLeft: Coords {
                    x: chunkSideLength as i64,
                    y: 0,
                },
                sideLength: chunkSideLength as i64
            })
        );

        assert_eq!(
            miner.next(),
            Some(ChunkFootprint {
                bottomLeft: Coords {
                    x: chunkSideLength as i64,
                    y: -(chunkSideLength as i64),
                },
                sideLength: chunkSideLength as i64
            })
        );

        assert_eq!(
            miner.next(),
            Some(ChunkFootprint {
                bottomLeft: Coords {
                    x: 0,
                    y: -(chunkSideLength as i64),
                },
                sideLength: chunkSideLength as i64
            })
        );
    }

    #[test]
    fn sixteen() {
        let chunkSideLength = 16;
        let center = Coords { x: 0, y: 0 };

        let start = ChunkFootprint {
            bottomLeft: center.clone(),
            sideLength: chunkSideLength as i64,
        };
        let spiral = Spiral::new(&center, chunkSideLength);
        let first = spiral.next(&start);
        let second = spiral.next(&first);
        let third = spiral.next(&second);
        let fourth = spiral.next(&third);
        let fifth = spiral.next(&fourth);

        assert_eq!(
            first,
            ChunkFootprint {
                bottomLeft: Coords {
                    x: 0,
                    y: chunkSideLength as i64,
                },
                sideLength: chunkSideLength as i64
            }
        );

        assert_eq!(
            second,
            ChunkFootprint {
                bottomLeft: Coords {
                    x: chunkSideLength as i64,
                    y: chunkSideLength as i64,
                },
                sideLength: chunkSideLength as i64
            }
        );

        assert_eq!(
            third,
            ChunkFootprint {
                bottomLeft: Coords {
                    x: chunkSideLength as i64,
                    y: 0,
                },
                sideLength: chunkSideLength as i64
            }
        );

        assert_eq!(
            fourth,
            ChunkFootprint {
                bottomLeft: Coords {
                    x: chunkSideLength as i64,
                    y: -(chunkSideLength as i64),
                },
                sideLength: chunkSideLength as i64
            }
        );

        assert_eq!(
            fifth,
            ChunkFootprint {
                bottomLeft: Coords {
                    x: 0,
                    y: -(chunkSideLength as i64),
                },
                sideLength: chunkSideLength as i64
            }
        );
    }

    #[test]
    fn thirtytwo() {
        let chunkSideLength = 32;
        let center = Coords { x: 0, y: 0 };

        let start = ChunkFootprint {
            bottomLeft: center.clone(),
            sideLength: chunkSideLength as i64,
        };
        let spiral = Spiral::new(&center, chunkSideLength);
        let first = spiral.next(&start);
        let second = spiral.next(&first);
        let third = spiral.next(&second);
        let fourth = spiral.next(&third);
        let fifth = spiral.next(&fourth);

        assert_eq!(
            first,
            ChunkFootprint {
                bottomLeft: Coords {
                    x: 0,
                    y: chunkSideLength as i64,
                },
                sideLength: chunkSideLength as i64
            }
        );

        assert_eq!(
            second,
            ChunkFootprint {
                bottomLeft: Coords {
                    x: chunkSideLength as i64,
                    y: chunkSideLength as i64,
                },
                sideLength: chunkSideLength as i64
            }
        );

        assert_eq!(
            third,
            ChunkFootprint {
                bottomLeft: Coords {
                    x: chunkSideLength as i64,
                    y: 0,
                },
                sideLength: chunkSideLength as i64
            }
        );

        assert_eq!(
            fourth,
            ChunkFootprint {
                bottomLeft: Coords {
                    x: chunkSideLength as i64,
                    y: -(chunkSideLength as i64),
                },
                sideLength: chunkSideLength as i64
            }
        );

        assert_eq!(
            fifth,
            ChunkFootprint {
                bottomLeft: Coords {
                    x: 0,
                    y: -(chunkSideLength as i64),
                },
                sideLength: chunkSideLength as i64
            }
        );
    }
}
