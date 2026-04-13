import * as algokit from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import { describe, it, expect, beforeAll } from 'vitest';

describe('Integration test for Promptly Contracts', () => {
  let algodClient: algosdk.Algodv2;

  beforeAll(async () => {
    algodClient = algokit.getAlgoClient({
      server: 'http://localhost',
      port: 4001,
      token: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
  });

  it('HelloWorld contract should be live (App ID: 2575)', async () => {
    const appInfo = await algodClient.getApplicationByID(2575).do();
    expect(appInfo.id).toBe(2575n);
  });

  it('AgentRegistry contract should be live (App ID: 2578)', async () => {
    const appInfo = await algodClient.getApplicationByID(2578).do();
    expect(appInfo.id).toBe(2578n);
  });

  it('AgentExecutor contract should be live (App ID: 2579)', async () => {
    const appInfo = await algodClient.getApplicationByID(2579).do();
    expect(appInfo.id).toBe(2579n);
  });

  it('AgentReputation contract should be live (App ID: 2580)', async () => {
    const appInfo = await algodClient.getApplicationByID(2580).do();
    expect(appInfo.id).toBe(2580n);
  });
});
