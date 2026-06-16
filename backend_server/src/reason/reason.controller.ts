
type TurnData = {
    turn_id: string;
    submitted: {
        public_actioon: string;
        secret_intent: string;
    }[];
};

export class ReasonController {
    
    

    async newTurnDubmission(lobbyId: string, turnData: TurnData) {
        
    } 
}