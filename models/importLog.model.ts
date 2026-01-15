import mongoose, { Schema, Document } from "mongoose";

export interface ImportLogDocument extends Document {
    source: string;
    dryRun: boolean;
    rowCount: number;
    inserted: {
        sectors: number;
        groups: number;
        products: number;
        assignments: number;
    };
    startedAt: Date;
    finishedAt: Date;
}

const ImportLogSchema = new Schema(
    {
        source: { type: String, required: true },
        dryRun: { type: Boolean, required: true },
        rowCount: { type: Number, required: true },
        inserted: {
            sectors: Number,
            groups: Number,
            products: Number,
            assignments: Number,
        },
        startedAt: { type: Date, required: true },
        finishedAt: { type: Date, required: true },
    },
    { timestamps: true }
);

export const ImportLog =
    mongoose.models.ImportLog ||
    mongoose.model<ImportLogDocument>("ImportLog", ImportLogSchema);
