import React from 'react';
import EventEmitter from 'events';
import { getRandomActionId, planetCanUpgrade, getOwnerColor } from './Utils';
import {
  EthTxStatus,
  SubmittedTx,
  UnconfirmedTx,
  PlanetEventType,
} from '../_types/darkforest/api/ContractsAPITypes';
import { EthIcon, TargetIcon } from '../app/Icons';
import {
  CenterChunkLink,
  FAQ04Link,
  PlanetNameLink,
  TxLink,
} from '../components/Text';
import { ExploredChunkData, Planet } from '../_types/global/GlobalTypes';
import dfstyles from '../styles/dfstyles.bs.js';

export enum NotificationType {
  Tx,
  CanUpgrade,
  BalanceEmpty,
  BeingAttacked,
}

export type NotificationInfo = {
  type: NotificationType;
  message: React.ReactNode;
  icon: React.ReactNode;
  id: string;
  color?: string;
  txData?: UnconfirmedTx;
  txStatus?: EthTxStatus;
};

export enum NotificationManagerEvent {
  Notify = 'Notify',
}

const getNotifColor = (
  type: NotificationType,
  txStatus?: EthTxStatus
): string | undefined => {
  if (type === NotificationType.Tx) {
    if (txStatus === EthTxStatus.Init) return dfstyles.colors.dfblue;
    else if (txStatus === EthTxStatus.Submit) return dfstyles.colors.dfgreen;
    else if (txStatus === EthTxStatus.Confirm) return undefined;
    else if (txStatus === EthTxStatus.Fail) return dfstyles.colors.dfred;
  }
  return undefined;
};

class NotificationManager extends EventEmitter {
  static instance: NotificationManager;

  private constructor() {
    super();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }

    return NotificationManager.instance;
  }

  private getIcon(type: NotificationType) {
    if (type === NotificationType.Tx) return <EthIcon />;
    else return <span>!</span>;
  }

  notify(type: NotificationType, message: React.ReactNode): void {
    this.emit(NotificationManagerEvent.Notify, {
      type,
      message,
      id: getRandomActionId(),
      icon: this.getIcon(type),
      color: getNotifColor(type),
    });
  }

  notifyTx(
    txData: UnconfirmedTx,
    message: React.ReactNode,
    txStatus: EthTxStatus
  ): void {
    this.emit(NotificationManagerEvent.Notify, {
      type: NotificationType.Tx,
      message,
      id: txData.actionId,
      icon: this.getIcon(NotificationType.Tx),
      color: getNotifColor(NotificationType.Tx, txStatus),
      txData,
      txStatus,
    });
  }

  txInit(tx: UnconfirmedTx): void {
    this.notifyTx(
      tx,
      <span>Transaction {tx.actionId} initialized.</span>,
      EthTxStatus.Init
    );
  }

  txSubmit(tx: SubmittedTx): void {
    this.notifyTx(
      tx,
      <span>
        Transaction {tx.actionId} accepted by Ethereum.
        <br />
        <TxLink tx={tx} />
      </span>,
      EthTxStatus.Submit
    );
  }

  txConfirm(tx: SubmittedTx): void {
    this.notifyTx(
      tx,
      <span>
        Transaction {tx.actionId} confirmed.
        <br />
        Hash: <TxLink tx={tx} />
      </span>,
      EthTxStatus.Confirm
    );
  }

  unsubmittedTxFail(tx: UnconfirmedTx, e: Error): void {
    this.notifyTx(
      tx,
      <span>
        Transaction {tx.actionId} failed.
        <br />
        Reason: {e.message}
      </span>,
      EthTxStatus.Fail
    );
  }

  txRevert(tx: SubmittedTx): void {
    this.notifyTx(
      tx,
      <span>
        Transaction {tx.txHash.slice(0, 8)} reverted.
        <br />
        <TxLink tx={tx} />
      </span>,
      EthTxStatus.Fail
    );
  }

  planetCanUpgrade(planet: Planet): void {
    if (planetCanUpgrade(planet)) {
      this.notify(
        NotificationType.CanUpgrade,
        <span>
          Your planet <PlanetNameLink planet={planet} /> can upgrade! <br />
        </span>
      );
    }
  }

  beingAttacked(yourPlanet: Planet, attackingPlanet: Planet): void {
    const message = (
      <span>
        Your planet <PlanetNameLink planet={yourPlanet} /> is being attacked by <PlanetNameLink planet={attackingPlanet} />! <br />
      </span>
    );

    this.emit(NotificationManagerEvent.Notify, {
      type: NotificationType.BeingAttacked,
      message,
      id: getRandomActionId(),
      icon: <TargetIcon />,
      color: getOwnerColor(attackingPlanet),
    });
  }

  balanceEmpty(): void {
    this.notify(
      NotificationType.BalanceEmpty,
      <span>
        Your xDAI account is out of balance!
        <br />
        Click <FAQ04Link>here</FAQ04Link> to learn how to get more.
      </span>
    );
  }
}

export default NotificationManager;
