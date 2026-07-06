import { NativeModules } from 'react-native';

const { CardConv } = NativeModules;

interface CardConvModule {
  convertSID: (sid: string) => Promise<string>;
  convertKonamiID: (konamiID: string) => Promise<string>;
}

export default CardConv as CardConvModule;
