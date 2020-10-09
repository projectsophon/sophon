import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  ModalPane,
  ModalHook,
  ModalName,
  ModalPlanetDexIcon,
} from './ModalPane';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { Planet, PlanetResource } from '../../_types/global/GlobalTypes';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import { Sub, Space } from '../../components/Text';
import {
  getPlanetShortHash,
  formatNumber,
  getPlanetRank,
} from '../../utils/Utils';
import dfstyles from '../../styles/dfstyles.bs.js';
import { getPlanetName, getPlanetColors } from '../../utils/ProcgenUtils';
import _ from 'lodash';
import { SelectedContext, AccountContext } from '../GameWindow';
import { SilverIcon, RankIcon } from '../Icons';
import { calculateRankAndScore } from './LeaderboardPane';

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

export function PlanetThumb({ planet }: { planet: Planet }) {
  const radius = 5 + 3 * planet.planetLevel;
  // const radius = 5 + 3 * PlanetLevel.MAX;
  const { baseColor, backgroundColor } = getPlanetColors(planet);

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
  score,
  rank,
}: {
  planet: Planet;
  className: string;
  score: number;
}) {
  let energyStyle = planet.energy === planet.energyCap ? { color: 'red' } : {};
  let silverStyle = planet.silver === planet.silverCap ? { color: 'red' } : {};
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
}) {
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

export function PlanetDexPane({
  hook,
  small,
}: {
  small?: boolean;
  hook: ModalHook;
}) {
  const [visible, _setVisible] = hook;
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

  return (
    <ModalPane hook={hook} title='Planet Dex' name={ModalName.PlanetDex}>
      {visible ? <PlayerInfoWrapper>
        <PlayerInfoRow />
      </PlayerInfoWrapper> : null}
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
