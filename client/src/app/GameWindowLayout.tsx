import React, { useContext, useState } from 'react';

import { ContextMenu } from './GameWindowComponents/ContextMenu';
import ControllableCanvas from './board/ControllableCanvas';

import {
  CanvasContainer,
  CanvasWrapper,
  MainWindow,
  MenuBar,
  WindowWrapper,
  LHSWrapper,
  UpperLeft,
} from './GameWindowComponents/GameWindowComponents';

import {
  Tooltip,
  CoordsPane,
  PlanetDetailsPane,
  LeaderboardPane,
  PlanetDexPane,
  EnergyDexPane,
  UpgradeDetailsPane,
  TwitterVerifyPane,
  TwitterBroadcastPane,
  ZoomPane,
} from './GameWindowPanes/GameWindowPanes';

import {
  ModalLeaderboardIcon,
  ModalSettingsIcon,
  ModalPlanetDexIcon,
  ModalEnergyDexIcon,
  ModalTwitterVerifyIcon,
} from './GameWindowPanes/ModalPane';
import { ExploreContextPane } from './GameWindowPanes/ExploreContextPane';
import { PlanetContextPane } from './GameWindowPanes/PlanetContextPane';
import { HatPane } from './GameWindowPanes/HatPane';
import { NotificationsPane } from './Notifications';
import { SettingsPane } from './GameWindowPanes/SettingsPane';
import GameUIManager from './board/GameUIManager';
import GameUIManagerContext from './board/GameUIManagerContext';
import { PrivatePane } from './GameWindowPanes/PrivatePane';

export function GameWindowLayout() {
  const planetDetailsHook = useState<boolean>(false);
  const leaderboardHook = useState<boolean>(false);
  const planetDexHook = useState<boolean>(false);
  const energyDexHook = useState<boolean>(false);
  const upgradeDetailsHook = useState<boolean>(false);
  const twitterVerifyHook = useState<boolean>(false);
  const twitterBroadcastHook = useState<boolean>(false);
  const hatHook = useState<boolean>(false);
  const settingsHook = useState<boolean>(false);

  const privateHook = useState<boolean>(false);

  return (
    <WindowWrapper>
      <Tooltip />

      {/* modals (fragment is purely semantic) */}
      <>
        <PlanetDetailsPane
          hook={planetDetailsHook}
          broadcastHook={twitterBroadcastHook}
          upgradeDetHook={upgradeDetailsHook}
          hatHook={hatHook}
        />
        <LeaderboardPane hook={leaderboardHook} />
        <PlanetDexPane hook={planetDexHook} />
        <EnergyDexPane hook={energyDexHook} />
        <UpgradeDetailsPane hook={upgradeDetailsHook} />
        <TwitterVerifyPane hook={twitterVerifyHook} />
        <TwitterBroadcastPane hook={twitterBroadcastHook} />
        <HatPane hook={hatHook} />
        <SettingsPane hook={settingsHook} privateHook={privateHook} />
        <PrivatePane hook={privateHook} />
      </>

      <MainWindow>
        {/* canvas and stuff */}
        <CanvasContainer>
          <UpperLeft>
            <MenuBar>
              <ModalTwitterVerifyIcon hook={twitterVerifyHook} />
              <ModalLeaderboardIcon hook={leaderboardHook} />
              <ModalPlanetDexIcon hook={planetDexHook} />
              <ModalEnergyDexIcon hook={energyDexHook} />
              <ModalSettingsIcon hook={settingsHook} />
            </MenuBar>
            <ZoomPane />
          </UpperLeft>

          <NotificationsPane />

          <CanvasWrapper>
            <ControllableCanvas />
          </CanvasWrapper>

          <CoordsPane />

          <LHSWrapper>
            <ContextMenu>
              <ExploreContextPane />
              <PlanetContextPane hook={planetDetailsHook} upgradeDetHook={upgradeDetailsHook} />
            </ContextMenu>
          </LHSWrapper>
        </CanvasContainer>
      </MainWindow>
    </WindowWrapper>
  );
}
