import React, { useContext, useState } from 'react';

import { ContextMenu } from './GameWindowComponents/ContextMenu';
import ControllableCanvas from './board/ControllableCanvas';

import {
  Sidebar,
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
  PlayerInfoPane,
  HelpPane,
  LeaderboardPane,
  PlanetDexPane,
  UpgradeDetailsPane,
  TwitterVerifyPane,
  TwitterBroadcastPane,
  ZoomPane,
} from './GameWindowPanes/GameWindowPanes';

import {
  ModalHelpIcon,
  ModalLeaderboardIcon,
  ModalSettingsIcon,
  ModalPlanetDexIcon,
  ModalTwitterVerifyIcon,
} from './GameWindowPanes/ModalPane';
import { ExploreContextPane } from './GameWindowPanes/ExploreContextPane';
import { PlanetContextPane } from './GameWindowPanes/PlanetContextPane';
import { TutorialPane } from './GameWindowPanes/TutorialPane';
import { HatPane } from './GameWindowPanes/HatPane';
import { NotificationsPane } from './Notifications';
import { SettingsPane } from './GameWindowPanes/SettingsPane';
import OnboardingPane from './GameWindowPanes/OnboardingPane';
import { useStoredUIState, UIDataKey } from '../api/UIStateStorageManager';
import GameUIManager from './board/GameUIManager';
import GameUIManagerContext from './board/GameUIManagerContext';
import { PrivatePane } from './GameWindowPanes/PrivatePane';

export function GameWindowLayout() {
  const planetDetailsHook = useState<boolean>(false);
  const helpHook = useState<boolean>(false);
  const leaderboardHook = useState<boolean>(false);
  const planetDexHook = useState<boolean>(false);
  const upgradeDetailsHook = useState<boolean>(false);
  const twitterVerifyHook = useState<boolean>(false);
  const twitterBroadcastHook = useState<boolean>(false);
  const hatHook = useState<boolean>(false);
  const settingsHook = useState<boolean>(false);

  const privateHook = useState<boolean>(false);

  const uiManager = useContext<GameUIManager | null>(GameUIManagerContext);
  const newPlayerHook = useStoredUIState<boolean>(
    UIDataKey.newPlayer,
    uiManager
  );

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
        <HelpPane hook={helpHook} />
        <LeaderboardPane hook={leaderboardHook} />
        <PlanetDexPane hook={planetDexHook} />
        <UpgradeDetailsPane hook={upgradeDetailsHook} />
        <TwitterVerifyPane hook={twitterVerifyHook} />
        <TwitterBroadcastPane hook={twitterBroadcastHook} />
        <HatPane hook={hatHook} />
        <SettingsPane hook={settingsHook} privateHook={privateHook} />
        <PrivatePane hook={privateHook} />
        {/* <PlayerInfoPane hook={} /> */}
      </>

      <OnboardingPane newPlayerHook={newPlayerHook} />

      <MainWindow>
        {/* canvas and stuff */}
        <CanvasContainer>
          <UpperLeft>
            <MenuBar>
              <ModalTwitterVerifyIcon hook={twitterVerifyHook} />
              <ModalHelpIcon hook={helpHook} />
              <ModalLeaderboardIcon hook={leaderboardHook} />
              <ModalPlanetDexIcon hook={planetDexHook} />
              <ModalSettingsIcon hook={settingsHook} />
            </MenuBar>
            <ZoomPane />
          </UpperLeft>
          <TutorialPane newPlayerHook={newPlayerHook} />

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
