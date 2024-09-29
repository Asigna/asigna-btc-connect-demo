import { UTXO } from "../types";

export const getUtxos = async (address: string, isTestnet: boolean): Promise<UTXO[]> => {
    const url = `https://open-api${isTestnet ? '-testnet' : ''}.unisat.io/v1/indexer/address/${address}/utxo-data?cursor=0&size=5000`;
    const res = await fetch(url, {
      method: 'get',
      headers: new Headers({
        'Authorization': 'Bearer 86f61a450a1ada1ce116751e20c37c1d3a17792ebead95a064eeec6e289ae54f',
      }),
    });
    const data = (await res.json()).data;
  
    return data.utxo.map((utxo) => ({
      ...utxo,
      outputIndex: utxo.vout,
      satoshis: utxo.satoshi,
      txId: utxo.txid,
    }));
  };