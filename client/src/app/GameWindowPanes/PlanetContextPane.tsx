import React, { useContext, useEffect, useState } from 'react';
import {
  ContextMenuType,
  SelectedContext,
  SelectedStatContext,
} from '../GameWindow';
import { ContextPane } from '../GameWindowComponents/ContextMenu';
import styled, { css } from 'styled-components';
import { Sub, Green, White } from '../../components/Text';

import {
  EthAddress, Bonus, StatIdx,

  Planet
} from '../../_types/global/GlobalTypes';
import GameUIManager from '../board/GameUIManager';
import GameUIManagerContext from '../board/GameUIManagerContext';
import { getPlanetName } from '../../utils/ProcgenUtils';
import {
  formatNumber,
  getFormatProp,
  getPlanetShortHash,
  getPlayerShortHash,
  PlanetStatsInfo,
  planetCanUpgrade,
} from '../../utils/Utils';
import { emptyAddress } from '../../utils/CheckedTypeUtils';
import dfstyles from '../../styles/dfstyles.bs.js';

import {
  DefenseIcon,
  EnergyGrowthIcon,
  EnergyIcon,
  RangeIcon,
  UpgradeIcon,
  SpeedIcon,
  SilverIcon
} from '../Icons';
import { ModalHook, ModalPlanetDetailsIcon, ModalUpgradeDetailsIcon } from './ModalPane';
import _ from 'lodash';
import { Sub } from '../../components/Text';
import { PlanetPreview } from './PlanetPreview';
import WindowManager, {
  CursorState,
  TooltipName,
} from '../../utils/WindowManager';
import UIEmitter, { UIEmitterEvent } from '../../utils/UIEmitter';
import { TooltipTrigger } from './GameWindowPanes';

const StyledPlanetContextPane = styled.div`
  width: 20em;
`;

const StyledPlanetInfo = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  // stats
  & > div:last-child {
    margin-left: 2em;
    flex-grow: 1;
    // stat row
    & > div {
      display: flex;
      flex-direction: row;
      justify-content: space-between;

      // icons
      & > span:first-child {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      & > span:last-child {
        flex-grow: 1;
        text-align: right;
      }
    }
  }
`;

const StyledFleets = styled.div<{ visible: boolean }>`
  display: ${({ visible }) => (visible ? 'block' : 'none')};

  & > p:first-child {
    color: ${dfstyles.colors.subtext};
    text-decoration: underline;
  }

  & > div.statselect {
    width: 100%;
    margin-top: 1em;

    & > div {
      width: 100%;
    }

    & > div:last-child {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;

      & > p:first-child {
        flex-grow: 1;
      }

      // spinner
      & > span:last-child {
        margin-left: 0.6em;
      }
    }
  }

  // fleet button
  & > div:last-child {
    margin-top: 1em;
    padding: 0.2em 0;
    text-align: center;

    border: 1px solid ${dfstyles.colors.text};
    border-radius: 2px;

    transition: color 0.2s, background 0.2s;

    &:hover,
    &.fill-send {
      color: ${dfstyles.colors.background};
      background: ${dfstyles.colors.text};
      cursor: pointer;
    }
  }
`;

const StyledIconSelector = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  & span.select {
    path {
      fill: white;
    }
  }

  & span.noselect {
    path {
      fill: gray;
    }
  }

  & span:hover {
    cursor: pointer;

    & path {
      fill: ${dfstyles.colors.dfblue};
    }
  }
`;

type NumberHook = [number, (arg: number | ((n: number) => number)) => void];

const TimesTwo = () => (
  <TooltipTrigger name={TooltipName.Bonus}>
    <Green>x2</Green>
  </TooltipTrigger>
);

export function EnergyIconSelector({
  icon,
  hook,
}: {
  icon: React.ReactNode;
  hook: NumberHook;
}) {
  const [percent, setPercent] = hook;
  return (
    <StyledIconSelector>
      {_.range(1, 11).map((i) => (
        <span
          key={i}
          onClick={() => setPercent(i * 10)}
          className={percent >= i * 10 ? 'select' : 'noselect'}
        >
          {icon}
        </span>
      ))}
    </StyledIconSelector>
  );
}

export function SilverIconSelector({
  icon,
  hook,
}: {
  icon: React.ReactNode;
  hook: NumberHook;
}) {
  const [percent, setPercent] = hook;
  return (
    <StyledIconSelector>
      {_.range(0, 11).map((i) => (
        <span
          key={i}
          onClick={() => setPercent(i * 10)}
          className={percent >= i * 10 ? 'select' : 'noselect'}
        >
          {i > 0 ? icon : <span style={{ width: '0.5em', marginLeft: '0.5em', display: 'inline-block', position: 'relative', fontWeight: 'bold' }}>X</span>}
        </span>
      ))}
    </StyledIconSelector>
  );
}

const defaultTransform = css`scale(2, 0.8)`;

const StyledSpinner = styled.span`
  display: inline-flex;
  flex-direction: row;
  height: 1.5em;

  position: relative;
  right: -4px;

  ${dfstyles.prefabs.noselect};

  & > span {
    background: ${dfstyles.colors.text};
    border-radius: 2px;
    text-align: center;
    color: ${dfstyles.colors.background};
    display: inline-block;
    width: 1em;

    &:hover {
      cursor: pointer;
      background: ${dfstyles.colors.subtext};
    }
  }
`;

const Percent = styled.p`
  width: 2.5em;
  text-align: center;
`;

export function Spinner({ hook, children }: { hook: NumberHook }) {
  const [, setPercent] = hook;

  return (
    <StyledSpinner>
      <span onClick={() => setPercent((x) => Math.max(x - 1, 0))}>
        <span>{'<'}</span>
      </span>
      {children}
      <span onClick={() => setPercent((x) => Math.min(x + 1, 100))}>
        <span>{'>'}</span>
      </span>
    </StyledSpinner>
  );
}

const SectionButtons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 0.5em 0;
`;

const StyledUpgradeButton = styled.div<{ active: boolean }>`
  min-width: 72.5px;
  border-radius: 2px;
  border: 1px solid ${dfstyles.colors.subtext};
  padding: 0.2em;

  text-align: center;

  &:hover {
    cursor: pointer;
    border: 1px solid ${dfstyles.colors.text};
  }

  background: ${({ active }) => (active ? dfstyles.colors.text : 'none')};

  &,
  & span {
    ${({ active }) =>
    active && `color: ${dfstyles.colors.background} !important`};
  }

  & svg path {
    ${({ active }) => active && `fill: ${dfstyles.colors.background} !important`}
  }

  & p > span {
    vertical-align: middle;
  }

  &.disabled {
    border: 1px solid ${dfstyles.colors.subtext} !important;
    &,
    & span {
      color: ${dfstyles.colors.subtext} !important;
      cursor: auto !important;
    }
  }
`;

const ManualInput = styled.input`
  transition: background 0.2s, color 0.2s, width: 0.2s !important;
  outline: none;
  background: ${dfstyles.colors.background};
  color: ${dfstyles.colors.subtext};
  border-radius: 4px;
  border: 1px solid ${dfstyles.colors.text};
  margin-left: 0.75em;
  width: 6em;
  padding: 2px 6px;

  &:focus {
    background: ${dfstyles.colors.backgroundlight};
    color: ${dfstyles.colors.text};
  }
`;

function UpgradeButton({
  branch,
  hook,
  disabled,
  planet,
}: {
  branch: UpgradeBranchName;
  hook: BranchHook;
  disabled: boolean;
  planet: Planet | null;
}) {
  if (!planet) return <></>;

  const [myBranch, setBranch] = hook;
  let branchIcon;
  switch (branch) {
    case 0:
      branchIcon = <DefenseIcon />
      break;
    case 1:
      branchIcon = <RangeIcon />
      break;
    case 2:
      branchIcon = <SpeedIcon />
      break;
  }

  return (
    <StyledUpgradeButton
      onClick={() => disabled || setBranch(branch)}
      active={branch === myBranch}
      className={disabled ? 'disabled' : ''}
    >
      <p>
        <Sub>
          <White>{branchIcon}</White> (lv
          <White>{planet.upgradeState[branch]}</White>)
        </Sub>
      </p>
    </StyledUpgradeButton>
  );
}

const isPending = (selected): boolean => {
  if (!selected) return true;
  if (!selected.unconfirmedUpgrades) return false;
  return selected.unconfirmedUpgrades.length > 0;
};

const DEFAULT_ENERGY_PERCENT = 50;
const DEFAULT_SILVER_PERCENT = 100;

export function PlanetContextPane({ hook, upgradeDetHook }: { hook: ModalHook, upgradeDetHook: ModalHook }) {
  const [account, setAccount] = useState<EthAddress | null>(null);
  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const selected = useContext<Planet | null>(SelectedContext);

  const selectedStats = useContext<PlanetStatsInfo | null>(SelectedStatContext);

  const [visible] = hook;

  const windowManager = WindowManager.getInstance();

  const [bonus, setBonus] = useState<Bonus | null>(null);
  const branchHook = useState<UpgradeBranchName | null>(null);
  const [branch, _setBranch] = branchHook;

  useEffect(() => {
    if (!uiManager) return;
    setAccount(uiManager.getAccount());

    const uiEmitter = UIEmitter.getInstance();

    const onKeypress = (e) => {
      if (e.key === 'Escape') {
        setSending(false);
        windowManager.setCursorState(CursorState.Normal);
        uiEmitter.emit(UIEmitterEvent.SendCancelled);
      }
    };

    document.addEventListener('keydown', onKeypress);
    return () => {
      document.removeEventListener('keydown', onKeypress);
    };
  }, [uiManager]);

  const planetName = (): string => {
    if (!uiManager || !selected) return 'No planet selected.';

    const planetname = getPlanetName(selected);
    const shorthash = getPlanetShortHash(selected);
    const shortaddress = getPlayerShortHash(selected.owner);

    if (selected.owner === emptyAddress)
      return `Unclaimed ${shorthash} ${planetname}`;
    if (selected.owner === account) return `${shorthash} ${planetname}`;

    const twitter = uiManager.getTwitter(selected.owner);
    if (!twitter) return `${shortaddress}'s ${shorthash} ${planetname}`;
    else return `@${twitter}'s ${shorthash} ${planetname}`;
  };

  const energyHook = useState<number>(
    selected && uiManager
      ? uiManager.getForcesSending(selected.locationId)
      : DEFAULT_ENERGY_PERCENT
  );
  const [energyPercent, _setEnergyPercent] = energyHook;

  const silverHook = useState<number>(
    selected && uiManager
      ? uiManager.getForcesSending(selected.locationId)
      : DEFAULT_SILVER_PERCENT
  );
  const [silverPercent, setSilverPercent] = silverHook;

  const getEnergy = () =>
    selectedStats
      ? formatNumber((energyPercent / 100) * selectedStats.energy)
      : '0';

  const getSilver = () =>
    selectedStats
      ? formatNumber((silverPercent / 100) * selectedStats.silver)
      : '0';

  const [inputValue, setInputValue] = useState(null);

  const manualChange = (evt) => {
    const { value } = evt.target;
    setInputValue(value);
  };

  useEffect(() => {
    if (selectedStats && inputValue) {
      let f = parseFloat(inputValue.replace(/[kK]$/, ''));
      if (Number.isNaN(f) || inputValue.endsWith('.')) {
        return;
      }

      if (/[kK]$/.test(inputValue)) {
        f *= 1000;
      }
      const percent = f / selectedStats.silver * 100;
      if (percent > 0 && percent <= 100) {
        setSilverPercent(percent);
        setInputValue(null);
      }
    }
  }, [inputValue, selectedStats]);

  const getUpgradeSilver = () => {
    if (!selected || !uiManager) return 0;
    return selected.silver;
  };

  const getUpgradeSilverNeeded = () => {
    if (!selected || !uiManager) return 0;
    const totalLevel = selected.upgradeState.reduce((a, b) => a + b);
    const totalNeeded = Math.floor((totalLevel + 1) * 0.2 * selected.silverCap);
    return totalNeeded;
  };

  /*
  useEffect(() => {
    console.log('updating percent values');
    console.log(selected);
    if (!uiManager) return;
    if (!selected) {
      setPopPercent(DEFAULT_POP_PERCENT);
      setSilverPercent(DEFAULT_SILVER_PERCENT);
    } else {
      setPopPercent(uiManager.getForcesSending(selected.locationId));
      setSilverPercent(uiManager.getSilverSending(selected.locationId));
    }
  }, [selected, uiManager, setPopPercent, setSilverPercent]);
  */

  useEffect(() => {
    if (!selected || !uiManager) return;

    uiManager.setForcesSending(selected.locationId, energyPercent);
    uiManager.setSilverSending(selected.locationId, silverPercent);
  }, [energyPercent, silverPercent, selected, uiManager]);

  const [sending, setSending] = useState<boolean>(false);
  const doSend = () => {
    if (!uiManager) return;

    const uiEmitter = UIEmitter.getInstance();

    if (windowManager.getCursorState() === CursorState.TargetingForces) {
      setSending(false);
      windowManager.setCursorState(CursorState.Normal);
      uiEmitter.emit(UIEmitterEvent.SendCancelled);
    } else {
      setSending(true);
      windowManager.setCursorState(CursorState.TargetingForces);
      uiEmitter.emit(UIEmitterEvent.SendInitiated, selected);
    }
  };

  useEffect(() => {
    const uiEmitter = UIEmitter.getInstance();
    setSending(false);
    windowManager.setCursorState(CursorState.Normal);
    uiEmitter.emit(UIEmitterEvent.SendCancelled);
  }, [visible, windowManager]);

  useEffect(() => {
    const uiEmitter = UIEmitter.getInstance();

    const onComplete = () => {
      setSending(false);
      windowManager.setCursorState(CursorState.Normal);
    };

    uiEmitter.on(UIEmitterEvent.SendCompleted, onComplete);

    return () => {
      uiEmitter.removeListener(UIEmitterEvent.SendCompleted, onComplete);
    };
  });

  const silver = getUpgradeSilver();
  const silverNeeded = getUpgradeSilverNeeded();
  const canUpgrade = planetCanUpgrade(selected);
  const isUpgradePending = isPending(selected);
  const isUpgradeDisabled = isUpgradePending || !canUpgrade || (silverNeeded && silver < silverNeeded);
  const doUpgrade = (_e) => {
    if (!canUpgrade || !uiManager || !selected || branch === null) return;
    uiManager.upgrade(selected, branch);
  };

  return (
    <ContextPane
      name={ContextMenuType.Planet}
      title={planetName()}
      headerItems={<><ModalPlanetDetailsIcon hook={hook} /><ModalUpgradeDetailsIcon hook={upgradeDetHook} /></>}
    >
      <StyledPlanetContextPane>
        <StyledPlanetInfo>
          <PlanetPreview selected={selected} />
          <div>

            <div>
              <span>
                <TooltipTrigger name={TooltipName.Energy} needsShift>
                  <EnergyIcon />
                </TooltipTrigger>
                {bonus && bonus[StatIdx.EnergyCap] && <TimesTwo />}
              </span>
              <span>
                {selected?.owner === emptyAddress && selected.energy > 0 ? (
                  <TooltipTrigger
                    name={TooltipName.Pirates}
                    display='inline-flex'
                  >
                    <span>{getFormatProp(selectedStats, 'energy')}</span>
                  </TooltipTrigger>
                ) : (
                    <>{getFormatProp(selectedStats, 'energy')}</>
                  )}{' '}
                <Sub>/</Sub> {getFormatProp(selected, 'energyCap')}
              </span>
            </div>

            <div>
              <span>
                <TooltipTrigger name={TooltipName.Silver} needsShift>
                  <SilverIcon />
                </TooltipTrigger>
              </span>
              <span>
                {getFormatProp(selectedStats, 'silver')} <Sub>/</Sub>{' '}
                {getFormatProp(selected, 'silverCap')}
              </span>
            </div>

            <div className='margin-top'>
              <span>
                <TooltipTrigger name={TooltipName.EnergyGrowth} needsShift>
                  <EnergyGrowthIcon />
                </TooltipTrigger>
                {bonus && bonus[StatIdx.EnergyGro] && <TimesTwo />}
              </span>
              <span>{getFormatProp(selected, 'energyGrowth')}</span>
            </div>

            <div>
              <span>
                <TooltipTrigger name={TooltipName.Range} needsShift>
                  <RangeIcon />
                </TooltipTrigger>
                {bonus && bonus[StatIdx.Range] && <TimesTwo />}
              </span>
              <span>{getFormatProp(selected, 'range')}</span>
            </div>



            <div>
              <span>
                <TooltipTrigger name={TooltipName.Speed} needsShift>
                  <SpeedIcon />
                </TooltipTrigger>
                {bonus && bonus[StatIdx.Speed] && <TimesTwo />}
              </span>
              <span>{getFormatProp(selected, 'speed')}</span>
            </div>

            <div>
              <span>
                <TooltipTrigger name={TooltipName.Defense} needsShift>
                  <DefenseIcon />
                </TooltipTrigger>
                {bonus && bonus[StatIdx.Defense] && <TimesTwo />}
              </span>
              <span>{getFormatProp(selected, 'defense')}</span>
            </div>

            <div>
              <span>
                <Sub><UpgradeIcon /></Sub>
              </span>
              <span>
                {canUpgrade
                  ? <> {formatNumber(silver)} <Sub>/</Sub>{' '} {formatNumber(silverNeeded)} </>
                  : 'N/A'}
              </span>
            </div>
          </div>
        </StyledPlanetInfo>

        <SectionButtons>
          <UpgradeButton branch={0} hook={branchHook} planet={selected} disabled={isUpgradeDisabled} />
          <UpgradeButton branch={1} hook={branchHook} planet={selected} disabled={isUpgradeDisabled} />
          <UpgradeButton branch={2} hook={branchHook} planet={selected} disabled={isUpgradeDisabled} />
          <StyledUpgradeButton
            className={isUpgradeDisabled ? 'disabled' : undefined}
            onClick={doUpgrade}
          >
            {isUpgradePending ? 'Pending' : canUpgrade ? 'Upgrade' : 'N/A'}
          </StyledUpgradeButton>
        </SectionButtons>

        <StyledFleets
          visible={selected !== null && selected.owner !== emptyAddress}
        >
          <p>Send Resources</p>
          <div className='statselect'>
            <EnergyIconSelector
              icon={<EnergyIcon />}
              hook={energyHook}
            ></EnergyIconSelector>
            <div>
              <p>
                <Sub>Sending {getEnergy()} energy</Sub>
              </p>
              <Spinner hook={energyHook}>
                <Percent>{energyPercent}%</Percent>
              </Spinner>
            </div>
          </div>
          {selected && selected.silver > 0 && (
            <div className='statselect'>
              <SilverIconSelector
                icon={<SilverIcon />}
                hook={silverHook}
              ></SilverIconSelector>
              <div>
                <p>
                  <Sub>Sending <ManualInput onChange={manualChange} value={inputValue || getSilver()} /> silver</Sub>
                </p>
                <Spinner hook={silverHook}>
                  <Percent>{Math.floor(silverPercent)}%</Percent>
                </Spinner>
              </div>
            </div>
          )}
          <div onClick={doSend} className={sending ? 'fill-send' : ''}>
            Send Resources
          </div>
        </StyledFleets>
      </StyledPlanetContextPane>
    </ContextPane >
  );
}
