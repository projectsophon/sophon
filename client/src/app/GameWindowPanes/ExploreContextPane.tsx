import React, { useContext, useEffect, useState } from 'react';
import { ContextPane } from '../GameWindowComponents/ContextMenu';
import { ContextMenuType } from '../GameWindow';
import { Sub, White, Blue } from '../../components/Text';
import styled from 'styled-components';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import WindowManager, {
  CursorState,
  TooltipName,
  WindowManagerEvent,
} from '../../utils/WindowManager';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { MIN_CHUNK_SIZE } from '../../utils/constants';
import { WorldCoords } from '../../utils/Coordinates';
import { SpiralPattern } from '../../utils/MiningPatterns';
import { TargetIcon, PauseIcon, PlayIcon } from '../Icons';
import { IconButton } from './ModalPane';
import { TooltipTrigger } from './Tooltip';
import dfstyles from '../../styles/dfstyles.bs.js';

const StyledExploreContextPane = styled.div`
  width: 18.5em;

  & p:last-child {
    margin-top: 0.5em;
  }

  .fill-target {
    background: ${dfstyles.colors.text};
    & path {
      fill: ${dfstyles.colors.background};
    }
    color: ${dfstyles.colors.background};
  }
`;

export function ExploreContextPane() {
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const windowManager = WindowManager.getInstance();
  const uiEmitter = UIEmitter.getInstance();

  const doTarget = (_e) => {
    if (windowManager.getCursorState() === CursorState.TargetingExplorer)
      windowManager.setCursorState(CursorState.Normal);
    else windowManager.setCursorState(CursorState.TargetingExplorer);
  };

  const [whichExplorer, setWhichExplorer] = useState(null);

  useEffect(() => {
    const doMouseDown = (worldCoords) => {
      if (windowManager.getCursorState() === CursorState.TargetingExplorer) {
        windowManager.acceptInputForTarget(worldCoords);
        setWhichExplorer(null);
      }
    };

    const updatePattern = (worldCoords: WorldCoords) => {
      const newpattern = new SpiralPattern(worldCoords, MIN_CHUNK_SIZE);
      uiManager?.setMiningPattern(newpattern, whichExplorer);
    };

    uiEmitter.on(UIEmitterEvent.WorldMouseDown, doMouseDown);
    windowManager.on(WindowManagerEvent.MiningCoordsUpdate, updatePattern);
    return () => {
      uiEmitter.removeListener(UIEmitterEvent.WorldMouseDown, doMouseDown);
      windowManager.removeListener(
        WindowManagerEvent.MiningCoordsUpdate,
        updatePattern
      );
    };
  }, [uiEmitter, windowManager, uiManager, whichExplorer]);

  const [hashRates, setHashRates] = useState([]);
  useEffect(() => {
    if (!uiManager) return;
    const updateHashes = () => {
      setHashRates(uiManager.getHashesPerSec());
    };

    const intervalId = setInterval(updateHashes, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [uiManager]);

  const getHashes = (rate = 0) => {
    return rate.toFixed(0)
  };

  const [explorers, setExplorers] = useState([]);
  useEffect(() => {
    if (!uiManager) return;

    const e = uiManager.getExplorers();
    if (e) {
      setExplorers(Array.from(e.entries()));
    }
  }, [uiManager])

  return (
    <ContextPane name={ContextMenuType.None} title='Explore'>
      <StyledExploreContextPane>
        <Sub>
          <p>
            Move your explorer anywhere to explore that part of the universe.
            <br />
            It will continue to explore as long as you leave this tab open.
          </p>
          {explorers.map(([ip, explorer]) => {
            // TODO: Refactor into component
            const hashRate = hashRates.filter(([key]) => key === ip)?.[0]?.[1];
            const moveHandler = () => {
              setWhichExplorer(ip);
              doTarget();
            };
            let className = '';
            if (windowManager.getCursorState() === CursorState.TargetingExplorer && whichExplorer === ip) {
              className = 'fill-target';
            }
            return (
              <p key={ip}>
                <TooltipTrigger
                  needsShift
                  name={TooltipName.MiningTarget}
                  style={{ height: '1.5em', marginRight: '1em', display: 'inline-block' }}
                  className={className}>
                  <span onClick={moveHandler}>
                    <IconButton> <TargetIcon /> </IconButton>
                  </span>
                </TooltipTrigger>
                <Blue>{ip.replace('http://', '')}</Blue>: <White>{getHashes(hashRate)}</White> hashes/sec{' '}
              </p>
            );
          })}
        </Sub>
      </StyledExploreContextPane>
    </ContextPane>
  );
}
