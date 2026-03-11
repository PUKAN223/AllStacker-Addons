export interface BillData {
  [playerId: string]: {
    id: number;
    amount: number;
    description: string;
    receiver: string;
    sender: string;
  }[];
}
