import mongoose from "mongoose";

export interface ITicketLog extends Document {

    ticketId: mongoose.Types.ObjectId;
    actionType: 'created' | 'status_change' | 'escalated' | 'assigned' | 
              'critical_assigned' | 'action_taken' | 'resolved' | 'comment';

    previousValue?: string;
    newValue?: string;
    comment?: string;

    escalatedFrom?: 'C1' | 'C2' | 'C3';  
    escalatedTo?: 'C1' | 'C2' | 'C3';   
    escalationReason?: string;

    performedBy: mongoose.Types.ObjectId;
    createdAt: Date;

}

const ticketLogSchema = new mongoose.Schema<ITicketLog>({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  actionType: {
    type: String,
    required: true,
    enum: [
      'created',
      'status_change',
      'escalated',
      'assigned',
      'critical_assigned',
      'action_taken',
      'resolved',
      'comment'
    ]
  },
  previousValue: String,
  newValue: String,
  comment: String,
  
  escalatedFrom: {
    type: String,
    enum: ['C1', 'C2' , 'C3']
  },
  escalatedTo: {
    type: String,
    enum: ['C1', 'C2' , 'C3']
  },
  escalationReason: String,
  
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const TicketLogModel = mongoose.model<ITicketLog>('TicketLog', ticketLogSchema);

// Create log entry
export const createTicketLog = async (logData: Partial<ITicketLog>) => {
  const log = new TicketLogModel(logData);
  return log.save();
};

// Get logs by ticket
export const getTicketLogs = (ticketId: string) =>
  TicketLogModel.find({ ticketId })
    .populate('performedBy', 'username email')
    .sort({ createdAt: -1 });

export default TicketLogModel;
