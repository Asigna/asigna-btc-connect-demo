import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { UTXO } from './types';
import { getUtxos } from './utils';
import { SignActionModals, useAsignaExtension, useAsignaAddress, useAsignaInputs, useAsignaFee, validateMessage, useAsignaSafeInfo } from '@asigna/btc-connect';
import * as bitcoin from 'bitcoinjs-lib';
import * as tinysecp from "tiny-secp256k1";
import BigNumber from 'bignumber.js';
bitcoin.initEccLib(tinysecp)


const NETWORK = bitcoin.networks.testnet;

function App() {
  const {openSignMessage, openSignPsbt, signPsbt, connect} = useAsignaExtension();
  const [utxos, setUtxos] = useState<UTXO[]>();
  const {asignaAddress} = useAsignaAddress();
  const {createInput} = useAsignaInputs();
  const {calculateGas} = useAsignaFee();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [feeRate, setFeeRate] = useState(25);
 
  useEffect(() => {
    if (!asignaAddress)
        return;
    getUtxos(asignaAddress, NETWORK === bitcoin.networks.testnet).then(setUtxos);
  }, [asignaAddress]);

  const balance = useMemo(() => {
    return utxos?.reduce((acc, x) => acc + x.satoshis, 0) || 0;
  }, [utxos]);

  function createTx(withModal?: boolean) {
    if (!utxos || !asignaAddress)
      return;
    const psbt = new bitcoin.Psbt({network: NETWORK});
    let totalOutput = 0;
    utxos.forEach(utxo => {
      //@ts-expect-error correct
      const input = createInput(utxo);
      if (!input)
          return;
      psbt.addInput(input.data);
      totalOutput += input.utxo.satoshis;
    })

    const amountToSend = BigNumber(amount).shiftedBy(8);
    psbt.addOutput({value: amountToSend.toNumber(), address});
    const fee = (calculateGas(psbt) || 0) * feeRate;
    psbt.addOutput({value: totalOutput - amountToSend.toNumber() - fee, address: asignaAddress})
    if (withModal) {
      openSignPsbt(psbt, true)
    } else 
      signPsbt(psbt);
  }

  const {asignaSafeInfo} = useAsignaSafeInfo();

  return (
    <div>
      {asignaAddress && <div>Connected with <span style={{fontWeight: 'bold'}}>{asignaAddress}</span></div>}
      {!asignaAddress && <div onClick={connect}>
        Connect
      </div>}
      {asignaAddress && <div>
        <div>Balance: {balance / Math.pow(10, 8)}</div>  
        <div><input placeholder='Amount' value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div><input placeholder='Address' value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        <div><input placeholder='Fee Rate' value={feeRate} onChange={(e) => setFeeRate(Number(e.target.value))} /></div>
        <button onClick={() => createTx(true)} style={{marginTop: 10}}>
          Open Send Tx Modal
        </button>
        <button onClick={() => createTx(false)}>
          Send Tx
        </button>
      </div>}
      {asignaAddress && <div style={{marginTop: '50px'}}>
        <div><input placeholder='Message' value={message} onChange={(e) => setMessage(e.target.value)} /></div>
        <button onClick={async () => await openSignMessage(message)} style={{marginTop: 10}}>
          Sign Message Modal
        </button>
      </div>}
      <SignActionModals onSignPsbt={(tx) => {
        console.log('PSBT: ' + tx);
      }} onSignMessage={(signature) => {
        console.log('MESSAGE SIG:', signature)
        if (!asignaSafeInfo)
          return;
        console.log('is Valid', validateMessage(
          message,
          signature,
          asignaSafeInfo.multisigType, 
          asignaSafeInfo.address,
          asignaSafeInfo.users.map(x => x.publicKey || ''),
          asignaSafeInfo.users.map(x => x.address), 
          asignaSafeInfo.threshold,
          bitcoin.networks.testnet,
        ));
      }}/>
    </div>
  )
}

export default App
