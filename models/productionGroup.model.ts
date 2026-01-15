import mongoose, { Schema, Document } from "mongoose";

export interface IProductionGroup extends Document {
    name: string;
    sectorId: mongoose.Types.ObjectId;
}

const ProductionGroupSchema = new Schema<IProductionGroup>(
    {
        name: { type: String, required: true },
        sectorId: {
            type: Schema.Types.ObjectId,
            ref: "Sector",
            required: true,
        },
    },
    { timestamps: true }
);

ProductionGroupSchema.index({ name: 1, sectorId: 1 }, { unique: true });

export const ProductionGroup =
    mongoose.models.ProductionGroup ||
    mongoose.model<IProductionGroup>("ProductionGroup", ProductionGroupSchema);
