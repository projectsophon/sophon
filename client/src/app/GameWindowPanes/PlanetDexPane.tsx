import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  ModalPane,
  ModalHook,
  ModalName,
  IconButton,
} from './ModalPane';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { Planet, PlanetResource, UpgradeBranchName } from '../../_types/global/GlobalTypes';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import { Sub, Space } from '../../components/Text';
import {
  getPlanetShortHash,
  formatNumber,
  getPlanetRank,
  planetCanUpgrade,
} from '../../utils/Utils';
import dfstyles from '../../styles/dfstyles.bs.js';
import { getPlanetName, getPlanetCosmetic } from '../../utils/ProcgenUtils';
import { SelectedContext, AccountContext } from '../GameWindow';
import { SilverIcon, RankIcon } from '../Icons';
import { calculateRankAndScore } from './LeaderboardPane';
import { DefenseIcon, RangeIcon, SpeedIcon } from '../Icons';

const DexWrapper = styled.div`
  height: 12.2em; // exact size so a row is cut off
  overflow-y: scroll;
`;

const DexRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  height: 30px; // 5 + 3 * 7 + 4px

  & > span {
    &:nth-child(1) {
      width: 2em;
    }
    &:nth-child(2) {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
      align-items: center;
      width: 3em;
      position: relative; // for planetcircle
    }
    &:nth-child(3) {
      // short hash
      margin-right: 0.5em;
    }
    &:nth-child(4) {
      flex-grow: 1;
    }
    // planet level
    &:nth-child(5) {
      width: 3em;
      text-align: center;
    }
    // rank
    &:nth-child(6) {
      width: 3em;
      text-align: center;
    }
    // energy
    &:nth-child(7) {
      width: 6.5em;
    }
    // silver
    &:nth-child(8) {
      width: 6.5em;
    }
    // score
    // &:nth-child(9) {
    //   width: 7em;
    // }
  }

  &.title-row > span {
    color: ${dfstyles.colors.subtext};

    &.selected {
      text-decoration: underline;
      color: ${dfstyles.colors.text};
    }

    &:hover {
      text-decoration: underline;
      cursor: pointer;
    }

    &.selected {
      text-decoration: underline;
    }

    &:nth-child(1),
    &:nth-child(2) {
      text-decoration: none;
      pointer-events: none;
      &:hover {
        text-decoration: none;
      }
    }
  }

  &:hover:not(.title-row) {
    cursor: pointer;
    & > span:nth-child(3) {
      text-decoration: underline;
    }
  }

  &.selected {
    background: ${dfstyles.colors.backgroundlight};
    & > span:nth-child(2) span:last-child {
      text-decoration: underline;
    }
  }
`;
const _PlanetThumb = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  & > span {
    // these guys wrap the icons
    position: absolute;
    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
  }
`;

const ColorIcon = styled.span<{ color: string }>`
  path {
    fill: ${({ color }) => color} !important;
  }
`;

export function PlanetThumb({ planet }: { planet: Planet }): JSX.Element {
  const radius = 5 + 3 * planet.planetLevel;
  // const radius = 5 + 3 * PlanetLevel.MAX;
  const { baseColor, backgroundColor } = getPlanetCosmetic(planet);

  const ringW = radius * 1.5;
  const ringH = Math.max(2, ringW / 7);

  if (planet.planetResource === PlanetResource.SILVER) {
    return (
      <_PlanetThumb>
        <ColorIcon color={baseColor}>
          <SilverIcon />
        </ColorIcon>
      </_PlanetThumb>
    );
  }

  return (
    <_PlanetThumb>
      <span>
        <span
          style={{
            width: radius + 'px',
            height: radius + 'px',
            borderRadius: radius / 2 + 'px',
            background: baseColor,
          }}
        ></span>
      </span>
      <span>
        <span
          style={{
            width: ringW + 'px',
            height: ringH + 'px',
            borderRadius: ringW * 2 + 'px',
            background: getPlanetRank(planet) > 0 ? backgroundColor : 'none',
          }}
        ></span>
      </span>
    </_PlanetThumb>
  );
}

const getPlanetScore = (planet: Planet, rank: number) => {
  const baseScore = rank < 10 ? planet.energyCap : 0;
  const totalSilver = planet.silverSpent + planet.silver;
  return baseScore + totalSilver / 10;
};

const PlayerInfoWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  height: 30px; // 5 + 3 * 7 + 4px

  & > div > span:last-of-type {
    margin-left: 0.5em;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  height: 30px; // 5 + 3 * 7 + 4px

  > div {
    margin-right: 0.5em;
  }
`;


function isasteroid(planet) {
  return planet.planetResource === PlanetResource.SILVER;
}

//or in browser  
// function isasteroid(planet){
//   return planet.planetResource === 1;
// }


//this is currently shorter distance ascending to larger
function distance(from, to) {
  let fromloc = df.planetHelper.getLocationOfPlanet(from.locationId);
  let toloc = df.planetHelper.getLocationOfPlanet(to.locationId);
  return Math.sqrt((fromloc.coords.x - toloc.coords.x) ** 2 + (fromloc.coords.y - toloc.coords.y) ** 2);
}

//tuples of [planet,distance]
function distance_sort(a, b) {
  return b[1] - a[1];
}

//distribute_funds("0000589000f2b5ff2e7823c5fd51eba81e283d0fb4487d6d1d9ea4d5b22eae39", .5);
async function distribute_funds(locationid, energystaysabovepercent) {
  let asteroid = df.getPlanetWithId(locationid);
  if (asteroid == null || !isasteroid(asteroid)) {
    return null;
  }

  let candidates_ = df.getPlanetsInRange(asteroid.locationId, energystaysabovepercent * 100).filter(p => p.owner === df.account).filter(p => !isasteroid(p)).map(p => [p, distance(asteroid, p)]).sort(distance_sort);

  let i = 0;
  let budget = energystaysabovepercent * asteroid.energyCap;
  while (budget > 0 && i < candidates_.length) {
    //remember its a tuple of candidates and their distance
    let candidate = candidates_[i++][0];

    // console.log(candidate);
    // let location = df.planetHelper.getLocationOfPlanet(candidate.locationId);
    // console.log("candidate x: ", location.coords.x, ", y: ", location.coords.y);


    //check if has incoming moves from a previous asteroid to be safe
    const arrivals = await df.contractsAPI.getArrivalsForPlanet(candidate);
    let needed_silver = candidate.silverCap - candidate.silver;
    let effective = df.getEnergyNeededForMove(asteroid.locationId, candidate.locationId, 1);
    if (arrivals === 0 && needed_silver > 0 && budget - effective > 0) {
      // let from = df.planetHelper.getLocationOfPlanet(asteroid.locationId);
      // let to = df.planetHelper.getLocationOfPlanet(candidate.locationId);
      // console.log("transfering ", needed_silver, " from x: ", from.coords.x, ", y: ", from.coords.y, " to x: ", to.coords.x, ", y: ", to.coords.y, " at cost of ", effective);
      // console.log('df.move("' + asteroid.locationId + '","' + candidate.locationId + '",' + effective + ',' + needed_silver + ')');

      //df.move('0000a55400f620e5378bfd33d312b1e396b82bf75a331549dd6fe3244937a0e9', '000060e40034c34995e1bdbc9d658d1697c482935da1e836f7cf0c4b0d8a4888', 1199, 1000)

      //df.move(asteroid.locationId, candidate.locationId, effective, needed_silver);
      budget -= effective;
    }
  }
}

//silverhasabovepercent so you dont bother grabbing like 1 silver from a million miles away, let it build up to say 20 percent
//im assuming taking input as floats distribute_funds_global(.5,.5);
async function distribute_funds_global(silverhasabovepercent, energystaysabovepercent) {
  let asteroids = df.getMyPlanets().filter(isasteroid).filter(a => (a.energy > energystaysabovepercent * a.energyCap) && (a.silver > silverhasabovepercent * a.silverCap));
  // console.log(asteroids);
  for (const a of asteroids) {
    console.log(a)
    let location = df.planetHelper.getLocationOfPlanet(a.locationId);
    console.log("asteroid x: ", location.coords.x, ", y: ", location.coords.y);

    await distribute_funds(a.locationId, energystaysabovepercent);
  }
}





const PlayerInfoRow = () => {
  const account = useContext<EthAddress | null>(AccountContext);
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const players = uiManager.getAllPlayers();
  const planets = uiManager.getAllOwnedPlanets();
  const [rank, score] = calculateRankAndScore(
    players,
    planets,
    account
  );

  return (
    <>
      <div>
        <span>Total Energy</span>
        <Sub>:</Sub>
        <span>
          {account && uiManager
            ? formatNumber(uiManager.getEnergyOfPlayer(account))
            : '...'}
        </span>
      </div>
      <div>
        <span>Total Silver</span>
        <Sub>:</Sub>
        <span>
          {account && uiManager
            ? formatNumber(uiManager.getSilverOfPlayer(account))
            : '...'}
        </span>
      </div>
      <div>
        <span>Score</span>
        <Sub>:</Sub>
        <span>{Math.floor(score)}</span>
      </div>
      <div>
        <span>Rank</span>
        <Sub>:</Sub>
        <span>{rank}</span>
      </div>
    </>
  );
};

function DexEntry({
  planet,
  className,
  score: _score,
  rank,
}: {
  planet: Planet;
  className: string;
  score: number;
  rank: number,
}) {
  const energyStyle = planet.energy === planet.energyCap ? { color: 'red' } : {};
  const silverStyle = planet.silver === planet.silverCap ? { color: 'red' } : {};
  return (
    <PlanetLink planet={planet}>
      <DexRow className={className}>
        <span>
          {rank}.
        </span>
        <span>
          <PlanetThumb planet={planet} />
        </span>
        <span>
          <Sub>{getPlanetShortHash(planet)}</Sub>
        </span>
        <span>
          <span>{getPlanetName(planet)}</span>
        </span>
        <span>
          <Sub>lv</Sub> {planet.planetLevel}
        </span>
        <span><RankIcon planet={planet} /></span>
        <span style={energyStyle}>
          {formatNumber(planet.energy)}<Sub>/</Sub>{formatNumber(planet.energyCap)}
        </span>
        <span style={silverStyle}>
          {formatNumber(planet.silver)}<Sub>/</Sub>{formatNumber(planet.silverCap)}
        </span>
        {/* <span>
          {formatNumber(score)}
          <Sub> pts</Sub>
        </span> */}
      </DexRow>
    </PlanetLink>
  );
}

export function PlanetLink({
  planet,
  children,
}: {
  planet: Planet;
  children: React.ReactNode;
}): JSX.Element {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const uiEmitter = UIEmitter.getInstance();

  return (
    <span
      onClick={() => {
        uiManager?.setSelectedPlanet(planet);
        uiEmitter.emit(UIEmitterEvent.CenterPlanet, planet);
      }}
    >
      {children}
    </span>
  );
}

enum Columns {
  Name = 0,
  Level = 1,
  Energy = 2,
  Silver = 3,
  Points = 4,
}

export function PlanetDexPane({ hook }: { hook: ModalHook; }): JSX.Element {
  const [visible] = hook;
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const selected = useContext<Planet | null>(SelectedContext);

  const [sortBy, setSortBy] = useState<Columns>(Columns.Points);

  const scoreFn = (a: [Planet, number], b: [Planet, number]): number => {
    const [scoreA, scoreB] = [getPlanetScore(...a), getPlanetScore(...b)];
    return scoreB - scoreA;
  };

  const nameFn = (a: [Planet, number], b: [Planet, number]): number => {
    const [nameA, nameB] = [getPlanetName(a[0]), getPlanetName(b[0])];
    return nameA.localeCompare(nameB);
  };

  const energyFn = (a: [Planet, number], b: [Planet, number]): number => {
    return b[0].energy - a[0].energy;
  };

  const silverFn = (a: [Planet, number], b: [Planet, number]): number => {
    return b[0].silver - a[0].silver;
  };

  const levelFn = (a: [Planet, number], b: [Planet, number]): number => {
    return b[0].planetLevel - a[0].planetLevel;
  };

  const sortingFn = (a: [Planet, number], b: [Planet, number]): number => {
    const [scoreA, scoreB] = [getPlanetScore(...a), getPlanetScore(...b)];
    const myFn = [nameFn, levelFn, energyFn, silverFn, scoreFn][sortBy];
    if (scoreA !== scoreB) return myFn(a, b);

    if (!uiManager) return 0;
    const locA = uiManager.getLocationOfPlanet(a[0].locationId);
    const locB = uiManager.getLocationOfPlanet(a[0].locationId);
    if (!locA || !locB) return 0;
    const { x: xA, y: yA } = locA.coords;
    const { x: xB, y: yB } = locB.coords;

    if (xA !== xB) return xA - xB;
    return yA - yB;
  };

  const [planets, setPlanets] = useState<Planet[]>([]);

  // update planet list on open
  useEffect(() => {
    if (!visible) return;
    if (!uiManager) return;
    const myAddr = uiManager.getAccount();
    if (!myAddr) return;
    const ownedPlanets = uiManager
      .getAllOwnedPlanets()
      .filter((planet) => planet.owner === myAddr);
    setPlanets(ownedPlanets);
  }, [visible, uiManager]);

  const getUpgradeSilverNeeded = (planet) => {
    if (!planet) return 0;
    const totalLevel = planet.upgradeState.reduce((a, b) => a + b);
    const totalNeeded = Math.floor((totalLevel + 1) * 0.2 * planet.silverCap);
    return totalNeeded;
  };

  const [autoUpgradeBranch, setAutoUpgradeBranch] = useState(null);

  useEffect(() => {
    if (!uiManager || autoUpgradeBranch == null) return;

    planets
      .filter(planet => {
        if (
          planetCanUpgrade(planet) &&
          planet.silver >= getUpgradeSilverNeeded(planet) &&
          planet.unconfirmedUpgrades?.length > 0
        ) {
          // 3 (a.ka. 4) is the max level an upgrade can be
          if (planet.upgradeState[autoUpgradeBranch] < 3) {
            return true;
          } else {
            console.log(`AutoUpgrade: Can't upgrade past level 4, try a different stat`);
            return false;
          }
        }
        return false
      })
      .forEach(planet => uiManager.upgrade(planet, autoUpgradeBranch));

    setAutoUpgradeBranch(null);
  }, [autoUpgradeBranch, planets, uiManager])

  return (
    <ModalPane hook={hook} title='Planet Dex' name={ModalName.PlanetDex}>
      {visible ? <PlayerInfoWrapper>
        <PlayerInfoRow />
      </PlayerInfoWrapper> : null}
      <ButtonRow>
        <div>Upgrade All</div>
        <IconButton onClick={() => setAutoUpgradeBranch(UpgradeBranchName.Defense)}>
          <DefenseIcon />
        </IconButton>
        <IconButton onClick={() => setAutoUpgradeBranch(UpgradeBranchName.Range)}>
          <RangeIcon />
        </IconButton>
        <IconButton onClick={() => setAutoUpgradeBranch(UpgradeBranchName.Speed)}>
          <SpeedIcon />
        </IconButton>
      </ButtonRow>
      <DexWrapper>
        <DexRow className='title-row'>
          <span>#</span>
          <span></span> {/* empty icon cell */}
          <span>
            <Space length={5} />
          </span>{' '}
          {/* empty icon cell */}
          <span
            className={sortBy === Columns.Name ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Name)}
          >
            Planet Name
          </span>
          <span
            className={sortBy === Columns.Level ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Level)}
          >
            Level
          </span>
          <span>
            Rank
          </span>
          <span
            className={sortBy === Columns.Energy ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Energy)}
          >
            Energy
          </span>
          <span
            className={sortBy === Columns.Silver ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Silver)}
          >
            Silver
          </span>
          {/* <span
            className={sortBy === Columns.Points ? 'selected' : ''}
            onClick={() => setSortBy(Columns.Points)}
          >
            Points
          </span> */}
        </DexRow>
        {visible && planets
          .sort((a, b) => b.energyCap - a.energyCap)
          .map((planet, i) => [planet, i]) // pass the index
          .sort(sortingFn) // sort using planet + index
          .map(([planet, i]: [Planet, number], rank) => (
            <DexEntry
              key={i}
              planet={planet}
              // score={getPlanetScore(planet, i)}
              rank={rank + 1}
              className={
                selected?.locationId === planet.locationId ? 'selected' : ''
              }
            />
          ))}
      </DexWrapper>
    </ModalPane>
  );
}
