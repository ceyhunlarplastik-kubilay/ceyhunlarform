import mongoose, { Schema, Document } from "mongoose";

export interface ISector extends Document {
    name: string;
    imageUrl?: string;
}

const SectorSchema = new Schema<ISector>(
    {
        name: { type: String, required: true, unique: true },
        imageUrl: String,
    },
    { timestamps: true }
);

export const Sector =
    mongoose.models.Sector || mongoose.model<ISector>("Sector", SectorSchema);

