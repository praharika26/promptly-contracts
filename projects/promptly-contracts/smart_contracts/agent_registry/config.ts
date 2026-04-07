import { resolve } from 'path'
import { Algorithm, Type } from '@algorandfoundation/algokit-utils/types/smart-contract'
import { useAgentRegistry } from './deploy-config'

export default {
  rootDir: __dirname,
  build: {
    target: Algorithm.AVM,
    contracts: [
      {
        name: 'AgentRegistry',
        path: resolve(__dirname, 'contract.algo.ts'),
        deploy: useAgentRegistry,
      },
    ],
  },
}
