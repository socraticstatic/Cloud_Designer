import { LOAData, CrossConnectData } from '../../crossconnect/CrossConnectWorkflow';

export interface CrossConnectReference {
  id: string;
  loa: LOAData;
  connection: CrossConnectData;
  showInTopology?: boolean;
}