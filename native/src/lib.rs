#![allow(non_snake_case)]

pub mod explorers;
pub mod game;
pub mod mimc;

use uint::construct_uint;
construct_uint! {
    pub struct U512(8);
}

use crate::game::{ChunkFootprint, Coords, Planet};
use crate::mimc::*;
use itertools::iproduct;
use neon::prelude::*;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};

#[allow(non_snake_case)]
#[derive(Deserialize, Debug)]
struct ExploreTask {
    chunkFootprint: ChunkFootprint,
    planetRarity: u32,
}

#[allow(non_snake_case)]
#[derive(Serialize)]
struct ExploreResponse {
    chunkFootprint: ChunkFootprint,
    planetLocations: Vec<Planet>,
}

struct Explorer {
    task: ExploreTask,
}

impl Task for Explorer {
    type Output = ExploreResponse;
    type Error = ();
    type JsEvent = JsValue;

    fn perform(&self) -> Result<Self::Output, Self::Error> {
        let x = self.task.chunkFootprint.bottomLeft.x;
        let y = self.task.chunkFootprint.bottomLeft.y;
        let size = self.task.chunkFootprint.sideLength;
        let threshold = MimcState::rarity(self.task.planetRarity);

        let planets = iproduct!(x..(x + size), y..(y + size))
            .par_bridge()
            .filter_map(|(xi, yi)| {
                let hash = MimcState::sponge(&[xi, yi], 220);
                if hash < threshold {
                    Some(Planet {
                        coords: Coords { x: xi, y: yi },
                        hash: hash.to_string(),
                    })
                } else {
                    None
                }
            })
            .collect::<Vec<Planet>>();

        let result = ExploreResponse {
            chunkFootprint: self.task.chunkFootprint.clone(),
            planetLocations: planets,
        };

        Ok(result)
    }

    fn complete(
        self,
        mut cx: TaskContext,
        result: Result<Self::Output, Self::Error>,
    ) -> JsResult<Self::JsEvent> {
        Ok(neon_serde::to_value(&mut cx, &result.unwrap())?)
    }
}

fn explore(mut cx: FunctionContext) -> JsResult<JsValue> {
    let arg0 = cx.argument::<JsValue>(0)?;

    let task: ExploreTask = neon_serde::from_value(&mut cx, arg0)?;

    let x = task.chunkFootprint.bottomLeft.x;
    let y = task.chunkFootprint.bottomLeft.y;
    let size = task.chunkFootprint.sideLength;

    let threshold = MimcState::rarity(task.planetRarity);

    let planets = iproduct!(x..(x + size), y..(y + size))
        .par_bridge()
        .filter_map(|(xi, yi)| {
            let hash = MimcState::sponge(&[xi, yi], 220);
            if hash < threshold {
                Some(Planet {
                    coords: Coords { x: xi, y: yi },
                    hash: hash.to_string(),
                })
            } else {
                None
            }
        })
        .collect::<Vec<Planet>>();

    let result = ExploreResponse {
        chunkFootprint: task.chunkFootprint.clone(),
        planetLocations: planets,
    };

    Ok(neon_serde::to_value(&mut cx, &result)?)
}

fn explore_async(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let arg0 = cx.argument::<JsValue>(0)?;
    let cb = cx.argument::<JsFunction>(1)?;

    let task: ExploreTask = neon_serde::from_value(&mut cx, arg0)?;
    let func = Explorer { task: task };

    func.schedule(cb);

    Ok(cx.undefined())
}

register_module!(mut cx, {
    cx.export_function("explore", explore)?;
    cx.export_function("explore_async", explore_async)?;
    Ok(())
});
