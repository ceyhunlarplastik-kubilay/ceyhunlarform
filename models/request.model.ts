import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IRequestProduct {
    productId: mongoose.Types.ObjectId | null; // product silinirse null olabilir
    productName: string;

    productionGroupId: mongoose.Types.ObjectId | null;
    productionGroupName: string;
}


export interface IRequestStatusHistory {
    status: string;
    note?: string;
    updatedBy?: string;
    timestamp: Date;
}

export interface IRequest extends Document {
    companyName: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
    address?: string;

    sectorId: mongoose.Types.ObjectId | null;
    productionGroupIds: mongoose.Types.ObjectId[];
    products: IRequestProduct[];

    status: string;
    statusHistory: IRequestStatusHistory[];
}

const RequestSchema = new Schema<IRequest>(
    {
        companyName: { type: String, required: true },
        firstName: String,
        lastName: String,
        email: { type: String, required: true },
        phone: { type: String, required: true },
        address: String,

        sectorId: { type: Schema.Types.ObjectId, ref: "Sector", default: null },

        productionGroupIds: [
            { type: Schema.Types.ObjectId, ref: "ProductionGroup" },
        ],

        products: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: "Product",
                    default: null,
                },
                productName: {
                    type: String,
                    required: true,
                },

                productionGroupId: {
                    type: Schema.Types.ObjectId,
                    ref: "ProductionGroup",
                    default: null,
                },
                productionGroupName: {
                    type: String,
                    required: true,
                },
            },
        ],

        status: {
            type: String,
            enum: [
                "pending",
                "review",
                "approved",
                "preparing",
                "shipped",
                "delivered",
                "completed",
                "cancelled",
            ],
            default: "pending",
        },

        statusHistory: [
            {
                status: String,
                note: String,
                updatedBy: String,
                timestamp: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);


export const Request =
    models.Request || model<IRequest>("Request", RequestSchema);
