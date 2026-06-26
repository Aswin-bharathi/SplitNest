import { Schema, model } from 'mongoose';

const participantSchema = new Schema(
  {
    memberId: { type: String, required: true },
    share: { type: Number, required: true },
    input: {
      quantity: Number,
      percentage: Number,
      exactAmount: Number,
      weight: Number
    }
  },
  { _id: false }
);

const expenseSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    groupId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    category: { type: String, required: true },
    paidBy: { type: String, required: true },
    createdBy: { type: String, required: true },
    splitMethod: {
      type: String,
      enum: ['equal', 'quantity', 'percentage', 'exact', 'weighted'],
      required: true
    },
    notes: { type: String },
    receiptUrl: { type: String },
    participants: { type: [participantSchema], default: [] },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

expenseSchema.index({ groupId: 1, date: -1 });

export const Expense = model('Expense', expenseSchema);
