import mongoose, { Schema, Document } from "mongoose";

export interface IProductAssignment extends Document {
    productId: mongoose.Types.ObjectId;
    productionGroupId: mongoose.Types.ObjectId;
    sectorId: mongoose.Types.ObjectId;
}

const ProductAssignmentSchema = new Schema<IProductAssignment>(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        productionGroupId: {
            type: Schema.Types.ObjectId,
            ref: "ProductionGroup",
            required: true,
        },
        sectorId: { type: Schema.Types.ObjectId, ref: "Sector", required: true },
    },
    { timestamps: true }
);

// Her kombinasyon tekil olsun
ProductAssignmentSchema.index(
    { productId: 1, productionGroupId: 1, sectorId: 1 },
    { unique: true }
);

export const ProductAssignment =
    mongoose.models.ProductAssignment ||
    mongoose.model<IProductAssignment>(
        "ProductAssignment",
        ProductAssignmentSchema
    );
