import _ from 'lodash';
import { isBrave, isChrome, isFirefox } from '../utils/Utils';

export enum Incompatibility {
  NoIDB = 'no_idb',
  NotRopsten = 'not_ropsten',
  MobileOrTablet = 'mobile_or_tablet',
  UnsupportedBrowser = 'unsupported_browser',
  NotLoggedInOrEnabled = 'not_logged_in_or_enabled',
  UnexpectedError = 'unexpected_error',
}

const supportsIDB = () => {
  return 'indexedDB' in window;
};


const isSupportedBrowser = async () =>
  isChrome() || isFirefox() || (await isBrave());

type FeatureList = Partial<Record<Incompatibility, boolean>>;

const checkFeatures = async (): Promise<FeatureList> => {
  const incompats = {};

  try {
    incompats[
      Incompatibility.UnsupportedBrowser
    ] = !(await isSupportedBrowser());
    incompats[Incompatibility.NoIDB] = !supportsIDB();
    incompats[Incompatibility.MobileOrTablet] = false;
  } catch (e) {
    console.error(e);
    incompats[Incompatibility.UnexpectedError] = true;
  }

  return incompats;
};

export const unsupportedFeatures = async (): Promise<Incompatibility[]> => {
  const features = await checkFeatures();
  return _.keys(features).filter((f) => features[f]) as Incompatibility[];
};
