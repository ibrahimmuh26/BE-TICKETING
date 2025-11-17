import mongoose from "mongoose";

export interface ITicket extends Document {

  ticketNumber: string;         
  title: string;
  description: string;
  category: string;              
  priority: 'low' | 'medium' | 'high';
  status: 'new' | 'attending' | 'completed' | 'resolved' | 'escalated';
  
  currentLevel: 1 | 2 | 3;        
  escalationLevel: 1 | 2 | 3;     
  criticalValue?: 'C1' | 'C2' | 'C3'; 
  
  expectedCompletionDate: Date;
  completedDate?: Date;
  resolvedDate?: Date;
  
  createdBy: mongoose.Types.ObjectId;     
  assignedTo?: mongoose.Types.ObjectId;   
  escalatedBy?: mongoose.Types.ObjectId;  
  resolvedBy?: mongoose.Types.ObjectId;   
  
  resolution?: string;        
  resolutionNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;

}

const ticketSchema = new mongoose.Schema<ITicket>({
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Hardware', 'Software', 'Network', 'Account', 'Other']
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    required: true,
    enum: ['new', 'attending', 'completed', 'resolved', 'escalated'],
    default: 'new'
  },
  
  // Escalation
  currentLevel: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
    default: 1
  },
  escalationLevel: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
    default: 1
  },
  criticalValue: {
    type: String,
    enum: ['C1', 'C2', 'C3']
  },
  
  // Dates
  expectedCompletionDate: {
    type: Date,
    required: true
  },
  completedDate: Date,
  resolvedDate: Date,
  
  // User references
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  escalatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Resolution
  resolution: String,
  resolutionNotes: String
  
}, {
  timestamps: true
});

const TicketModel = mongoose.model<ITicket>('Ticket', ticketSchema);

// Helper: Generate ticket number
const generateTicketNumber = async (): Promise<string> => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `TKT-${year}${month}`;

  const lastTicket = await TicketModel.findOne({
    ticketNumber: new RegExp(`^${prefix}`)
  }).sort({ ticketNumber: -1 });

  let sequence = 1;
  if (lastTicket) {
    const lastSeq = parseInt(lastTicket.ticketNumber.split('-')[2]);
    sequence = lastSeq + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

// CRUD Operations
export const createTicket = async (value: Partial<ITicket>) => {
  const ticketNumber = await generateTicketNumber();
  const ticket = new TicketModel({ ...value, ticketNumber });
  return ticket.save();
};

export const getTickets = (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  return TicketModel.find()
    .populate('createdBy assignedTo escalatedBy resolvedBy', 'username email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export const getTicketsCount = () => TicketModel.countDocuments();

export const getTicketById = (id: string) => TicketModel.findById(id)
  .populate('createdBy assignedTo escalatedBy resolvedBy', 'username email');

export const getTicketsByLevel = (level: number) => TicketModel.find({ currentLevel: level })
  .populate('createdBy assignedTo escalatedBy resolvedBy', 'username email');

export const getTicketsByStatus = (status: string) => TicketModel.find({ status })
  .populate('createdBy assignedTo escalatedBy resolvedBy', 'username email');

export const updateTicketById = (id: string, value: Partial<ITicket>) =>
  TicketModel.findByIdAndUpdate(id, value, { new: true })
    .populate('createdBy assignedTo escalatedBy resolvedBy', 'username email');

export const deleteTicketById = (id: string) => TicketModel.findByIdAndDelete(id);

export default TicketModel;