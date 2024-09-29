import { AddressType } from 'bitcoin-address-validation';
export interface ExtensionAuthProps {
    token: string;
    address: string;
    network: string;
    isSilent?: boolean;
  }

export interface AsignaExtensionProvider {
    request: (method: string) => Promise<{ result: { token: string } }>;
    isConnected: boolean;
}

export interface UTXO {
  txId: string;
  outputIndex: number;
  satoshis: number;
  scriptPk?: string;
  addressType: AddressType;
  inscriptions?: {
    id: string;
    num: number;
    offset: number;
    inscriptionId?: string;
    inscriptionNumber?: number;
  }[];
  contentType?: string;
  vout?: number;
}